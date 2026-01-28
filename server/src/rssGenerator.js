/**
 * Générateur de flux RSS 2.0
 * Supporte les éléments standard RSS ainsi que les extensions media
 */

/**
 * Échappe les caractères spéciaux XML
 */
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
  const itemUrl = `${baseUrl}/post/${post.id}`;
  const pubDate = formatRFC822Date(post.pubDate);

  let itemXml = `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${itemUrl}</link>
      <guid isPermaLink="true">${itemUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.author)}</author>
      <description><![CDATA[${post.content}]]></description>`;

  // Ajouter la vignette comme enclosure si présente
  if (post.thumbnail) {
    const thumbnailUrl = `${baseUrl}${post.thumbnail}`;
    const mimeType = getMimeType(post.thumbnail);
    itemXml += `
      <enclosure url="${thumbnailUrl}" type="${mimeType}" length="0" />
      <media:thumbnail url="${thumbnailUrl}" />`;
  }

  // Ajouter les médias
  if (post.media && post.media.length > 0) {
    itemXml += `
      <media:group>`;
    post.media.forEach(media => {
      const mediaUrl = `${baseUrl}${media.url}`;
      const mimeType = media.type || getMimeType(media.url);
      itemXml += `
        <media:content url="${mediaUrl}" type="${mimeType}" medium="${mimeType.startsWith('image') ? 'image' : mimeType.startsWith('video') ? 'video' : 'document'}">
          <media:title>${escapeXml(media.name)}</media:title>
        </media:content>`;
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
  const baseUrl = config.link || 'http://localhost:3001';
  const buildDate = formatRFC822Date(new Date().toISOString());

  let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(config.title)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(config.description)}</description>
    <language>${escapeXml(config.language || 'fr-FR')}</language>
    <copyright>${escapeXml(config.copyright)}</copyright>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <generator>RSS Generator Dashboard v1.0</generator>
    <atom:link href="${baseUrl}/rss/feed.xml" rel="self" type="application/rss+xml" />`;

  if (config.managingEditor) {
    rssXml += `
    <managingEditor>${escapeXml(config.managingEditor)}</managingEditor>`;
  }

  if (config.webMaster) {
    rssXml += `
    <webMaster>${escapeXml(config.webMaster)}</webMaster>`;
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
