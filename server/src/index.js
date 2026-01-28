import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateRSSFeed, parseRSSFeed } from './rssGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/rss', express.static(path.join(__dirname, '../rss')));

// Configuration Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mp3|pdf|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  }
});

// Chemin du fichier de données
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
      managingEditor: 'editor@example.com',
      webMaster: 'webmaster@example.com'
    };
    await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }
}

// Lire les posts
async function getPosts() {
  const data = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Sauvegarder les posts
async function savePosts(posts) {
  await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2));
}

// Lire la config
async function getConfig() {
  const data = await fs.readFile(CONFIG_FILE, 'utf-8');
  return JSON.parse(data);
}

// Sauvegarder la config
async function saveConfig(config) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Routes API

// GET - Récupérer tous les posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await getPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des posts' });
  }
});

// GET - Récupérer un post par ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const posts = await getPosts();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du post' });
  }
});

// POST - Créer un nouveau post
app.post('/api/posts', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'media', maxCount: 10 }
]), async (req, res) => {
  try {
    const posts = await getPosts();
    const { title, content, author, pubDate } = req.body;

    const thumbnail = req.files?.thumbnail?.[0]
      ? `/uploads/${req.files.thumbnail[0].filename}`
      : null;

    const media = req.files?.media
      ? req.files.media.map(file => ({
          url: `/uploads/${file.filename}`,
          type: file.mimetype,
          name: file.originalname
        }))
      : [];

    const newPost = {
      id: uuidv4(),
      title,
      content,
      author,
      pubDate: pubDate || new Date().toISOString(),
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
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du post' });
  }
});

// PUT - Mettre à jour un post
app.put('/api/posts/:id', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'media', maxCount: 10 }
]), async (req, res) => {
  try {
    const posts = await getPosts();
    const index = posts.findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    const { title, content, author, pubDate, existingMedia } = req.body;

    let thumbnail = posts[index].thumbnail;
    if (req.files?.thumbnail?.[0]) {
      thumbnail = `/uploads/${req.files.thumbnail[0].filename}`;
    } else if (req.body.removeThumbnail === 'true') {
      thumbnail = null;
    }

    let media = [];
    if (existingMedia) {
      media = JSON.parse(existingMedia);
    }
    if (req.files?.media) {
      const newMedia = req.files.media.map(file => ({
        url: `/uploads/${file.filename}`,
        type: file.mimetype,
        name: file.originalname
      }));
      media = [...media, ...newMedia];
    }

    posts[index] = {
      ...posts[index],
      title: title || posts[index].title,
      content: content || posts[index].content,
      author: author || posts[index].author,
      pubDate: pubDate || posts[index].pubDate,
      thumbnail,
      media,
      updatedAt: new Date().toISOString()
    };

    await savePosts(posts);
    await regenerateRSS();

    res.json(posts[index]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du post' });
  }
});

// DELETE - Supprimer un post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const posts = await getPosts();
    const index = posts.findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    posts.splice(index, 1);
    await savePosts(posts);
    await regenerateRSS();

    res.json({ message: 'Post supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du post' });
  }
});

// GET - Configuration du flux RSS
app.get('/api/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
  }
});

// PUT - Mettre à jour la configuration
app.put('/api/config', async (req, res) => {
  try {
    const config = await getConfig();
    const updatedConfig = { ...config, ...req.body };
    await saveConfig(updatedConfig);
    await regenerateRSS();
    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration' });
  }
});

// GET - Télécharger le fichier RSS
app.get('/api/rss/download', async (req, res) => {
  try {
    await fs.access(RSS_FILE);
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

// Démarrer le serveur
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📡 Flux RSS disponible sur http://localhost:${PORT}/rss/feed.xml`);
  });
});
