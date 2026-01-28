/**
 * API Mock pour le mode statique (GitHub Pages)
 * Utilise les données JSON statiques au lieu du backend
 */

// Détection du mode statique (GitHub Pages ou fichier local)
const IS_STATIC_MODE = import.meta.env.VITE_STATIC_MODE === 'true' ||
  window.location.hostname.includes('github.io') ||
  window.location.protocol === 'file:' ||
  !window.location.hostname ||
  window.location.hostname === '';

// Cache pour les données
let postsCache = null;
let configCache = null;

/**
 * Détermine le chemin de base pour les requêtes
 */
function getBasePath() {
  // Pour GitHub Pages ou fichier local, utilise des chemins relatifs
  return './';
}

/**
 * Charge les données depuis les fichiers JSON statiques
 */
async function loadStaticData() {
  const basePath = getBasePath();

  if (!postsCache) {
    try {
      const postsResponse = await fetch(`${basePath}api/posts.json`);
      if (!postsResponse.ok) throw new Error('Posts not found');
      postsCache = await postsResponse.json();
    } catch (e) {
      console.warn('Could not load static posts:', e.message);
      postsCache = [];
    }
  }

  if (!configCache) {
    try {
      const configResponse = await fetch(`${basePath}api/config.json`);
      if (!configResponse.ok) throw new Error('Config not found');
      configCache = await configResponse.json();
    } catch (e) {
      console.warn('Could not load static config:', e.message);
      configCache = {
        title: 'RSS Generator Demo',
        description: 'Démonstration du générateur RSS',
        link: window.location.origin || window.location.href,
        language: 'fr-FR',
        copyright: '© 2024'
      };
    }
  }

  return { posts: postsCache, config: configCache };
}

/**
 * API wrapper qui utilise soit le backend réel, soit les données statiques
 */
export const api = {
  /**
   * Récupère tous les posts
   */
  async getPosts() {
    if (IS_STATIC_MODE) {
      const { posts } = await loadStaticData();
      return posts;
    }
    const response = await fetch('/api/posts');
    return response.json();
  },

  /**
   * Récupère un post par ID
   */
  async getPost(id) {
    if (IS_STATIC_MODE) {
      const { posts } = await loadStaticData();
      return posts.find(p => p.id === id) || null;
    }
    const response = await fetch(`/api/posts/${id}`);
    if (!response.ok) return null;
    return response.json();
  },

  /**
   * Crée un nouveau post
   */
  async createPost(formData) {
    if (IS_STATIC_MODE) {
      // En mode statique, on simule la création
      console.warn('Mode statique: création de post simulée');
      return {
        id: crypto.randomUUID(),
        title: formData.get('title'),
        content: formData.get('content'),
        author: formData.get('author'),
        pubDate: formData.get('pubDate'),
        thumbnail: null,
        media: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  /**
   * Met à jour un post
   */
  async updatePost(id, formData) {
    if (IS_STATIC_MODE) {
      console.warn('Mode statique: modification de post simulée');
      const { posts } = await loadStaticData();
      const post = posts.find(p => p.id === id);
      return post || null;
    }
    const response = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      body: formData
    });
    return response.json();
  },

  /**
   * Supprime un post
   */
  async deletePost(id) {
    if (IS_STATIC_MODE) {
      console.warn('Mode statique: suppression de post simulée');
      // Retirer du cache local
      if (postsCache) {
        postsCache = postsCache.filter(p => p.id !== id);
      }
      return { success: true };
    }
    const response = await fetch(`/api/posts/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  /**
   * Récupère la configuration
   */
  async getConfig() {
    if (IS_STATIC_MODE) {
      const { config } = await loadStaticData();
      return config;
    }
    const response = await fetch('/api/config');
    return response.json();
  },

  /**
   * Met à jour la configuration
   */
  async updateConfig(config) {
    if (IS_STATIC_MODE) {
      console.warn('Mode statique: modification de config simulée');
      configCache = { ...configCache, ...config };
      return configCache;
    }
    const response = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return response.json();
  },

  /**
   * Régénère le flux RSS
   */
  async regenerateRSS() {
    if (IS_STATIC_MODE) {
      console.warn('Mode statique: régénération RSS simulée');
      return { success: true, message: 'Mode démo - RSS non régénéré' };
    }
    const response = await fetch('/api/rss/regenerate', {
      method: 'POST'
    });
    return response.json();
  },

  /**
   * Vérifie si on est en mode statique
   */
  isStaticMode() {
    return IS_STATIC_MODE;
  }
};

export default api;
