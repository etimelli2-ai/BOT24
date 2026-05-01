const { EmbedBuilder, Events } = require('discord.js');

// ── Flux RSS des développeurs MSFS 2024 ─────────────────────────────────────
const FEEDS = [
  // Avions
  { name: 'PMDG',           url: 'https://pmdg.com/feed/',                          color: 0x003087, emoji: '✈️' },
  { name: 'Fenix Simulations', url: 'https://fenixsim.com/feed/',                   color: 0xFF6B00, emoji: '✈️' },
  { name: 'FlyByWire',      url: 'https://flybywiresim.com/blog/rss.xml',            color: 0x00B4D8, emoji: '✈️' },
  { name: 'iniBuilds',      url: 'https://inibuilds.com/feed/',                     color: 0x1A1A2E, emoji: '✈️' },
  { name: 'BlackSquare',    url: 'https://blacksquaresim.com/feed/',                 color: 0x2D2D2D, emoji: '✈️' },
  { name: 'Milviz',         url: 'https://milviz.com/feed/',                        color: 0x4A4A4A, emoji: '✈️' },
  { name: 'HPG',            url: 'https://hpgsim.com/feed/',                        color: 0xFF0000, emoji: '🚁' },

  // Scènes & aéroports
  { name: 'Orbx',           url: 'https://orbxdirect.com/blog/rss/',                color: 0x2E8B57, emoji: '🌍' },
  { name: 'Aerosoft',       url: 'https://www.aerosoft.com/en/rss/news.xml',        color: 0x005BAA, emoji: '🏔️' },
  { name: 'Flightsim.to',   url: 'https://flightsim.to/blog/rss/',                 color: 0xFF4500, emoji: '🧩' },

  // Utilitaires & météo
  { name: 'Active Sky',     url: 'https://hifisimtech.com/feed/',                  color: 0x87CEEB, emoji: '🌤️' },
  { name: 'Navigraph',      url: 'https://navigraph.com/blog/rss.xml',             color: 0x1A73E8, emoji: '📡' },
  { name: 'GSX / FSDreamTeam', url: 'https://www.fsdreamteam.com/news_rss.xml',   color: 0xFF8C00, emoji: '🚌' },

  // Officiel
  { name: 'Microsoft MSFS', url: 'https://blogs.windows.com/tag/microsoft-flight-simulator/feed/', color: 0x00A4EF, emoji: '🛫' },
  { name: 'MSFS Forums',    url: 'https://forums.flightsimulator.com/latest.rss',  color: 0x0078D4, emoji: '💬' },
];

// Garde en mémoire les articles déjà postés
const posted = new Set();

async function parseFeed(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MSFS24-Bot/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(text)) !== null) {
      const block = match[1];
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                     block.match(/<title>(.*?)<\/title>/))?.[1]?.trim();
      const link  = (block.match(/<link>(.*?)<\/link>/) ||
                     block.match(/<link href="(.*?)"/))?.[1]?.trim();
      const date  = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]?.trim();
      const desc  = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                     block.match(/<description>(.*?)<\/description>/))?.[1]
                    ?.replace(/<[^>]+>/g, '').trim().slice(0, 200);

      if (title && link) items.push({ title, link, date, desc });
      if (items.length >= 3) break;
    }
    return items;
  } catch {
    return [];
  }
}

async function checkNews(client) {
  for (const [, guild] of client.guilds.cache) {
    const channel = guild.channels.cache.find(c =>
      c.name.toLowerCase().includes('actus') || c.name.toLowerCase().includes('news')
    );
    if (!channel) continue;

    for (const feed of FEEDS) {
      const items = await parseFeed(feed.url);
      for (const item of items) {
        const id = `${feed.name}::${item.link}`;
        if (posted.has(id)) continue;
        posted.add(id);

        const embed = new EmbedBuilder()
          .setColor(feed.color)
          .setTitle(`${feed.emoji} ${item.title}`.slice(0, 256))
          .setURL(item.link)
          .setAuthor({ name: feed.name })
          .setTimestamp(item.date ? new Date(item.date) : new Date());

        if (item.desc) embed.setDescription(item.desc + '...');

        await channel.send({ embeds: [embed] }).catch(() => {});
        await new Promise(r => setTimeout(r, 500)); // anti-spam
      }
    }
  }
}

module.exports = (client) => {
  client.once(Events.ClientReady, async () => {
    // Premier check au démarrage
    setTimeout(() => checkNews(client), 10000);

    // Vérification toutes les heures
    setInterval(() => checkNews(client), 60 * 60 * 1000);
  });
};
