/**
 * SEED DE DÉMO — à ne JAMAIS lancer automatiquement en prod.
 *
 * Ce script est séparé du prisma/seed.ts officiel (qui ne contient que les
 * rôles/sous-rôles système et tourne automatiquement au démarrage du
 * conteneur backend). Il peuple la DB avec des données réalistes pour :
 *   1) avoir un site démo visuellement peuplé
 *   2) pouvoir faire des requêtes concrètes à citer dans le rapport
 *
 * IDEMPOTENCE : toutes les données créées ici sont "taguées" :
 *   - emails des users se terminant par "@demo.thesis"
 *   - noms de TrainingCourse / Group préfixés par "DEMO "
 * Au lancement, le script supprime d'abord tout ce qui porte ces tags avant
 * de tout recréer. Il ne touche à AUCUNE autre donnée de la DB.
 *
 * Lancement : depuis backend/  ->  npm run seed:demo
 * (ajouter dans package.json : "seed:demo": "ts-node prisma/seed-demo.ts")
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CHANGELOG vs version précédente (adaptation au schema.prisma V2) :
 *   - GridVersion supprimé -> AssessmentGrid porte directement les Criteria.
 *   - SubmissionStatus supprimé -> l'existence d'une FormSubmission/
 *     UserWorkSubmission encode à elle seule "soumis ou non", plus de champ
 *     status à renseigner.
 *   - ConditionType (ACCESS/SUCCESS) supprimé -> les conditions ne servent
 *     plus qu'à l'accès à un module. Le bloc "condition de succès sur le
 *     cadrage" + la UserValidation associée ont été retirés.
 *   - RoleType.GUEST renommé RoleType.EXTERNAL.
 *   - QuestionType.RADIO -> QuestionType.SELECT, QuestionType.NUMBER
 *     supprimé -> la question "charge de travail estimée" devient une
 *     question TEXT (valeur numérique stockée en string, comme toute
 *     réponse de formulaire).
 *   - User.supervisorId (hiérarchie coordinateur/enseignant) supprimé ->
 *     bloc retiré entièrement, absent du drawio V2.
 *   - Project.supervisorId supprimé -> le "promoteur" est désormais un
 *     ProjectMember comme les autres (subRoleId = null). Les rôles de jury
 *     (SUPERVISOR/PRESIDENT/READER) sont portés par ProjectMember.subRoleId.
 *   - Nouveau : chaque soutenance (projet terminé) génère une Activity
 *     (créneau daté) + un Group qui lui est obligatoirement rattaché
 *     (Group.eventId), avec les enseignants du jury en UserGroup et le
 *     projet en ProjectGroup -> modélise correctement "qui siège, quand,
 *     pour quel(s) projet(s)".
 *   - Group.type supprimé -> seul le "name" identifie le groupe.
 *   - CriteriaAssessment.studentId supprimé -> l'évaluation par critère se
 *     fait au niveau du projet (pas par étudiant individuel au sein d'un
 *     binôme).
 *   - CriteriaAssessment.cellId supprimé, remplacé par note (Decimal). La
 *     cellule "votée" n'est plus stockée : elle est déduite en comparant
 *     `note` aux bornes cumulées des Cell.weight du critère. Un des critères
 *     de démo utilise des poids de cellule non uniformes pour illustrer
 *     concrètement ce mécanisme dans le rapport.
 *   - GridVersionFeedback renommé GridFeedback, le champ comment est scindé
 *     en commentEval (interne profs) / commentFeedback (visible étudiant).
 * ─────────────────────────────────────────────────────────────────────────
 */

import {
  PrismaClient,
  RoleType,
  SubRoleType,
  ToolType,
  QuestionType,
  ConditionMethod,
  ConditionOperator,
  Importance,
} from '@prisma/client';
import { fakerFR as faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt'; // remplacer par bcryptjs si c'est ce que le projet utilise
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────

const DEMO_EMAIL_DOMAIN = '@demo.thesis';
const DEMO_PREFIX = 'DEMO ';
const DEMO_PASSWORD = 'Demo1234!'; // même mot de passe pour tous les comptes démo

const STUDENTS_PER_COURSE = 35;
const DUOS_PER_COURSE = 4; // nombre de projets en binôme (le reste = solo)
const TEACHERS_COUNT = 10;
const COORDINATORS_COUNT = 2;
const EXTERNALS_COUNT = 5;

// faker.seed rend le jeu de données reproductible (pratique pour des
// captures d'écran stables dans le rapport). Retire cette ligne si tu veux
// des données différentes à chaque exécution.
faker.seed(2026);

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const res: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    res.push(copy.splice(idx, 1)[0]);
  }
  return res;
}

// Contrairement à pickMany (non destructif), takeRandom RETIRE réellement
// les éléments piochés du tableau passé en paramètre. Nécessaire pour vider
// un pool (ex: répartir des étudiants en projets sans doublon ni boucle infinie).
function takeRandom<T>(pool: T[], n: number): T[] {
  const res: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    res.push(pool.splice(idx, 1)[0]);
  }
  return res;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const v = min + Math.random() * (max - min);
  return Number(v.toFixed(decimals));
}

function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const usedEmails = new Set<string>();
function buildEmail(firstname: string, surname: string): string {
  const base = stripAccents(`${firstname}.${surname}`)
    .toLowerCase()
    .replace(/[^a-z.]/g, '');
  let email = `${base}${DEMO_EMAIL_DOMAIN}`;
  let i = 1;
  while (usedEmails.has(email)) {
    email = `${base}${i}${DEMO_EMAIL_DOMAIN}`;
    i++;
  }
  usedEmails.add(email);
  return email;
}

const usedRegistrationIds = new Set<string>();
function buildRegistrationId(): string {
  let id: string;
  do {
    id = String(randomInt(1000000, 9999999));
  } while (usedRegistrationIds.has(id));
  usedRegistrationIds.add(id);
  return id;
}

// Déduit les bornes cumulées d'un ensemble de cellules à partir de leur poids
// (cellule d'ordre 0 = toujours 0, poids ignoré). Sert à générer une note de
// démo cohérente avec la cellule "votée" simulée, et illustre le calcul que
// fera le front (cellule affichée = celle dont l'intervalle contient `note`).
function cumulativeBounds(cells: { order: number; weight: number | null }[]): number[] {
  const sorted = [...cells].sort((a, b) => a.order - b.order);
  const bounds: number[] = [0];
  for (let i = 1; i < sorted.length; i++) {
    bounds.push(bounds[i - 1] + (sorted[i].weight ?? 1));
  }
  return bounds;
}

function noteForCellIndex(bounds: number[], index: number): number {
  if (index <= 0) return 0;
  const lower = bounds[index - 1];
  const upper = bounds[index];
  return randomFloat(lower, upper, 2);
}

const THESIS_TITLES = [
  "Conception d'une application de gestion de stocks en temps réel",
  "Développement d'un système de recommandation basé sur l'apprentissage automatique",
  "Mise en place d'une architecture microservices pour une plateforme e-commerce",
  "Détection d'intrusions réseau par techniques de machine learning",
  "Application mobile de suivi de la condition physique avec objets connectés",
  "Automatisation des tests d'une application web avec Cypress",
  "Étude et mise en œuvre d'une solution de sauvegarde décentralisée",
  "Chatbot d'assistance client basé sur le traitement du langage naturel",
  "Optimisation des performances d'une base de données PostgreSQL à grande échelle",
  "Conception d'un tableau de bord de visualisation de données pour le secteur médical",
  "Sécurisation d'une API REST : authentification, autorisation et audit",
  "Développement d'un jumeau numérique pour la maintenance prédictive",
  "Migration d'une application monolithique vers une architecture cloud native",
  "Analyse de sentiments sur les réseaux sociaux appliquée au marketing",
  "Conception d'un système de vote électronique sécurisé par blockchain",
  "Développement d'une plateforme collaborative de gestion de projets agiles",
  "Reconnaissance d'images pour le tri automatisé de déchets recyclables",
  "Mise en place d'un pipeline CI/CD pour une équipe de développement distribuée",
  "Système de gestion des réservations pour une infrastructure hôtelière",
  "Application de covoiturage universitaire avec géolocalisation",
  "Étude comparative des frameworks front-end pour applications temps réel",
  "Développement d'un outil de génération automatique de documentation technique",
  "Conception d'une solution d'accessibilité numérique pour malvoyants",
  "Plateforme de gestion des dons pour associations caritatives",
  "Optimisation énergétique d'un bâtiment intelligent via capteurs IoT",
  "Développement d'un jeu éducatif pour l'apprentissage de la programmation",
  "Système de gestion de bibliothèque avec reconnaissance RFID",
  "Analyse prédictive des pannes dans un parc informatique",
  "Application de suivi budgétaire personnel avec catégorisation automatique",
  "Conception d'une API GraphQL pour une plateforme de streaming vidéo",
  "Outil d'audit de sécurité automatisé pour applications web",
  "Développement d'un système de billetterie électronique pour événements",
  "Plateforme de mise en relation entre freelances et entreprises",
  "Système de gestion des plannings pour un service hospitalier",
  "Application de traçabilité alimentaire basée sur la blockchain",
  "Conception d'un moteur de recherche interne pour documentation d'entreprise",
  "Développement d'une solution de télémédecine sécurisée",
  "Outil de détection de plagiat pour travaux académiques",
  "Système domotique open-source pour la gestion énergétique du foyer",
  "Plateforme d'apprentissage en ligne avec suivi de progression personnalisé",
];

const DOMAIN_OPTIONS = [
  'Développement Web',
  'Intelligence Artificielle',
  'Cybersécurité',
  'Réseaux & Infrastructure',
  'Science des données',
  'Développement Mobile',
];

const TECH_OPTIONS = [
  'Angular',
  'React',
  'Vue.js',
  'NestJS',
  'Spring Boot',
  'Python',
  'Java',
  'PostgreSQL',
  'MongoDB',
  'Docker',
];

// ─────────────────────────────────────────────────────────────────────────
// RESET (idempotence) — supprime uniquement les données taguées "démo"
// L'ordre respecte les dépendances de clés étrangères (enfants -> parents).
// ─────────────────────────────────────────────────────────────────────────

async function resetDemoData(demoTrainingCourseIds: number[]) {
  console.log('🧹  Nettoyage des anciennes données de démo...');

  const userFilter = { email: { endsWith: DEMO_EMAIL_DOMAIN } };
  const tcFilter = { trainingCourseId: { in: demoTrainingCourseIds } };
  const tcById = { id: { in: demoTrainingCourseIds } };

  await prisma.response.deleteMany({ where: { submission: { project: tcFilter } } });
  await prisma.userValidation.deleteMany({ where: { user: userFilter } });
  await prisma.criteriaAssessment.deleteMany({ where: { project: tcFilter } });
  await prisma.weighting.deleteMany({ where: { project: tcFilter } });
  await prisma.gridFeedback.deleteMany({ where: { project: tcFilter } });
  await prisma.notebook.deleteMany({ where: { project: tcFilter } });
  await prisma.notification.deleteMany({ where: { user: userFilter } });
  await prisma.userWorkSubmission.deleteMany({ where: { project: tcFilter } });
  await prisma.formSubmission.deleteMany({ where: { project: tcFilter } });
  await prisma.questionOption.deleteMany({
    where: { question: { form: { tool: { module: tcFilter } } } },
  });
  await prisma.question.deleteMany({ where: { form: { tool: { module: tcFilter } } } });
  await prisma.form.deleteMany({ where: { tool: { module: tcFilter } } });

  // ProjectGroup avant Group (référence project + group)
  await prisma.projectGroup.deleteMany({ where: { project: tcFilter } });
  // UserGroup avant Group (référence group)
  await prisma.userGroup.deleteMany({ where: { user: userFilter } });
  // Group avant Activity (Group.eventId référence Activity)
  await prisma.group.deleteMany({ where: { name: { startsWith: DEMO_PREFIX } } });
  await prisma.activity.deleteMany({ where: { tool: { module: tcFilter } } });

  await prisma.cell.deleteMany({ where: { criteria: { grid: { tool: { module: tcFilter } } } } });
  await prisma.criteria.deleteMany({ where: { grid: { tool: { module: tcFilter } } } });
  await prisma.assessmentGrid.deleteMany({ where: { tool: { module: tcFilter } } });
  await prisma.work.deleteMany({ where: { tool: { module: tcFilter } } });

  await prisma.condition.deleteMany({
    where: { conditionsSubgroup: { conditionsGroup: { module: tcFilter } } },
  });
  await prisma.conditionsSubgroup.deleteMany({ where: { conditionsGroup: { module: tcFilter } } });
  await prisma.conditionsGroup.deleteMany({ where: { module: tcFilter } });

  await prisma.tool.deleteMany({ where: { module: tcFilter } });
  await prisma.module.deleteMany({ where: tcFilter });

  await prisma.projectMember.deleteMany({ where: { project: tcFilter } });
  await prisma.userSupervisorPreference.deleteMany({ where: { project: tcFilter } });
  await prisma.project.deleteMany({ where: tcFilter });

  await prisma.invitation.deleteMany({ where: { email: { endsWith: DEMO_EMAIL_DOMAIN } } });
  await prisma.userRole.deleteMany({ where: { user: userFilter } });
  await prisma.user.deleteMany({ where: userFilter });
  await prisma.trainingCourse.deleteMany({ where: tcById });

  console.log('✅  Anciennes données de démo supprimées.');
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  // 0) Vérifier que les rôles + sous-rôles système existent
  //    (seed.ts doit avoir tourné avant celui-ci)
  const roles = await prisma.role.findMany();
  if (roles.length === 0) {
    throw new Error(
      "Aucun rôle trouvé. Lance d'abord `npx prisma db seed` (seed.ts) avant seed-demo.ts.",
    );
  }
  const roleId: Record<RoleType, number> = Object.fromEntries(
    roles.map((r) => [r.role, r.id]),
  ) as Record<RoleType, number>;

  const subRoles = await prisma.subRole.findMany();
  if (subRoles.length === 0) {
    throw new Error(
      "Aucun sous-rôle trouvé. Ajoute le seed des SubRole (SUPERVISOR/PRESIDENT/READER) dans seed.ts avant de lancer seed-demo.ts.",
    );
  }
  const subRoleId: Record<SubRoleType, number> = Object.fromEntries(
    subRoles.map((r) => [r.subRole, r.id]),
  ) as Record<SubRoleType, number>;

  // 0bis) Repérer d'éventuelles anciennes promos de démo pour les nettoyer
  const oldCourses = await prisma.trainingCourse.findMany({
    where: { name: { startsWith: DEMO_PREFIX } },
    select: { id: true },
  });
  await resetDemoData(oldCourses.map((c) => c.id));

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ───────────────────────────────────────────────────────────────────────
  // 1) TRAINING COURSES
  // ───────────────────────────────────────────────────────────────────────
  console.log('📚  Création des promotions...');

  const courseA = await prisma.trainingCourse.create({
    data: {
      name: `${DEMO_PREFIX}Promotion 2024-2025`,
      startDate: new Date('2024-09-16'),
      endDate: new Date('2025-06-30'),
    },
  });
  const courseB = await prisma.trainingCourse.create({
    data: {
      name: `${DEMO_PREFIX}Promotion 2025-2026`,
      startDate: new Date('2025-09-15'),
      endDate: null, // promo en cours
    },
  });
  const courses = [
    { course: courseA, label: 'A' as const, finished: true },
    { course: courseB, label: 'B' as const, finished: false },
  ];

  // ───────────────────────────────────────────────────────────────────────
  // 2) USERS
  // ───────────────────────────────────────────────────────────────────────
  console.log('👤  Création des utilisateurs...');

  async function createUser(opts: {
    role: RoleType;
    secondRole?: RoleType;
    hoursQuota?: number;
  }) {
    const firstname = faker.person.firstName();
    const surname = faker.person.lastName();
    const email = buildEmail(firstname, surname);
    return prisma.user.create({
      data: {
        firstname,
        surname,
        email,
        passwordHash,
        hoursQuota: opts.hoursQuota ?? null,
        registrationId: opts.role === RoleType.STUDENT ? buildRegistrationId() : null,
        roles: {
          create: [
            { role: { connect: { id: roleId[opts.role] } } },
            ...(opts.secondRole
              ? [{ role: { connect: { id: roleId[opts.secondRole] } } } as const]
              : []),
          ],
        },
      },
    });
  }

  type SeededUser = Awaited<ReturnType<typeof createUser>>;

  const coordinators: SeededUser[] = [];
  for (let i = 0; i < COORDINATORS_COUNT; i++) {
    coordinators.push(await createUser({ role: RoleType.COORDINATOR }));
  }

  const teachers: SeededUser[] = [];
  for (let i = 0; i < TEACHERS_COUNT; i++) {
    teachers.push(await createUser({ role: RoleType.TEACHER, hoursQuota: randomInt(20, 60) }));
  }
  // NB : la hiérarchie coordinateur/enseignant (User.supervisorId en V1)
  // n'existe plus dans le schéma V2 -> plus de bloc d'affectation ici.

  const studentsByCourse: Record<'A' | 'B', SeededUser[]> = { A: [], B: [] };
  for (const { label } of courses) {
    for (let i = 0; i < STUDENTS_PER_COURSE; i++) {
      studentsByCourse[label].push(await createUser({ role: RoleType.STUDENT }));
    }
  }

  const externals: SeededUser[] = [];
  for (let i = 0; i < EXTERNALS_COUNT; i++) {
    externals.push(await createUser({ role: RoleType.EXTERNAL }));
  }

  // ───────────────────────────────────────────────────────────────────────
  // 3) MODULES + TOOLS (par promo)
  // ───────────────────────────────────────────────────────────────────────
  console.log('🧩  Création des modules et outils...');

  type CourseAssets = {
    tcId: number;
    formToolId: number;
    formId: number;
    questions: { id: number; type: QuestionType }[];
    workToolId: number;
    workId: number;
    dueDate: Date;
    soutenanceToolId: number; // Tool (type ACTIVITY) sous lequel on crée un créneau par soutenance
    assessmentGridId: number; // = id du Tool "grille d'évaluation" (clé partagée)
    criteria: { id: number; cells: { id: number; order: number; weight: number | null }[] }[];
    accessConditionValidatorId: number;
    accessConditionId: number; // condition SUPERVISOR_VALIDATION, pour illustrer UserValidation
  };

  const assetsByCourse: Record<'A' | 'B', CourseAssets> = {} as any;

  const CELL_LEVELS = ['Insuffisant', 'Satisfaisant', 'Bon', 'Excellent'];

  for (const { course, label, finished } of courses) {
    // Module 1 — Cadrage du sujet
    const moduleCadrage = await prisma.module.create({
      data: {
        name: 'Cadrage du sujet',
        description: 'Proposition et validation du sujet de TFE.',
        trainingCourseId: course.id,
      },
    });
    const toolForm = await prisma.tool.create({
      data: {
        name: 'Formulaire de proposition de sujet',
        description: 'À compléter par l’étudiant en début d’année.',
        type: ToolType.FORM,
        moduleId: moduleCadrage.id,
      },
    });
    const formDueDate = new Date(course.startDate!);
    formDueDate.setDate(formDueDate.getDate() + 42); // ~6 semaines après la rentrée
    const form = await prisma.form.create({
      data: { id: toolForm.id, maxAttempts: 1, dueDate: formDueDate },
    });

    const q1 = await prisma.question.create({
      data: { name: 'Titre du sujet proposé', type: QuestionType.TEXT, isRequired: true, formId: form.id },
    });
    const q2 = await prisma.question.create({
      data: { name: 'Domaine du TFE', type: QuestionType.SELECT, isRequired: true, formId: form.id },
    });
    for (const [i, opt] of DOMAIN_OPTIONS.entries()) {
      await prisma.questionOption.create({ data: { name: opt, order: i, questionId: q2.id } });
    }
    const q3 = await prisma.question.create({
      data: { name: 'Résumé du projet', type: QuestionType.TEXT, isRequired: true, formId: form.id },
    });
    const q4 = await prisma.question.create({
      data: { name: 'Technologies envisagées', type: QuestionType.CHECKBOX, isRequired: false, formId: form.id },
    });
    for (const [i, opt] of TECH_OPTIONS.entries()) {
      await prisma.questionOption.create({ data: { name: opt, order: i, questionId: q4.id } });
    }
    // Plus de QuestionType.NUMBER en V2 -> réponse numérique stockée comme un TEXT
    const q5 = await prisma.question.create({
      data: {
        name: 'Charge de travail hebdomadaire estimée (heures)',
        type: QuestionType.TEXT,
        isRequired: true,
        formId: form.id,
      },
    });

    // Module 2 — Suivi de projet
    const moduleSuivi = await prisma.module.create({
      data: {
        name: 'Suivi de projet',
        description: 'Réunions régulières entre l’étudiant et son promoteur.',
        trainingCourseId: course.id,
      },
    });
    const toolSuivi = await prisma.tool.create({
      data: {
        name: 'Réunions de suivi',
        description: 'Points d’avancement planifiés avec le promoteur.',
        type: ToolType.ACTIVITY,
        moduleId: moduleSuivi.id,
      },
    });
    for (let i = 0; i < 6; i++) {
      const start = new Date(course.startDate!);
      start.setDate(start.getDate() + i * 21 + randomInt(0, 4));
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      await prisma.activity.create({
        data: {
          id: toolSuivi.id === toolSuivi.id ? (await prisma.tool.create({
            data: {
              name: `Réunion de suivi #${i + 1}`,
              description: 'Point d’avancement planifié avec le promoteur.',
              type: ToolType.ACTIVITY,
              moduleId: moduleSuivi.id,
            },
          })).id : toolSuivi.id,
          startDateTime: start,
          endDateTime: end,
          location: pick(['Salle B204', 'Visioconférence (Teams)', 'Salle A112']),
        },
      });
    }

    // Module 3 — Remise du mémoire
    const moduleRemise = await prisma.module.create({
      data: {
        name: 'Remise du mémoire',
        description: 'Dépôt du document final avant la soutenance.',
        trainingCourseId: course.id,
      },
    });
    const toolWork = await prisma.tool.create({
      data: {
        name: 'Dépôt du mémoire final',
        description: 'Fichier PDF du mémoire complet.',
        type: ToolType.WORK,
        moduleId: moduleRemise.id,
      },
    });
    const dueDate = finished ? new Date('2025-06-15') : new Date('2026-09-15');
    const work = await prisma.work.create({ data: { id: toolWork.id, maxAttempts: 2, dueDate } });

    // Module 4 — Soutenance
    const moduleSoutenance = await prisma.module.create({
      data: {
        name: 'Soutenance',
        description: 'Présentation orale et évaluation finale.',
        trainingCourseId: course.id,
      },
    });
    // On ne crée que le "gabarit" ici : un Tool par soutenance sera créé au
    // moment de planifier chaque défense (cf. section 8), car chaque
    // Activity/Group est propre à un projet dans le schéma V2.
    const toolSoutenanceTemplate = await prisma.tool.create({
      data: {
        name: 'Séance de soutenance',
        description: 'Créneau de présentation devant jury.',
        type: ToolType.ACTIVITY,
        moduleId: moduleSoutenance.id,
      },
    });

    const toolAssessment = await prisma.tool.create({
      data: {
        name: 'Grille d’évaluation de la soutenance',
        description: 'Grille utilisée par le jury pour noter la présentation et le mémoire.',
        type: ToolType.ASSESSMENT,
        moduleId: moduleSoutenance.id,
      },
    });
    // AssessmentGrid partage sa PK avec Tool -> pas d'autoincrement, on fixe id.
    const assessmentGrid = await prisma.assessmentGrid.create({
      data: { id: toolAssessment.id, editable: !finished },
    });

    // Deux jeux de critères différents selon la promo, pour varier la démo
    // (plus de notion de "version" -> juste un jeu de critères par grille).
    const CRITERIA_DEFS = finished
      ? [
          { name: 'Qualité rédactionnelle du mémoire', weight: 20 },
          { name: 'Maîtrise technique et pertinence des choix', weight: 25 },
          { name: 'Originalité et valeur ajoutée du projet', weight: 20 },
          { name: 'Qualité de la présentation orale', weight: 20 },
          { name: 'Respect du planning et autonomie', weight: 15 },
        ]
      : [
          { name: 'Qualité rédactionnelle et structuration du mémoire', weight: 25 },
          { name: 'Maîtrise technique et pertinence des choix', weight: 30 },
          { name: 'Originalité et valeur ajoutée du projet', weight: 15 },
          { name: 'Qualité de la présentation orale', weight: 20 },
          { name: 'Respect du planning et autonomie', weight: 10 },
        ];

    const criteria: { id: number; cells: { id: number; order: number; weight: number | null }[] }[] = [];
    for (const [i, def] of CRITERIA_DEFS.entries()) {
      const crit = await prisma.criteria.create({
        data: { name: def.name, order: i, defaultWeight: def.weight, gridId: assessmentGrid.id },
      });
      // Sur le critère "Maîtrise technique..." (index 1), on illustre une
      // pondération de cellule non uniforme (cf. discussion pondération) :
      // la cellule "Bon" (order=2) pèse 4x plus que les autres transitions.
      const isWeightedDemo = i === 1;
      const cellWeights: (number | null)[] = isWeightedDemo ? [null, 1, 4, 1] : [null, 1, 1, 1];

      const cells: { id: number; order: number; weight: number | null }[] = [];
      for (const [j, level] of CELL_LEVELS.entries()) {
        const cell = await prisma.cell.create({
          data: {
            description: `${level} — ${def.name.toLowerCase()}`,
            order: j,
            weight: cellWeights[j],
            criteriaId: crit.id,
          },
        });
        cells.push({ id: cell.id, order: j, weight: cellWeights[j] });
      }
      criteria.push({ id: crit.id, cells });
    }

    // Condition d'accès au module Soutenance (mémoire déposé + date passée +
    // validation par un enseignant désigné -> illustre les 3 méthodes de
    // condition non liées à une date pure, et le modèle UserValidation).
    const cgAccess = await prisma.conditionsGroup.create({
      data: { operator: ConditionOperator.AND, moduleId: moduleSoutenance.id },
    });
    const csgAccess = await prisma.conditionsSubgroup.create({
      data: { operator: ConditionOperator.AND, conditionsGroupId: cgAccess.id },
    });
    await prisma.condition.create({
      data: { method: ConditionMethod.TOOL_SUBMISSION, toolId: toolWork.id, conditionsSubgroupId: csgAccess.id },
    });
    await prisma.condition.create({
      data: { method: ConditionMethod.DATE, dateValue: dueDate, conditionsSubgroupId: csgAccess.id },
    });
    const validator = pick(teachers);
    const supervisorValidationCondition = await prisma.condition.create({
      data: {
        method: ConditionMethod.SUPERVISOR_VALIDATION,
        validatorId: validator.id,
        conditionsSubgroupId: csgAccess.id,
      },
    });

    assetsByCourse[label] = {
      tcId: course.id,
      formToolId: toolForm.id,
      formId: form.id,
      questions: [
        { id: q1.id, type: QuestionType.TEXT },
        { id: q2.id, type: QuestionType.SELECT },
        { id: q3.id, type: QuestionType.TEXT },
        { id: q4.id, type: QuestionType.CHECKBOX },
        { id: q5.id, type: QuestionType.TEXT },
      ],
      workToolId: toolWork.id,
      workId: work.id,
      dueDate,
      soutenanceToolId: toolSoutenanceTemplate.id,
      assessmentGridId: assessmentGrid.id,
      criteria,
      accessConditionValidatorId: validator.id,
      accessConditionId: supervisorValidationCondition.id,
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 4) PROJECTS + MEMBERS
  // ───────────────────────────────────────────────────────────────────────
  console.log('🎓  Création des projets (TFE)...');

  type ProjectStatus = 'TERMINE' | 'EN_COURS' | 'EN_RETARD';

  function computeStatus(finished: boolean): ProjectStatus {
    if (finished) return 'TERMINE';
    const r = Math.random();
    if (r < 0.6) return 'EN_COURS';
    if (r < 0.85) return 'TERMINE'; // certains ont fini en avance
    return 'EN_RETARD';
  }

  type CreatedProject = {
    id: number;
    title: string;
    members: { id: number }[];
    supervisor: SeededUser;
    status: ProjectStatus;
    courseLabel: 'A' | 'B';
  };

  const allProjects: CreatedProject[] = [];

  for (const { course, label, finished } of courses) {
    const students = [...studentsByCourse[label]];
    const groupings: { id: number }[][] = [];

    for (let i = 0; i < DUOS_PER_COURSE; i++) {
      groupings.push(takeRandom(students, 2));
    }
    while (students.length > 0) {
      groupings.push(takeRandom(students, 1));
    }

    for (const members of groupings) {
      const supervisor = pick(teachers);
      const title = pick(THESIS_TITLES);
      const status = computeStatus(finished);
      const project = await prisma.project.create({
        data: {
          title,
          confidential: Math.random() < 0.1,
          trainingCourseId: course.id,
          // Le "promoteur" est un ProjectMember comme les autres, sans
          // sous-rôle (les sous-rôles SUPERVISOR/PRESIDENT/READER ne
          // s'appliquent qu'aux membres du jury de soutenance).
          members: {
            create: [
              { userId: supervisor.id },
              ...members.map((m) => ({ userId: m.id })),
            ],
          },
        },
      });
      allProjects.push({ id: project.id, title, members, supervisor, status, courseLabel: label });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 5) FORM SUBMISSIONS + RESPONSES
  //    (plus de champ status : l'existence de la soumission suffit)
  // ───────────────────────────────────────────────────────────────────────
  console.log('📝  Création des soumissions de formulaire (cadrage)...');

  for (const project of allProjects) {
    const assets = assetsByCourse[project.courseLabel];
    const submitter = project.members[0];

    const hasSubmittedForm = project.status !== 'EN_RETARD' || Math.random() < 0.5;
    if (!hasSubmittedForm) continue;

    const submission = await prisma.formSubmission.create({
      data: { formId: assets.formId, userId: submitter.id, projectId: project.id },
    });

    for (const q of assets.questions) {
      let value = '';
      switch (q.type) {
        case QuestionType.TEXT:
          value = faker.lorem.sentence();
          break;
        case QuestionType.SELECT:
          value = pick(DOMAIN_OPTIONS);
          break;
        case QuestionType.CHECKBOX:
          value = pickMany(TECH_OPTIONS, randomInt(1, 3)).join(', ');
          break;
      }
      await prisma.response.create({ data: { value, questionId: q.id, submissionId: submission.id } });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 6) DÉPÔTS DE MÉMOIRE
  // ───────────────────────────────────────────────────────────────────────
  console.log('📄  Création des dépôts de mémoire...');

  for (const project of allProjects) {
    if (project.status !== 'TERMINE') continue;
    const assets = assetsByCourse[project.courseLabel];
    for (const member of project.members) {
      await prisma.userWorkSubmission.create({
        data: {
          workId: assets.workId,
          userId: member.id,
          projectId: project.id,
          fileName: `memoire_${member.id}.pdf`,
          filePath: `/uploads/memoires/memoire_${member.id}.pdf`,
        },
      });
    }

    // Validation de la condition SUPERVISOR_VALIDATION : une seule fois par
    // promo (la clé composite de UserValidation est userId+conditionId, et
    // cette condition est au niveau du module, pas du projet — inutile/
    // impossible de la "revalider" à chaque projet terminé).
  }

  for (const { label } of courses) {
    const assets = assetsByCourse[label];
    if (Math.random() < 0.8) {
      await prisma.userValidation.create({
        data: { userId: assets.accessConditionValidatorId, conditionId: assets.accessConditionId },
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 7) PONDÉRATIONS PERSONNALISÉES
  // ───────────────────────────────────────────────────────────────────────
  console.log('⚖️   Création des pondérations personnalisées...');

  for (const project of allProjects) {
    const assets = assetsByCourse[project.courseLabel];
    // pondération personnalisée pour ~15% des projets (le reste utilise le defaultWeight)
    if (Math.random() < 0.15) {
      const customWeights = [25, 20, 25, 20, 10];
      for (const [i, crit] of assets.criteria.entries()) {
        await prisma.weighting.create({
          data: { criteriaId: crit.id, projectId: project.id, weight: customWeights[i] ?? 20 },
        });
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 8) SOUTENANCES : Activity + Group + jury (UserGroup / ProjectMember) +
  //    ÉVALUATIONS (CriteriaAssessment) + GridFeedback
  // ───────────────────────────────────────────────────────────────────────
  console.log('🏆  Planification des soutenances et création des évaluations...');

  let soutenanceSlot = 0;

  for (const project of allProjects) {
    if (project.status !== 'TERMINE') continue;
    const assets = assetsByCourse[project.courseLabel];
    const course = project.courseLabel === 'A' ? courseA : courseB;
    const soutenanceDay = project.courseLabel === 'A' ? new Date('2025-06-20') : new Date('2026-09-20');

    // Créneau de soutenance dédié à ce projet (Activity, sous-type de Tool)
    const start = new Date(soutenanceDay);
    start.setMinutes(start.getMinutes() + soutenanceSlot * 30);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 25);
    soutenanceSlot++;

    const toolSlot = await prisma.tool.create({
      data: {
        name: `Soutenance — ${project.title.slice(0, 40)}`,
        type: ToolType.ACTIVITY,
        moduleId: (await prisma.tool.findUniqueOrThrow({ where: { id: assets.soutenanceToolId } })).moduleId,
      },
    });
    const activity = await prisma.activity.create({
      data: { id: toolSlot.id, startDateTime: start, endDateTime: end, location: 'Auditoire A1' },
    });

    // Jury de 2 à 3 enseignants (le promoteur + 1-2 co-évaluateurs), avec
    // sous-rôles distincts pour illustrer intervenant_projet.sous_role.
    const juryPeers = teachers.filter((t) => t.id !== project.supervisor.id);
    const peers = pickMany(juryPeers, randomInt(1, 2));
    const jurySubRoles: SubRoleType[] = [SubRoleType.SUPERVISOR, SubRoleType.PRESIDENT, SubRoleType.READER];
    for (const [i, peer] of peers.entries()) {
      await prisma.projectMember.create({
        data: { userId: peer.id, projectId: project.id, subRoleId: subRoleId[jurySubRoles[i % jurySubRoles.length]] },
      });
    }
    const jury = [project.supervisor, ...peers];

    // Group rattaché obligatoirement à cette Activity (eventId NOT NULL)
    const group = await prisma.group.create({
      data: {
        name: `${DEMO_PREFIX}Jury — ${project.title.slice(0, 40)}`,
        startDateTime: start,
        endDateTime: end,
        location: 'Auditoire A1',
        eventId: activity.id,
      },
    });
    for (const member of jury) {
      await prisma.userGroup.create({ data: { userId: member.id, groupId: group.id } });
    }
    await prisma.projectGroup.create({ data: { groupId: group.id, projectId: project.id } });

    // Évaluation par critère, au niveau du projet (plus par étudiant)
    for (const crit of assets.criteria) {
      const bounds = cumulativeBounds(crit.cells);
      // "consensus" de base pour ce critère, centré sur "Bon" (order 2)
      const baseOrder = pick([0, 1, 1, 2, 2, 2, 2, 3, 3]);
      for (const evaluator of jury) {
        // chaque évaluateur peut diverger légèrement du consensus (+/-1 niveau)
        const jitter = pick([-1, 0, 0, 0, 1]);
        const order = Math.min(3, Math.max(0, baseOrder + jitter));
        const note = noteForCellIndex(bounds, order);
        await prisma.criteriaAssessment.create({
          data: {
            date: randomDateBetween(new Date('2025-06-15'), new Date('2025-06-30')),
            commentEval: Math.random() < 0.3 ? faker.lorem.sentence() : null,
            commentFeedback: Math.random() < 0.5 ? faker.lorem.sentence() : null,
            note,
            criteriaId: crit.id,
            teacherId: evaluator.id,
            projectId: project.id,
          },
        });
      }
    }

    if (Math.random() < 0.6) {
      await prisma.gridFeedback.create({
        data: {
          commentEval: faker.lorem.sentence(),
          commentFeedback: faker.lorem.paragraph(),
          userId: project.supervisor.id,
          projectId: project.id,
          gridId: assets.assessmentGridId,
        },
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 9) NOTEBOOKS
  // ───────────────────────────────────────────────────────────────────────
  console.log('📓  Création des carnets de bord (Notebook)...');

  for (const project of allProjects) {
    for (const member of project.members) {
      const content =
        project.status === 'EN_RETARD'
          ? (Math.random() < 0.5 ? faker.lorem.sentence() : null)
          : faker.lorem.paragraphs(randomInt(1, 3));
      await prisma.notebook.create({ data: { userId: member.id, projectId: project.id, content } });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 10) NOTIFICATIONS
  // ───────────────────────────────────────────────────────────────────────
  console.log('🔔  Création des notifications...');

  const allDemoUsers = [...coordinators, ...teachers, ...studentsByCourse.A, ...studentsByCourse.B];
  const notifTemplates: { title: string; description: string; importance: Importance }[] = [
    { title: 'Rappel de dépôt', description: 'Le dépôt du mémoire final approche à grands pas.', importance: Importance.HIGH },
    { title: 'Réunion planifiée', description: 'Une nouvelle réunion de suivi a été ajoutée à votre agenda.', importance: Importance.LOW },
    { title: 'Grille mise à jour', description: 'La grille d’évaluation de la soutenance a été révisée.', importance: Importance.MEDIUM },
    { title: 'Formulaire à compléter', description: 'Le formulaire de proposition de sujet est en attente de validation.', importance: Importance.MEDIUM },
  ];
  for (const user of pickMany(allDemoUsers, 25)) {
    const tpl = pick(notifTemplates);
    await prisma.notification.create({
      data: { title: tpl.title, description: tpl.description, importance: tpl.importance, userId: user.id },
    });
  }

  // ───────────────────────────────────────────────────────────────────────
  // 11) INVITATIONS
  // ───────────────────────────────────────────────────────────────────────
  console.log('✉️   Création des invitations...');

  for (let i = 0; i < 6; i++) {
    const firstname = faker.person.firstName();
    const surname = faker.person.lastName();
    const email = buildEmail(firstname, surname);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + randomInt(3, 14));
    await prisma.invitation.create({
      data: {
        email,
        role: pick([RoleType.STUDENT, RoleType.STUDENT, RoleType.EXTERNAL]),
        token: randomUUID(),
        used: Math.random() < 0.2,
        expiresAt,
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────────
  // 12) PRÉFÉRENCES DE SUPERVISEUR (avec ordre de préférence)
  // ───────────────────────────────────────────────────────────────────────
  console.log('⭐  Création des préférences de superviseur...');

  const courseBStudents = studentsByCourse.B;
  for (const student of pickMany(courseBStudents, 25)) {
    const preferredTeachers = pickMany(teachers, 2);
    const randomProject = pick(allProjects.filter((p) => p.courseLabel === 'B'));
    for (const [order, teacher] of preferredTeachers.entries()) {
      await prisma.userSupervisorPreference
        .create({
          data: { userId: student.id, teacherId: teacher.id, projectId: randomProject.id, order: order + 1 },
        })
        .catch(() => {
          /* collision possible sur la clé composite, on ignore silencieusement */
        });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // RÉSUMÉ
  // ───────────────────────────────────────────────────────────────────────
  console.log('\n✅  Seed de démo terminé.\n');
  console.log(`   Promotions       : 2 (${courseA.name}, ${courseB.name})`);
  console.log(`   Étudiants        : ${studentsByCourse.A.length + studentsByCourse.B.length}`);
  console.log(`   Enseignants      : ${teachers.length}`);
  console.log(`   Coordinateurs    : ${coordinators.length}`);
  console.log(`   Externes         : ${externals.length}`);
  console.log(`   Projets (TFE)    : ${allProjects.length}`);
  console.log(`     dont terminés  : ${allProjects.filter((p) => p.status === 'TERMINE').length}`);
  console.log(`     dont en cours  : ${allProjects.filter((p) => p.status === 'EN_COURS').length}`);
  console.log(`     dont en retard : ${allProjects.filter((p) => p.status === 'EN_RETARD').length}`);
  console.log(`\n   Mot de passe pour tous les comptes de démo : ${DEMO_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });