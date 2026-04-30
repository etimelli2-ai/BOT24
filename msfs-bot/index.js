const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// ─── Structure du serveur ───────────────────────────────────────────────────

const ROLES = [
  // [nom, couleur hex, hoist (visible séparément), mentionable]
  { name: '✈️ Admin',           color: 0xE24B4A, hoist: true,  mentionable: false, permissions: [PermissionFlagsBits.Administrator] },
  { name: '🛡️ Modérateur',      color: 0xBA7517, hoist: true,  mentionable: true,  permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers] },
  { name: '🏅 Pilote de ligne',  color: 0x185FA5, hoist: true,  mentionable: true,  permissions: [] },
  { name: '🎓 Pilote confirmé',  color: 0x1D9E75, hoist: true,  mentionable: true,  permissions: [] },
  { name: '🪂 Pilote débutant',  color: 0x7F77DD, hoist: true,  mentionable: true,  permissions: [] },
  { name: '🤖 Bot',             color: 0x888780, hoist: false, mentionable: false, permissions: [] },
];

const STRUCTURE = [
  {
    category: '📋 BIENVENUE',
    channels: [
      { name: 'règles',         type: ChannelType.GuildText,  topic: 'Règles du serveur — merci de les lire avant de participer.' },
      { name: 'annonces',       type: ChannelType.GuildText,  topic: 'Annonces officielles du serveur et de MSFS 2024.', readonly: true },
      { name: 'présentations',  type: ChannelType.GuildText,  topic: 'Présente-toi à la communauté !' },
      { name: 'liens-utiles',   type: ChannelType.GuildText,  topic: 'Simbrief, LittleNavmap, flightsim.to, VATSIM...' },
    ]
  },
  {
    category: '💬 GÉNÉRAL',
    channels: [
      { name: 'discussion-générale', type: ChannelType.GuildText,  topic: 'Discussion libre autour de MSFS 2024.' },
      { name: 'actualités-msfs',     type: ChannelType.GuildText,  topic: 'Dernières news, mises à jour, patches.' },
      { name: 'off-topic',           type: ChannelType.GuildText,  topic: 'Tout ce qui ne concerne pas MSFS.' },
      { name: '🔊 Vocal général',    type: ChannelType.GuildVoice },
    ]
  },
  {
    category: '🆘 AIDE & TUTORIELS',
    channels: [
      { name: 'aide-débutants',       type: ChannelType.GuildText, topic: 'Toutes les questions sont les bienvenues ici !' },
      { name: 'tutoriels',            type: ChannelType.GuildText, topic: 'Guides, tutoriels vidéo, ressources pédagogiques.' },
      { name: 'bugs-et-crashes',      type: ChannelType.GuildText, topic: 'Problèmes techniques, crashs, CTD.' },
      { name: 'performance-pc',       type: ChannelType.GuildText, topic: 'Optimisation CPU/GPU, stutters, VRAM...' },
      { name: 'paramètres-graphiques',type: ChannelType.GuildText, topic: 'TAA, DLSS, LOD, Ultra settings...' },
    ]
  },
  {
    category: '✈️ AVIONS & VOLS',
    channels: [
      { name: 'avions-stock',      type: ChannelType.GuildText, topic: 'Les avions inclus dans MSFS 2024.' },
      { name: 'avions-payants',    type: ChannelType.GuildText, topic: 'PMDG, Fenix, Asobo Premium, etc.' },
      { name: 'hélicoptères',      type: ChannelType.GuildText, topic: 'H135, R44, vols rotatifs.' },
      { name: 'navigation-ifr-vfr',type: ChannelType.GuildText, topic: 'Plans de vol, Simbrief, LittleNavmap, SID/STAR.' },
      { name: 'procédures-atc',    type: ChannelType.GuildText, topic: 'Phraséologie radio, VATSIM, IVAO.' },
    ]
  },
  {
    category: '🧩 ADD-ONS & MODS',
    channels: [
      { name: 'add-ons-recommandés', type: ChannelType.GuildText, topic: 'Les incontournables de la communauté.' },
      { name: 'freeware',            type: ChannelType.GuildText, topic: 'Mods gratuits — flightsim.to, MSFS Addons Linker...' },
      { name: 'payware',             type: ChannelType.GuildText, topic: 'Avis et conseils sur les add-ons payants.' },
      { name: 'sceneries-aéroports', type: ChannelType.GuildText, topic: 'Scènes, aéroports, paysages améliorés.' },
      { name: 'liveries',            type: ChannelType.GuildText, topic: 'Livrées personnalisées pour vos appareils.' },
    ]
  },
  {
    category: '📸 SCREENSHOTS & MÉDIAS',
    channels: [
      { name: 'screenshots',      type: ChannelType.GuildText, topic: 'Partagez vos plus belles captures !' },
      { name: 'vidéos',           type: ChannelType.GuildText, topic: 'Clips, streams, YouTube.' },
      { name: 'timelapse-replays',type: ChannelType.GuildText, topic: 'Replays et timelapses de vols.' },
    ]
  },
  {
    category: '🗓️ ÉVÈNEMENTS',
    channels: [
      { name: 'vols-en-groupe',       type: ChannelType.GuildText,  topic: 'Organisation de vols multijoueurs.' },
      { name: 'challenges',           type: ChannelType.GuildText,  topic: 'Défis atterrissage, Bush trips, etc.' },
      { name: 'planning-évènements',  type: ChannelType.GuildText,  topic: 'Calendrier des évènements à venir.' },
      { name: '🔊 Vols online',       type: ChannelType.GuildVoice },
    ]
  },
  {
    category: '⚙️ ADMINISTRATION',
    channels: [
      { name: 'suggestions',  type: ChannelType.GuildText, topic: 'Propose tes idées pour améliorer le serveur.' },
      { name: 'modération',   type: ChannelType.GuildText, topic: 'Contact privé avec les modérateurs.' },
    ]
  },
];

// ─── Setup du serveur ───────────────────────────────────────────────────────

async function setupServer(guild) {
  console.log(`\n🚀 Démarrage du setup sur : ${guild.name}`);

  // 1. Supprimer les salons et catégories existants
  console.log('🗑️  Nettoyage des salons existants...');
  const existing = await guild.channels.fetch();
  for (const [, ch] of existing) {
    try { await ch.delete(); } catch (_) {}
  }

  // 2. Créer les rôles
  console.log('🎭 Création des rôles...');
  const createdRoles = {};
  for (const roleData of ROLES) {
    const role = await guild.roles.create({
      name: roleData.name,
      color: roleData.color,
      hoist: roleData.hoist,
      mentionable: roleData.mentionable,
      permissions: roleData.permissions,
    });
    createdRoles[roleData.name] = role;
    console.log(`   ✅ Rôle créé : ${role.name}`);
  }

  // 3. Créer les catégories et salons
  console.log('📁 Création des catégories et salons...');
  for (const section of STRUCTURE) {
    const category = await guild.channels.create({
      name: section.category,
      type: ChannelType.GuildCategory,
    });
    console.log(`\n   📂 ${section.category}`);

    for (const ch of section.channels) {
      const channelOptions = {
        name: ch.name,
        type: ch.type,
        parent: category.id,
      };
      if (ch.topic) channelOptions.topic = ch.topic;

      // Salon annonces : lecture seule pour @everyone
      if (ch.readonly) {
        channelOptions.permissionOverwrites = [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] }
        ];
      }

      await guild.channels.create(channelOptions);
      console.log(`      #${ch.name}`);
    }
  }

  console.log('\n✅ Setup terminé avec succès !');
}

// ─── Commande !setup ────────────────────────────────────────────────────────

client.on('messageCreate', async (message) => {
  if (message.content !== '!setup') return;
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Tu dois être administrateur pour utiliser cette commande.');
  }

  await message.reply('⏳ Setup en cours... le serveur va être configuré, ne t\'inquiète pas si les salons disparaissent !');

  try {
    await setupServer(message.guild);
    // Le message de confirmation sera dans le nouveau salon #annonces
  } catch (err) {
    console.error(err);
  }
});

// ─── Démarrage ──────────────────────────────────────────────────────────────

client.once('ready', () => {
  console.log(`✈️  Bot connecté en tant que ${client.user.tag}`);
  console.log(`📡 Sur ${client.guilds.cache.size} serveur(s)`);
  console.log(`\nTape !setup dans ton serveur Discord pour lancer la configuration.`);
});

client.login(process.env.DISCORD_TOKEN);
