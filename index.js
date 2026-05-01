const { Client, GatewayIntentBits, REST, Routes, Events } = require('discord.js');
const { getCommands } = require('./modules/commands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ]
});

require('./modules/welcome')(client);
require('./modules/grades')(client);
require('./modules/metar')(client);
require('./modules/events')(client);
require('./modules/tickets')(client);
require('./modules/moderation')(client);
require('./modules/setup')(client);
require('./modules/news')(client);
require('./modules/bump')(client);

client.once(Events.ClientReady, async () => {
  console.log(`✈️ Bot connecté : ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: getCommands() });
    console.log('✅ Slash commands enregistrées !');
  } catch (err) { console.error('Erreur commandes:', err); }
});

client.login(process.env.DISCORD_TOKEN);
