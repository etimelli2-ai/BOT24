const {
  Client, GatewayIntentBits, PermissionFlagsBits,
  ChannelType, EmbedBuilder, Events
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

// ─── Warns en mémoire ────────────────────────────────────────────────────────
const warns = new Map();

function getWarns(userId) { return warns.get(userId) || []; }
function addWarn(userId, reason, modTag) {
  const list = getWarns(userId);
  list.push({ reason, date: new Date().toLocaleDateString('fr-FR'), modTag });
  warns.set(userId, list);
  return list.length;
}
function findChannel(guild, name) {
  return guild.channels.cache.find(c => c.name === name);
}

// ─── Message de bienvenue auto ───────────────────────────────────────────────

client.on(Events.GuildMemberAdd, async (member) => {
  const channel = findChannel(member.guild, 'présentations') || findChannel(member.guild, 'bienvenue');
  if (!channel) return;

  const rulesChannel = findChannel(member.guild, 'règles');
  const helpChannel = findChannel(member.guild, 'aide-débutants');

  const embed = new EmbedBuilder()
    .setColor(0x185FA5)
    .setTitle('✈️ Nouveau pilote dans les airs !')
    .setDescription(
      `Bienvenue sur **MSFS 2024 FR**, ${member} ! 🛫\n\n` +
      `Avant de décoller :\n` +
      `📋 Lis les règles ${rulesChannel ? `dans ${rulesChannel}` : ''}\n` +
      `✈️ Présente-toi ici !\n` +
      `❓ Pose tes questions ${helpChannel ? `dans ${helpChannel}` : ''}`
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: `Membre #${member.guild.memberCount}` })
    .setTimestamp();

  await channel.send({ embeds: [embed] });
});

// ─── Messages épinglés ───────────────────────────────────────────────────────

async function pinAllMessages(guild) {
  const pins = [
    {
      channel: 'règles',
      embed: new EmbedBuilder()
        .setColor(0xE24B4A)
        .setTitle('📋 Règles du serveur')
        .setDescription(
          '**1.** Respectez tous les membres\n' +
          '**2.** Pas de spam, pub ou contenu NSFW\n' +
          '**3.** Restez dans le sujet de chaque salon\n' +
          '**4.** Pas de piratage ou contenu illégal\n' +
          '**5.** Écoutez les modérateurs\n' +
          '**6.** Bonne ambiance avant tout ! ✈️'
        )
        .setFooter({ text: 'Non-respect → warn → mute → ban' }),
    },
    {
      channel: 'liens-utiles',
      embed: new EmbedBuilder()
        .setColor(0x1D9E75)
        .setTitle('🔗 Liens utiles MSFS 2024')
        .addFields(
          { name: '🗺️ Plan de vol', value: '[Simbrief](https://www.simbrief.com)\n[LittleNavmap](https://albar965.github.io/littlenavmap.html)', inline: true },
          { name: '🧩 Add-ons gratuits', value: '[flightsim.to](https://flightsim.to)\n[MSFS Addons Linker](https://github.com/musaffa/MSFS-Addons-Linker)', inline: true },
          { name: '🌐 Vols online', value: '[VATSIM](https://vatsim.net)\n[IVAO](https://ivao.aero)', inline: true },
          { name: '📡 Météo', value: '[CheckWX METAR](https://www.checkwxapi.com)\n[Windy](https://www.windy.com)', inline: true },
          { name: '📚 Formation', value: '[FS Academy](https://www.fsacademy.co.uk)', inline: true },
          { name: '🐛 Bugs MS', value: '[Zendesk](https://flightsimulator.zendesk.com)', inline: true },
        ),
    },
    {
      channel: 'aide-débutants',
      embed: new EmbedBuilder()
        .setColor(0x7F77DD)
        .setTitle('🆘 Bienvenue dans #aide-débutants !')
        .setDescription('Toutes les questions sont les bienvenues. Pas de jugement !')
        .addFields(
          { name: '🎮 Manette / HOTAS', value: 'Précise ta manette pour de l\'aide au binding' },
          { name: '💻 Performances', value: 'Donne tes specs PC (CPU, GPU, RAM)' },
          { name: '🛩️ Premier vol', value: 'Commence par le Cessna 172 en VFR !' },
        ),
    },
    {
      channel: 'add-ons-recommandés',
      embed: new EmbedBuilder()
        .setColor(0xBA7517)
        .setTitle('🧩 Add-ons incontournables')
        .addFields(
          { name: '🛬 Trafic IA', value: '**FSLTL** (gratuit) — trafic réaliste' },
          { name: '🔧 Utilitaires', value: '**MSFS Addons Linker** (gratuit)\n**Toolbar Pushback** (gratuit)' },
          { name: '🗺️ Navigation', value: '**LittleNavmap** (gratuit) — carte & plan de vol' },
          { name: '🌤️ Météo', value: '**Active Sky** (payant) — météo avancée' },
          { name: '🚌 Sol', value: '**GSX Pro** (payant) — services au sol' },
          { name: '🎨 Livrées', value: '[flightsim.to](https://flightsim.to) — des milliers gratuites' },
        ),
    },
    {
      channel: 'navigation-ifr-vfr',
      embed: new EmbedBuilder()
        .setColor(0x185FA5)
        .setTitle('🗺️ Ressources Navigation')
        .addFields(
          { name: '📋 Plan de vol IFR', value: '[Simbrief](https://www.simbrief.com) — gratuit et complet' },
          { name: '🗺️ Carte', value: '[LittleNavmap](https://albar965.github.io/littlenavmap.html) — visualise et exporte vers MSFS' },
          { name: '📡 Cartes officielles', value: '[Navigraph](https://navigraph.com) — abonnement pour les Jeppesen' },
          { name: '🎙️ Phraséologie', value: '[SKYbrary](https://skybrary.aero) — apprends les bases radio' },
        ),
    },
  ];

  let count = 0;
  for (const { channel: name, embed } of pins) {
    const ch = findChannel(guild, name);
    if (!ch) continue;
    try {
      const msg = await ch.send({ embeds: [embed] });
      await msg.pin();
      count++;
    } catch (_) {}
  }
  return count;
}

// ─── Log de modération ───────────────────────────────────────────────────────

async function modLog(guild, embed) {
  const ch = findChannel(guild, 'modération');
  if (ch) await ch.send({ embeds: [embed] }).catch(() => {});
}

// ─── Commandes ───────────────────────────────────────────────────────────────

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  const args = message.content.trim().split(/\s+/);
  const cmd = args[0].toLowerCase();

  const isAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator);
  const isMod   = message.member?.permissions.has(PermissionFlagsBits.ManageMessages);

  // !pinall
  if (cmd === '!pinall') {
    if (!isAdmin) return message.reply('❌ Réservé aux admins.');
    await message.reply('📌 Épinglage en cours...');
    const count = await pinAllMessages(message.guild);
    return message.reply(`✅ ${count} messages épinglés !`);
  }

  // !bienvenue
  if (cmd === '!bienvenue') {
    if (!isAdmin) return message.reply('❌ Réservé aux admins.');
    const ch = findChannel(message.guild, 'présentations') || message.channel;
    const rulesId = findChannel(message.guild, 'règles')?.id;
    const helpId  = findChannel(message.guild, 'aide-débutants')?.id;
    const addonsId = findChannel(message.guild, 'add-ons-recommandés')?.id;

    const embed = new EmbedBuilder()
      .setColor(0x185FA5)
      .setTitle('✈️ Bienvenue sur MSFS 2024 FR !')
      .setDescription(
        'Le serveur communautaire francophone dédié à **Microsoft Flight Simulator 2024**.\n\n' +
        '**Pour commencer :**\n' +
        `📋 Lis les règles ${rulesId ? `<#${rulesId}>` : ''}\n` +
        `🙋 Présente-toi dans ce salon\n` +
        `❓ Pose tes questions ${helpId ? `<#${helpId}>` : ''}\n` +
        `🧩 Découvre les add-ons ${addonsId ? `<#${addonsId}>` : ''}\n\n` +
        'Bon vol à tous ! 🛫'
      )
      .setTimestamp();
    await ch.send({ embeds: [embed] });
    return message.reply('✅ Message de bienvenue envoyé !');
  }

  // !warn @user [raison]
  if (cmd === '!warn') {
    if (!isMod) return message.reply('❌ Réservé aux modérateurs.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Usage : `!warn @user raison`');
    const reason = args.slice(2).join(' ') || 'Aucune raison fournie';
    const total  = addWarn(target.id, reason, message.author.tag);

    const embed = new EmbedBuilder()
      .setColor(0xBA7517).setTitle('⚠️ Avertissement')
      .addFields(
        { name: 'Membre', value: `${target}`, inline: true },
        { name: 'Modérateur', value: message.author.tag, inline: true },
        { name: 'Raison', value: reason },
        { name: 'Total warns', value: `${total}/3`, inline: true },
      ).setTimestamp();

    await message.channel.send({ embeds: [embed] });
    await modLog(message.guild, embed);
    try { await target.send(`⚠️ Avertissement sur **MSFS 2024 FR**\nRaison : ${reason} (${total}/3)`); } catch (_) {}
    if (total >= 3) await message.channel.send(`⚡ ${target} a 3 warns — action recommandée.`);
    return;
  }

  // !warns @user
  if (cmd === '!warns') {
    if (!isMod) return message.reply('❌ Réservé aux modérateurs.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre.');
    const list = getWarns(target.id);
    if (!list.length) return message.reply(`✅ Aucun warn pour ${target.user.tag}.`);
    const embed = new EmbedBuilder()
      .setColor(0xBA7517)
      .setTitle(`⚠️ Warns de ${target.user.tag} (${list.length}/3)`)
      .setDescription(list.map((w, i) => `**${i+1}.** ${w.date} — ${w.reason} *(${w.modTag})*`).join('\n'));
    return message.channel.send({ embeds: [embed] });
  }

  // !clearwarns @user
  if (cmd === '!clearwarns') {
    if (!isAdmin) return message.reply('❌ Réservé aux admins.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre.');
    warns.delete(target.id);
    return message.reply(`✅ Warns de ${target.user.tag} effacés.`);
  }

  // !mute @user [minutes] [raison]
  if (cmd === '!mute') {
    if (!isMod) return message.reply('❌ Réservé aux modérateurs.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Usage : `!mute @user 10 raison`');
    const minutes = parseInt(args[2]) || 10;
    const reason  = args.slice(3).join(' ') || 'Aucune raison fournie';
    await target.timeout(minutes * 60 * 1000, reason);
    const embed = new EmbedBuilder()
      .setColor(0x888780).setTitle('🔇 Mute')
      .addFields(
        { name: 'Membre', value: `${target}`, inline: true },
        { name: 'Durée', value: `${minutes} min`, inline: true },
        { name: 'Raison', value: reason },
      ).setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return modLog(message.guild, embed);
  }

  // !unmute @user
  if (cmd === '!unmute') {
    if (!isMod) return message.reply('❌ Réservé aux modérateurs.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre.');
    await target.timeout(null);
    return message.reply(`✅ ${target} a été unmute.`);
  }

  // !kick @user [raison]
  if (cmd === '!kick') {
    if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ Permission refusée.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Usage : `!kick @user raison`');
    const reason = args.slice(2).join(' ') || 'Aucune raison fournie';
    try { await target.send(`👢 Expulsé de **MSFS 2024 FR**\nRaison : ${reason}`); } catch (_) {}
    await target.kick(reason);
    const embed = new EmbedBuilder()
      .setColor(0xE24B4A).setTitle('👢 Kick')
      .addFields(
        { name: 'Membre', value: target.user.tag, inline: true },
        { name: 'Modérateur', value: message.author.tag, inline: true },
        { name: 'Raison', value: reason },
      ).setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return modLog(message.guild, embed);
  }

  // !ban @user [raison]
  if (cmd === '!ban') {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Permission refusée.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Usage : `!ban @user raison`');
    const reason = args.slice(2).join(' ') || 'Aucune raison fournie';
    try { await target.send(`🔨 Banni de **MSFS 2024 FR**\nRaison : ${reason}`); } catch (_) {}
    await target.ban({ reason, deleteMessageSeconds: 86400 });
    const embed = new EmbedBuilder()
      .setColor(0xE24B4A).setTitle('🔨 Ban')
      .addFields(
        { name: 'Membre', value: target.user.tag, inline: true },
        { name: 'Modérateur', value: message.author.tag, inline: true },
        { name: 'Raison', value: reason },
      ).setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return modLog(message.guild, embed);
  }

  // !purge [nombre]
  if (cmd === '!purge') {
    if (!isMod) return message.reply('❌ Réservé aux modérateurs.');
    const n = Math.min(parseInt(args[1]) || 10, 100);
    await message.delete();
    const deleted = await message.channel.bulkDelete(n, true);
    const reply = await message.channel.send(`🗑️ ${deleted.size} messages supprimés.`);
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    return;
  }

  // !help
  if (cmd === '!help') {
    const embed = new EmbedBuilder()
      .setColor(0x185FA5)
      .setTitle('✈️ Commandes MSFS 2024 FR')
      .addFields(
        {
          name: '👑 Admin uniquement',
          value:
            '`!pinall` — Épingle les messages utiles dans tous les salons\n' +
            '`!bienvenue` — Envoie le message de bienvenue\n' +
            '`!clearwarns @user` — Efface les warns d\'un membre',
        },
        {
          name: '🛡️ Modération',
          value:
            '`!warn @user [raison]` — Avertir un membre\n' +
            '`!warns @user` — Voir les warns\n' +
            '`!mute @user [min] [raison]` — Mute temporaire\n' +
            '`!unmute @user` — Unmute\n' +
            '`!kick @user [raison]` — Expulser\n' +
            '`!ban @user [raison]` — Bannir\n' +
            '`!purge [nombre]` — Supprimer des messages (max 100)',
        },
      )
      .setFooter({ text: 'MSFS 2024 FR • Bon vol ! ✈️' });
    return message.channel.send({ embeds: [embed] });
  }
});

// ─── Démarrage ───────────────────────────────────────────────────────────────

client.once(Events.ClientReady, () => {
  console.log(`✈️  Bot connecté : ${client.user.tag}`);
});

require("./welcome")(client);

client.login(process.env.DISCORD_TOKEN);
