# Thesis — Plateforme de gestion des TFE
Application web permettant la gestion et l'évaluation des travaux de fin d'études (TFE), développée avec Angular, NestJS, PostgreSQL et Prisma.

## Stack technique
- Frontend : Angular
- Backend : NestJS + Prisma
- Base de données : PostgreSQL
- Conteneurisation : Docker / Docker Compose
- Emails : Brevo

---

# Récupérer le projet
Cloner le dépôt Git :
```bash
git clone https://github.com/Maxion38/Thesis.git
```

---

# Commandes disponibles (`npm run`)

| Commande | Description |
|---|---|
| `npm run dev` | Lance tout l'environnement de développement (DB, backend, frontend, Prisma Studio) |
| `npm run dev:db` | Lance uniquement la base de données PostgreSQL conteneurisée |
| `npm run dev:backend` | Lance uniquement le backend NestJS en mode hot-reload |
| `npm run dev:frontend` | Lance uniquement le frontend Angular en mode hot-reload |
| `npm run dev:studio` | Lance uniquement Prisma Studio |
| `npm run prod` | Build et lance l'app complète en mode production (depuis le code source) |
| `npm run prod:down` | Arrête les conteneurs de production |
| `npm run prod:logs` | Affiche les logs des conteneurs de production en temps réel |
| `npm run publish` | Build et publie les images Docker sur Docker Hub (voir section Publication) |

---

# Fichiers Docker Compose

Le projet contient trois fichiers Docker Compose selon l'usage :

| Fichier | Usage | Commande |
|---|---|---|
| `docker-compose.dev.yml` | Développement local — lance uniquement PostgreSQL | `docker compose -f docker-compose.dev.yml up -d` |
| `docker-compose.prod.yml` | Production depuis le code source — build et lance les 3 services | `npm run prod` |
| `docker-compose.yml` | Déploiement rapide — pull les images depuis Docker Hub, pas de build nécessaire | `docker compose up -d` |

---

# Développement

L'ensemble du développement s'effectue en environnement local.

La base de données PostgreSQL est exécutée dans un conteneur Docker. Lors de la première installation, il est nécessaire de :

1. Configurer les variables d'environnement ;
2. Initialiser la base de données.

Une fois cette configuration effectuée, l'ensemble des services nécessaires au développement peut être démarré à l'aide de la commande `npm run dev`.

Cette commande lance :
- Angular en mode développement ;
- NestJS en mode développement ;
- la base de données PostgreSQL conteneurisée ;
- Prisma Studio, permettant de consulter et modifier les données de la base de données.

## Prérequis
- Node.js 22+
- Docker Desktop

## Setup initial

### Installer les dépendances

Se placer sur la branche de développement :
```bash
git checkout dev
```
`cd backend`
```bash
npm install
```
`cd ..`, `cd frontend`
```bash
npm install
```

### Configurer les variables d'environnement

```bash
cp backend/.env.example backend/.env
```

Remplir `backend/.env` :
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` : créer un compte gratuit sur [Brevo](https://www.brevo.com) et générer une clé API (optionnel pour développer, requis pour l'envoi d'invitations)
- Les autres valeurs par défaut fonctionnent telles quelles

### Initialiser la base de données

Lancer la DB conteneurisée :
```bash
docker compose -f docker-compose.dev.yml up -d
```

Appliquer les migrations Prisma. [Documentation Migrations Prisma](https://www.prisma.io/docs/orm/prisma-migrate)
```bash
cd backend
```
```bash
npx prisma migrate deploy
```

Remplir les données par défaut de la DB (rôles COORDINATOR, TEACHER, STUDENT, GUEST) :
```bash
npx prisma db seed
```
```bash
cd ..
```

Arrêter la DB :
```bash
docker compose -f docker-compose.dev.yml down
```

### Lancer l'environnement de dev

```bash
npm run dev
```

Cela lance simultanément :
- PostgreSQL (conteneur Docker)
- Backend NestJS (`localhost:3000`, hot-reload)
- Prisma Studio (`localhost:5555`)
- Frontend Angular (`localhost:4200`, hot-reload)

`Ctrl+C` arrête tout, y compris le conteneur de base de données.

### Modifier le schéma de base de données

```bash
cd backend
# 1. Éditer prisma/schema.prisma
# 2. Générer et appliquer la migration
npx prisma migrate dev --name description_du_changement
# 3. Commit schema.prisma ET le dossier prisma/migrations/ généré
```

Après un `git pull` incluant de nouvelles migrations :
```bash
cd backend
```
```bash
npx prisma migrate deploy
```

---

# Déploiement (production)

Deux méthodes de déploiement sont disponibles selon le contexte.

## Méthode 1 — Depuis le code source (build local - recommandée en développement)

Nécessite : Docker + Git

```bash
git checkout main
```
```bash
cp .env.example .env
```

Remplir .env (voir section Variables d'environnement)

```bash
npm run prod
```

Le build des images Angular et NestJS s'effectue localement (~3-5 minutes au premier lancement).

## Méthode 2 — Depuis Docker Hub (déploiement rapide - recommandée en déploiment réel)

Nécessite : Docker uniquement — pas de Git, pas de code source.

Les images sont prébuilées et disponibles sur Docker Hub. Le déploiement prend ~30 secondes.

Télécharger les fichiers nécessaires
```bash
curl -O https://raw.githubusercontent.com/Maxion38/Thesis/main/docker-compose.yml
```
```bash
curl -O https://raw.githubusercontent.com/Maxion38/Thesis/main/.env.example
```

Préparer le .env
```bash
cp .env.example .env
```
Remplir .env (voir section Variables d'environnement)

Lancer
```bash
docker compose up -d
```

## Variables d'environnement (`.env`)

| Variable | Description |
|---|---|
| `POSTGRES_USER` | Nom d'utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL (fort recommandé) |
| `POSTGRES_DB` | Nom de la base de données |
| `JWT_SECRET` | Clé secrète JWT — générer avec `openssl rand -hex 32` |
| `BREVO_API_KEY` | Clé API Brevo pour l'envoi d'emails |
| `BREVO_SENDER_EMAIL` | Email expéditeur Brevo |
| `BREVO_SENDER_NAME` | Nom expéditeur Brevo |
| `FRONTEND_URL` | URL publique du frontend (ex: `https://thesis-app.be`) |

Les migrations de base de données et le seed des rôles s'exécutent automatiquement au démarrage du conteneur backend.

## Mettre à jour l'application

**Depuis le code source :**
```bash
git pull
```
```bash
npm run prod
```

**Depuis Docker Hub :**
```bash
docker compose pull
```
```bash
docker compose up -d
```

Les données de la base de données sont conservées lors des mises à jour (stockées dans un volume Docker indépendant des images).

## Exposer publiquement (domaine + HTTPS)

Cette étape dépend de votre infrastructure. La configuration sert l'application sur le port 80 en HTTP.

Options possibles :
- **Reverse proxy** (Nginx/Traefik + Let's Encrypt) en amont du conteneur frontend
- **Cloudflare Tunnel** (gratuit, pas de configuration réseau requise) : créer un tunnel sur le [dashboard Cloudflare](https://dash.cloudflare.com) pointant vers `http://frontend:80`

---

# Publication sur Docker Hub

Cette section concerne les contributeurs souhaitant publier de nouvelles versions des images.

## Prérequis

1. Créer un compte sur [hub.docker.com](https://hub.docker.com)
2. Créer deux repositories publics : `thesis-backend` et `thesis-frontend`
3. Dans `publish.ps1`, remplacer la valeur de `$username` par votre username Docker Hub
4. Dans `docker-compose.yml`, remplacer `maxion78` par votre username Docker Hub

## Publier une nouvelle version

Se connecter à Docker Hub :
```bash
docker login
```

Publier en `latest` (recommandé après chaque release stable) :
```bash
npm run publish
```

Publier avec un tag de version (optionnel, permet le rollback) :
```powershell
./publish.ps1 v1.1
```

Les deux peuvent être combinés :
```powershell
./publish.ps1        # publie en latest
./publish.ps1 v1.1   # publie aussi avec le tag de version
```

---

# Tests

```bash
cd backend
```
Tests unitaires
```bash
npm run test
```

Tests avec rapport de couverture
```bash
npm run test:cov
```
