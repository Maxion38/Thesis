# Thesis

Application web de gestion et de suivi de parcours pédagogiques développée dans le cadre d'un Travail de Fin d'Études (TFE).

L'application permet aux étudiants de suivre des modules de formation, réaliser des activités, remettre des travaux et suivre leur progression. Les enseignants peuvent gérer le contenu pédagogique, valider les activités et suivre l'avancement des étudiants.

---

# 🚀 Technologies utilisées

## Frontend

- Angular
- TypeScript
- SCSS

## Backend

- NestJS
- TypeScript

## Base de données

- PostgreSQL
- Prisma ORM

## Services externes

- Brevo (emails transactionnels)
- Gmail SMTP (développement)

---

# 📂 Architecture du projet

```text
thesis/
│
├── frontend/          # Application Angular
│
├── backend/           # API NestJS
│   ├── prisma/
│   ├── src/
│   └── uploads/
│
└── README.md
```

---


# ⚙️ Installation

## Prérequis

- Node.js 20+
- npm
- PostgreSQL 16+
- Git

---

## Clonage du projet

```bash
git clone https://github.com/Maxion38/Thesis.git

cd Thesis
```

---

## Installation du frontend

```bash
cd frontend

npm install
```

---

## Installation du backend

```bash
cd backend

npm install
```

---

# 🗄️ Configuration

Créer un fichier `.env` dans le dossier backend.

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5433/thesis"

EMAIL_USER="noreply@example.com"
EMAIL_PASS="your_password"

BREVO_API_KEY="your_api_key"
BREVO_SENDER_EMAIL="noreply@example.com"
BREVO_SENDER_NAME="Thesis"
```

---

# 🗃️ Base de données

## Générer le client Prisma

```bash
npx prisma generate
```

## Appliquer les migrations

```bash
npx prisma migrate deploy
```

ou en développement :

```bash
npx prisma migrate dev
```

## Ouvrir Prisma Studio

```bash
npx prisma studio
```

---

# ▶️ Lancement de l'application

## Backend

```bash
cd backend

npm run start:dev
```

Backend accessible sur :

```text
http://localhost:3000
```

---

## Frontend

```bash
cd frontend

npm start
```

Frontend accessible sur :

```text
http://localhost:4200
```

## Ou lancement de toute l'application

```bash
cd Thesis

npm run dev
```

---

# 📧 Système d'emails

L'application utilise :

- Brevo pour les emails transactionnels

Les emails sont utilisés pour les invitations.

---

# 📄 Gestion des fichiers

Les documents remis par les étudiants sont stockés sur le serveur et référencés dans la base de données.

Les fichiers sont accessibles uniquement aux utilisateurs autorisés.

---

# 🧪 Développement

## Générer une migration Prisma

```bash
npx prisma migrate dev --name migration_name
```

## Réinitialiser la base

```bash
npx prisma migrate reset
```

---

# 📜 Contexte

Projet réalisé dans le cadre d'un Travail de Fin d'Études.
