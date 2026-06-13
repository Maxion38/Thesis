# Thesis — Plateforme de gestion des TFE

## Stack technique
- Frontend : Angular
- Backend : NestJS + Prisma
- Base de données : PostgreSQL
- Conteneurisation : Docker / Docker Compose
- Emails : Brevo

---

## 🛠️ Développement local

### Prérequis
- Node.js 22+
- Docker Desktop

### Setup initial

```bash
git checkout dev
npm install
cd backend && npm install && cd ../frontend && npm install && cd ..
cp backend/.env.example backend/.env
```

Remplis `backend/.env` :
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` : créer un compte gratuit sur [Brevo](https://www.brevo.com) (optionnel pour développer, requis pour tester l'envoi d'invitations)
- Les autres valeurs par défaut fonctionnent telles quelles

### Premier lancement — initialiser la base de données

```bash
docker compose -f docker-compose.dev.yml up -d
cd backend
npx prisma migrate deploy
npx prisma db seed
cd ..
docker compose -f docker-compose.dev.yml down
```

### Lancer l'environnement de dev

```bash
npm run dev
```

Lance simultanément :
- PostgreSQL (conteneur Docker)
- Backend NestJS (`localhost:3000`, hot-reload)
- Prisma Studio (`localhost:5555`)
- Frontend Angular (`localhost:4200`, hot-reload, s'ouvre automatiquement)

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
npx prisma migrate deploy
```

---

## 🚀 Déploiement (production)

### Prérequis
- Docker + Docker Compose installés sur le serveur

### Setup

```bash
git checkout main
cp .env.example .env
```

Remplis `.env` avec les vraies valeurs :
- `POSTGRES_PASSWORD` : mot de passe fort
- `JWT_SECRET` : générer avec `openssl rand -hex 32`
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` : compte Brevo de production

### Lancer

```bash
docker compose up -d --build
```

L'application est accessible sur `http://localhost` (ou le port 80 du serveur).

Les migrations de base de données et le seed des rôles s'exécutent automatiquement au démarrage du conteneur backend.

### Mettre à jour après un nouveau déploiement

```bash
git pull
docker compose up -d --build
```

### Exposer publiquement (domaine + HTTPS)

Cette configuration sert l'application sur le port 80 en HTTP. Pour une exposition publique avec HTTPS, deux options :

1. **Cloudflare Tunnel** (recommandé, pas de configuration réseau requise) :
   - Créer un tunnel sur le [dashboard Cloudflare](https://dash.cloudflare.com)
   - Pointer la route publique vers `http://frontend:80`
   - Lancer : `docker run -d --restart unless-stopped --network thesis_default cloudflare/cloudflared:latest tunnel run --token <TOKEN>`

2. **Reverse proxy classique** (Nginx/Traefik + Let's Encrypt) en amont du conteneur `frontend`.

---

## 🧪 Tests

```bash
cd backend
npm run test          # tests unitaires
npm run test:cov       # avec couverture
```

(work in progress) : Tests qui s'exécutent automatiquement via GitHub Actions à chaque push.
