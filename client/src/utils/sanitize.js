import DOMPurify from 'dompurify';

/**
 * Configuration de DOMPurify pour le contenu HTML sécurisé
 */
const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span', 'div', 'hr', 'sup', 'sub', 'mark'
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
  'width', 'height', 'style'
];

/**
 * Sanitize le contenu HTML pour affichage sécurisé
 * Utilisé avant d'utiliser dangerouslySetInnerHTML
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Forcer les liens à s'ouvrir dans un nouvel onglet avec noopener
    ADD_ATTR: ['target', 'rel'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    SANITIZE_DOM: true
  });
}

/**
 * Supprime toutes les balises HTML et retourne du texte brut
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Échappe les caractères HTML dangereux
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Valide une URL
 */
export function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Nettoie un nom de fichier pour l'affichage
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'fichier';

  // Supprimer les caractères dangereux
  return filename
    .replace(/[<>:"\/\\|?*]/g, '')
    .replace(/\.\./g, '')
    .substring(0, 255);
}
