import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateRSSFeed } from './rssGenerator.js';
import {
  sanitizeHtml,
  sanitizeText,
  validateFileType,
  isValidUUID,
  isValidMediaPath,
  validateExistingMedia,
  validatePostData,
  validateConfigData
} from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration CORS sécurisée
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 heures
};

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requêtes par fenêtre
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting plus strict pour les uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 30, // Maximum 30 uploads par heure
  message: { error: 'Limite d\'upload atteinte, veuillez réessayer plus tard' }
});

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false // Pour permettre le chargement des images
}));

app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json({ limit: '1mb' })); // Limiter la taille du body JSON

// Servir les fichiers statiques avec headers de sécurité
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // Empêcher l'exécution de scripts
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    // Pour les images/vidéos, forcer le type de contenu
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.pdf': 'application/pdf'
    };
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

app.use('/rss', express.static(path.join(__dirname, '../rss'), {
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Configuration Multer sécurisée pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier sécurisé avec UUID
    const ext = path.extname(file.originalname).toLowerCase();
    // Valider l'extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mp3', '.pdf'];
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Extension de fichier non autorisée'));
    }
    const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max par fichier
    files: 11 // 1 thumbnail + 10 médias max
  },
  fileFilter: (req, file, cb) => {
    // Liste blanche des types MIME
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'application/pdf'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Type MIME non autorisé'));
    }

    // Vérifier l'extension
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeToExt = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'audio/mpeg': ['.mp3'],
      'application/pdf': ['.pdf']
    };

    if (!mimeToExt[file.mimetype]?.includes(ext)) {
      return cb(new Error('L\'extension ne correspond pas au type de fichier'));
    }

    cb(null, true);
  }
});

// Middleware de validation des fichiers uploadés (vérifie les magic bytes)
async function validateUploadedFiles(req, res, next) {
  const files = [];

  if (req.files?.thumbnail) files.push(...req.files.thumbnail);
  if (req.files?.media) files.push(...req.files.media);

  for (const file of files) {
    const validation = await validateFileType(file.path, file.mimetype);
    if (!validation.valid) {
      // Supprimer le fichier invalide
      try {
        await fs.unlink(file.path);
      } catch (e) {
        // Ignorer les erreurs de suppression
      }
      return res.status(400).json({
        error: 'Fichier invalide',
        details: validation.reason
      });
    }
  }

  next();
}

// Chemins des fichiers de données
const DATA_FILE = path.join(__dirname, '../data/posts.json');
const RSS_FILE = path.join(__dirname, '../rss/feed.xml');
const CONFIG_FILE = path.join(__dirname, '../data/config.json');

// Initialiser les dossiers et fichiers
async function initializeData() {
  const dataDir = path.join(__dirname, '../data');
  const rssDir = path.join(__dirname, '../rss');
  const uploadsDir = path.join(__dirname, '../uploads');

  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(rssDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(CONFIG_FILE);
  } catch {
    const defaultConfig = {
      title: 'Mon Flux RSS',
      description: 'Description de mon flux RSS',
      link: 'http://localhost:3001',
      language: 'fr-FR',
      copyright: `© ${new Date().getFullYear()}`,
      managingEditor: '',
      webMaster: ''
    };
    await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }
}

// Lire les posts avec gestion d'erreur
async function getPosts() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lecture posts:', error);
    return [];
  }
}

// Sauvegarder les posts
async function savePosts(posts) {
  await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2));
}

// Lire la config
async function getConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lecture config:', error);
    return {};
  }
}

// Sauvegarder la config
async function saveConfig(config) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Supprimer un fichier uploadé
async function deleteUploadedFile(filePath) {
  if (!filePath || !isValidMediaPath(filePath)) return;
  const fullPath = path.join(__dirname, '..', filePath);
  try {
    await fs.unlink(fullPath);
  } catch (e) {
    // Fichier déjà supprimé ou inexistant
  }
}

// Routes API

// GET - Récupérer tous les posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await getPosts();
    res.json(posts);
  } catch (error) {
    console.error('GET /api/posts error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des posts' });
  }
});

// GET - Récupérer un post par ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Valider l'UUID
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const posts = await getPosts();
    const post = posts.find(p => p.id === id);

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    res.json(post);
  } catch (error) {
    console.error('GET /api/posts/:id error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du post' });
  }
});

// POST - Créer un nouveau post
app.post('/api/posts',
  uploadLimiter,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'media', maxCount: 10 }
  ]),
  validateUploadedFiles,
  async (req, res) => {
    try {
      const { title, content, author, pubDate } = req.body;

      // Valider les données
      const validation = validatePostData({ title, content, author, pubDate });
      if (!validation.valid) {
        return res.status(400).json({ error: 'Données invalides', details: validation.errors });
      }

      const posts = await getPosts();

      // Traiter la vignette
      const thumbnail = req.files?.thumbnail?.[0]
        ? `/uploads/${req.files.thumbnail[0].filename}`
        : null;

      // Traiter les médias avec sanitization des noms
      const media = req.files?.media
        ? req.files.media.map(file => ({
            url: `/uploads/${file.filename}`,
            type: file.mimetype,
            name: sanitizeText(file.originalname, 255)
          }))
        : [];

      const newPost = {
        id: uuidv4(),
        title: sanitizeText(title, 500),
        content: sanitizeHtml(content), // Sanitize le HTML
        author: sanitizeText(author, 200),
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        thumbnail,
        media,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      posts.unshift(newPost);
      await savePosts(posts);
      await regenerateRSS();

      res.status(201).json(newPost);
    } catch (error) {
      console.error('POST /api/posts error:', error);
      res.status(500).json({ error: 'Erreur lors de la création du post' });
    }
  }
);

// PUT - Mettre à jour un post
app.put('/api/posts/:id',
  uploadLimiter,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'media', maxCount: 10 }
  ]),
  validateUploadedFiles,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Valider l'UUID
      if (!isValidUUID(id)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      const posts = await getPosts();
      const index = posts.findIndex(p => p.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Post non trouvé' });
      }

      const { title, content, author, pubDate, existingMedia } = req.body;

      // Valider les données si elles sont fournies
      if (title || content || author) {
        const validation = validatePostData({
          title: title || posts[index].title,
          content: content || posts[index].content,
          author: author || posts[index].author,
          pubDate: pubDate || posts[index].pubDate
        });
        if (!validation.valid) {
          return res.status(400).json({ error: 'Données invalides', details: validation.errors });
        }
      }

      // Gérer la vignette
      let thumbnail = posts[index].thumbnail;
      if (req.files?.thumbnail?.[0]) {
        // Supprimer l'ancienne vignette si elle existe
        await deleteUploadedFile(posts[index].thumbnail);
        thumbnail = `/uploads/${req.files.thumbnail[0].filename}`;
      } else if (req.body.removeThumbnail === 'true') {
        await deleteUploadedFile(posts[index].thumbnail);
        thumbnail = null;
      }

      // Gérer les médias existants avec validation
      let media = [];
      if (existingMedia) {
        try {
          const parsed = JSON.parse(existingMedia);
          media = validateExistingMedia(parsed);
        } catch (e) {
          return res.status(400).json({ error: 'Format des médias existants invalide' });
        }
      }

      // Ajouter les nouveaux médias
      if (req.files?.media) {
        const newMedia = req.files.media.map(file => ({
          url: `/uploads/${file.filename}`,
          type: file.mimetype,
          name: sanitizeText(file.originalname, 255)
        }));
        media = [...media, ...newMedia];
      }

      // Mettre à jour le post
      posts[index] = {
        ...posts[index],
        title: title ? sanitizeText(title, 500) : posts[index].title,
        content: content ? sanitizeHtml(content) : posts[index].content,
        author: author ? sanitizeText(author, 200) : posts[index].author,
        pubDate: pubDate ? new Date(pubDate).toISOString() : posts[index].pubDate,
        thumbnail,
        media,
        updatedAt: new Date().toISOString()
      };

      await savePosts(posts);
      await regenerateRSS();

      res.json(posts[index]);
    } catch (error) {
      console.error('PUT /api/posts/:id error:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du post' });
    }
  }
);

// DELETE - Supprimer un post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Valider l'UUID
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const posts = await getPosts();
    const index = posts.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Supprimer les fichiers associés
    const postToDelete = posts[index];
    await deleteUploadedFile(postToDelete.thumbnail);
    if (postToDelete.media) {
      for (const m of postToDelete.media) {
        await deleteUploadedFile(m.url);
      }
    }

    posts.splice(index, 1);
    await savePosts(posts);
    await regenerateRSS();

    res.json({ message: 'Post supprimé avec succès' });
  } catch (error) {
    console.error('DELETE /api/posts/:id error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du post' });
  }
});

// GET - Configuration du flux RSS
app.get('/api/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    console.error('GET /api/config error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
  }
});

// PUT - Mettre à jour la configuration
app.put('/api/config', async (req, res) => {
  try {
    // Valider et sanitizer les données de configuration
    const validation = validateConfigData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Données invalides', details: validation.errors });
    }

    const config = await getConfig();
    const updatedConfig = { ...config, ...validation.sanitized };
    await saveConfig(updatedConfig);
    await regenerateRSS();

    res.json(updatedConfig);
  } catch (error) {
    console.error('PUT /api/config error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration' });
  }
});

// GET - Télécharger le fichier RSS
app.get('/api/rss/download', async (req, res) => {
  try {
    await fs.access(RSS_FILE);
    res.setHeader('Content-Type', 'application/rss+xml');
    res.setHeader('Content-Disposition', 'attachment; filename="feed.xml"');
    res.download(RSS_FILE, 'feed.xml');
  } catch {
    res.status(404).json({ error: 'Fichier RSS non trouvé' });
  }
});

// POST - Régénérer le flux RSS manuellement
app.post('/api/rss/regenerate', async (req, res) => {
  try {
    await regenerateRSS();
    res.json({ message: 'Flux RSS régénéré avec succès' });
  } catch (error) {
    console.error('POST /api/rss/regenerate error:', error);
    res.status(500).json({ error: 'Erreur lors de la régénération du flux RSS' });
  }
});

// Fonction pour régénérer le flux RSS
async function regenerateRSS() {
  const posts = await getPosts();
  const config = await getConfig();
  const rssContent = generateRSSFeed(posts, config);
  await fs.writeFile(RSS_FILE, rssContent);
}

// Gestion des erreurs Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux (max 10MB)' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Trop de fichiers (max 11)' });
    }
    return res.status(400).json({ error: `Erreur d'upload: ${error.message}` });
  }

  if (error.message) {
    return res.status(400).json({ error: error.message });
  }

  next(error);
});

// Gestion des erreurs générales
app.use((error, req, res, next) => {
  console.error('Erreur non gérée:', error);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrer le serveur
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📡 Flux RSS disponible sur http://localhost:${PORT}/rss/feed.xml`);
    console.log('🔒 Mode sécurisé activé');
  });
});
