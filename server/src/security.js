/**
 * Module de sécurité pour la validation et la sanitization
 */

import { fileTypeFromBuffer } from 'file-type';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import validator from 'validator';
import fs from 'fs/promises';

// Créer une instance de DOMPurify avec JSDOM
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Configuration DOMPurify - autoriser uniquement les balises sûres
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

// Styles autorisés (évite les injections CSS)
const ALLOWED_STYLES = [
  'color', 'background-color', 'font-size', 'font-weight', 'font-style',
  'text-align', 'text-decoration', 'margin', 'padding', 'border'
];

/**
 * Sanitize le contenu HTML pour prévenir les attaques XSS
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';

  return purify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    // Empêcher les injections JavaScript dans les attributs
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    // Nettoyer les styles potentiellement dangereux
    SANITIZE_DOM: true,
    KEEP_CONTENT: true
  });
}

/**
 * Échappe le texte pour l'insertion dans le XML
 * Gère aussi le cas spécial de CDATA
 */
export function escapeForXml(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Échappe le contenu pour CDATA (remplace ]]> par ]]]]><![CDATA[>)
 */
export function escapeForCDATA(text) {
  if (!text || typeof text !== 'string') return '';

  // Remplacer ]]> pour éviter de casser le CDATA
  return text.replace(/\]\]>/g, ']]]]><![CDATA[>');
}

/**
 * Types MIME autorisés avec leurs signatures (magic bytes)
 */
const ALLOWED_FILE_SIGNATURES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'image/webp': true,
  'video/mp4': true,
  'video/webm': true,
  'audio/mpeg': true,
  'application/pdf': true
};

/**
 * Valide un fichier uploadé en vérifiant ses magic bytes
 * Retourne true si le fichier est valide, false sinon
 */
export async function validateFileType(filePath, declaredMimeType) {
  try {
    const buffer = await fs.readFile(filePath);
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      // Impossible de déterminer le type - rejeter par sécurité
      return { valid: false, reason: 'Type de fichier non reconnu' };
    }

    // Vérifier si le type réel correspond au type déclaré
    if (fileType.mime !== declaredMimeType) {
      return {
        valid: false,
        reason: `Type MIME déclaré (${declaredMimeType}) ne correspond pas au contenu réel (${fileType.mime})`
      };
    }

    // Vérifier si le type est dans la liste autorisée
    if (!ALLOWED_FILE_SIGNATURES[fileType.mime]) {
      return {
        valid: false,
        reason: `Type de fichier non autorisé: ${fileType.mime}`
      };
    }

    return { valid: true, detectedType: fileType.mime };
  } catch (error) {
    return { valid: false, reason: `Erreur lors de la validation: ${error.message}` };
  }
}

/**
 * Valide un UUID v4
 */
export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return validator.isUUID(str, 4);
}

/**
 * Valide une URL
 */
export function isValidURL(str) {
  if (!str || typeof str !== 'string') return false;
  return validator.isURL(str, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true
  });
}

/**
 * Valide une adresse email
 */
export function isValidEmail(str) {
  if (!str || typeof str !== 'string') return false;
  return validator.isEmail(str);
}

/**
 * Valide une date ISO
 */
export function isValidISODate(str) {
  if (!str || typeof str !== 'string') return false;
  return validator.isISO8601(str);
}

/**
 * Nettoie et valide une chaîne de texte simple (pas de HTML)
 */
export function sanitizeText(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';

  // Supprimer les balises HTML
  let clean = text.replace(/<[^>]*>/g, '');

  // Échapper les caractères spéciaux
  clean = validator.escape(clean);

  // Limiter la longueur
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }

  return clean.trim();
}

/**
 * Valide le chemin d'un média pour éviter le path traversal
 */
export function isValidMediaPath(path) {
  if (!path || typeof path !== 'string') return false;

  // Doit commencer par /uploads/
  if (!path.startsWith('/uploads/')) return false;

  // Ne doit pas contenir de path traversal
  if (path.includes('..') || path.includes('//')) return false;

  // Ne doit contenir que des caractères sûrs
  const safePattern = /^\/uploads\/[\w\-\.]+$/;
  return safePattern.test(path);
}

/**
 * Valide et sanitize un tableau de médias existants
 */
export function validateExistingMedia(mediaArray) {
  if (!Array.isArray(mediaArray)) return [];

  return mediaArray.filter(media => {
    if (!media || typeof media !== 'object') return false;
    if (!isValidMediaPath(media.url)) return false;
    if (media.type && typeof media.type !== 'string') return false;
    if (media.name && typeof media.name !== 'string') return false;
    return true;
  }).map(media => ({
    url: media.url,
    type: sanitizeText(media.type || '', 100),
    name: sanitizeText(media.name || '', 255)
  }));
}

/**
 * Valide les données d'un post
 */
export function validatePostData(data) {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Le titre est requis');
  } else if (data.title.length > 500) {
    errors.push('Le titre ne doit pas dépasser 500 caractères');
  }

  if (!data.author || typeof data.author !== 'string' || data.author.trim().length === 0) {
    errors.push('L\'auteur est requis');
  } else if (data.author.length > 200) {
    errors.push('Le nom de l\'auteur ne doit pas dépasser 200 caractères');
  }

  if (!data.content || typeof data.content !== 'string') {
    errors.push('Le contenu est requis');
  } else if (data.content.length > 100000) {
    errors.push('Le contenu ne doit pas dépasser 100 000 caractères');
  }

  if (data.pubDate && !isValidISODate(data.pubDate)) {
    errors.push('La date de publication n\'est pas valide');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valide les données de configuration
 */
export function validateConfigData(data) {
  const errors = [];
  const sanitized = {};

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.length > 200) {
      errors.push('Titre invalide');
    } else {
      sanitized.title = sanitizeText(data.title, 200);
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string' || data.description.length > 1000) {
      errors.push('Description invalide');
    } else {
      sanitized.description = sanitizeText(data.description, 1000);
    }
  }

  if (data.link !== undefined) {
    if (!isValidURL(data.link)) {
      errors.push('URL invalide');
    } else {
      sanitized.link = data.link;
    }
  }

  if (data.language !== undefined) {
    // Valider le format de langue (ex: fr-FR, en-US)
    const langPattern = /^[a-z]{2}(-[A-Z]{2})?$/;
    if (!langPattern.test(data.language)) {
      errors.push('Code de langue invalide');
    } else {
      sanitized.language = data.language;
    }
  }

  if (data.copyright !== undefined) {
    sanitized.copyright = sanitizeText(data.copyright, 200);
  }

  if (data.managingEditor !== undefined) {
    if (data.managingEditor && !isValidEmail(data.managingEditor)) {
      errors.push('Email de l\'éditeur invalide');
    } else {
      sanitized.managingEditor = data.managingEditor;
    }
  }

  if (data.webMaster !== undefined) {
    if (data.webMaster && !isValidEmail(data.webMaster)) {
      errors.push('Email du webmaster invalide');
    } else {
      sanitized.webMaster = data.webMaster;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}
