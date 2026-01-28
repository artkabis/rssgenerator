# RSS Feed Generator

Application complète de génération de flux RSS avec dashboard moderne. Permet de créer, gérer et publier des articles avec support multimédia complet.

## Table des matières

- [Aperçu du projet](#aperçu-du-projet)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Installation](#installation)
- [Configuration](#configuration)
- [Sécurité](#sécurité)
- [API REST](#api-rest)
- [Déploiement](#déploiement)
- [Structure du projet](#structure-du-projet)
- [Historique des corrections](#historique-des-corrections)
- [Démo](#démo)

---

## Aperçu du projet

RSS Feed Generator est une application full-stack permettant de :

- **Créer et gérer des articles** avec un dashboard moderne
- **Générer des flux RSS 2.0** avec extensions Media RSS
- **Uploader des médias** (images, vidéos, audio) avec validation sécurisée
- **Prévisualiser en temps réel** les articles avant publication
- **Exporter le flux XML** compatible avec tous les lecteurs RSS

### Fonctionnalités principales

| Fonctionnalité | Description |
|----------------|-------------|
| Thumbnail | Image principale de l'article |
| Titre | Titre de l'événement/article |
| Contenu | Éditeur de contenu riche |
| Date de publication | Date configurable |
| Auteur | Attribution de l'auteur |
| Médias multiples | Pièces jointes (images, vidéos, audio) |
| Flux XML | Génération automatique RSS 2.0 |

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   React Client  │────▶│  Express API    │────▶│   RSS XML File  │
│   (Vite + TW)   │     │  (Node.js)      │     │   (feed.xml)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │                 │
        └──────────────▶│   Static Mode   │ (GitHub Pages)
                        │   (mockApi.js)  │
                        │                 │
                        └─────────────────┘
```

### Mode de fonctionnement

1. **Mode Développement** : Client React connecté au serveur Express
2. **Mode Production** : Client build servi avec le serveur API
3. **Mode Statique** : Client déployé sur GitHub Pages avec données JSON

---

## Stack technique

### Frontend (client/)

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.x | Framework UI |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Styling utilitaire |
| React Router | 6.x | Navigation SPA (HashRouter) |
| Lucide React | - | Icônes |
| date-fns | - | Manipulation des dates |

### Backend (server/)

| Technologie | Version | Usage |
|-------------|---------|-------|
| Node.js | 20.x | Runtime JavaScript |
| Express | 4.x | Framework HTTP |
| Multer | - | Upload de fichiers |
| xml2js | - | Parsing/génération XML |
| DOMPurify + jsdom | - | Sanitization XSS |
| file-type | - | Validation magic bytes |
| Helmet | - | Headers de sécurité |
| express-rate-limit | - | Rate limiting |
| validator | - | Validation des données |

---

## Installation

### Prérequis

- Node.js 20.x ou supérieur
- npm 9.x ou supérieur

### Installation complète

```bash
# Cloner le dépôt
git clone https://github.com/artkabis/rssgenerator.git
cd rssgenerator

# Installer toutes les dépendances
npm run install:all

# Ou manuellement :
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Démarrage

```bash
# Mode développement (client + serveur)
npm run dev

# Ou séparément :
npm run dev:server  # http://localhost:3001
npm run dev:client  # http://localhost:5173
```

### Build production

```bash
# Build du client
cd client && npm run build

# Le build sera dans client/dist/
```

---

## Configuration

### Variables d'environnement

Créer un fichier `.env` dans le dossier `server/` :

```env
# Serveur
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Upload
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

### Configuration RSS (server/data/config.json)

```json
{
  "title": "Mon Flux RSS",
  "description": "Description du flux",
  "link": "https://monsite.com",
  "language": "fr",
  "copyright": "2024 MonSite",
  "author": "Auteur par défaut",
  "imageUrl": "https://monsite.com/logo.png"
}
```

---

## Sécurité

### Mesures de sécurité implémentées

L'application intègre plusieurs couches de sécurité conformes aux recommandations OWASP :

#### 1. Protection XSS (Cross-Site Scripting)

```javascript
// server/src/security.js
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}
```

#### 2. Validation des uploads (Magic Bytes)

```javascript
// Validation du type réel du fichier (pas juste l'extension)
import { fileTypeFromBuffer } from 'file-type';

export async function validateFileType(buffer, declaredMimeType) {
  const detected = await fileTypeFromBuffer(buffer);

  const ALLOWED_TYPES = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'video/mp4': ['mp4'],
    'audio/mpeg': ['mp3'],
  };

  if (!detected || !ALLOWED_TYPES[detected.mime]) {
    throw new Error('Type de fichier non autorisé');
  }

  return detected;
}
```

#### 3. Headers de sécurité (Helmet)

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));
```

#### 4. Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

// Limite globale : 100 requêtes par minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes, réessayez plus tard' }
});

// Limite uploads : 10 par minute
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});
```

#### 5. Validation des données

```javascript
import validator from 'validator';

export function validatePostData(data) {
  const errors = [];

  if (!data.title || !validator.isLength(data.title, { min: 1, max: 200 })) {
    errors.push('Titre invalide (1-200 caractères)');
  }

  if (data.link && !validator.isURL(data.link, {
    protocols: ['http', 'https'],
    require_protocol: true
  })) {
    errors.push('URL invalide');
  }

  return errors;
}
```

#### 6. Protection CDATA Injection (RSS XML)

```javascript
function escapeCDATA(text) {
  if (!text) return '';
  // Empêche l'injection via fermeture prématurée de CDATA
  return text.replace(/\]\]>/g, ']]]]><![CDATA[>');
}
```

#### 7. CORS restrictif

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

---

## API REST

### Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/posts` | Liste tous les articles |
| GET | `/api/posts/:id` | Récupère un article |
| POST | `/api/posts` | Crée un nouvel article |
| PUT | `/api/posts/:id` | Modifie un article |
| DELETE | `/api/posts/:id` | Supprime un article |
| POST | `/api/upload` | Upload un fichier média |
| GET | `/api/config` | Récupère la config RSS |
| PUT | `/api/config` | Modifie la config RSS |
| GET | `/rss/feed.xml` | Flux RSS généré |

### Exemple de requête POST /api/posts

```json
{
  "title": "Mon article",
  "content": "<p>Contenu de l'article</p>",
  "author": "John Doe",
  "pubDate": "2024-01-15T10:00:00Z",
  "thumbnail": "/uploads/thumbnail.jpg",
  "media": [
    {
      "url": "/uploads/image1.jpg",
      "type": "image/jpeg",
      "title": "Image 1"
    }
  ]
}
```

### Exemple de réponse

```json
{
  "success": true,
  "post": {
    "id": "abc123",
    "title": "Mon article",
    "content": "<p>Contenu de l'article</p>",
    "author": "John Doe",
    "pubDate": "2024-01-15T10:00:00Z",
    "thumbnail": "/uploads/thumbnail.jpg",
    "media": [...],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## Déploiement

### GitHub Pages (Mode Statique)

L'application peut être déployée sur GitHub Pages en mode statique (sans serveur backend).

#### Prérequis

1. **Activer GitHub Pages manuellement** dans les paramètres du dépôt :
   - Aller dans `Settings` > `Pages`
   - Source : `GitHub Actions`

2. Le workflow CI/CD se charge du reste automatiquement.

#### Fonctionnement du mode statique

Le client détecte automatiquement s'il est en mode statique :

```javascript
// client/src/api/mockApi.js
const IS_STATIC_MODE =
  import.meta.env.VITE_STATIC_MODE === 'true' ||
  window.location.hostname.includes('github.io') ||
  window.location.protocol === 'file:';
```

En mode statique, les données sont chargées depuis des fichiers JSON :
- `/api/posts.json` - Liste des articles
- `/api/config.json` - Configuration RSS
- `/rss/feed.xml` - Flux RSS pré-généré

#### Workflow CI/CD

Le fichier `.github/workflows/ci.yml` gère :

1. **Lint** : Vérification du code
2. **Build Server** : Test du serveur
3. **Build Client** : Compilation React
4. **Validate RSS** : Validation XML du flux
5. **Deploy Demo** : Déploiement GitHub Pages

### Déploiement serveur (VPS/Cloud)

```bash
# Build du client
cd client && npm run build

# Démarrer le serveur en production
cd server
NODE_ENV=production node src/index.js

# Avec PM2 (recommandé)
pm2 start src/index.js --name "rss-generator"
```

### Docker (optionnel)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY server ./server
COPY client ./client

RUN npm run install:all
RUN cd client && npm run build

EXPOSE 3001

CMD ["node", "server/src/index.js"]
```

---

## Structure du projet

```
rssgenerator/
├── .github/
│   └── workflows/
│       └── ci.yml              # Pipeline CI/CD
│
├── client/                     # Frontend React
│   ├── public/
│   │   ├── .nojekyll          # Désactive Jekyll sur GH Pages
│   │   ├── 404.html           # Redirect SPA
│   │   └── rss-icon.svg       # Icône
│   ├── src/
│   │   ├── api/
│   │   │   ├── index.js       # Client API
│   │   │   └── mockApi.js     # API statique (GH Pages)
│   │   ├── components/
│   │   │   ├── Dashboard.jsx  # Liste des articles
│   │   │   ├── PostForm.jsx   # Formulaire création/édition
│   │   │   ├── PostCard.jsx   # Carte article
│   │   │   ├── Settings.jsx   # Configuration RSS
│   │   │   ├── Layout.jsx     # Layout principal
│   │   │   └── Sidebar.jsx    # Navigation
│   │   ├── App.jsx            # Routes (HashRouter)
│   │   ├── main.jsx           # Point d'entrée
│   │   └── index.css          # Styles Tailwind
│   ├── vite.config.js         # Config Vite (base: './')
│   └── package.json
│
├── server/                     # Backend Express
│   ├── src/
│   │   ├── index.js           # Serveur principal
│   │   ├── rssGenerator.js    # Génération XML RSS
│   │   └── security.js        # Module sécurité
│   ├── data/
│   │   ├── posts.json         # Stockage articles
│   │   └── config.json        # Configuration RSS
│   ├── uploads/               # Fichiers uploadés
│   ├── rss/
│   │   └── feed.xml           # Flux RSS généré
│   └── package.json
│
├── demo/                       # Données de démo
│   ├── data/
│   │   ├── posts.json         # 5 articles de test
│   │   └── config.json        # Config démo
│   └── rss/
│       └── feed.xml           # Flux RSS démo
│
├── scripts/                    # Scripts utilitaires
│   └── generate-demo.js       # Générateur de démo
│
├── package.json               # Scripts racine
└── README.md                  # Ce fichier
```

---

## Historique des corrections

### Version initiale

- Création de l'application React + Express
- Dashboard de gestion des articles
- Génération de flux RSS 2.0 avec Media RSS

### Corrections de sécurité (Commit: dba4642)

| Vulnérabilité | Correction |
|---------------|------------|
| XSS via contenu HTML | Sanitization DOMPurify |
| Upload fichiers malveillants | Validation magic bytes (file-type) |
| Injection CDATA RSS | Échappement `]]>` |
| Attaques brute-force | Rate limiting express-rate-limit |
| Headers manquants | Helmet avec CSP |
| Validation données | validator.js |

### Ajout environnement de démo (Commit: 5e63d52)

- Création du dossier `demo/` avec données de test
- 5 articles avec images Unsplash (libres de droits)
- Workflow GitHub Actions CI/CD
- Validation automatique du flux RSS

### Corrections GitHub Pages (Commits: 985085c, bb17275, 652f391)

| Problème | Solution |
|----------|----------|
| Page blanche | `base: './'` dans vite.config.js |
| Routes 404 | HashRouter au lieu de BrowserRouter |
| API non trouvée | mockApi.js avec détection mode statique |
| Jekyll interférence | Fichier `.nojekyll` |
| xmllint manquant | Installation `libxml2-utils` dans CI |
| Pages non activé | Permissions workflow + activation manuelle |

### Correction permissions GitHub Pages (Dernier commit)

- Ajout permissions globales au workflow
- Configuration `concurrency` pour éviter les conflits
- Suppression de `enablement: true` (nécessite activation manuelle)

---

## Démo

### URL de démonstration

Une fois GitHub Pages activé, la démo est accessible à :

**https://artkabis.github.io/rssgenerator/**

### Données de démo incluses

5 articles de test avec :
- Images Unsplash (libres de droits)
- Contenu HTML varié
- Différents auteurs
- Dates échelonnées

### Activer la démo

1. Aller dans `Settings` > `Pages` du dépôt GitHub
2. Sélectionner `Source: GitHub Actions`
3. Le workflow déploiera automatiquement sur push

---

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commiter (`git commit -m 'feat: Ma nouvelle feature'`)
4. Pusher (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

---

## Licence

MIT License - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## Support

Pour signaler un bug ou proposer une amélioration :
- Ouvrir une [Issue](https://github.com/artkabis/rssgenerator/issues)
- Ou contacter l'auteur

---

*Dernière mise à jour : Janvier 2024*
