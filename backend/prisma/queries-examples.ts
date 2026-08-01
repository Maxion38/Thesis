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
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function section(title: string) {
  console.log('\n' + '─'.repeat(70));
  console.log(`▶ ${title}`);
  console.log('─'.repeat(70));
}

async function main() {
  // ═════════════════════════════════════════════════════════════════════
  // 1) JOINTURE SIMPLE — un projet avec son responsable, sa promotion et
  //    ses membres, via `include`
  // ═════════════════════════════════════════════════════════════════════
  section('1. Jointure simple : projets + superviseur + promotion + membres');

  const projectsOverview = await prisma.project.findMany({
    take: 3,
    include: {
      supervisor: { select: { firstname: true, surname: true, email: true } },
      trainingCourse: { select: { name: true } },
      members: {
        include: { user: { select: { firstname: true, surname: true } } },
      },
    },
  });
  console.log(JSON.stringify(projectsOverview, null, 2));

  // ═════════════════════════════════════════════════════════════════════
  // 2) JOINTURE PROFONDE IMBRIQUÉE — le détail complet d'un projet évalué :
  //    formulaire de cadrage + réponses, dépôt de mémoire, évaluations par
  //    critère avec le libellé de la cellule attribuée
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
          cell: { select: { description: true, order: true } },
          student: { select: { firstname: true, surname: true } },
        },
      },
    },
  });
  console.log(JSON.stringify(evaluatedProject, null, 2));

  // ═════════════════════════════════════════════════════════════════════
  // 3) FILTRAGE RELATIONNEL — étudiants dont le projet n'a pas encore
  //    déposé de mémoire (filtre sur une relation "none")
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
  // 4) AGRÉGATION — moyenne des notes (order de la cellule, 0=Insuffisant
  //    à 3=Excellent) par critère, tous projets évalués confondus
  // ═════════════════════════════════════════════════════════════════════
  section('4. Agrégation : moyenne par critère (via groupBy + agrégat manuel)');

  const assessments = await prisma.criteriaAssessment.findMany({
    include: { criteria: { select: { name: true } }, cell: { select: { order: true } } },
  });
  const byCriteria = new Map<string, number[]>();
  for (const a of assessments) {
    const list = byCriteria.get(a.criteria.name) ?? [];
    list.push(a.cell.order);
    byCriteria.set(a.criteria.name, list);
  }
  for (const [name, scores] of byCriteria) {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    console.log(`   ${name} : moyenne ${avg.toFixed(2)} / 3 (n=${scores.length})`);
  }

  // ═════════════════════════════════════════════════════════════════════
  // 5) GROUPBY — charge de travail par enseignant (nombre de projets
  //    supervisés, par promotion)
  // ═════════════════════════════════════════════════════════════════════
  section('5. GroupBy : nombre de projets supervisés par enseignant');

  const supervisionLoad = await prisma.project.groupBy({
    by: ['supervisorId'],
    _count: { _all: true },
    orderBy: { _count: { supervisorId: 'desc' } },
  });
  const teacherIds = supervisionLoad
    .map((s) => s.supervisorId)
    .filter((id): id is number => id !== null);
  const teacherNames = await prisma.user.findMany({
    where: { id: { in: teacherIds } },
    select: { id: true, firstname: true, surname: true },
  });
  const nameById = new Map(teacherNames.map((t) => [t.id, `${t.firstname} ${t.surname}`]));
  for (const row of supervisionLoad) {
    console.log(
      `   ${nameById.get(row.supervisorId!) ?? 'N/A'} : ${row._count._all} projet(s)`,
    );
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
        SUM(cell."order" * c."defaultWeight")::numeric
        / NULLIF(SUM(c."defaultWeight"), 0),
        2
      ) AS weighted_avg
    FROM "CriteriaAssessment" ca
    JOIN "Cell" cell ON cell.id = ca."cellId"
    JOIN "Criteria" c ON c.id = ca."criteriaId"
    JOIN "Project" p ON p.id = ca."projectId"
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