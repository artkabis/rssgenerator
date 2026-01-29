# RSS Feed Generator

A complete RSS feed generation application with a modern dashboard. Create, manage, and publish articles with full multimedia support.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Security](#security)
- [REST API](#rest-api)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Changelog](#changelog)
- [Demo](#demo)

---

## Project Overview

RSS Feed Generator is a full-stack application that allows you to:

- **Create and manage articles** with a modern dashboard
- **Generate RSS 2.0 feeds** with Media RSS extensions
- **Upload media** (images, videos, audio) with secure validation
- **Preview articles in real-time** before publication
- **Export XML feeds** compatible with all RSS readers

### Key Features

| Feature | Description |
|---------|-------------|
| Thumbnail | Main article image |
| Title | Event/article title |
| Content | Rich content editor |
| Publication Date | Configurable date |
| Author | Author attribution |
| Multiple Media | Attachments (images, videos, audio) |
| XML Feed | Automatic RSS 2.0 generation |

---

## Architecture

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│   React Client    │────▶│   Express API     │────▶│   RSS XML File    │
│   (Vite + TW)     │     │   (Node.js)       │     │   (feed.xml)      │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
          │                         │
          │                         ▼
          │               ┌───────────────────┐
          │               │                   │
          │               │   Static Mode     │
          └──────────────▶│   (GitHub Pages)  │
                          │   (mockApi.js)    │
                          │                   │
                          └───────────────────┘
```

### Operating Modes

1. **Development Mode**: React client connected to Express server
2. **Production Mode**: Built client served with API server
3. **Static Mode**: Client deployed on GitHub Pages with JSON data

---

## Tech Stack

### Frontend (client/)

| Technology | Version | Usage |
|------------|---------|-------|
| React | 18.x | UI Framework |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Utility styling |
| React Router | 6.x | SPA Navigation (HashRouter) |
| Lucide React | - | Icons |
| date-fns | - | Date manipulation |

### Backend (server/)

| Technology | Version | Usage |
|------------|---------|-------|
| Node.js | 20.x | JavaScript Runtime |
| Express | 4.x | HTTP Framework |
| Multer | - | File upload |
| xml2js | - | XML Parsing/generation |
| DOMPurify + jsdom | - | XSS Sanitization |
| file-type | - | Magic bytes validation |
| Helmet | - | Security headers |
| express-rate-limit | - | Rate limiting |
| validator | - | Data validation |

---

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher

### Full Installation

```bash
# Clone the repository
git clone https://github.com/artkabis/rssgenerator.git
cd rssgenerator

# Install all dependencies
npm run install:all

# Or manually:
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Getting Started

```bash
# Development mode (client + server)
npm run dev

# Or separately:
npm run dev:server  # http://localhost:3001
npm run dev:client  # http://localhost:5173
```

### Production Build

```bash
# Build the client
cd client && npm run build

# Build output will be in client/dist/
```

---

## Configuration

### Environment Variables

Create a `.env` file in the `server/` folder:

```env
# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Upload
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

### RSS Configuration (server/data/config.json)

```json
{
  "title": "My RSS Feed",
  "description": "Feed description",
  "link": "https://mysite.com",
  "language": "en",
  "copyright": "2024 MySite",
  "author": "Default Author",
  "imageUrl": "https://mysite.com/logo.png"
}
```

---

## Security

### Implemented Security Measures

The application integrates multiple security layers following OWASP recommendations:

#### 1. XSS Protection (Cross-Site Scripting)

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

#### 2. Upload Validation (Magic Bytes)

```javascript
// Validate actual file type (not just extension)
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
    throw new Error('File type not allowed');
  }

  return detected;
}
```

#### 3. Security Headers (Helmet)

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

// Global limit: 100 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
});

// Upload limit: 10 per minute
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});
```

#### 5. Data Validation

```javascript
import validator from 'validator';

export function validatePostData(data) {
  const errors = [];

  if (!data.title || !validator.isLength(data.title, { min: 1, max: 200 })) {
    errors.push('Invalid title (1-200 characters)');
  }

  if (data.link && !validator.isURL(data.link, {
    protocols: ['http', 'https'],
    require_protocol: true
  })) {
    errors.push('Invalid URL');
  }

  return errors;
}
```

#### 6. CDATA Injection Protection (RSS XML)

```javascript
function escapeCDATA(text) {
  if (!text) return '';
  // Prevent injection via premature CDATA closure
  return text.replace(/\]\]>/g, ']]]]><![CDATA[>');
}
```

#### 7. Restrictive CORS

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

---

## REST API

### Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/posts` | List all articles |
| GET | `/api/posts/:id` | Get an article |
| POST | `/api/posts` | Create a new article |
| PUT | `/api/posts/:id` | Update an article |
| DELETE | `/api/posts/:id` | Delete an article |
| POST | `/api/upload` | Upload a media file |
| GET | `/api/config` | Get RSS config |
| PUT | `/api/config` | Update RSS config |
| GET | `/rss/feed.xml` | Generated RSS feed |

### Example POST /api/posts Request

```json
{
  "title": "My article",
  "content": "<p>Article content</p>",
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

### Example Response

```json
{
  "success": true,
  "post": {
    "id": "abc123",
    "title": "My article",
    "content": "<p>Article content</p>",
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

## Deployment

### GitHub Pages (Static Mode)

The application can be deployed on GitHub Pages in static mode (without backend server).

#### GitHub Pages Configuration

1. **Enable GitHub Pages** in repository settings:
   - Go to `Settings` > `Pages`
   - Source: **Deploy from a branch**
   - Branch: `gh-pages` / `/ (root)`
   - Click "Save"

2. The CI/CD workflow automatically deploys to the `gh-pages` branch on each push.

#### Static Mode Operation

The client automatically detects if it's in static mode:

```javascript
// client/src/api/mockApi.js
const IS_STATIC_MODE =
  import.meta.env.VITE_STATIC_MODE === 'true' ||
  window.location.hostname.includes('github.io') ||
  window.location.protocol === 'file:';
```

In static mode, data is loaded from JSON files:
- `/api/posts.json` - Article list
- `/api/config.json` - RSS configuration
- `/rss/feed.xml` - Pre-generated RSS feed

#### CI/CD Workflow

The `.github/workflows/ci.yml` file handles:

1. **Lint**: Code verification
2. **Build Server**: Server testing
3. **Build Client**: React compilation
4. **Validate RSS**: XML feed validation
5. **Deploy Demo**: GitHub Pages deployment

### Server Deployment (VPS/Cloud)

```bash
# Build the client
cd client && npm run build

# Start server in production
cd server
NODE_ENV=production node src/index.js

# With PM2 (recommended)
pm2 start src/index.js --name "rss-generator"
```

### Docker (optional)

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

## Project Structure

```
rssgenerator/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD Pipeline
│
├── client/                     # React Frontend
│   ├── public/
│   │   ├── .nojekyll          # Disable Jekyll on GH Pages
│   │   ├── 404.html           # SPA Redirect
│   │   └── rss-icon.svg       # Icon
│   ├── src/
│   │   ├── api/
│   │   │   ├── index.js       # API Client
│   │   │   └── mockApi.js     # Static API (GH Pages)
│   │   ├── components/
│   │   │   ├── Dashboard.jsx  # Article list
│   │   │   ├── PostForm.jsx   # Create/edit form
│   │   │   ├── PostCard.jsx   # Article card
│   │   │   ├── Settings.jsx   # RSS Configuration
│   │   │   ├── Layout.jsx     # Main layout
│   │   │   └── Sidebar.jsx    # Navigation
│   │   ├── App.jsx            # Routes (HashRouter)
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Tailwind styles
│   ├── vite.config.js         # Vite config (base: './')
│   └── package.json
│
├── server/                     # Express Backend
│   ├── src/
│   │   ├── index.js           # Main server
│   │   ├── rssGenerator.js    # RSS XML generation
│   │   └── security.js        # Security module
│   ├── data/
│   │   ├── posts.json         # Article storage
│   │   └── config.json        # RSS configuration
│   ├── uploads/               # Uploaded files
│   ├── rss/
│   │   └── feed.xml           # Generated RSS feed
│   └── package.json
│
├── demo/                       # Demo data
│   ├── data/
│   │   ├── posts.json         # 5 test articles
│   │   └── config.json        # Demo config
│   └── rss/
│       └── feed.xml           # Demo RSS feed
│
├── scripts/                    # Utility scripts
│   └── generate-demo.js       # Demo generator
│
├── package.json               # Root scripts
└── README.md                  # This file
```

---

## Changelog

### Initial Version

- React + Express application creation
- Article management dashboard
- RSS 2.0 feed generation with Media RSS

### Security Fixes (Commit: dba4642)

| Vulnerability | Fix |
|---------------|-----|
| XSS via HTML content | DOMPurify sanitization |
| Malicious file uploads | Magic bytes validation (file-type) |
| CDATA RSS injection | `]]>` escaping |
| Brute-force attacks | express-rate-limit |
| Missing headers | Helmet with CSP |
| Data validation | validator.js |

### Demo Environment (Commit: 5e63d52)

- Created `demo/` folder with test data
- 5 articles with Unsplash images (royalty-free)
- GitHub Actions CI/CD workflow
- Automatic RSS feed validation

### GitHub Pages Fixes (Commits: 985085c, bb17275, 652f391)

| Issue | Solution |
|-------|----------|
| Blank page | `base: './'` in vite.config.js |
| 404 routes | HashRouter instead of BrowserRouter |
| API not found | mockApi.js with static mode detection |
| Jekyll interference | `.nojekyll` file |
| Missing xmllint | `libxml2-utils` installation in CI |
| Pages not enabled | Workflow permissions + manual activation |

### GitHub Pages Permissions Fix (Previous commits)

- Added global workflow permissions
- `concurrency` configuration to avoid conflicts
- Removed `enablement: true` (requires manual activation)

### Switch to gh-pages Branch Deployment (Latest commit)

- Replaced "GitHub Actions" deployment with `gh-pages` branch deployment
- Using `peaceiris/actions-gh-pages@v4` for automatic push
- `force_orphan: true` configuration to keep branch clean
- Simpler to configure: just select the branch in settings

---

## Demo

### Demo URL

Once GitHub Pages is enabled, the demo is accessible at:

**https://artkabis.github.io/rssgenerator/**

### Included Demo Data

5 test articles with:
- Unsplash images (royalty-free)
- Various HTML content
- Different authors
- Staggered dates

### Enable Demo

1. Go to `Settings` > `Pages` in the GitHub repository
2. Select `Source: Deploy from a branch`
3. Select the `gh-pages` branch and `/ (root)`
4. Click "Save"
5. The workflow automatically creates the `gh-pages` branch on next push

---

## Easter Egg

This project contains a hidden feature! If you're curious, try typing `rss-magic` in the console when viewing the demo. This will trigger a special animation celebrating your discovery.

**Keyword**: `rss-magic`

If someone contacts you mentioning this keyword, they've found the easter egg!

---

## Contributing

1. Fork the project
2. Create a branch (`git checkout -b feature/my-feature`)
3. Commit (`git commit -m 'feat: My new feature'`)
4. Push (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

MIT License - See the [LICENSE](LICENSE) file for more details.

---

## Support

To report a bug or suggest an improvement:
- Open an [Issue](https://github.com/artkabis/rssgenerator/issues)
- Or contact the author

---

*Last updated: January 2025*
