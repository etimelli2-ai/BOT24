const { EmbedBuilder, Events } = require('discord.js');

const MIN_MS = 2 * 60 * 60 * 1000;
const MAX_MS = 4 * 60 * 60 * 1000;

function randomDelay() {
  return Math.floor(Math.random() * (MAX_MS - MIN_MS + 1)) + MIN_MS;
}

function formatDelay(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${m.toString().padStart(2, '0')}`;
}

let bumpTimeout = null;

function scheduleReminder(channel) {
  const delay = randomDelay();
  console.log(`⏰ Prochain bump dans ${formatDelay(delay)}`);

  bumpTimeout = setTimeout(async () => {
    const embed = new EmbedBuilder()
      .setColor(0x185FA5)
      .setTitle('🚀 Il est temps de bumper !')
      .setDescription('@here Tape `/bump` pour bumper le serveur sur **Disboard** ! 🛫\nMerci à toi ! ✈️')
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
    await channel.send('/bump').catch(() => {});
    scheduleReminder(channel);
  }, delay);
}

module.exports = (client) => {
  client.once(Events.ClientReady, async () => {
    setTimeout(async () => {
      for (const [, guild] of client.guilds.cache) {
        const channel = guild.channels.cache.find(c =>
          c.name.toLowerCase().includes('bump') ||
          c.name.toLowerCase().includes('disboard')
        );
        if (!channel) { console.log('⚠️ Aucun salon bump trouvé.'); continue; }

        console.log(`✅ Auto-bump activé sur #${channel.name}`);
        scheduleReminder(channel);
      }
    }, 15000);
  });

  // Détecte le bump Disboard pour replanifier depuis ce moment
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.id !== '302050872383242240') return;
    const desc = message.embeds?.[0]?.description?.toLowerCase() || '';
    if (!desc.includes('bump done') && !desc.includes('bumped')) return;

    if (bumpTimeout) clearTimeout(bumpTimeout);
    const delay = randomDelay();

    const embed = new EmbedBuilder()
      .setColor(0x1D9E75)
      .setTitle('✅ Bump enregistré !')
      .setDescription(`Merci ! Prochain rappel dans **${formatDelay(delay)}**. ✈️`)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] }).catch(() => {});
    scheduleReminder(message.channel);
  });
};
