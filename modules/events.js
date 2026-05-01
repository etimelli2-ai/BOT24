const { EmbedBuilder, Events } = require('discord.js');

const REFRESH_INTERVAL = 30 * 60 * 1000;

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
  }) + ' UTC';
}

async function fetchVatsimEvents() {
  try {
    const res = await fetch('https://my.vatsim.net/api/v2/events/latest', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    return (json.data || []).slice(0, 5);
  } catch (e) {
    console.error('VATSIM events error:', e.message);
    return [];
  }
}

async function fetchIvaoRSS() {
  try {
    const res = await fetch('https://www.ivao.aero/rss/events.xml', {
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null && items.length < 5) {
      const block = match[1];
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/))?.[1]?.trim();
      const link  = block.match(/<link>(.*?)<\/link>/)?.[1]?.trim();
      const date  = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim();
      const desc  = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || block.match(/<description>(.*?)<\/description>/))?.[1]
                    ?.replace(/<[^>]+>/g, '').trim().slice(0, 150);
      if (title && link) items.push({ title, link, startAt: date, description: desc });
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

  const [vatsimEvents, ivaoEvents] = await Promise.all([fetchVatsimEvents(), fetchIvaoRSS()]);

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
          e.startAt    ? `📅 **Publié :** ${formatDate(e.startAt)}` : '',
          e.description ? `📝 ${e.description}` : '',
          `🔗 [Voir l'event](${e.link || 'https://www.ivao.aero/events'})`,
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
