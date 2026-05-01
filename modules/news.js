const { EmbedBuilder, Events } = require('discord.js');

const DEVS = [
  { name: 'PMDG',              url: 'https://pmdg.com/feed/',                                         color: 0x003087, emoji: '✈️', type: 'Avion' },
  { name: 'Fenix Simulations', url: 'https://fenixsim.com/feed/',                                     color: 0xFF6B00, emoji: '✈️', type: 'Avion' },
  { name: 'FlyByWire',         url: 'https://flybywiresim.com/blog/rss.xml',                          color: 0x00B4D8, emoji: '✈️', type: 'Avion' },
  { name: 'iniBuilds',         url: 'https://inibuilds.com/feed/',                                    color: 0x5865F2, emoji: '✈️', type: 'Avion' },
  { name: 'BlackSquare',       url: 'https://blacksquaresim.com/feed/',                               color: 0x2D2D2D, emoji: '✈️', type: 'Avion' },
  { name: 'Milviz',            url: 'https://milviz.com/feed/',                                       color: 0x8B0000, emoji: '✈️', type: 'Avion' },
  { name: 'HPG Simulators',    url: 'https://hpgsim.com/feed/',                                       color: 0xFF0000, emoji: '🚁', type: 'Hélicoptère' },
  { name: 'Carenado',          url: 'https://carenado.com/feed/',                                     color: 0xD4A017, emoji: '✈️', type: 'Avion' },
  { name: 'Just Flight',       url: 'https://www.justflight.com/rss/news',                            color: 0x0066CC, emoji: '✈️', type: 'Avion' },
  { name: 'Orbx',              url: 'https://orbxdirect.com/blog/rss/',                               color: 0x2E8B57, emoji: '🌍', type: 'Scène' },
  { name: 'Aerosoft',          url: 'https://www.aerosoft.com/en/rss/news.xml',                       color: 0x005BAA, emoji: '🏔️', type: 'Scène' },
  { name: 'FlyTampa',          url: 'https://www.flytampa.org/rss.xml',                               color: 0x00CED1, emoji: '🏔️', type: 'Scène' },
  { name: 'Active Sky',        url: 'https://hifisimtech.com/feed/',                                  color: 0x87CEEB, emoji: '🌤️', type: 'Utilitaire' },
  { name: 'Navigraph',         url: 'https://navigraph.com/blog/rss.xml',                             color: 0x1A73E8, emoji: '📡', type: 'Utilitaire' },
  { name: 'GSX FSDreamTeam',   url: 'https://www.fsdreamteam.com/news_rss.xml',                       color: 0xFF8C00, emoji: '🚌', type: 'Utilitaire' },
  { name: 'Microsoft MSFS',    url: 'https://forums.flightsimulator.com/c/news-and-announcements.rss',color: 0x0078D4, emoji: '🛫', type: 'Officiel' },
];

const posted = new Set();

function extractText(block, tag) {
  return (
    block.match(new RegExp(`<${tag}><\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1] ||
    block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ||
    ''
  ).trim();
}

function extractLink(block) {
  // RSS <link>
  const rss = block.match(/<link>(https?:\/\/[^<]+)<\/link>/)?.[1];
  if (rss) return rss.trim();
  // Atom <link href="...">
  const atom = block.match(/<link[^>]+href="(https?:\/\/[^"]+)"/)?.[1];
  if (atom) return atom.trim();
  return '';
}

function fixUrl(link, devUrl) {
  if (!link) return '';
  if (link.startsWith('http')) return link;
  try {
    const base = new URL(devUrl);
    return `${base.origin}/${link.replace(/^\//, '')}`;
  } catch { return ''; }
}

async function parseFeed(dev) {
  try {
    const res = await fetch(dev.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 MSFS24-Bot/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const text = await res.text();

    const items = [];
    // Supporte RSS (<item>) et Atom (<entry>)
    const tagRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
    let match;

    while ((match = tagRegex.exec(text)) !== null && items.length < 3) {
      const block = match[1];
      const title = extractText(block, 'title');
      const rawLink = extractLink(block);
      const link = fixUrl(rawLink, dev.url);
      const date = extractText(block, 'pubDate') || extractText(block, 'published') || extractText(block, 'updated');
      const desc = (extractText(block, 'description') || extractText(block, 'summary') || extractText(block, 'content'))
                   .replace(/<[^>]+>/g, '').trim().slice(0, 200);

      if (title && link) items.push({ title, link, date, desc });
    }
    return items;
  } catch (e) {
    console.error(`News error [${dev.name}]:`, e.message);
    return [];
  }
}

async function checkNews(client) {
  for (const [, guild] of client.guilds.cache) {
    const channel = guild.channels.cache.find(c =>
      c.name.toLowerCase().includes('actus') ||
      c.name.toLowerCase().includes('news') ||
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
    setTimeout(() => checkNews(client), 15000);
    setInterval(() => checkNews(client), 60 * 60 * 1000);
  });
};
