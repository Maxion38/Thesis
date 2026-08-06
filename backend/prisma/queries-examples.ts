/**
 * QUERIES-EXAMPLES — série de requêtes illustrant les capacités relationnelles
 * de la DB (jointures, filtrage, agrégations, SQL brut) pour extraire des
 * exemples concrets à insérer dans le rapport.
 *
 * Lancement : depuis backend/  ->  npm run queries:examples
 * (ajouter dans package.json : "queries:examples": "dotenv -e .env -- ts-node prisma/queries-examples.ts")
 *
 * Astuce rapport : copie/colle directement la sortie console (JSON.stringify
 * avec indentation) dans une capture d'écran ou un bloc de code annexe.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CHANGELOG vs version précédente (adaptation au schema.prisma V2) :
 *   - Project.supervisorId supprimé -> le "promoteur" n'est plus un champ
 *     direct sur Project. Un projet n'a désormais aucun ProjectMember
 *     structurellement marqué "promoteur" (étudiants et promoteur ont tous
 *     deux subRoleId = null ; seuls les rôles de jury RAPPORTEUR/PRESIDENT/
 *     LECTEUR sont distingués). On déduit donc le/les enseignant(s) d'un
 *     projet via le rôle global de l'utilisateur (User.roles = TEACHER),
 *     pas via un champ dédié.
 *   - CriteriaAssessment.cellId / relation `cell` supprimés, ainsi que
 *     `studentId` -> l'évaluation se fait au niveau du projet (pas par
 *     étudiant), et la note est un `note` (Decimal) directement stocké,
 *     plus une cellule pointée par FK.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient, RoleType } from '@prisma/client';

const prisma = new PrismaClient();

function section(title: string) {
  console.log('\n' + '─'.repeat(70));
  console.log(`▶ ${title}`);
  console.log('─'.repeat(70));
}

async function main() {
  // ═════════════════════════════════════════════════════════════════════
  // 1) JOINTURE SIMPLE — un projet avec sa promotion et ses membres (avec
  //    leur rôle global), via `include`
  // ═════════════════════════════════════════════════════════════════════
  section('1. Jointure simple : projets + promotion + membres (avec rôles)');

  const projectsOverview = await prisma.project.findMany({
    take: 3,
    include: {
      trainingCourse: { select: { name: true } },
      members: {
        include: {
          user: {
            select: {
              firstname: true,
              surname: true,
              email: true,
              roles: { select: { role: { select: { role: true } } } },
            },
          },
          subRole: { select: { subRole: true } },
        },
      },
    },
  });
  console.log(JSON.stringify(projectsOverview, null, 2));

  // ═════════════════════════════════════════════════════════════════════
  // 2) JOINTURE PROFONDE IMBRIQUÉE — le détail complet d'un projet évalué :
  //    formulaire de cadrage + réponses, dépôt de mémoire, évaluations par
  //    critère avec la note et l'enseignant évaluateur
  // ═════════════════════════════════════════════════════════════════════
  section('2. Jointure profonde : dossier complet d’un projet évalué');

  const evaluatedProject = await prisma.project.findFirst({
    where: { criteriaAssessments: { some: {} } },
    include: {
      trainingCourse: { select: { name: true } },
      members: { include: { user: { select: { firstname: true, surname: true } } } },
      formSubmissions: {
        include: {
          responses: { include: { question: { select: { name: true } } } },
        },
      },
      workSubmissions: { select: { fileName: true, submittedAt: true } },
      criteriaAssessments: {
        include: {
          criteria: { select: { name: true, defaultWeight: true } },
          teacher: { select: { firstname: true, surname: true } },
        },
      },
    },
  });
  console.log(JSON.stringify(evaluatedProject, null, 2));

  // ═════════════════════════════════════════════════════════════════════
  // 3) FILTRAGE RELATIONNEL — projets dont le mémoire n'a pas encore été
  //    déposé (filtre sur une relation "none")
  // ═════════════════════════════════════════════════════════════════════
  section('3. Filtrage relationnel : projets sans dépôt de mémoire');

  const projectsWithoutSubmission = await prisma.project.findMany({
    where: { workSubmissions: { none: {} } },
    select: {
      id: true,
      title: true,
      trainingCourse: { select: { name: true } },
      members: { include: { user: { select: { firstname: true, surname: true } } } },
    },
  });
  console.log(`→ ${projectsWithoutSubmission.length} projet(s) sans dépôt :`);
  console.log(JSON.stringify(projectsWithoutSubmission.slice(0, 5), null, 2));

  // ═════════════════════════════════════════════════════════════════════
  // 4) AGRÉGATION — moyenne des notes par critère, tous projets évalués
  //    confondus (note est directement stockée en Decimal, plus besoin de
  //    passer par une cellule)
  // ═════════════════════════════════════════════════════════════════════
  section('4. Agrégation : moyenne par critère');

  const assessments = await prisma.criteriaAssessment.findMany({
    where: { note: { not: null } },
    include: { criteria: { select: { name: true } } },
  });
  const byCriteria = new Map<string, number[]>();
  for (const a of assessments) {
    const list = byCriteria.get(a.criteria.name) ?? [];
    list.push(Number(a.note));
    byCriteria.set(a.criteria.name, list);
  }
  for (const [name, scores] of byCriteria) {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    console.log(`   ${name} : moyenne ${avg.toFixed(2)} (n=${scores.length})`);
  }

  // ═════════════════════════════════════════════════════════════════════
  // 5) GROUPBY — charge de travail par enseignant (nombre de projets où il
  //    intervient). Plus de Project.supervisorId : on regroupe les
  //    ProjectMember des utilisateurs ayant le rôle TEACHER.
  // ═════════════════════════════════════════════════════════════════════
  section('5. GroupBy : nombre de projets par enseignant intervenant');

  const supervisionLoad = await prisma.projectMember.groupBy({
    by: ['userId'],
    where: {
      user: { roles: { some: { role: { role: RoleType.TEACHER } } } },
    },
    _count: { _all: true },
    orderBy: { _count: { userId: 'desc' } },
  });
  const teacherIds = supervisionLoad.map((s) => s.userId);
  const teacherNames = await prisma.user.findMany({
    where: { id: { in: teacherIds } },
    select: { id: true, firstname: true, surname: true },
  });
  const nameById = new Map(teacherNames.map((t) => [t.id, `${t.firstname} ${t.surname}`]));
  for (const row of supervisionLoad) {
    console.log(`   ${nameById.get(row.userId) ?? 'N/A'} : ${row._count._all} projet(s)`);
  }

  // ═════════════════════════════════════════════════════════════════════
  // 6) SQL BRUT — même idée que #4 mais en SQL pur avec JOIN explicite,
  //    utile si tu veux montrer une requête SQL "physique" dans le rapport
  // ═════════════════════════════════════════════════════════════════════
  section('6. SQL brut ($queryRaw) : moyenne pondérée par projet');

  const weightedAverages = await prisma.$queryRaw<
    { project_id: number; title: string; weighted_avg: number }[]
  >`
    SELECT
      p.id AS project_id,
      p.title,
      ROUND(
        SUM(ca."note" * c."defaultWeight")::numeric
        / NULLIF(SUM(c."defaultWeight"), 0),
        2
      ) AS weighted_avg
    FROM "CriteriaAssessment" ca
    JOIN "Criteria" c ON c.id = ca."criteriaId"
    JOIN "Project" p ON p.id = ca."projectId"
    WHERE ca."note" IS NOT NULL
    GROUP BY p.id, p.title
    ORDER BY weighted_avg DESC
    LIMIT 5;
  `;
  console.log(JSON.stringify(weightedAverages, null, 2));

  section('Terminé ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });