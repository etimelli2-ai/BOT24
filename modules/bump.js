const { Events } = require('discord.js');

const MIN_MS = 2 * 60 * 60 * 1000; // 2h
const MAX_MS = 4 * 60 * 60 * 1000; // 4h

function randomDelay() {
  return Math.floor(Math.random() * (MAX_MS - MIN_MS + 1)) + MIN_MS;
}

let bumpTimeout = null;

function scheduleBump(channel) {
  const delay = randomDelay();
  console.log(`⏰ Prochain :bump dans ${Math.floor(delay / 3600000)}h`);

  bumpTimeout = setTimeout(async () => {
    await channel.send(':bump').catch(() => {});
    scheduleBump(channel); // relance le cycle
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

        if (!channel) {
          console.log('⚠️ Aucun salon bump trouvé.');
          continue;
        }

        console.log(`✅ Auto-bump activé sur #${channel.name}`);
        scheduleBump(channel);
      }
    }, 15000);
  });
};
