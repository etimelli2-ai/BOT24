const { EmbedBuilder, Events } = require('discord.js');

// Rafraîchit les events toutes les 30 minutes
const REFRESH_INTERVAL = 30 * 60 * 1000;

async function fetchVatsimEvents() {
  try {
    const res = await fetch('https://my.vatsim.net/api/v2/events/latest');
    const json = await res.json();
    return (json.data || []).slice(0, 5);
  } catch { return []; }
}

async function fetchIvaoEvents() {
  try {
    const res = await fetch('https://api.ivao.aero/v2/events/whazzup');
    const json = await res.json();
    return (json || []).slice(0, 5);
  } catch { return []; }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

async function postEvents(guild) {
  const channel = guild.channels.cache.find(c =>
    c.name.toLowerCase().includes('events') || c.name.toLowerCase().includes('évènements')
  );
  if (!channel) return;

  const [vatsimEvents, ivaoEvents] = await Promise.all([fetchVatsimEvents(), fetchIvaoEvents()]);

  // ── VATSIM ──
  const vatsimEmbed = new EmbedBuilder()
    .setColor(0x4A90D9)
    .setTitle('🌐 Events VATSIM en cours')
    .setURL('https://my.vatsim.net/events')
    .setTimestamp();

  if (vatsimEvents.length === 0) {
    vatsimEmbed.setDescription('Aucun event VATSIM en ce moment.');
  } else {
    vatsimEvents.forEach(e => {
      const start = formatDate(e.start_time);
      const end = formatDate(e.end_time);
      vatsimEmbed.addFields({
        name: `✈️ ${e.name || 'Sans titre'}`,
        value: `📅 Du ${start} au ${end}\n🗺️ ${e.airports?.map(a => a.icao).join(' → ') || 'N/A'}\n🔗 [Voir l'event](https://my.vatsim.net/events/${e.id})`,
      });
    });
  }

  // ── IVAO ──
  const ivaoEmbed = new EmbedBuilder()
    .setColor(0x1AA34A)
    .setTitle('🌍 Events IVAO en cours')
    .setURL('https://www.ivao.aero/events')
    .setTimestamp();

  if (ivaoEvents.length === 0) {
    ivaoEmbed.setDescription('Aucun event IVAO en ce moment.');
  } else {
    ivaoEvents.forEach(e => {
      const start = formatDate(e.startAt);
      const end = formatDate(e.endAt);
      ivaoEmbed.addFields({
        name: `✈️ ${e.title || 'Sans titre'}`,
        value: `📅 Du ${start} au ${end}\n🌍 ${e.divisionId || 'International'}\n🔗 [Voir l'event](https://www.ivao.aero/events)`,
      });
    });
  }

  // Supprime les anciens messages du bot dans ce salon
  try {
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessages = messages.filter(m => m.author.id === guild.client.user.id);
    for (const [, msg] of botMessages) await msg.delete().catch(() => {});
  } catch (_) {}

  await channel.send({ embeds: [vatsimEmbed] }).catch(() => {});
  await channel.send({ embeds: [ivaoEmbed] }).catch(() => {});
}

module.exports = (client) => {
  // Commande /events
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'events') return;

    await interaction.deferReply({ ephemeral: true });
    await postEvents(interaction.guild);
    return interaction.editReply({ content: '✅ Events IVAO & VATSIM mis à jour !' });
  });

  // Refresh automatique toutes les 30 min
  client.once(Events.ClientReady, () => {
    setTimeout(async () => {
      for (const [, guild] of client.guilds.cache) await postEvents(guild);
      setInterval(async () => {
        for (const [, guild] of client.guilds.cache) await postEvents(guild);
      }, REFRESH_INTERVAL);
    }, 5000); // attend 5s que le bot soit prêt
  });
};
