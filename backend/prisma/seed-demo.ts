/**
 * SEED DE DÉMO — à ne JAMAIS lancer automatiquement en prod.
 *
 * Ce script est séparé du prisma/seed.ts officiel (qui ne contient que les
 * rôles système et tourne automatiquement au démarrage du conteneur backend).
 * Il peuple la DB avec des données réalistes pour :
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
 */

import {
  PrismaClient,
  RoleType,
  ToolType,
  QuestionType,
  SubmissionStatus,
  ConditionType,
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
const GUESTS_COUNT = 5;

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
// ─────────────────────────────────────────────────────────────────────────

async function resetDemoData(demoTrainingCourseIds: number[]) {
  console.log('🧹  Nettoyage des anciennes données de démo...');

  const userFilter = { email: { endsWith: DEMO_EMAIL_DOMAIN } };
  const tcFilter = { trainingCourseId: { in: demoTrainingCourseIds } };
  const tcById = { id: { in: demoTrainingCourseIds } };

  await prisma.response.deleteMany({
    where: { submission: { project: tcFilter } },
  });
  await prisma.userValidation.deleteMany({ where: { user: userFilter } });
  await prisma.criteriaAssessment.deleteMany({ where: { project: tcFilter } });
  await prisma.weighting.deleteMany({ where: { project: tcFilter } });
  await prisma.gridVersionFeedback.deleteMany({ where: { project: tcFilter } });
  await prisma.notebook.deleteMany({ where: { project: tcFilter } });
  await prisma.notification.deleteMany({ where: { user: userFilter } });
  await prisma.userWorkSubmission.deleteMany({ where: { project: tcFilter } });
  await prisma.formSubmission.deleteMany({ where: { project: tcFilter } });
  await prisma.questionOption.deleteMany({
    where: { question: { form: { tool: { module: tcFilter } } } },
  });
  await prisma.question.deleteMany({
    where: { form: { tool: { module: tcFilter } } },
  });
  await prisma.form.deleteMany({ where: { tool: { module: tcFilter } } });
  await prisma.activity.deleteMany({ where: { tool: { module: tcFilter } } });
  await prisma.cell.deleteMany({
    where: { criteria: { gridVersion: { assessmentGrid: { tool: { module: tcFilter } } } } },
  });
  await prisma.criteria.deleteMany({
    where: { gridVersion: { assessmentGrid: { tool: { module: tcFilter } } } },
  });
  await prisma.gridVersion.deleteMany({
    where: { assessmentGrid: { tool: { module: tcFilter } } },
  });
  await prisma.assessmentGrid.deleteMany({ where: { tool: { module: tcFilter } } });
  await prisma.work.deleteMany({ where: { tool: { module: tcFilter } } });
  await prisma.condition.deleteMany({
    where: { conditionsSubgroup: { conditionsGroup: { module: tcFilter } } },
  });
  await prisma.conditionsSubgroup.deleteMany({
    where: { conditionsGroup: { module: tcFilter } },
  });
  await prisma.conditionsGroup.deleteMany({ where: { module: tcFilter } });
  await prisma.tool.deleteMany({ where: { module: tcFilter } });
  await prisma.module.deleteMany({ where: tcFilter });
  await prisma.userGroup.deleteMany({ where: { user: userFilter } });
  await prisma.group.deleteMany({ where: { name: { startsWith: DEMO_PREFIX } } });
  await prisma.projectMember.deleteMany({ where: { project: tcFilter } });
  await prisma.userSupervisorPreference.deleteMany({ where: { project: tcFilter } });
  await prisma.project.deleteMany({ where: tcFilter });
  await prisma.invitation.deleteMany({ where: { email: { endsWith: DEMO_EMAIL_DOMAIN } } });
  await prisma.userRole.deleteMany({ where: { user: userFilter } });
  await prisma.user.updateMany({ where: userFilter, data: { supervisorId: null } });
  await prisma.user.deleteMany({ where: userFilter });
  await prisma.trainingCourse.deleteMany({ where: tcById });

  console.log('✅  Anciennes données de démo supprimées.');
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  // 0) Vérifier que les rôles système existent (seed.ts doit avoir tourné avant)
  const roles = await prisma.role.findMany();
  if (roles.length === 0) {
    throw new Error(
      "Aucun rôle trouvé. Lance d'abord `npx prisma db seed` (seed.ts) avant seed-demo.ts.",
    );
  }
  const roleId: Record<RoleType, number> = Object.fromEntries(
    roles.map((r) => [r.role, r.id]),
  ) as Record<RoleType, number>;

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
    coordinators.push(await createUser({ role: RoleType.COORDINATOR, secondRole: RoleType.TEACHER }));
  }

  const teachers: SeededUser[] = [];
  for (let i = 0; i < TEACHERS_COUNT; i++) {
    teachers.push(await createUser({ role: RoleType.TEACHER, hoursQuota: randomInt(20, 60) }));
  }

  // Petite hiérarchie illustrative : les enseignants dépendent d'un coordinateur
  for (const teacher of teachers) {
    await prisma.user.update({
      where: { id: teacher.id },
      data: { supervisorId: pick(coordinators).id },
    });
  }

  const studentsByCourse: Record<'A' | 'B', SeededUser[]> = {
    A: [],
    B: [],
  };
  for (const { label } of courses) {
    for (let i = 0; i < STUDENTS_PER_COURSE; i++) {
      studentsByCourse[label].push(await createUser({ role: RoleType.STUDENT }));
    }
  }

  const guests: SeededUser[] = [];
  for (let i = 0; i < GUESTS_COUNT; i++) {
    guests.push(await createUser({ role: RoleType.GUEST }));
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
    soutenanceToolId: number;
    assessmentToolId: number;
    activeGridVersionId: number;
    criteriaIds: number[];
    cellsByCriteria: Record<number, { id: number; order: number }[]>;
  };

  const assetsByCourse: Record<'A' | 'B', CourseAssets> = {} as any;

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
    const form = await prisma.form.create({
      data: { maxAttempts: 1, toolId: toolForm.id },
    });

    const q1 = await prisma.question.create({
      data: { name: 'Titre du sujet proposé', type: QuestionType.TEXT, isRequired: true, formId: form.id },
    });
    const q2 = await prisma.question.create({
      data: { name: 'Domaine du TFE', type: QuestionType.RADIO, isRequired: true, formId: form.id },
    });
    for (const [i, opt] of DOMAIN_OPTIONS.entries()) {
      await prisma.questionOption.create({ data: { name: opt, order: i, questionId: q2.id } });
    }
    const q3 = await prisma.question.create({
      data: { name: 'Résumé du projet', type: QuestionType.TEXT, isRequired: true, formId: form.id },
    });
    const q4 = await prisma.question.create({
      data: {
        name: 'Technologies envisagées',
        type: QuestionType.CHECKBOX,
        isRequired: false,
        formId: form.id,
      },
    });
    for (const [i, opt] of TECH_OPTIONS.entries()) {
      await prisma.questionOption.create({ data: { name: opt, order: i, questionId: q4.id } });
    }
    const q5 = await prisma.question.create({
      data: {
        name: 'Charge de travail hebdomadaire estimée (heures)',
        type: QuestionType.NUMBER,
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
          startDateTime: start,
          endDateTime: end,
          location: pick(['Salle B204', 'Visioconférence (Teams)', 'Salle A112']),
          toolId: toolSuivi.id,
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
    const work = await prisma.work.create({
      data: { toolId: toolWork.id, maxAttempts: 2, dueDate },
    });

    // Module 4 — Soutenance
    const moduleSoutenance = await prisma.module.create({
      data: {
        name: 'Soutenance',
        description: 'Présentation orale et évaluation finale.',
        trainingCourseId: course.id,
      },
    });
    const toolSoutenanceActivity = await prisma.tool.create({
      data: {
        name: 'Séance de soutenance',
        description: 'Créneaux de présentation devant jury.',
        type: ToolType.ACTIVITY,
        moduleId: moduleSoutenance.id,
      },
    });
    const soutenanceDay = finished ? new Date('2025-06-20') : new Date('2026-09-20');
    for (let i = 0; i < 8; i++) {
      const start = new Date(soutenanceDay);
      start.setMinutes(start.getMinutes() + i * 30);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 25);
      await prisma.activity.create({
        data: {
          startDateTime: start,
          endDateTime: end,
          location: 'Auditoire A1',
          toolId: toolSoutenanceActivity.id,
        },
      });
    }

    const toolAssessment = await prisma.tool.create({
      data: {
        name: 'Grille d’évaluation de la soutenance',
        description: 'Grille utilisée par le jury pour noter la présentation et le mémoire.',
        type: ToolType.ASSESSMENT,
        moduleId: moduleSoutenance.id,
      },
    });
    const assessmentGrid = await prisma.assessmentGrid.create({ data: { toolId: toolAssessment.id } });

    const CRITERIA_DEFS_V1 = [
      { name: 'Qualité rédactionnelle du mémoire', weight: 20 },
      { name: 'Maîtrise technique et pertinence des choix', weight: 25 },
      { name: 'Originalité et valeur ajoutée du projet', weight: 20 },
      { name: 'Qualité de la présentation orale', weight: 20 },
      { name: 'Respect du planning et autonomie', weight: 15 },
    ];
    const CRITERIA_DEFS_V2 = [
      { name: 'Qualité rédactionnelle et structuration du mémoire', weight: 25 },
      { name: 'Maîtrise technique et pertinence des choix', weight: 30 },
      { name: 'Originalité et valeur ajoutée du projet', weight: 15 },
      { name: 'Qualité de la présentation orale', weight: 20 },
      { name: 'Respect du planning et autonomie', weight: 10 },
    ];
    const CELL_LEVELS = ['Insuffisant', 'Satisfaisant', 'Bon', 'Excellent'];

    async function createGridVersion(
      startDate: Date,
      endDate: Date | null,
      defs: { name: string; weight: number }[],
    ) {
      const gv = await prisma.gridVersion.create({
        data: { assessmentGridId: assessmentGrid.id, startDate, endDate },
      });
      const criteriaIds: number[] = [];
      const cellsByCriteria: Record<number, { id: number; order: number }[]> = {};
      for (const [i, def] of defs.entries()) {
        const criteria = await prisma.criteria.create({
          data: { name: def.name, order: i, defaultWeight: def.weight, gridVersionId: gv.id },
        });
        criteriaIds.push(criteria.id);
        const cells: { id: number; order: number }[] = [];
        for (const [j, level] of CELL_LEVELS.entries()) {
          const cell = await prisma.cell.create({
            data: {
              description: `${level} — ${def.name.toLowerCase()}`,
              order: j,
              criteriaId: criteria.id,
            },
          });
          cells.push({ id: cell.id, order: j });
        }
        cellsByCriteria[criteria.id] = cells;
      }
      return { gridVersionId: gv.id, criteriaIds, cellsByCriteria };
    }

    let activeGrid: { gridVersionId: number; criteriaIds: number[]; cellsByCriteria: Record<number, { id: number; order: number }[]> };

    if (finished) {
      // Une seule version, utilisée du début à la fin de la promo
      activeGrid = await createGridVersion(course.startDate!, course.endDate, CRITERIA_DEFS_V1);
    } else {
      // Deux versions : montre l'évolution de la grille en cours d'année
      await createGridVersion(course.startDate!, new Date('2026-01-15'), CRITERIA_DEFS_V1);
      activeGrid = await createGridVersion(new Date('2026-01-16'), null, CRITERIA_DEFS_V2);
    }

    assetsByCourse[label] = {
      tcId: course.id,
      formToolId: toolForm.id,
      formId: form.id,
      questions: [
        { id: q1.id, type: QuestionType.TEXT },
        { id: q2.id, type: QuestionType.RADIO },
        { id: q3.id, type: QuestionType.TEXT },
        { id: q4.id, type: QuestionType.CHECKBOX },
        { id: q5.id, type: QuestionType.NUMBER },
      ],
      workToolId: toolWork.id,
      workId: work.id,
      dueDate,
      soutenanceToolId: toolSoutenanceActivity.id,
      assessmentToolId: toolAssessment.id,
      activeGridVersionId: activeGrid.gridVersionId,
      criteriaIds: activeGrid.criteriaIds,
      cellsByCriteria: activeGrid.cellsByCriteria,
    };

    // Conditions d'accès / de réussite (illustratif)
    const cgSuccess = await prisma.conditionsGroup.create({
      data: { type: ConditionType.SUCCESS, operator: ConditionOperator.AND, moduleId: moduleCadrage.id },
    });
    const csgSuccess = await prisma.conditionsSubgroup.create({
      data: { operator: ConditionOperator.AND, conditionsGroupId: cgSuccess.id },
    });
    const conditionCadrageValide = await prisma.condition.create({
      data: {
        method: ConditionMethod.TOOL_SUBMISSION,
        toolId: toolForm.id,
        conditionsSubgroupId: csgSuccess.id,
      },
    });

    const cgAccess = await prisma.conditionsGroup.create({
      data: { type: ConditionType.ACCESS, operator: ConditionOperator.AND, moduleId: moduleSoutenance.id },
    });
    const csgAccess = await prisma.conditionsSubgroup.create({
      data: { operator: ConditionOperator.AND, conditionsGroupId: cgAccess.id },
    });
    await prisma.condition.create({
      data: {
        method: ConditionMethod.TOOL_SUBMISSION,
        toolId: toolWork.id,
        conditionsSubgroupId: csgAccess.id,
      },
    });
    await prisma.condition.create({
      data: {
        method: ConditionMethod.DATE,
        dateValue: dueDate,
        conditionsSubgroupId: csgAccess.id,
      },
    });

    (assetsByCourse[label] as any).conditionCadrageId = conditionCadrageValide.id;
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
    supervisor: { id: number };
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
    // ce qu'il reste = projets solo
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
          supervisorId: supervisor.id,
          trainingCourseId: course.id,
          members: { create: members.map((m) => ({ userId: m.id })) },
        },
      });
      allProjects.push({
        id: project.id,
        title,
        members,
        supervisor,
        status,
        courseLabel: label,
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 5) FORM SUBMISSIONS + RESPONSES
  // ───────────────────────────────────────────────────────────────────────
  console.log('📝  Création des soumissions de formulaire (cadrage)...');

  for (const project of allProjects) {
    const assets = assetsByCourse[project.courseLabel];
    const submitter = project.members[0];

    let status: SubmissionStatus;
    if (project.status === 'TERMINE') status = SubmissionStatus.APPROVED;
    else if (project.status === 'EN_COURS') status = SubmissionStatus.SUBMITTED;
    else status = Math.random() < 0.5 ? SubmissionStatus.NOT_SUBMITED : SubmissionStatus.SUBMITTED;

    const submission = await prisma.formSubmission.create({
      data: {
        formId: assets.formId,
        userId: submitter.id,
        projectId: project.id,
        status,
      },
    });

    if (status !== SubmissionStatus.NOT_SUBMITED) {
      for (const q of assets.questions) {
        let value = '';
        switch (q.type) {
          case QuestionType.TEXT:
            value = faker.lorem.sentence();
            break;
          case QuestionType.RADIO:
            value = pick(DOMAIN_OPTIONS);
            break;
          case QuestionType.CHECKBOX:
            value = pickMany(TECH_OPTIONS, randomInt(1, 3)).join(', ');
            break;
          case QuestionType.NUMBER:
            value = String(randomInt(5, 20));
            break;
        }
        await prisma.response.create({
          data: { value, questionId: q.id, submissionId: submission.id },
        });
      }

      // Validation de la condition de cadrage pour cet étudiant
      const conditionId = (assets as any).conditionCadrageId as number;
      await prisma.userValidation.create({
        data: { userId: submitter.id, conditionId },
      });
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
  }

  // ───────────────────────────────────────────────────────────────────────
  // 7) ÉVALUATIONS (CriteriaAssessment) + PONDÉRATIONS + FEEDBACK
  // ───────────────────────────────────────────────────────────────────────
  console.log('🏆  Création des évaluations...');

  for (const project of allProjects) {
    const assets = assetsByCourse[project.courseLabel];

    // pondération personnalisée pour ~15% des projets (le reste utilise le defaultWeight)
    if (Math.random() < 0.15) {
      const customWeights = [25, 20, 25, 20, 10];
      for (const [i, criteriaId] of assets.criteriaIds.entries()) {
        await prisma.weighting.create({
          data: { criteriaId, projectId: project.id, weight: customWeights[i] ?? 20 },
        });
      }
    }

    if (project.status !== 'TERMINE') continue;

    // Jury de 2 à 3 enseignants par projet (le superviseur + 1-2 co-évaluateurs).
    // Chaque membre du jury note indépendamment chaque critère pour chaque
    // étudiant -> illustre le caractère collaboratif de l'évaluation.
    const juryPeers = teachers.filter((t) => t.id !== project.supervisor.id);
    const jury = [project.supervisor, ...pickMany(juryPeers, randomInt(1, 2))];

    for (const member of project.members) {
      for (const criteriaId of assets.criteriaIds) {
        const cells = assets.cellsByCriteria[criteriaId];
        // "consensus" de base pour ce critère, centré sur "Bon"
        const baseOrder = pick([0, 1, 1, 2, 2, 2, 2, 3, 3]);
        for (const evaluator of jury) {
          // chaque évaluateur peut diverger légèrement du consensus (+/-1 niveau)
          const jitter = pick([-1, 0, 0, 0, 1]);
          const order = Math.min(3, Math.max(0, baseOrder + jitter));
          const cell = cells.find((c) => c.order === order) ?? cells[2];
          await prisma.criteriaAssessment.create({
            data: {
              date: randomDateBetween(new Date('2025-06-15'), new Date('2025-06-30')),
              comment: Math.random() < 0.3 ? faker.lorem.sentence() : null,
              cellId: cell.id,
              projectId: project.id,
              criteriaId,
              studentId: member.id,
              teacherId: evaluator.id,
            },
          });
        }
      }
    }

    if (Math.random() < 0.6) {
      await prisma.gridVersionFeedback.create({
        data: {
          comment: faker.lorem.paragraph(),
          userId: project.supervisor.id,
          projectId: project.id,
          gridVersionId: assets.activeGridVersionId,
        },
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 8) NOTEBOOKS
  // ───────────────────────────────────────────────────────────────────────
  console.log('📓  Création des carnets de bord (Notebook)...');

  for (const project of allProjects) {
    for (const member of project.members) {
      const content =
        project.status === 'EN_RETARD'
          ? (Math.random() < 0.5 ? faker.lorem.sentence() : null)
          : faker.lorem.paragraphs(randomInt(1, 3));
      await prisma.notebook.create({
        data: { userId: member.id, projectId: project.id, content },
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 9) GROUPS
  // ───────────────────────────────────────────────────────────────────────
  console.log('👥  Création des groupes...');

  for (const { course, label } of courses) {
    const promoGroup = await prisma.group.create({
      data: { name: `${DEMO_PREFIX}Promotion ${label === 'A' ? '2024-2025' : '2025-2026'}`, type: 'PROMOTION' },
    });
    const members = [...studentsByCourse[label], ...coordinators];
    for (const m of members) {
      await prisma.userGroup.create({ data: { userId: m.id, groupId: promoGroup.id } });
    }
  }

  const juryA = await prisma.group.create({ data: { name: `${DEMO_PREFIX}Jury Soutenances A`, type: 'JURY' } });
  const juryB = await prisma.group.create({ data: { name: `${DEMO_PREFIX}Jury Soutenances B`, type: 'JURY' } });
  const shuffledTeachers = pickMany(teachers, teachers.length);
  for (const t of shuffledTeachers.slice(0, 5)) {
    await prisma.userGroup.create({ data: { userId: t.id, groupId: juryA.id } });
  }
  for (const t of shuffledTeachers.slice(5)) {
    await prisma.userGroup.create({ data: { userId: t.id, groupId: juryB.id } });
  }

  // ───────────────────────────────────────────────────────────────────────
  // 10) NOTIFICATIONS
  // ───────────────────────────────────────────────────────────────────────
  console.log('🔔  Création des notifications...');

  const allDemoUsers = [...coordinators, ...teachers, ...studentsByCourse.A, ...studentsByCourse.B];
  const notifTemplates: { name: string; description: string; importance: Importance }[] = [
    { name: 'Rappel de dépôt', description: 'Le dépôt du mémoire final approche à grands pas.', importance: Importance.HIGH },
    { name: 'Réunion planifiée', description: 'Une nouvelle réunion de suivi a été ajoutée à votre agenda.', importance: Importance.LOW },
    { name: 'Grille mise à jour', description: 'La grille d’évaluation de la soutenance a été révisée.', importance: Importance.MEDIUM },
    { name: 'Formulaire à compléter', description: 'Le formulaire de proposition de sujet est en attente de validation.', importance: Importance.MEDIUM },
  ];
  for (const user of pickMany(allDemoUsers, 25)) {
    const tpl = pick(notifTemplates);
    await prisma.notification.create({
      data: {
        name: tpl.name,
        description: tpl.description,
        importance: tpl.importance,
        userId: user.id,
      },
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
        role: pick([RoleType.STUDENT, RoleType.STUDENT, RoleType.GUEST]),
        token: randomUUID(),
        used: Math.random() < 0.2,
        expiresAt,
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────────
  // 12) PRÉFÉRENCES DE SUPERVISEUR
  // ───────────────────────────────────────────────────────────────────────
  console.log('⭐  Création des préférences de superviseur...');

  const courseBStudents = studentsByCourse.B;
  for (const student of pickMany(courseBStudents, 25)) {
    const preferredTeachers = pickMany(teachers, 2);
    for (const teacher of preferredTeachers) {
      const randomProject = pick(allProjects.filter((p) => p.courseLabel === 'B'));
      await prisma.userSupervisorPreference
        .create({
          data: { userId: student.id, teacherId: teacher.id, projectId: randomProject.id },
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
  console.log(`   Invités          : ${guests.length}`);
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