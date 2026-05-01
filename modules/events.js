const { EmbedBuilder, Events } = require('discord.js');

const REFRESH_INTERVAL = 30 * 60 * 1000;

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    }) + ' UTC';
  } catch { return dateStr; }
}

async function fetchVatsimEvents() {
  try {
    const res = await fetch('https://my.vatsim.net/api/v2/events/latest', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'MSFS24-Bot/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const arr = Array.isArray(json) ? json : (json.data || json.events || []);
    return arr.slice(0, 5);
  } catch (e) {
    console.error('VATSIM error:', e.message);
    return [];
  }
}

async function fetchIvaoEvents() {
  try {
    // Essaie le flux RSS public
    const res = await fetch('https://www.ivao.aero/rss/events.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0 MSFS24-Bot/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    const items = [];
    const tagRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
    let match;

    while ((match = tagRegex.exec(text)) !== null && items.length < 5) {
      const block = match[1];
      const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || block.match(/<title[^>]*>([\s\S]*?)<\/title>/))?.[1]?.trim();
      const link  = block.match(/<link>(https?:\/\/[^<]+)<\/link>/)?.[1]?.trim() ||
                    block.match(/<link[^>]+href="(https?:\/\/[^"]+)"/)?.[1]?.trim();
      const date  = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || block.match(/<published>([\s\S]*?)<\/published>/))?.[1]?.trim();
      const desc  = (block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || block.match(/<description[^>]*>([\s\S]*?)<\/description>/))?.[1]
                    ?.replace(/<[^>]+>/g, '').trim().slice(0, 150);

      if (title) items.push({ title, link: link || 'https://www.ivao.aero/events', startAt: date, description: desc });
    }
    return items;
  } catch (e) {
    console.error('IVAO RSS error:', e.message);
    return [];
  }
}

async function postEvents(guild) {
  const channel = guild.channels.cache.find(c =>
    c.name.toLowerCase().includes('events') ||
    c.name.toLowerCase().includes('évènements') ||
    c.name.toLowerCase().includes('evenements')
  );
  if (!channel) return;

  const [vatsimEvents, ivaoEvents] = await Promise.all([fetchVatsimEvents(), fetchIvaoEvents()]);

  // Supprime les anciens messages du bot
  try {
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessages = messages.filter(m => m.author.id === guild.client.user.id);
    for (const [, msg] of botMessages) await msg.delete().catch(() => {});
  } catch (_) {}

  // ── VATSIM ──
  const vatsimEmbed = new EmbedBuilder()
    .setColor(0x4A90D9)
    .setTitle('🌐 Events VATSIM')
    .setURL('https://my.vatsim.net/events')
    .setTimestamp();

  if (vatsimEvents.length === 0) {
    vatsimEmbed.setDescription('Aucun event VATSIM en ce moment.\n[Voir tous les events](https://my.vatsim.net/events)');
  } else {
    for (const e of vatsimEvents) {
      const airports = e.airports?.map(a => a.icao).join(' → ') || '';
      vatsimEmbed.addFields({
        name: `✈️ ${(e.name || 'Sans titre').slice(0, 100)}`,
        value: [
          e.start_time ? `📅 **Début :** ${formatDate(e.start_time)}` : '',
          e.end_time   ? `🏁 **Fin :** ${formatDate(e.end_time)}` : '',
          airports     ? `🗺️ **Route :** ${airports}` : '',
          `🔗 [Voir l'event](https://my.vatsim.net/events/${e.id})`,
        ].filter(Boolean).join('\n'),
      });
    }
  }

  // ── IVAO ──
  const ivaoEmbed = new EmbedBuilder()
    .setColor(0x1AA34A)
    .setTitle('🌍 Events IVAO')
    .setURL('https://www.ivao.aero/events')
    .setTimestamp();

  if (ivaoEvents.length === 0) {
    ivaoEmbed.setDescription('Aucun event IVAO trouvé.\n[Voir tous les events](https://www.ivao.aero/events)');
  } else {
    for (const e of ivaoEvents) {
      ivaoEmbed.addFields({
        name: `✈️ ${(e.title || 'Sans titre').slice(0, 100)}`,
        value: [
          e.startAt      ? `📅 **Date :** ${formatDate(e.startAt)}` : '',
          e.description  ? `📝 ${e.description}` : '',
          `🔗 [Voir l'event](${e.link})`,
        ].filter(Boolean).join('\n'),
      });
    }
  }

  await channel.send({ embeds: [vatsimEmbed] }).catch(() => {});
  await channel.send({ embeds: [ivaoEmbed] }).catch(() => {});
}

module.exports = (client) => {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'events') return;
    await interaction.deferReply({ ephemeral: true });
    await postEvents(interaction.guild);
    return interaction.editReply({ content: '✅ Events mis à jour !' });
  });

  client.once(Events.ClientReady, () => {
    setTimeout(async () => {
      for (const [, guild] of client.guilds.cache) await postEvents(guild);
      setInterval(async () => {
        for (const [, guild] of client.guilds.cache) await postEvents(guild);
      }, REFRESH_INTERVAL);
    }, 5000);
  });
};
