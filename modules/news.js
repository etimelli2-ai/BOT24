const { EmbedBuilder, Events } = require('discord.js');

// ── Devs reconnus avec leurs flux RSS ───────────────────────────────────────
const DEVS = [
  // ✈️ Avions
  { name: 'PMDG',              url: 'https://pmdg.com/feed/',                                color: 0x003087, emoji: '✈️', type: 'Avion' },
  { name: 'Fenix Simulations', url: 'https://fenixsim.com/feed/',                            color: 0xFF6B00, emoji: '✈️', type: 'Avion' },
  { name: 'FlyByWire',         url: 'https://flybywiresim.com/blog/rss.xml',                 color: 0x00B4D8, emoji: '✈️', type: 'Avion' },
  { name: 'iniBuilds',         url: 'https://inibuilds.com/feed/',                           color: 0x5865F2, emoji: '✈️', type: 'Avion' },
  { name: 'BlackSquare',       url: 'https://blacksquaresim.com/feed/',                      color: 0x2D2D2D, emoji: '✈️', type: 'Avion' },
  { name: 'Milviz',            url: 'https://milviz.com/feed/',                              color: 0x8B0000, emoji: '✈️', type: 'Avion' },
  { name: 'HPG Simulators',    url: 'https://hpgsim.com/feed/',                              color: 0xFF0000, emoji: '🚁', type: 'Hélicoptère' },
  { name: 'Carenado',          url: 'https://carenado.com/feed/',                            color: 0xD4A017, emoji: '✈️', type: 'Avion' },
  { name: 'Just Flight',       url: 'https://www.justflight.com/rss/news',                   color: 0x0066CC, emoji: '✈️', type: 'Avion' },
  { name: 'A2A Simulations',   url: 'https://www.a2asimulations.com/feed/',                  color: 0x1A1A2E, emoji: '✈️', type: 'Avion' },

  // 🌍 Scènes & Aéroports
  { name: 'Orbx',              url: 'https://orbxdirect.com/blog/rss/',                      color: 0x2E8B57, emoji: '🌍', type: 'Scène' },
  { name: 'Aerosoft',          url: 'https://www.aerosoft.com/en/rss/news.xml',              color: 0x005BAA, emoji: '🏔️', type: 'Scène' },
  { name: 'Drzewiecki Design', url: 'https://drzewiecki-design.net/feed/',                   color: 0x8B4513, emoji: '🏔️', type: 'Scène' },
  { name: 'FlyTampa',          url: 'https://www.flytampa.org/rss.xml',                      color: 0x00CED1, emoji: '🏔️', type: 'Scène' },
  { name: 'LatinVFR',          url: 'https://www.latinvfr.com/feed/',                        color: 0xFF4500, emoji: '🏔️', type: 'Scène' },

  // 🔧 Utilitaires & Météo
  { name: 'Active Sky (HiFi)', url: 'https://hifisimtech.com/feed/',                         color: 0x87CEEB, emoji: '🌤️', type: 'Utilitaire' },
  { name: 'Navigraph',         url: 'https://navigraph.com/blog/rss.xml',                    color: 0x1A73E8, emoji: '📡', type: 'Utilitaire' },
  { name: 'FSDreamTeam (GSX)', url: 'https://www.fsdreamteam.com/news_rss.xml',              color: 0xFF8C00, emoji: '🚌', type: 'Utilitaire' },

  // 🛫 Officiel MSFS
  { name: 'Microsoft MSFS',    url: 'https://forums.flightsimulator.com/c/news-and-announcements.rss', color: 0x0078D4, emoji: '🛫', type: 'Officiel' },
];

// Mots-clés pour filtrer UNIQUEMENT les vrais updates/releases
const UPDATE_KEYWORDS = [
  'update', 'release', 'v1.', 'v2.', 'v3.', 'v4.', 'patch', 'hotfix',
  'changelog', 'new version', 'available now', 'out now', 'launched',
  'now available', 'just released', 'introducing', 'announcing',
  'mise à jour', 'sortie', 'disponible', 'livraison', 'nouveauté',
  'msfs 2024', 'msfs2024', 'microsoft flight simulator',
  'world update', 'sim update', 'game update', 'preview', 'beta',
  'early access', 'released', 'announced', 'new aircraft', 'new airport',
];

function isUpdatePost(title, desc) {
  // Si le titre seul contient un mot clé c'est suffisant
  const titleLow = title.toLowerCase();
  const textLow = `${title} ${desc}`.toLowerCase();
  return UPDATE_KEYWORDS.some(kw => titleLow.includes(kw) || textLow.includes(kw));
}

const posted = new Set();

async function parseFeed(dev) {
  try {
    const res = await fetch(dev.url, {
      headers: { 'User-Agent': 'MSFS24-CommunityBot/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(text)) !== null) {
      const block = match[1];
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/))?.[1]?.trim();
      const link  = (block.match(/<link>(.*?)<\/link>/))?.[1]?.trim();
      const date  = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim();
      const desc  = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || block.match(/<description>(.*?)<\/description>/))?.[1]
                    ?.replace(/<[^>]+>/g, '').trim().slice(0, 200) || '';

      // Corrige les URLs relatives
      let fullLink = link;
      if (link && !link.startsWith('http')) {
        const base = new URL(dev.url);
        fullLink = `${base.origin}/${link.replace(/^\//, '')}`;
      }
      if (title && fullLink && isUpdatePost(title, desc)) {
        items.push({ title, link: fullLink, date, desc });
      }
      if (items.length >= 2) break;
    }
    return items;
  } catch {
    return [];
  }
}

async function checkNews(client) {
  for (const [, guild] of client.guilds.cache) {
    const channel = guild.channels.cache.find(c =>
      c.name.toLowerCase().includes('actus') ||
      c.name.toLowerCase().includes('news') ||
      c.name.toLowerCase().includes('mises-à-jour') ||
      c.name.toLowerCase().includes('updates')
    );
    if (!channel) continue;

    for (const dev of DEVS) {
      const items = await parseFeed(dev);
      for (const item of items) {
        const id = `${dev.name}::${item.link}`;
        if (posted.has(id)) continue;
        posted.add(id);

        const embed = new EmbedBuilder()
          .setColor(dev.color)
          .setAuthor({ name: `${dev.emoji} ${dev.name} — ${dev.type}` })
          .setTitle(item.title.slice(0, 256))
          .setTimestamp(item.date ? new Date(item.date) : new Date());

        try { if (item.link) embed.setURL(item.link); } catch (_) {}

        if (item.desc) embed.setDescription(item.desc + (item.desc.length >= 200 ? '...' : ''));

        await channel.send({ embeds: [embed] }).catch(() => {});
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
}

module.exports = (client) => {
  client.once(Events.ClientReady, async () => {
    // Premier check 15s après démarrage
    setTimeout(() => checkNews(client), 15000);
    // Vérification toutes les heures
    setInterval(() => checkNews(client), 60 * 60 * 1000);
  });
};
