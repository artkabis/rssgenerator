/**
 * Générateur de flux RSS 2.0
 * Supporte les éléments standard RSS ainsi que les extensions media
 * Sécurisé contre les injections XML et CDATA
 */

/**
 * Échappe les caractères spéciaux XML
 */
function escapeXml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Échappe le contenu pour CDATA
 * Remplace ]]> par ]]]]><![CDATA[> pour éviter de casser le bloc CDATA
 */
function escapeForCDATA(text) {
  if (!text) return '';
  return String(text).replace(/\]\]>/g, ']]]]><![CDATA[>');
}

/**
 * Valide et nettoie une URL
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  // Supprimer les caractères dangereux
  return url.replace(/[<>"'&]/g, '').trim();
}

/**
 * Formate une date au format RFC 822 (requis par RSS)
 */
function formatRFC822Date(dateString) {
  const date = new Date(dateString);
  return date.toUTCString();
}

/**
 * Détermine le type MIME à partir de l'extension
 */
function getMimeType(url) {
  const ext = url.split('.').pop().toLowerCase();
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    pdf: 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Génère un élément item RSS à partir d'un post
 */
function generateItemXml(post, baseUrl) {
  // Valider l'ID du post (doit être un UUID)
  const safeId = /^[a-f0-9-]{36}$/i.test(post.id) ? post.id : 'invalid-id';
  const itemUrl = `${sanitizeUrl(baseUrl)}/post/${safeId}`;
  const pubDate = formatRFC822Date(post.pubDate);

  // Échapper le contenu pour CDATA afin d'éviter les injections
  const safeContent = escapeForCDATA(post.content || '');

  let itemXml = `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(itemUrl)}</link>
      <guid isPermaLink="true">${escapeXml(itemUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.author)}</author>
      <description><![CDATA[${safeContent}]]></description>`;

  // Ajouter la vignette comme enclosure si présente
  if (post.thumbnail && typeof post.thumbnail === 'string') {
    // Valider que le chemin de la vignette est sûr
    if (post.thumbnail.startsWith('/uploads/') && !post.thumbnail.includes('..')) {
      const thumbnailUrl = `${sanitizeUrl(baseUrl)}${escapeXml(post.thumbnail)}`;
      const mimeType = getMimeType(post.thumbnail);
      itemXml += `
      <enclosure url="${thumbnailUrl}" type="${escapeXml(mimeType)}" length="0" />
      <media:thumbnail url="${thumbnailUrl}" />`;
    }
  }

  // Ajouter les médias
  if (post.media && Array.isArray(post.media) && post.media.length > 0) {
    itemXml += `
      <media:group>`;
    post.media.forEach(media => {
      // Valider chaque média
      if (media && media.url && typeof media.url === 'string' &&
          media.url.startsWith('/uploads/') && !media.url.includes('..')) {
        const mediaUrl = `${sanitizeUrl(baseUrl)}${escapeXml(media.url)}`;
        const mimeType = media.type || getMimeType(media.url);
        const medium = mimeType.startsWith('image') ? 'image' :
                       mimeType.startsWith('video') ? 'video' : 'document';
        itemXml += `
        <media:content url="${mediaUrl}" type="${escapeXml(mimeType)}" medium="${medium}">
          <media:title>${escapeXml(media.name || '')}</media:title>
        </media:content>`;
      }
    });
    itemXml += `
      </media:group>`;
  }

  itemXml += `
    </item>`;

  return itemXml;
}

/**
 * Génère le flux RSS complet
 */
export function generateRSSFeed(posts, config) {
  // Valider et nettoyer la configuration
  const safeConfig = {
    title: escapeXml(config.title || 'Mon Flux RSS'),
    description: escapeXml(config.description || ''),
    link: sanitizeUrl(config.link) || 'http://localhost:3001',
    language: /^[a-z]{2}(-[A-Z]{2})?$/.test(config.language) ? config.language : 'fr-FR',
    copyright: escapeXml(config.copyright || ''),
    managingEditor: escapeXml(config.managingEditor || ''),
    webMaster: escapeXml(config.webMaster || '')
  };

  const baseUrl = safeConfig.link;
  const buildDate = formatRFC822Date(new Date().toISOString());

  let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${safeConfig.title}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${safeConfig.description}</description>
    <language>${safeConfig.language}</language>
    <copyright>${safeConfig.copyright}</copyright>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <generator>RSS Generator Dashboard v1.0</generator>
    <atom:link href="${escapeXml(baseUrl)}/rss/feed.xml" rel="self" type="application/rss+xml" />`;

  if (safeConfig.managingEditor) {
    rssXml += `
    <managingEditor>${safeConfig.managingEditor}</managingEditor>`;
  }

  if (safeConfig.webMaster) {
    rssXml += `
    <webMaster>${safeConfig.webMaster}</webMaster>`;
  }

  // Ajouter les posts triés par date de publication (plus récent en premier)
  const sortedPosts = [...posts].sort((a, b) =>
    new Date(b.pubDate) - new Date(a.pubDate)
  );

  sortedPosts.forEach(post => {
    rssXml += `
${generateItemXml(post, baseUrl)}`;
  });

  rssXml += `
  </channel>
</rss>`;

  return rssXml;
}

/**
 * Parse un flux RSS existant (pour import futur)
 */
export async function parseRSSFeed(xmlContent) {
  // Implémentation basique - peut être étendue avec xml2js
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlContent)) !== null) {
    const itemXml = match[1];
    const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const description = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
                        itemXml.match(/<description>(.*?)<\/description>/)?.[1] || '';
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const author = itemXml.match(/<author>(.*?)<\/author>/)?.[1] || '';

    items.push({
      title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
      content: description,
      pubDate: new Date(pubDate).toISOString(),
      author: author.replace(/&amp;/g, '&'),
      link
    });
  }

  return items;
}
