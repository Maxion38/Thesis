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
 *   - GridVersionFeedback renommé GridFeedback : redevenu un feedback unique
 *     et global par grille/projet (plus de commentEval/commentFeedback ni
 *     d'auteur, un seul champ `comment`), portant désormais un `status`
 *     (GridFeedbackStatus) et une `date`.
 *   - CriteriaAssessment.date scindée en dateEval / dateFeedback.
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
  GridFeedbackStatus,
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

const STUDENTS_PER_COURSE = 20; // par promo -> 4 promos désormais (cf. section 1)
const DUOS_PER_COURSE = 3; // nombre de projets en binôme (le reste = solo)
const TEACHERS_COUNT = 10;
const COORDINATORS_COUNT = 2;
const EXTERNALS_COUNT = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

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
// GRILLES RÉELLES — retranscrites depuis les PDF officiels de l'école
//
// Chaque grille (nom d'outil, critères, descriptions de cellules) est reprise
// telle quelle depuis les PDF fournis par l'école, pour remplacer le contenu
// générique par du contenu réel et exploitable dans le rapport :
//   - cdc                 <- TFE_-_Évaluation_1_-_cahier_des_charges.pdf
//   - validationSujet     <- TFE_-_Évaluation_1_-_validation_sujet.pdf
//   - analyse             <- grille_cdc_analyse_v2_pyg.pdf
//   - suiviRapporteur     <- grille_suivi_rapporteur.pdf
//   - oral                <- grille_oral_final.pdf
//   - realisationPratique <- grille_realisation_pratique.pdf
//   - rapportFinal        <- grille_rapport_final.pdf
//
// Le schéma n'a pas de notion de "catégorie" regroupant plusieurs Criteria
// au sein d'une AssessmentGrid (pas de table intermédiaire dans le drawio
// V2) : les sous-thèmes visuels des PDF (ex. "Evaluation de la forme" /
// "Evaluation du fond", "Cahier des charges", "Conclusion", ...) ne sont
// donc pas repris, seuls les critères eux-mêmes sont modélisés.
//
// IMPORTANT : le nombre de cellules par critère n'est PAS une constante à
// faire respecter globalement. Certains PDF laissent une colonne vide pour
// un critère donné (ex. pas de "Bien"/"Très bien" pour "Réalisation
// pratique" dans la grille de validation du sujet, ou pas de "Bien"/"Très
// bien" pour "Mise en œuvre de la méthodologie" dans la grille d'analyse) :
// dans ce cas, seules les cellules réellement présentes dans le PDF sont
// créées pour ce critère. `createGridsForModule` ci-dessous se base
// uniquement sur `criteria[i].cells.length`, critère par critère -> rien
// n'empêche un jeu de critères avec 2 cellules pour l'un et 6 pour un autre.
//
// Les poids par critère (defaultWeight) ne figurent pas dans les PDF ; ils
// ont été estimés pour totaliser 100 par grille, à ajuster librement.
// ─────────────────────────────────────────────────────────────────────────

interface RealGridCriterionDef {
  name: string;
  weight: number;
  cells: string[]; // du niveau le plus bas au plus haut ; la longueur varie selon le critère
}

interface RealGridDef {
  key: string;
  toolName: string;
  toolDescription: string;
  module: 'cadrage' | 'suivi' | 'soutenance';
  evaluator: 'rapporteur' | 'jury';
  criteria: RealGridCriterionDef[];
}

const REAL_GRIDS: RealGridDef[] = [
  {
    key: 'cdc',
    toolName: 'Évaluation 1 - Cahier des charges',
    toolDescription: 'Grille utilisée par le rapporteur pour évaluer le cahier des charges remis par l’étudiant.',
    module: 'cadrage',
    evaluator: 'rapporteur',
    criteria: [
      {
        name: 'Forme du texte',
        weight: 15,
        cells: [
          'La forme du rapport n\'est pas professionnelle : plus de 5 fautes d\'orthographe par page, mise en page non homogène gênant la lecture, pas de structuration des sections. Illustrations (schémas, images, photos) absentes ou non cohérentes avec le texte.',
          'L\'orthographe est suffisante (maximum une ou deux fautes par page), la mise en page est homogène, les titres sont structurés et numérotés.',
          'L\'orthographe est correcte, il y a peu de fautes d\'orthographe (moins de 5 sur le document). La mise en page est soignée et la structuration correcte.',
          'Il n\'y a pas ou très peu de fautes d\'orthographe. La mise en page est particulièrement agréable et professionnelle. Les sections sont bien organisées. Des illustrations légendées et exploitées dans le texte viennent clarifier le propos.',
        ],
      },
      {
        name: 'Qualité du texte',
        weight: 15,
        cells: [
          'Le vocabulaire utilisé n\'est pas adapté au public. Les phrases ne sont grammaticalement pas correctes. Le style n\'est pas professionnel. Il n\'y a pas de cohésion dans le texte.',
          'Le vocabulaire utilisé est adapté au public. Les phrases sont grammaticalement correctes et le style suffisant. Les sections ont une suite logique.',
          'Le vocabulaire est adapté au public et spécifique au domaine. Le style d\'écriture est agréable. Un fil rouge permet de faire le lien entre les sections qui se suivent logiquement.',
          'Le style est particulièrement soigné et professionnel, le texte est agréable à lire, tous les éléments s\'enchaînent de manière fluide et logique.',
        ],
      },
      {
        name: 'Oral',
        weight: 10,
        cells: [
          'L\'étudiant n\'a rien préparé et n\'est pas en mesure d\'expliquer clairement son sujet.',
          'L\'étudiant a préparé son explication orale et permet au jury de comprendre la problématique.',
          'L\'étudiant fait une présentation professionnelle de son sujet, et peut répondre aux questions posées.',
          'L\'étudiant fait une présentation professionnelle de son sujet et est particulièrement convainquant pour la mise en avant de l\'intérêt de son sujet. Il interagit et rebondit intelligemment aux critiques et suggestions formulées.',
        ],
      },
      {
        name: 'Problème et contexte',
        weight: 15,
        cells: [
          'La problématique n\'est pas décrite, ou insuffisamment. Le lecteur ne comprend pas de quoi il est question dans le TFE.',
          'La problématique et son contexte sont présentés dans le texte, de manière à ce que le lecteur puisse comprendre le sujet du TFE.',
          'La problématique et le contexte sont introduits de manière détaillée. La problématique est mise en perspective sur base des spécificités du contexte. Les enjeux et objectifs des parties prenantes sont identifiés.',
          'La problématique et le contexte sont présentés de manière détaillée et fine. Les enjeux et objectifs des parties prenantes sont identifiés et correctement analysés. L\'étudiant démontre une bonne capacité de prise de recul et d\'analyse par rapport au contexte du TFE.',
        ],
      },
      {
        name: 'Identification des intervenants',
        weight: 10,
        cells: [
          'Les intervenants de la problématique ne sont pas identifiés (client, différents utilisateurs, ...).',
          'Les intervenants de la problématique sont identifiés (client, différents utilisateurs, ...).',
          'Les intervenants de la problématique sont identifiés et leurs spécificités sont décrites. Leurs objectifs spécifiques sont identifiés.',
          'Les intervenants de la problématique sont identifiés et leurs spécificités sont analysées de manière approfondie. Leurs objectifs spécifiques sont identifiés, décrits et analysés.',
        ],
      },
      {
        name: 'Identification des fonctionnalités',
        weight: 15,
        cells: [
          'Les fonctionnalités ne sont pas décrites, ou sont décrites de manière superficielle ou incomplète.',
          'Les fonctionnalités sont décrites et couvrent effectivement la problématique présentée.',
          'Les fonctionnalités sont décrites de manière précise (éventuellement sous forme d\'US) et classifiées par type d\'utilisateur. Elles sont réfléchies, adéquates et couvrent bien l\'entièreté de la problématique.',
          'Les fonctionnalités sont complètes, bien décrites (éventuellement sous forme d\'US), classées par type d\'utilisateur et éventuellement illustrées par des cas d\'utilisation. Elles possèdent des critères d\'acceptation. Elles sont classées par ordre d\'importance pour le "client" et possèdent une estimation de la complexité.',
        ],
      },
      {
        name: 'Méthodologie : organisation du travail',
        weight: 10,
        cells: [
          'Le CdC ne précise pas la méthodologie qui sera suivie.',
          'La méthodologie est présentée : étapes principales du travail, mention du type de gestion de projet envisagée (+ outils), organisation des interactions avec les intervenants (rapporteur, client, …).',
          'La méthodologie est présentée : étapes principales du travail avec échéances, explication claire du type de gestion de projet envisagée (+ outils), organisation régulière d\'interactions avec les intervenants (rapporteur, client, …).',
          'La méthodologie est présentée et l\'étudiant montre qu\'il a intégré de bonnes pratiques dans sa gestion de projet : étapes principales du travail avec échéances et objectifs, explication claire du type de gestion de projet envisagée, choix d\'outil pertinent, interactions régulières et spécifiques avec les intervenants (rapporteur, client, …).',
        ],
      },
      {
        name: 'Méthodologie : approche itérative et incrémentale',
        weight: 10,
        cells: [
          'L\'étudiant n\'identifie pas de premier objectif de réalisation (type MVP - Minimum Valuable Product).',
          'L\'étudiant a organisé l\'implémentation des fonctionnalités pour la réalisation pratique par priorité. Le MVP est présent et représente bien une première itération fonctionnelle apportant de la valeur au client. Il est rapidement réalisable.',
          'L\'étudiant organise l\'implémentation pratique des fonctionnalités par priorité. Plusieurs itérations sont prévues, en commençant par un MVP qui représente bien une première itération fonctionnelle apportant de la valeur au client et rapidement réalisable. Il montre qu\'il fait preuve de souplesse et qu\'il sera capable de s\'adapter au rythme réel d\'avancement du TFE.',
          'L\'étudiant a tout mis en place pour suivre une méthodologie type SCRUM, avec un outil permettant de suivre l\'avancement du travail et d\'adapter la planification sur base de métriques (ex : vélocité, story point, burndown chart, …). Exemples d\'outils : Jira, IceScrum, ...',
        ],
      },
    ],
  },
  {
    key: 'validationSujet',
    toolName: 'Évaluation 1 - Validation du sujet',
    toolDescription: 'Grille utilisée par le rapporteur pour évaluer la pertinence du sujet proposé par l’étudiant.',
    module: 'cadrage',
    evaluator: 'rapporteur',
    criteria: [
      {
        name: 'Client',
        weight: 20,
        cells: [
          'Le sujet n\'est pas lié à un client réel.',
          'L\'étudiant est en contact avec un client intéressé par le sujet.',
          'Le client est un professionnel "métier" de la problématique, et a des attentes par rapport au résultat du TFE.',
          'Le client est un professionnel "métier" de la problématique, il a de réelles attentes par rapport à cette dernière et demande à pouvoir suivre régulièrement le projet.',
        ],
      },
      {
        name: 'Réalisation pratique',
        weight: 20,
        cells: [
          'Le sujet ne permet pas la réalisation d\'un cas pratique.',
          'La problématique permet d\'envisager une solution qui mènera à une réalisation pratique significative.',
        ],
      },
      {
        name: 'Etendue du sujet',
        weight: 20,
        cells: [
          'Le sujet abordé n\'est pas représentatif du profil métier TI, ou possède déjà une solution existante évidente pour laquelle une variante plus adaptée pour le client n\'est pas concevable.',
          'Le sujet permet la mise en oeuvre d\'une solution se démarquant de l\'existant. Dans le cadre de ce sujet, l\'étudiant sera amené à mettre en oeuvre de manière non superficielle minimum deux piliers de la formation TI (Réseaux/admin, télécom, électronique, développement). Par exemple, si le sujet est du développement Web, l\'étudiant le déploie sur une infrastructure d\'hébergement non triviale (et cela a du sens dans le cadre de la problématique).',
          'Le sujet permet la mise en oeuvre d\'une solution se démarquant de l\'existant. Le sujet intègre deux piliers ou plus de la formation TI que l\'étudiant sera amené à analyser et mettre en oeuvre de manière approfondie.',
          'Le sujet permet la mise en oeuvre d\'une solution se démarquant de l\'existant. Le sujet correspond particulièrement au profil-métier TI en intégrant "naturellement" plusieurs piliers, et est particulièrement innovant.',
        ],
      },
      {
        name: 'Intérêt de l\'analyse',
        weight: 20,
        cells: [
          'L\'ampleur du sujet ne permet pas une analyse suffisamment intéressante.',
          'Le sujet permettra à l\'étudiant de creuser la problématique métier, de mettre en oeuvre des techniques d\'analyse (schémas DB, UML, réseaux, …) et de comparer plusieurs solutions techniques connues, en appliquant les approches et procédures vues dans le cadre des projets.',
          'Le sujet permettra à l\'étudiant de creuser une problématique métier originale se démarquant des projets réalisés durant le cursus, de mettre en oeuvre des techniques d\'analyse (schémas DB, UML, réseaux, …) et de comparer plusieurs solutions techniques peu ou pas vues au cours du cursus.',
          'L\'analyse à mener sort de l\'ordinaire et amène des challenges inédits dans le cadre de la formation. L\'étudiant sera amené à creuser des pratiques et techniques sortant éventuellement des domaines d\'expertises de l\'équipe enseignante.',
        ],
      },
      {
        name: 'Ampleur du TFE',
        weight: 20,
        cells: [
          'Le sujet ne permet pas d\'effectuer un travail nécessitant 16 ECTS de travail (~450 heures).',
          'Les fonctionnalités identifiées dans le cahier des charges devraient permettre de réaliser la charge de travail attendue (16 ECTS).',
          'Les fonctionnalités identifiées dans le cahier des charges devraient permettre de réaliser la charge de travail attendue (16 ECTS). L\'étudiant a classé ces dernières par ordre de priorité afin de pouvoir ajuster le périmètre du TFE au fur et à mesure de l\'avancement.',
        ],
      },
    ],
  },
  {
    key: 'analyse',
    toolName: 'Évaluation 2 - analyse',
    toolDescription: 'Grille utilisée par le rapporteur pour évaluer l’analyse de la problématique et les choix de conception, en cours d’année.',
    module: 'suivi',
    evaluator: 'rapporteur',
    criteria: [
      {
        name: 'Forme du texte',
        weight: 8,
        cells: [
          'Rapport pas professionnel : plus de 5 fautes d\'orthographe par page ; mise en page non-homogène ; pas de structuration en sections ; illustrations absentes ou incohérentes avec le texte.',
          'L\'orthographe est suffisante (maximum une ou deux fautes par page), la mise en page est homogène, les titres sont structurés et numérotés.',
          'La mise en page est bien soignée, très agréable ; des illustrations accompagnent le propos.',
          'Il n\'y a pas ou très peu de fautes d\'orthographe. La mise en page est remarquable. Des illustrations légendées et citées dans le texte clarifient le propos.',
        ],
      },
      {
        name: 'Qualité du texte',
        weight: 8,
        cells: [
          'Le style n\'est pas professionnel : vocabulaire pas adapté au public ; erreurs flagrantes de grammaire ; pas de cohésion dans le texte.',
          'Le vocabulaire utilisé est adapté au public ; la grammaire est correcte. Les sections sont logiquement structurées.',
          'Le vocabulaire est spécifique au domaine. Le style d\'écriture est agréable et la compréhension aisée. Les sections s\'organisent autour d\'un fil rouge clair.',
          'Le style est particulièrement soigné et professionnel, le texte est agréable à lire, tous les éléments s\'enchaînent de manière fluide et logique.',
        ],
      },
      {
        name: 'Oral',
        weight: 6,
        cells: [
          'L\'étudiant n\'a rien préparé et/ou n\'est pas en mesure d\'expliquer clairement son sujet.',
          'L\'étudiant a préparé son exposé (éventuellement avec un support) et permet au jury de comprendre la problématique.',
          'La présentation est professionnelle. L\'étudiant peut répondre adéquatement aux questions posées.',
          'L\'étudiant interagit et rebondit intelligemment aux critiques et suggestions formulées.',
        ],
      },
      {
        name: 'Problème et contexte',
        weight: 8,
        cells: [
          'La problématique n\'est pas décrite, ou insuffisamment. Le lecteur ne comprend pas de quoi il est question dans le TFE.',
          'La problématique et son contexte sont présentés dans le texte, de manière à ce que le lecteur puisse comprendre le sujet du TFE.',
          'La problématique est mise en perspective sur base des spécificités du contexte. Les enjeux et objectifs des parties prenantes sont identifiés.',
          'L\'étudiant démontre une bonne capacité de prise de recul et d\'analyse par rapport au contexte du TFE.',
        ],
      },
      {
        name: 'Identification des intervenants',
        weight: 6,
        cells: [
          'Les intervenants de la problématique ne sont pas identifiés (client, différents utilisateurs).',
          'Les intervenants de la problématique sont identifiés (client, différents utilisateurs).',
          'Les spécificités et objectifs des intervenants sont décrites ("rôles").',
          'L\'étudiant analyse les enjeux et impacts fonctionnels des différents rôles dans la problématique.',
        ],
      },
      {
        name: 'Identification des fonctionnalités',
        weight: 8,
        cells: [
          'Les fonctionnalités ne sont pas décrites, ou sont décrites de manière superficielle ou incomplète.',
          'Les fonctionnalités sont décrites et couvrent effectivement la problématique présentée.',
          'Les fonctionnalités sont : classées par type d\'utilisateur ; éventuellement formulées sous forme de User Stories ; précises, réfléchies et pertinentes.',
          'Les fonctionnalités sont : illustrées par des cas d\'utilisation ; possèdent des critères d\'acceptation ; classées par ordre d\'importance pour le client ; possèdent une estimation de la complexité.',
        ],
      },
      {
        name: 'Méthodologie : organisation du travail',
        weight: 8,
        cells: [
          'Le cahier des charges ne précise pas la méthodologie qui sera suivie.',
          'Le document décrit : les étapes principales du travail ; le type de gestion de projet envisagée (et les outils) ; l\'organisation des interactions avec les intervenants (rapporteur, client).',
          'Le document détaille : les étapes du travail, sous forme d\'un calendrier sommaire ; comment la méthodologie de travail sera mise en œuvre concrètement ; un planning grossier des interactions avec les intervenants.',
          'L\'organisation est incrémentale. Le document identifie : une première itération fonctionnelle (MVP) ; les étapes successives nécessaires à obtenir différentes versions à montrer au client ; les outils de suivi de l\'avancement du travail permettant une organisation flexible aux aléas du projet.',
        ],
      },
      {
        name: 'Positionnement de la solution',
        weight: 8,
        cells: [
          'Le TFE n\'est pas comparé aux solutions existantes répondant à la problématique.',
          'Une ou deux solutions concurrentes sont identifiées et comparées au projet défendu. Le développement d\'une solution nouvelle est justifié.',
          'Plusieurs solutions sont présentées, leurs forces et faiblesses sont décrites. La pertinence du développement d\'une solution nouvelle est convaincante.',
          'Une analyse des avantages et inconvénients d\'une nouvelle solution est effectuée.',
        ],
      },
      {
        name: 'Analyse technique',
        weight: 8,
        cells: [
          'Les éléments techniques nécessaires pour répondre à la problématique ne sont pas décrits, ou les choix posés ne sont pas justifiés.',
          'Les éléments techniques et technologies nécessaires pour répondre à la problématique sont identifiés et comparés. Le choix effectué est raisonné.',
          'Les critères de comparaison des technologies sont choisis sur base des objectifs du client. Le choix effectué est basé sur ce comparatif. Les limites de ce choix sont exposées.',
          'Les éléments de comparaisons sont basés sur des analyses ou des benchmarks reproductibles et scientifiquement vérifiables. Tous les éléments utilisés sont référencés adéquatement.',
        ],
      },
      {
        name: 'Conception de la solution',
        weight: 8,
        cells: [
          'Les outils de conception vus lors du cursus (schémas DB, UML, électroniques, etc) ne sont pas mis en oeuvre. Aucune maquette d\'interface ou du produit n\'est présentée.',
          'Les outils adaptés au sujet sont utilisés pour proposer une solution (schéma DB, UML, réseau, électronique, etc). Les diagrammes sont corrects, suffisants, lisibles, légendés et accompagnés d\'une explication textuelle.',
          'Des maquettes ou des schémas du produit sont fournis et permettent d\'imaginer l\'aspect de la solution finale. Les diagrammes sont justifiés dans le texte, et cette justification démontre la profondeur de la réflexion menée.',
          'Les diagrammes sont remarquables par leur ampleur et/ou leur qualité intrinsèque, reflétée dans le texte.',
        ],
      },
      {
        name: 'Stratégie de validation',
        weight: 8,
        cells: [
          'Aucune stratégie de validation n\'est présentée.',
          'Des critères d\'acceptation des fonctionnalités sont fournis. Les outils de validation décrits.',
          'Une stratégie de validation variée (deux techniques différentes au moins), permet de vérifier que la solution répond au besoin. Les outils de validation sont pertinents.',
          'La stratégie de validation envisagée est riche, les éléments techniques sont validés individuellement et de manière intégrée.',
        ],
      },
      {
        name: 'Stratégie de sécurité et RGPD',
        weight: 8,
        cells: [
          'La question de la sécurité et des enjeux liés au RGPD est éludée.',
          'Les points critiques de sécurité sont identifiés. Les stratégies de protection mises en place sont imaginées.',
          'Les biens à protéger et les menaces qui s\'y réfèrent sont identifiés et priorisés. Des contre-mesures correspondantes à ces menaces sont proposées.',
          'L\'analyse de sécurité est particulièrement remarquable : les contre-mesures sont choisies avec soin et justifiées au moyen de critères solides et documentés.',
        ],
      },
      {
        name: 'Mise en œuvre de la méthodologie',
        weight: 8,
        cells: [
          'Les méthodologies de travail identifiées dans le cahier des charges ne sont pas mises en œuvre.',
          'Les outils de base soutenant la méthodologie de travail sont mis en œuvre adéquatement (repository, outils d\'organisation, etc.). Les outils sont conformes au cahier des charges.',
        ],
      },
    ],
  },
  {
    key: 'suiviRapporteur',
    toolName: 'Évaluation 3 - suivi rapporteur',
    toolDescription: 'Grille utilisée par le rapporteur pour évaluer l’assiduité et l’implication de l’étudiant tout au long de l’année.',
    module: 'suivi',
    evaluator: 'rapporteur',
    criteria: [
      {
        name: 'Présences',
        weight: 40,
        cells: [
          '',
          'L\'étudiant.e a participé à au moins 5 activités parmi : la discussion préalable d\'un sujet, le pitch des sujets, la présentation du sujet et du CDC, une première analyse, le 1er état d\'avancement, le second état d\'avancement, l\'envoi par mail d\'une première version du rapport.',
          'L\'étudiant.e a participé à au moins 6 activités.',
          'L\'étudiant.e a participé à toutes les activités proposées.',
        ],
      },
      {
        name: 'Méthodologie',
        weight: 30,
        cells: [
          '',
          'L\'étudiant.e a contacté plusieurs fois son rapporteur pour prendre rendez-vous.',
          'L\'étudiant.e a pris des notes lors des réunions et en a fait des compte-rendus personnels.',
          'L\'étudiant.e a envoyé à son rapporteur un ordre du jour avant les réunions ainsi qu\'un PV après celles-ci contenant les points d\'action à réaliser.',
        ],
      },
      {
        name: 'Implication et attitude professionnelle',
        weight: 30,
        cells: [
          '',
          'L\'étudiant.e a participé activement aux activités où il.elle était présent.e.',
          'Au moins la moitié des rencontres étaient bien préparées. L\'étudiant a tenu compte de la plupart des suggestions/feedback donnés.',
          'L\'étudiant.e a été proactif, toutes les rencontres étaient bien préparées, l\'étudiant.e a tenu compte de toutes les suggestions/feedback donnés, tous les délais ont été respectés.',
        ],
      },
    ],
  },
  {
    key: 'rapportFinal',
    toolName: 'Évaluation 3 - rapport',
    toolDescription: 'Grille utilisée par le jury pour évaluer le rapport écrit remis en fin de TFE.',
    module: 'soutenance',
    evaluator: 'jury',
    criteria: [
      {
        name: 'Forme du texte',
        weight: 10,
        cells: [
          '',
          'L\'orthographe est suffisante (maximum une ou deux fautes par page), la mise en page est homogène, les titres sont structurés et numérotés.',
          'La mise en page est bien soignée, très agréable ; des illustrations accompagnent le propos.',
          'Il n\'y a pas ou très peu de fautes d\'orthographe. La mise en page est remarquable. Des illustrations légendées et citées dans le texte clarifient le propos.',
        ],
      },
      {
        name: 'Qualité du texte',
        weight: 9,
        cells: [
          '',
          'Le vocabulaire utilisé est adapté au public ; la grammaire est correcte. Les sections sont logiquement structurées.',
          'Le vocabulaire est spécifique au domaine. Le style d\'écriture est agréable et la compréhension aisée. Les sections s\'organisent autour d\'un fil rouge clair.',
          'Le style est particulièrement soigné et professionnel, le texte est agréable à lire, tous les éléments s\'enchaînent de manière fluide et logique.',
        ],
      },
      {
        name: 'Références',
        weight: 5,
        cells: [
          '',
          'La plupart des références sont écrites correctement et sont fiables.',
          'La plupart des références sont citées dans le texte ; respect irréprochable des normes bibliographiques.',
          'Chaque référence est citée au moins une fois à un endroit adéquat. Toutes les sources sont fiables.',
        ],
      },
      {
        name: 'Introduction',
        weight: 5,
        cells: [
          '',
          'Une introduction est présente.',
          'L\'introduction introduit le contexte et la problématique du TFE. Elle présente la structure du rapport.',
          'L\'introduction éveille la curiosité du lecteur et lui donne une idée claire de la contribution effectuée.',
        ],
      },
      {
        name: 'Problème et contexte',
        weight: 6,
        cells: [
          '',
          'La problématique et son contexte sont présentés de manière à ce que le lecteur comprenne le sujet du TFE.',
          'La problématique est mise en perspective sur base du contexte. Les enjeux des intervenants sont identifiés.',
          'L\'étudiant.e démontre une bonne capacité de prise de recul et d\'analyse par rapport au contexte du TFE.',
        ],
      },
      {
        name: 'Identification des intervenants',
        weight: 5,
        cells: [
          '',
          'Les intervenants de la problématique sont identifiés (client, différents utilisateurs).',
          'Les spécificités et objectifs des intervenants sont décrits ("rôles").',
          'L\'étudiant.e analyse les enjeux et impacts fonctionnels des différents rôles dans la problématique.',
        ],
      },
      {
        name: 'Identification des fonctionnalités',
        weight: 6,
        cells: [
          '',
          'Les fonctionnalités sont décrites et couvrent effectivement la problématique présentée.',
          'Les fonctionnalités sont : classées par type d\'utilisateur ; éventuellement formulées sous forme de User Stories ; précises, réfléchies et pertinentes.',
          'Les fonctionnalités possèdent : des cas d\'utilisation ; des critères d\'acceptation ; un classement par ordre d\'importance pour le client ; une estimation de leur complexité.',
        ],
      },
      {
        name: 'Méthodologie : organisation du travail',
        weight: 6,
        cells: [
          '',
          'Le document décrit : les étapes principales du travail ; le type de gestion de projet envisagé (et les outils) ; l\'organisation des interactions avec les intervenants (rapporteur, client).',
          'Le document détaille : les étapes du travail, sous forme d\'un calendrier sommaire ; comment la méthodologie de travail sera mise en œuvre concrètement ; un planning grossier des interactions avec les intervenants.',
          'Le document décrit une organisation incrémentale : une première itération fonctionnelle (MVP) ; les étapes successives nécessaires à obtenir différentes versions à montrer au client ; les outils de suivi de l\'avancement du travail permettent une organisation flexible aux aléas du projet.',
        ],
      },
      {
        name: 'Positionnement de la solution',
        weight: 5,
        cells: [
          '',
          'Une ou deux solutions concurrentes sont identifiées et comparées au projet défendu. Le développement d\'une solution nouvelle est justifié.',
          'Plusieurs solutions sont présentées, leurs forces et faiblesses sont décrites. La pertinence du développement d\'une solution nouvelle est convaincante.',
          'Une analyse des avantages et inconvénients d\'une nouvelle solution est effectuée.',
        ],
      },
      {
        name: 'Analyse technique',
        weight: 6,
        cells: [
          '',
          'Les éléments techniques et technologies nécessaires pour répondre à la problématique sont identifiés et comparés. Le choix effectué est raisonné.',
          'Les critères de comparaison des technologies sont choisis sur base des objectifs du client. Le choix effectué est basé sur ce comparatif. Les limites de ce choix sont exposées.',
          'Les éléments de comparaison sont basés sur des analyses ou des benchmarks reproductibles et scientifiquement vérifiables. Tous les éléments utilisés sont référencés.',
        ],
      },
      {
        name: 'Conception de la solution',
        weight: 6,
        cells: [
          '',
          'Les outils adaptés au sujet sont utilisés pour proposer une solution (schéma DB, UML, réseau, électronique, etc.). Les diagrammes sont corrects, suffisants, lisibles, légendés et expliqués. Des maquettes ont été produites pour permettre d\'imaginer l\'aspect de la solution finale.',
          'Les diagrammes sont justifiés dans le texte et cette justification démontre la profondeur de la réflexion menée.',
          'Les diagrammes sont remarquables par leur ampleur et/ou leur qualité intrinsèque, reflétée dans le texte.',
        ],
      },
      {
        name: 'Description du cas pratique',
        weight: 10,
        cells: [
          '',
          'Le texte décrit la réalisation effectuée et est illustré par des screenshots, de telle sorte que le lecteur a une bonne idée du résultat obtenu.',
          'L\'étudiant.e fait un compte-rendu des étapes de la réalisation. Il explique les challenges techniques rencontrés et les solutions apportées. Les éléments techniques présentés sont compréhensibles pour le lecteur uniquement sur base du texte (ex : pas besoin de connaître le code source).',
          'Les éléments techniques présentés démontrent que l\'étudiant.e a développé une expertise dans son domaine.',
        ],
      },
      {
        name: 'Description de la validation',
        weight: 7,
        cells: [
          '',
          'L\'étudiant.e décrit les tests effectués sur sa réalisation.',
          'L\'étudiant.e présente une stratégie de validation cohérente et fait le bilan de son application dans le TFE : couverture des tests, conformité de la solution par rapport aux fonctionnalités visées, … ET/OU il présente les limites de sa solution (par ex. par une campagne de mesures des performances dans le cas d\'un circuit électronique).',
          'L\'étudiant.e effectue une analyse critique de sa stratégie de validation et de sa mise en œuvre dans le cadre du TFE ET/OU des performances mesurées de sa réalisation. Il.elle en dégage des pistes d\'amélioration pour la suite.',
        ],
      },
      {
        name: 'Législation',
        weight: 4,
        cells: [
          '',
          'L\'étudiant.e liste les contraintes législatives qui s\'appliquent sur son TFE et indique s\'il.elle en a tenu compte dans sa réalisation.',
          'L\'étudiant.e détaille les contraintes législatives, les analyse et explique comment il.elle en a tenu compte dans sa réalisation.',
        ],
      },
      {
        name: 'Sécurité',
        weight: 6,
        cells: [
          '',
          'L\'étudiant.e liste ce qu\'il.elle a mis en place pour la sécurisation de son travail.',
          'L\'étudiant.e a identifié les éléments à protéger, a listé les risques qui s\'y appliquent et les contre-mesures correspondantes. Il.elle justifie les contre-mesures qu\'il.elle a mises en place et documente leur implémentation.',
          'L\'étudiant.e montre au travers de son texte que la sécurité est prise en compte à toutes les étapes du travail. Il.elle documente ce qu\'il faut prévoir en termes de maintenance pour garantir la sécurité à long terme de la solution (backup, mises à jour etc.).',
        ],
      },
      {
        name: 'Conclusion',
        weight: 4,
        cells: [
          '',
          'Une conclusion est présente et fait le bilan de la réalisation par rapport à la demande du client.',
          'La conclusion intègre une analyse réflexive : de la réalisation, de la méthodologie choisie et de son application dans le TFE. La conclusion indique quelques pistes d\'amélioration.',
          'La conclusion remet le travail en perspective dans son contexte. Les analyses critiques démontrent une profondeur de réflexion, notamment en intégrant une analyse fine des retours du client. La conclusion indique ce qu\'il faut prévoir pour assurer la pérennité de la réalisation (mise en production, suivi, maintenance, ...).',
        ],
      },
    ],
  },
  {
    key: 'realisationPratique',
    toolName: 'Évaluation 3 - réalisation pratique',
    toolDescription: 'Grille utilisée par le jury pour évaluer la réalisation pratique. Préalable : « L’étudiant a-t-il réalisé un cas pratique ? » — une réponse négative vaut cote d’exclusion, indépendamment des critères ci-dessous.',
    module: 'soutenance',
    evaluator: 'jury',
    criteria: [
      {
        name: 'Ampleur du cas pratique',
        weight: 30,
        cells: [
          '',
          'La réalisation pratique est fonctionnelle, correspond à la charge de travail attendue pour un TFE de bachelier (environ 450h, rapport compris), répond aux besoins du client et tourne dans un environnement proche de l\'environnement de production OU constitue un prototype satisfaisant (dans le cas d\'un sujet exploratoire). Elle fait intervenir deux piliers de la formation TI.',
          'Le cas pratique tourne en environnement de production et/ou le client est satisfait après l\'avoir testé concrètement.',
          'La réalisation pratique dépasse les attentes du client en termes de fonctionnalités réalisées à bon escient et/ou a bénéficié de plusieurs itérations d\'amélioration en tenant compte du feedback du client.',
        ],
      },
      {
        name: 'Technicité',
        weight: 30,
        cells: [
          '',
          'L\'étudiant.e n\'a pas effectué d\'erreur grossière de conception et/ou d\'implémentation ; les attentes minimales liées au domaine sont respectées (voir doc. des attentes minimales sur Moodle).',
          'Les bonnes pratiques techniques vues dans le cadre du cursus sont mises en œuvre dans la réalisation pratique.',
          'La réalisation pratique démontre une maitrise technique poussée et une compréhension profonde des technologies et techniques mises en œuvre ; ET/OU l\'étudiant.e a exploré, s\'est formé et a mis en œuvre des technologies innovantes non vues durant le cursus en adéquation avec le besoin du client.',
        ],
      },
      {
        name: 'Validation',
        weight: 20,
        cells: [
          '',
          'L\'étudiant.e a validé sa réalisation pratique conformément à une procédure.',
          'Selon le domaine, l\'étudiant a automatisé le processus de validation (scripts, CI/CD), et/ou a exploré les limites de validité de sa solution (électronique).',
          'Le processus de validation est particulièrement complet et a été exploité par l\'étudiant.e tout au long de sa réalisation.',
        ],
      },
      {
        name: 'Sécurité et législation',
        weight: 20,
        cells: [
          '',
          'L\'étudiant.e a respecté les contraintes législatives. Il.elle a fait une analyse de sécurité et a mis en place les contre-mesures de sécurité incontournables (ex : chiffrement).',
          'L\'étudiant.e a mis en place un ensemble cohérent et adéquat de contre-mesures contre les risques principaux visant son système.',
          'L\'étudiant.e a intégré la sécurité à toutes les étapes et aspects de sa réalisation pratique. Un grand nombre de risques sont couverts par des contre-mesures adéquates. L\'implémentation des contre-mesures est validée.',
        ],
      },
    ],
  },
  {
    key: 'oral',
    toolName: 'Évaluation 3 - présentation orale et défense',
    toolDescription: 'Grille utilisée par le jury pour évaluer la présentation orale lors de la soutenance. La grille contient quatre niveaux (insuffisant, suffisant, bien, très bien) ; pour valider un niveau, il faut aussi valider tous les niveaux situés à sa gauche. Le critère "Contenu de la présentation" attend 6 points : contexte et client, cahier des charges, analyse et choix techniques, réalisation pratique et sa validation, sécurité et législation, limites et pistes d’amélioration.',
    module: 'soutenance',
    evaluator: 'jury',
    criteria: [
      {
        name: 'Qualité de l\'exposé (forme)',
        weight: 20,
        cells: [
          '',
          'La longueur de l\'exposé n\'excède pas 15 min (20 min pour des groupes) démo comprise ; l\'étudiant.e a un support de présentation.',
          'Le support de présentation est soigné : le texte et les figures sont lisibles, les graphiques sont annotés (légende, axes). Il y a moins de cinq fautes d\'orthographe.',
          'Le discours est fluide et préparé. Il y a moins de deux fautes d\'orthographe.',
        ],
      },
      {
        name: 'Contenu de la présentation',
        weight: 25,
        cells: [
          '',
          'Au moins quatre des six points mentionnés sont abordés dans la présentation.',
          'Au moins cinq des six points mentionnés sont abordés dans la présentation.',
          'Les six points mentionnés sont abordés dans la présentation.',
        ],
      },
      {
        name: 'Démonstration du cas pratique',
        weight: 30,
        cells: [
          '',
          'L\'étudiant.e propose une démonstration sans bug majeur illustrant sa réalisation pratique.',
          'L\'étudiant.e propose une démonstration fonctionnelle du produit fini, en local ou déployé en production. Celle-ci met en avant les fonctionnalités essentielles, sans perte de temps sur du superflu.',
          'La démonstration est complète et met en avant les points forts de la solution présentée. Le produit fini peut être testé par le jury durant la défense, ou l\'a été avant par le promoteur, en fonction des contraintes liées au TFE.',
        ],
      },
      {
        name: 'Maîtrise/appropriation du sujet',
        weight: 25,
        cells: [
          '',
          'L\'étudiant.e apporte des éléments de réponse pertinents aux questions posées.',
          'Le vocabulaire utilisé (oral + slides) est correct. L\'étudiant.e répond de manière complète aux questions posées. Il.elle convainc le jury.',
          'Le vocabulaire utilisé (oral + slides) est précis (termes techniques idoines). L\'étudiant.e prend du recul et interagit avec le jury lors des questions.',
        ],
      },
    ],
  },
];

// Répartition des grilles réelles entre les modules de la promo (identique
// pour la structure "générique" et pour MAIN, cf. buildGenericCourseStructure
// / buildMainCourseStructure) : le champ `module` de REAL_GRIDS n'est plus
// utilisé pour ce placement, seulement à titre informatif/historique.
const CADRAGE_GRID_KEYS = ['cdc', 'validationSujet', 'suiviRapporteur'];
const ANALYSE_GRID_KEYS = ['analyse'];
const RAPPORT_GRID_KEYS = ['rapportFinal', 'realisationPratique'];
const DEFENSE_GRID_KEYS = ['oral'];
const GRID_FEEDBACK_STATUSES = [
  GridFeedbackStatus.PENDING,
  GridFeedbackStatus.CORRECTION,
  GridFeedbackStatus.PUBLISHED,
  GridFeedbackStatus.SEEN,
];
// `cellCount` niveaux (2, 3, 4peu importe). Générique et biaisé vers le
// haut de l'échelle (les niveaux supérieurs sont un peu plus probables que
// les niveaux inférieurs), pour représenter une promo qui s'en sort plutôt
// bien dans l'ensemble.
function pickConsensusOrder(cellCount: number): number {
  const candidates: number[] = [];
  for (let i = 0; i < cellCount; i++) {
    const weight = i + 1; // le dernier niveau pèse plus que le premier
    for (let w = 0; w < weight; w++) candidates.push(i);
  }
  return pick(candidates);
}

type GridAssets = {
  toolId: number;
  gridId: number;
  evaluator: 'rapporteur' | 'jury';
  criteria: { id: number; cells: { id: number; order: number; weight: number | null }[] }[];
};

// Crée, pour un module donné, les Tool/AssessmentGrid/Criteria/Cell des
// grilles réelles de REAL_GRIDS dont la `key` est passée en paramètre.
// Contrairement à la V1 (une grille était figée sur son `module` d'origine
// dans REAL_GRIDS), l'appelant choisit librement quelles grilles rattacher à
// quel module -> une même grille (ex. "rapportFinal") peut être rattachée à
// des modules différents selon la promotion.
async function createGridsForKeys(
  keys: string[],
  moduleId: number,
  editable: boolean,
): Promise<Record<string, GridAssets>> {
  const result: Record<string, GridAssets> = {};
  for (const key of keys) {
    const def = REAL_GRIDS.find((g) => g.key === key);
    if (!def) throw new Error(`REAL_GRIDS: clé de grille inconnue "${key}".`);
    const tool = await prisma.tool.create({
      data: { name: def.toolName, description: def.toolDescription, type: ToolType.ASSESSMENT, moduleId },
    });
    // AssessmentGrid partage sa PK avec Tool -> pas d'autoincrement, on fixe id.
    const grid = await prisma.assessmentGrid.create({ data: { id: tool.id, editable } });

    const criteria: { id: number; cells: { id: number; order: number; weight: number | null }[] }[] = [];
    for (const [i, critDef] of def.criteria.entries()) {
      if (critDef.cells.length < 2) {
        throw new Error(`REAL_GRIDS["${def.key}"]["${critDef.name}"] doit avoir au moins 2 cellules.`);
      }
      const crit = await prisma.criteria.create({
        data: { name: critDef.name, order: i, defaultWeight: critDef.weight, gridId: grid.id },
      });
      const cells: { id: number; order: number; weight: number | null }[] = [];
      for (const [j, description] of critDef.cells.entries()) {
        const cell = await prisma.cell.create({
          data: { description, order: j, weight: 1, criteriaId: crit.id },
        });
        cells.push({ id: cell.id, order: j, weight: 1 });
      }
      criteria.push({ id: crit.id, cells });
    }
    result[def.key] = { toolId: tool.id, gridId: grid.id, evaluator: def.evaluator, criteria };
  }
  return result;
}

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

  // CriteriaDiscussion avant Criteria (référence criteriaId)
  await prisma.criteriaDiscussion.deleteMany({ where: { project: tcFilter } });
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
  //    4 promotions : 2 inactives (déjà terminées, hors de la fenêtre
  //    startDate/endDate courante -> cf. isTrainingCourseActive) et 2
  //    actives. "MAIN" est la promo effectivement utilisée pour la démo
  //    (structure de modules/outils sur-mesure, cf. section 3) ; "STAGE"
  //    garde la structure générique (comme avant), tout comme les 2 promos
  //    inactives.
  // ───────────────────────────────────────────────────────────────────────
  console.log('📚  Création des promotions...');

  const courseQ1 = await prisma.trainingCourse.create({
    data: {
      name: `${DEMO_PREFIX}TFE premier quadrimestre 2024-2025`,
      startDate: new Date('2024-09-16'),
      endDate: new Date('2025-01-31'),
    },
  });
  const courseSession2 = await prisma.trainingCourse.create({
    data: {
      name: `${DEMO_PREFIX}TFE seconde session 2025-2026`,
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-07-15'),
    },
  });
  const courseMain = await prisma.trainingCourse.create({
    data: {
      name: `${DEMO_PREFIX}TFE second quadrimestre 2025-2026`,
      startDate: new Date('2026-02-09'),
      endDate: new Date('2026-09-15'),
    },
  });
  const courseStage = await prisma.trainingCourse.create({
    data: {
      name: `${DEMO_PREFIX}Stage second quadrimestre 2025-2026`,
      startDate: new Date('2026-02-09'),
      endDate: new Date('2026-09-30'),
    },
  });

  type CourseLabel = 'Q1' | 'SESSION2' | 'MAIN' | 'STAGE';
  const MAIN_LABEL: CourseLabel = 'MAIN';

  // "generic" = garde la structure de modules historique (Cadrage du sujet /
  // Suivi de projet / Remise du mémoire / Soutenance, formulaire + activités
  // de suivi comprises) ; seule MAIN reçoit la structure sur-mesure demandée.
  const genericCourses: { course: typeof courseQ1; label: CourseLabel; finished: boolean }[] = [
    { course: courseQ1, label: 'Q1', finished: true },
    { course: courseSession2, label: 'SESSION2', finished: true },
    { course: courseStage, label: 'STAGE', finished: false },
  ];
  const courses: { course: typeof courseQ1; label: CourseLabel; finished: boolean }[] = [
    ...genericCourses,
    { course: courseMain, label: MAIN_LABEL, finished: false },
  ];

  // Fenêtre "soutenance" (planification des défenses + fenêtre temporelle des
  // évaluations jury) commune aux deux types de structure : pour une promo
  // déjà terminée, on la situe juste avant l'endDate ; pour une promo en
  // cours, on la situe dans un passé récent (certains projets peuvent être
  // "TERMINE" en avance, cf. computeStatus plus bas).
  function soutenanceWindow(course: { endDate: Date | null }, finished: boolean) {
    const day = finished
      ? new Date(course.endDate!.getTime() - 10 * DAY_MS)
      : new Date(Date.now() - 30 * DAY_MS);
    const spanBefore = finished ? 5 : 10;
    const spanAfter = finished ? 15 : 10;
    return {
      day,
      start: new Date(day.getTime() - spanBefore * DAY_MS),
      end: new Date(day.getTime() + spanAfter * DAY_MS),
    };
  }

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

  const studentsByCourse: Record<CourseLabel, SeededUser[]> = {
    Q1: [],
    SESSION2: [],
    MAIN: [],
    STAGE: [],
  };
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
    courseStartDate: Date;
    formToolId?: number;
    formId?: number;
    formDueDate?: Date;
    questions?: { id: number; type: QuestionType }[];
    workToolId: number;
    workId: number;
    dueDate: Date;
    withSoutenanceEvent: boolean; // false pour MAIN ("no event" -> pas d'Activity/Group de soutenance)
    soutenanceToolId?: number; // Tool (type ACTIVITY) sous lequel on crée un créneau par soutenance
    soutenanceDay: Date;
    soutenanceWindowStart: Date;
    soutenanceWindowEnd: Date;
    accessConditionValidatorId?: number;
    accessConditionId?: number; // condition SUPERVISOR_VALIDATION, pour illustrer UserValidation
    grids: Record<string, GridAssets>; // toutes les grilles réelles (REAL_GRIDS) rattachées à cette promo, indexées par leur "key"
  };

  const assetsByCourse: Record<CourseLabel, CourseAssets> = {} as any;

  // Structure "historique" (Cadrage du sujet / Suivi de projet / Remise du
  // mémoire / Soutenance, formulaire + activités de suivi comprises) :
  // utilisée pour les 3 promos qui ne sont pas la vitrine de démo.
  async function buildGenericCourseStructure(
    course: typeof courseQ1,
    finished: boolean,
  ): Promise<CourseAssets> {
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

    // Grilles réelles rattachées au module "Cadrage du sujet" (cf. REAL_GRIDS) :
    // "cdc" (cahier des charges), "validationSujet" (pertinence du sujet) et
    // "suiviRapporteur" (assiduité/implication), toutes remplies par le
    // rapporteur.
    const cadrageGrids = await createGridsForKeys(CADRAGE_GRID_KEYS, moduleCadrage.id, false);

    // Module 2 — Analyse et conception
    const moduleAnalyse = await prisma.module.create({
      data: {
        name: 'Analyse et conception',
        description: 'Analyse de la problématique et conception de la solution, avec suivi régulier du promoteur.',
        trainingCourseId: course.id,
      },
    });
    const toolSuivi = await prisma.tool.create({
      data: {
        name: 'Réunions de suivi',
        description: 'Points d’avancement planifiés avec le promoteur.',
        type: ToolType.ACTIVITY,
        moduleId: moduleAnalyse.id,
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
              moduleId: moduleAnalyse.id,
            },
          })).id : toolSuivi.id,
          startDateTime: start,
          endDateTime: end,
          location: pick(['Salle B204', 'Visioconférence (Teams)', 'Salle A112']),
        },
      });
    }

    // Grille réelle rattachée au module "Analyse et conception" (cf. REAL_GRIDS) :
    // "analyse", remplie par le rapporteur.
    const analyseGrids = await createGridsForKeys(ANALYSE_GRID_KEYS, moduleAnalyse.id, false);

    // Module 3 — Rapport de TFE
    const moduleRapport = await prisma.module.create({
      data: {
        name: 'Rapport de TFE',
        description: 'Dépôt du rapport final et évaluation de la réalisation pratique et du rapport écrit.',
        trainingCourseId: course.id,
      },
    });
    const toolWork = await prisma.tool.create({
      data: {
        name: 'Dépôt du mémoire final',
        description: 'Fichier PDF du mémoire complet.',
        type: ToolType.WORK,
        moduleId: moduleRapport.id,
      },
    });
    const dueDate = finished ? new Date(course.endDate!.getTime() - 15 * DAY_MS) : new Date(course.endDate!.getTime() - 15 * DAY_MS);
    const work = await prisma.work.create({ data: { id: toolWork.id, maxAttempts: 2, dueDate } });

    // Grilles réelles rattachées au module "Rapport de TFE" (cf. REAL_GRIDS) :
    // "rapportFinal" et "realisationPratique", toutes deux remplies par le
    // jury complet lors de la défense (cf. section 8).
    const rapportGrids = await createGridsForKeys(RAPPORT_GRID_KEYS, moduleRapport.id, !finished);

    // ToolLink "rapportFinal" (grille) <-> "Dépôt du mémoire final" (work) :
    // permet à la page d'évaluation d'afficher le PDF du mémoire à côté de
    // la grille lorsqu'il a été soumis (cf. assessment-grid.getGridContext).
    await prisma.toolLink.create({
      data: { sourceToolId: rapportGrids.rapportFinal.toolId, targetToolId: toolWork.id },
    });

    // Module 4 — Défense du TFE
    const moduleDefense = await prisma.module.create({
      data: {
        name: 'Défense du TFE',
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
        moduleId: moduleDefense.id,
      },
    });

    // Grille réelle rattachée au module "Défense du TFE" (cf. REAL_GRIDS) :
    // "oral", remplie par le jury complet lors de la défense (cf. section 8).
    const defenseGrids = await createGridsForKeys(DEFENSE_GRID_KEYS, moduleDefense.id, !finished);

    // Condition d'accès au module Défense du TFE (mémoire déposé + date
    // passée + validation par un enseignant désigné -> illustre les 3
    // méthodes de condition non liées à une date pure, et le modèle
    // UserValidation).
    const cgAccess = await prisma.conditionsGroup.create({
      data: { operator: ConditionOperator.AND, moduleId: moduleDefense.id },
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

    const { day, start, end } = soutenanceWindow(course, finished);

    return {
      tcId: course.id,
      courseStartDate: course.startDate!,
      formToolId: toolForm.id,
      formId: form.id,
      formDueDate,
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
      withSoutenanceEvent: true,
      soutenanceToolId: toolSoutenanceTemplate.id,
      soutenanceDay: day,
      soutenanceWindowStart: start,
      soutenanceWindowEnd: end,
      accessConditionValidatorId: validator.id,
      accessConditionId: supervisorValidationCondition.id,
      grids: { ...cadrageGrids, ...analyseGrids, ...rapportGrids, ...defenseGrids },
    };
  }

  // Structure sur-mesure demandée pour la vitrine de démo : 4 modules, un
  // seul outil "Work" (le rapport final), pas de formulaire ni d'activité —
  // uniquement les grilles réelles réparties comme demandé.
  async function buildMainCourseStructure(course: typeof courseMain, finished: boolean): Promise<CourseAssets> {
    // Module 1 — Cadrage du sujet
    const moduleCadrage = await prisma.module.create({
      data: {
        name: 'Cadrage du sujet',
        description:
          '## 🎯 Cadrage du sujet\n\n' +
          "Cette étape pose les fondations de votre TFE :\n\n" +
          '- Rédaction et validation du **cahier des charges**\n' +
          '- Confirmation de la pertinence du **sujet** avec votre rapporteur\n' +
          '- Suivi régulier de votre implication tout au long du quadrimestre\n\n' +
          "> 💡 Un cahier des charges soigné évite bien des remises en question plus tard dans l'année.",
        trainingCourseId: course.id,
      },
    });
    const cadrageGrids = await createGridsForKeys(CADRAGE_GRID_KEYS, moduleCadrage.id, false);

    // Module 2 — Analyse et conception
    const moduleAnalyse = await prisma.module.create({
      data: {
        name: 'Analyse et conception',
        description:
          '## 🧠 Analyse et conception\n\n' +
          'Place à la réflexion technique et fonctionnelle :\n\n' +
          '- Analyse approfondie de la problématique\n' +
          '- Choix technologiques justifiés\n' +
          "- Conception de la solution (schémas, maquettes, UML...)\n\n" +
          "Cette étape est évaluée par votre rapporteur en cours d'année.",
        trainingCourseId: course.id,
      },
    });
    const analyseGrids = await createGridsForKeys(ANALYSE_GRID_KEYS, moduleAnalyse.id, false);

    // Module 3 — Rapport de TFE
    const moduleRapport = await prisma.module.create({
      data: {
        name: 'Rapport de TFE',
        description:
          '## 📄 Rapport de TFE\n\n' +
          '- Dépôt du **rapport final** (PDF) avant l’échéance\n' +
          '- Évaluation de la **réalisation pratique**\n' +
          '- Évaluation du **rapport écrit** par le jury\n\n' +
          '⚠️ Le rapport doit être déposé avant la date limite pour être recevable.',
        trainingCourseId: course.id,
      },
    });
    const toolWork = await prisma.tool.create({
      data: {
        name: 'Dépôt du rapport final',
        description: 'Fichier PDF du rapport de TFE complet.',
        type: ToolType.WORK,
        moduleId: moduleRapport.id,
      },
    });
    const dueDate = new Date('2026-09-01');
    const work = await prisma.work.create({ data: { id: toolWork.id, maxAttempts: 2, dueDate } });
    const rapportGrids = await createGridsForKeys(RAPPORT_GRID_KEYS, moduleRapport.id, !finished);
    // ToolLink "rapportFinal" (grille) <-> "Dépôt du rapport final" (work) :
    // permet à la page d'évaluation d'afficher le PDF du rapport à côté de
    // la grille lorsqu'il a été soumis (cf. assessment-grid.getGridContext).
    await prisma.toolLink.create({
      data: { sourceToolId: rapportGrids.rapportFinal.toolId, targetToolId: toolWork.id },
    });

    // Module 4 — Défense du TFE
    const moduleDefense = await prisma.module.create({
      data: {
        name: 'Défense du TFE',
        description:
          '## 🎤 Défense du TFE\n\n' +
          "L'aboutissement de votre travail : la présentation orale devant jury.\n\n" +
          '- Préparez un support clair et professionnel\n' +
          '- Prévoyez une démonstration de votre réalisation pratique\n' +
          '- Soyez prêt·e à répondre aux questions du jury\n\n' +
          'Bonne chance ! 🍀',
        trainingCourseId: course.id,
      },
    });
    const defenseGrids = await createGridsForKeys(DEFENSE_GRID_KEYS, moduleDefense.id, !finished);

    const { day, start, end } = soutenanceWindow(course, finished);

    return {
      tcId: course.id,
      courseStartDate: course.startDate!,
      workToolId: toolWork.id,
      workId: work.id,
      dueDate,
      withSoutenanceEvent: false, // pas de formulaire ni d'activité pour cette promo
      soutenanceDay: day,
      soutenanceWindowStart: start,
      soutenanceWindowEnd: end,
      grids: { ...cadrageGrids, ...analyseGrids, ...rapportGrids, ...defenseGrids },
    };
  }

  for (const { course, label, finished } of genericCourses) {
    assetsByCourse[label] = await buildGenericCourseStructure(course, finished);
  }
  assetsByCourse[MAIN_LABEL] = await buildMainCourseStructure(courseMain, false);

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
    courseLabel: CourseLabel;
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
          // Le "promoteur" est un ProjectMember marqué du sous-rôle
          // SUPERVISOR (distinct des sous-rôles PRESIDENT/READER, réservés
          // aux autres membres du jury de soutenance).
          members: {
            create: [
              { userId: supervisor.id, subRoleId: subRoleId[SubRoleType.SUPERVISOR] },
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
  //    MAIN n'a pas de formulaire ("no form or event") -> on saute simplement.
  // ───────────────────────────────────────────────────────────────────────
  console.log('📝  Création des soumissions de formulaire (cadrage)...');

  for (const project of allProjects) {
    const assets = assetsByCourse[project.courseLabel];
    if (!assets.formId || !assets.questions) continue;
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
  // 5bis) ÉVALUATIONS "RAPPORTEUR" (toutes les grilles évaluées par le seul
  //    rapporteur — cahier des charges, validation du sujet, analyse, suivi
  //    rapporteur — quel que soit le module auquel elles sont rattachées
  //    pour la promo courante). Étalées entre le cadrage et la remise du
  //    rapport/mémoire.
  // ───────────────────────────────────────────────────────────────────────
  console.log('🔎  Création des évaluations "rapporteur" (cadrage, analyse, suivi)...');

  for (const project of allProjects) {
    const assets = assetsByCourse[project.courseLabel];
    const rapporteurGrids = Object.values(assets.grids).filter((g) => g.evaluator === 'rapporteur');
    if (rapporteurGrids.length === 0) continue;
    if (project.status === 'EN_RETARD' && Math.random() < 0.5) continue;

    const windowStart = assets.formDueDate
      ? new Date(assets.formDueDate.getTime() + 14 * DAY_MS)
      : new Date(assets.courseStartDate.getTime() + 45 * DAY_MS);
    const windowEndRaw = Math.min(assets.dueDate.getTime(), Date.now());
    const windowEnd = new Date(Math.max(windowEndRaw, windowStart.getTime() + DAY_MS));

    for (const grid of rapporteurGrids) {
      const evalDate = randomDateBetween(windowStart, windowEnd);
      for (const crit of grid.criteria) {
        const bounds = cumulativeBounds(crit.cells);
        const order = pickConsensusOrder(crit.cells.length);
        const note = noteForCellIndex(bounds, order);
        await prisma.criteriaAssessment.create({
          data: {
            date: evalDate,
            commentFeedback: Math.random() < 0.6 ? faker.lorem.sentence() : null,
            note,
            criteriaId: crit.id,
            teacherId: project.supervisor.id,
            projectId: project.id,
          },
        });
      }

      if (Math.random() < 0.5) {
        await prisma.gridFeedback.create({
          data: {
            date: evalDate,
            comment: faker.lorem.paragraph(),
            status: pick(GRID_FEEDBACK_STATUSES),
            projectId: project.id,
            gridId: grid.gridId,
          },
        });
      }
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
    if (!assets.accessConditionValidatorId || !assets.accessConditionId) continue; // MAIN n'a pas cette condition
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
      const rapportFinalCriteria = assets.grids['rapportFinal'].criteria;
      // Redistribution arbitraire : les 3 premiers critères (forme, forme,
      // références) perdent un peu de poids au profit des 3 suivants.
      for (const [i, crit] of rapportFinalCriteria.entries()) {
        const original = REAL_GRIDS.find((g) => g.key === 'rapportFinal')!.criteria[i].weight;
        const adjusted = i < 3 ? Math.max(2, original - 2) : i < 6 ? original + 2 : original;
        await prisma.weighting.create({
          data: { criteriaId: crit.id, projectId: project.id, weight: adjusted },
        });
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 8) SOUTENANCES : jury (ProjectMember) + ÉVALUATIONS (CriteriaAssessment)
  //    + GridFeedback, avec Activity/Group (créneau + salle) en plus pour
  //    les promos "génériques" — MAIN n'a pas d'Activity ("no event") mais a
  //    bien un jury et des évaluations sur ses grilles de type "jury".
  // ───────────────────────────────────────────────────────────────────────
  console.log('🏆  Planification des soutenances et création des évaluations...');

  let soutenanceSlot = 0;

  for (const project of allProjects) {
    if (project.status !== 'TERMINE') continue;
    const assets = assetsByCourse[project.courseLabel];

    // Jury de 2 à 3 enseignants (le promoteur, déjà SUPERVISOR, + 1-2
    // co-évaluateurs), avec sous-rôles distincts pour illustrer
    // intervenant_projet.sous_role.
    const juryPeers = teachers.filter((t) => t.id !== project.supervisor.id);
    const peers = pickMany(juryPeers, randomInt(1, 2));
    const jurySubRoles: SubRoleType[] = [SubRoleType.PRESIDENT, SubRoleType.READER];
    for (const [i, peer] of peers.entries()) {
      await prisma.projectMember.create({
        data: { userId: peer.id, projectId: project.id, subRoleId: subRoleId[jurySubRoles[i % jurySubRoles.length]] },
      });
    }
    const jury = [project.supervisor, ...peers];

    if (assets.withSoutenanceEvent && assets.soutenanceToolId) {
      // Créneau de soutenance dédié à ce projet (Activity, sous-type de Tool)
      const start = new Date(assets.soutenanceDay);
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
    }

    // Évaluation par critère, au niveau du projet (plus par étudiant), pour
    // chacune des grilles de type "jury" rattachées à cette promo (oral,
    // réalisation pratique, rapport final — quel que soit leur module) :
    // tout le jury note chaque critère.
    const juryGrids = Object.values(assets.grids).filter((g) => g.evaluator === 'jury');
    for (const grid of juryGrids) {
      for (const crit of grid.criteria) {
        const bounds = cumulativeBounds(crit.cells);
        // "consensus" de base pour ce critère (générique quel que soit le
        // nombre de niveaux du critère - certains n'en ont que 2, d'autres 4).
        const baseOrder = pickConsensusOrder(crit.cells.length);
        const soutenanceEvalDate = randomDateBetween(assets.soutenanceWindowStart, assets.soutenanceWindowEnd);

        // Fil de discussion interne du jury sur ce critère (jamais visible
        // étudiant), typiquement échangé juste avant que chacun ne note.
        if (jury.length > 1 && Math.random() < 0.35) {
          const discussionAuthors = pickMany(jury, randomInt(1, Math.min(2, jury.length)));
          for (const author of discussionAuthors) {
            await prisma.criteriaDiscussion.create({
              data: {
                date: soutenanceEvalDate,
                comment: faker.lorem.sentence(),
                criteriaId: crit.id,
                teacherId: author.id,
                projectId: project.id,
              },
            });
          }
        }

        for (const evaluator of jury) {
          // chaque évaluateur peut diverger légèrement du consensus (+/-1 niveau)
          const jitter = pick([-1, 0, 0, 0, 1]);
          const order = Math.min(crit.cells.length - 1, Math.max(0, baseOrder + jitter));
          const note = noteForCellIndex(bounds, order);
          await prisma.criteriaAssessment.create({
            data: {
              date: soutenanceEvalDate,
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
            date: randomDateBetween(
              assets.soutenanceWindowStart,
              new Date(assets.soutenanceWindowEnd.getTime() + 5 * DAY_MS),
            ),
            comment: faker.lorem.paragraph(),
            status: pick(GRID_FEEDBACK_STATUSES),
            projectId: project.id,
            gridId: grid.gridId,
          },
        });
      }
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

  const allDemoUsers = [...coordinators, ...teachers, ...Object.values(studentsByCourse).flat()];
  const notifTemplates: { title: string; description: string; importance: Importance }[] = [
    { title: 'Rappel de dépôt', description: 'Le dépôt du mémoire final approche à grands pas.', importance: Importance.HIGH },
    { title: 'Réunion planifiée', description: 'Une nouvelle réunion de suivi a été ajoutée à votre agenda.', importance: Importance.LOW },
    { title: 'Grille mise à jour', description: 'La grille d’évaluation du rapport final a été révisée.', importance: Importance.MEDIUM },
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

  const mainStudents = studentsByCourse[MAIN_LABEL];
  for (const student of pickMany(mainStudents, Math.min(25, mainStudents.length))) {
    const preferredTeachers = pickMany(teachers, 2);
    const randomProject = pick(allProjects.filter((p) => p.courseLabel === MAIN_LABEL));
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
  console.log(`   Promotions       : ${courses.length} (${courses.map((c) => c.course.name).join(', ')})`);
  console.log(`   Étudiants        : ${Object.values(studentsByCourse).flat().length}`);
  console.log(`   Enseignants      : ${teachers.length}`);
  console.log(`   Coordinateurs    : ${coordinators.length}`);
  console.log(`   Externes         : ${externals.length}`);
  console.log(`   Projets (TFE)    : ${allProjects.length}`);
  console.log(`     dont terminés  : ${allProjects.filter((p) => p.status === 'TERMINE').length}`);
  console.log(`     dont en cours  : ${allProjects.filter((p) => p.status === 'EN_COURS').length}`);
  console.log(`     dont en retard : ${allProjects.filter((p) => p.status === 'EN_RETARD').length}`);
  console.log(`   Grilles réelles  : ${REAL_GRIDS.length} (${REAL_GRIDS.map((g) => g.key).join(', ')})`);
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