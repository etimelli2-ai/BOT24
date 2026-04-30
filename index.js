const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, Events } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

function findChannel(guild, name) {
  return guild.channels.cache.find(c => c.name === name);
}

// Bienvenue auto
client.on(Events.GuildMemberAdd, async (member) => {
  const channel = findChannel(member.guild, 'bienvenue') || findChannel(member.guild, 'présentations');
  if (!channel) return;
  const embed = new EmbedBuilder()
    .setColor(0x185FA5)
    .setTitle('✈️ Nouveau pilote dans les airs !')
    .setDescription(`Bienvenue sur **MSFS 2024 FR**, ${member} ! 🛫\nLis les règles et présente-toi !`)
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: `Membre #${member.guild.memberCount}` })
    .setTimestamp();
  await channel.send({ embeds: [embed] });
});

// Commandes
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  const args = message.content.trim().split(/\s+/);
  const cmd = args[0].toLowerCase();
  const isMod = message.member?.permissions.has(PermissionFlagsBits.ManageMessages);

  if (cmd === '!warn') {
    if (!isMod) return message.reply('❌ Réservé aux modérateurs.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Usage : `!warn @user raison`');
    const reason = args.slice(2).join(' ') || 'Aucune raison';
    const embed = new EmbedBuilder().setColor(0xBA7517).setTitle('⚠️ Avertissement')
      .addFields({ name: 'Membre', value: `${target}`, inline: true }, { name: 'Raison', value: reason });
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === '!mute') {
    if (!isMod) return message.reply('❌ Réservé aux modérateurs.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Usage : `!mute @user 10 raison`');
    const minutes = parseInt(args[2]) || 10;
    const reason = args.slice(3).join(' ') || 'Aucune raison';
    await target.timeout(minutes * 60 * 1000, reason);
    return message.reply(`🔇 ${target} muté pour ${minutes} min.`);
  }

  if (cmd === '!unmute') {
    if (!isMod) return message.reply('❌ Réservé aux modérateurs.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre.');
    await target.timeout(null);
    return message.reply(`✅ ${target} unmute.`);
  }

  if (cmd === '!kick') {
    if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ Permission refusée.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Usage : `!kick @user raison`');
    const reason = args.slice(2).join(' ') || 'Aucune raison';
    await target.kick(reason);
    return message.reply(`👢 ${target.user.tag} expulsé.`);
  }

  if (cmd === '!ban') {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Permission refusée.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Usage : `!ban @user raison`');
    const reason = args.slice(2).join(' ') || 'Aucune raison';
    await target.ban({ reason });
    return message.reply(`🔨 ${target.user.tag} banni.`);
  }

  if (cmd === '!purge') {
    if (!isMod) return message.reply('❌ Réservé aux modérateurs.');
    const n = Math.min(parseInt(args[1]) || 10, 100);
    await message.delete();
    const deleted = await message.channel.bulkDelete(n, true);
    const reply = await message.channel.send(`🗑️ ${deleted.size} messages supprimés.`);
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    return;
  }

  if (cmd === '!help') {
    const embed = new EmbedBuilder().setColor(0x185FA5).setTitle('✈️ Commandes MSFS 2024 FR')
      .addFields({ name: '🛡️ Modération', value: '`!warn @user raison`\n`!mute @user min raison`\n`!unmute @user`\n`!kick @user raison`\n`!ban @user raison`\n`!purge nombre`' });
    return message.channel.send({ embeds: [embed] });
  }
});

client.once(Events.ClientReady, () => {
  console.log(`✈️ Bot connecté : ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
