const {
  EmbedBuilder, Events, ChannelType, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

async function createTicket(interaction, type) {
  const guild = interaction.guild;
  const user = interaction.user;
  const ticketName = `ticket-${user.username}-${Date.now().toString().slice(-4)}`;

  const category = guild.channels.cache.find(c =>
    c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('ticket')
  );
  const modRole = guild.roles.cache.find(r =>
    r.name.toLowerCase().includes('modérateur') || r.name.toLowerCase().includes('moderateur')
  );

  const permOverwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ];
  if (modRole) permOverwrites.push({
    id: modRole.id,
    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
  });

  const ticketChannel = await guild.channels.create({
    name: ticketName,
    type: ChannelType.GuildText,
    parent: category?.id,
    permissionOverwrites: permOverwrites,
  });

  const labels = {
    aide:        { title: '🔧 Ticket — Aide Technique', color: 0x185FA5, desc: 'Décris ton problème (specs PC, add-ons, message d\'erreur).' },
    signalement: { title: '🚨 Ticket — Signalement',   color: 0xE24B4A, desc: 'Mentionne le membre concerné et décris le problème. Screenshot si possible.' },
    role:        { title: '🎭 Ticket — Demande de Rôle', color: 0x7F77DD, desc: 'Quel rôle souhaites-tu et pourquoi ?' },
  };
  const info = labels[type];

  const embed = new EmbedBuilder()
    .setColor(info.color)
    .setTitle(info.title)
    .setDescription(`Bonjour ${user}, ${info.desc}\n\nUn modérateur te répondra dès que possible.`)
    .setFooter({ text: 'Clique sur 🔒 Fermer pour clore ce ticket.' })
    .setTimestamp();

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_close_${ticketChannel.id}`)
      .setLabel('🔒 Fermer le ticket')
      .setStyle(ButtonStyle.Danger),
  );

  await ticketChannel.send({ content: `${user} ${modRole ?? ''}`, embeds: [embed], components: [closeRow] });
  return ticketChannel;
}

module.exports = (client) => {
  // Setup de la catégorie tickets
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup-tickets') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
        return interaction.reply({ content: '❌ Réservé aux admins.', ephemeral: true });

      await interaction.reply({ content: '⏳ Création des tickets...', ephemeral: true });

      const guild = interaction.guild;
      let category = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('ticket')
      );
      if (!category) {
        category = await guild.channels.create({
          name: '🎫 TICKETS',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }],
        });
      }

      let ticketChannel = guild.channels.cache.find(c => c.name.toLowerCase().includes('ouvrir-ticket'));
      if (!ticketChannel) {
        ticketChannel = await guild.channels.create({
          name: '🎫 ouvrir-un-ticket',
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
          ],
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x185FA5)
        .setTitle('🎫 Support — MSFS 2024 FR')
        .setDescription('Tu as besoin d\'aide ? Clique sur le bouton correspondant !')
        .addFields(
          { name: '🔧 Aide technique', value: 'Problème MSFS, bug, crash, performances...' },
          { name: '🚨 Signalement', value: 'Signaler un membre qui ne respecte pas les règles.' },
          { name: '🎭 Demande de rôle', value: 'Demander un rôle spécifique.' },
        )
        .setFooter({ text: 'Un modérateur vous répondra dès que possible.' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_aide').setLabel('🔧 Aide technique').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ticket_signalement').setLabel('🚨 Signalement').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_role').setLabel('🎭 Demande de rôle').setStyle(ButtonStyle.Secondary),
      );

      await ticketChannel.send({ embeds: [embed], components: [row] });
      return interaction.editReply({ content: '✅ Catégorie tickets créée !' });
    }

    // Boutons tickets
    if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
      const type = interaction.customId.replace('ticket_', '');

      if (['aide', 'signalement', 'role'].includes(type)) {
        await interaction.deferReply({ ephemeral: true });
        const ticketChannel = await createTicket(interaction, type);
        return interaction.editReply({ content: `✅ Ton ticket : ${ticketChannel}` });
      }

      if (type.startsWith('close_')) {
        const isMod = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
        const isOwner = interaction.channel.name.includes(interaction.user.username);
        if (!isMod && !isOwner)
          return interaction.reply({ content: '❌ Seul le créateur ou un modérateur peut fermer.', ephemeral: true });
        await interaction.reply({ content: '🔒 Ticket fermé. Suppression dans 5 secondes.' });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      }
    }
  });
};
