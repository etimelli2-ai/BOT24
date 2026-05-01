const { EmbedBuilder, Events, PermissionFlagsBits } = require('discord.js');

module.exports = (client) => {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, member } = interaction;
    const isMod = member.permissions.has(PermissionFlagsBits.ManageMessages);

    if (commandName === 'warn') {
      if (!isMod) return interaction.reply({ content: '❌ Réservé aux modérateurs.', ephemeral: true });
      const target = interaction.options.getMember('membre');
      const reason = interaction.options.getString('raison') || 'Aucune raison';
      const embed = new EmbedBuilder().setColor(0xBA7517).setTitle('⚠️ Avertissement')
        .addFields({ name: 'Membre', value: `${target}`, inline: true }, { name: 'Raison', value: reason });
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'mute') {
      if (!isMod) return interaction.reply({ content: '❌ Réservé aux modérateurs.', ephemeral: true });
      const target = interaction.options.getMember('membre');
      const minutes = interaction.options.getInteger('minutes') || 10;
      const reason = interaction.options.getString('raison') || 'Aucune raison';
      await target.timeout(minutes * 60 * 1000, reason);
      return interaction.reply({ content: `🔇 ${target} muté pour ${minutes} min.`, ephemeral: true });
    }

    if (commandName === 'unmute') {
      if (!isMod) return interaction.reply({ content: '❌ Réservé aux modérateurs.', ephemeral: true });
      const target = interaction.options.getMember('membre');
      await target.timeout(null);
      return interaction.reply({ content: `✅ ${target} unmute.`, ephemeral: true });
    }

    if (commandName === 'kick') {
      if (!member.permissions.has(PermissionFlagsBits.KickMembers))
        return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
      const target = interaction.options.getMember('membre');
      const reason = interaction.options.getString('raison') || 'Aucune raison';
      await target.kick(reason);
      return interaction.reply({ content: `👢 ${target.user.tag} expulsé.`, ephemeral: true });
    }

    if (commandName === 'ban') {
      if (!member.permissions.has(PermissionFlagsBits.BanMembers))
        return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
      const target = interaction.options.getMember('membre');
      const reason = interaction.options.getString('raison') || 'Aucune raison';
      await target.ban({ reason });
      return interaction.reply({ content: `🔨 ${target.user.tag} banni.`, ephemeral: true });
    }

    if (commandName === 'purge') {
      if (!isMod) return interaction.reply({ content: '❌ Réservé aux modérateurs.', ephemeral: true });
      const n = Math.min(interaction.options.getInteger('nombre'), 100);
      await interaction.deferReply({ ephemeral: true });
      const deleted = await interaction.channel.bulkDelete(n, true);
      return interaction.editReply({ content: `🗑️ ${deleted.size} messages supprimés.` });
    }

    if (commandName === 'help') {
      const embed = new EmbedBuilder().setColor(0x185FA5).setTitle('✈️ Commandes MSFS 2024 FR')
        .addFields(
          { name: '👑 Admin', value: '`/setup` `/setup-tickets`' },
          { name: '🌐 Info', value: '`/events` — Events IVAO & VATSIM en cours' },
          { name: '🛡️ Modération', value: '`/warn` `/mute` `/unmute` `/kick` `/ban` `/purge`' },
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  });
};
