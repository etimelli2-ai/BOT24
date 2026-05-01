const {
  EmbedBuilder, Events,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');

const ROLE_NAME = '🪂 Pilote débutant';
const birthdays = new Map(); // userId -> { day, month }

function findChannel(guild, keyword) {
  return guild.channels.cache.find(c => c.name.toLowerCase().includes(keyword));
}

// ── Vérification anniversaires chaque jour à 9h ─────────────────────────────
function scheduleBirthdayCheck(client) {
  const now = new Date();
  const next = new Date();
  next.setHours(9, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  setTimeout(() => {
    checkBirthdays(client);
    setInterval(() => checkBirthdays(client), 24 * 60 * 60 * 1000);
  }, next - now);
}

async function checkBirthdays(client) {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  for (const [, guild] of client.guilds.cache) {
    const channel = findChannel(guild, 'birthday') || findChannel(guild, 'anniversaire');
    if (!channel) continue;
    for (const [userId, data] of birthdays.entries()) {
      if (data.day === day && data.month === month) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) continue;
        const embed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle('🎂 Joyeux Anniversaire !')
          .setDescription(`Toute l'équipe de **MSFS 2024 FR** souhaite un joyeux anniversaire à ${member} ! 🎉✈️`)
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();
        await channel.send({ content: `${member} 🎂`, embeds: [embed] }).catch(() => {});
      }
    }
  }
}

module.exports = (client) => {
  // ── Message de bienvenue + bouton règles ──────────────────────────────────
  client.on(Events.GuildMemberAdd, async (member) => {
    const channel = findChannel(member.guild, 'bienvenue');
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x185FA5)
      .setTitle('✈️ Nouveau pilote détecté !')
      .setDescription(
        `Bienvenue sur **MSFS 2024 FR**, ${member} ! 🛫\n\n` +
        `Avant de décoller :\n\n` +
        `**1.** Respecter tous les membres\n` +
        `**2.** Pas de spam, pub ou contenu NSFW\n` +
        `**3.** Rester dans le sujet de chaque salon\n` +
        `**4.** Pas de piratage\n` +
        `**5.** Écouter les modérateurs\n\n` +
        `👇 Accepte les règles et entre ta date de naissance pour accéder au serveur !`
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: `Membre #${member.guild.memberCount}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_rules_${member.id}`)
        .setLabel('✅ J\'accepte les règles')
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ content: `${member}`, embeds: [embed], components: [row] });
  });

  // ── Bouton règles → modal anniversaire ────────────────────────────────────
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton() && interaction.customId.startsWith('accept_rules_')) {
      const memberId = interaction.customId.split('_')[2];
      if (interaction.user.id !== memberId)
        return interaction.reply({ content: '❌ Ce bouton n\'est pas pour toi !', ephemeral: true });

      const modal = new ModalBuilder()
        .setCustomId(`birthday_modal_${memberId}`)
        .setTitle('🎂 Date de naissance');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('birth_day').setLabel('Jour (1-31)')
            .setStyle(TextInputStyle.Short).setPlaceholder('Ex: 15').setMinLength(1).setMaxLength(2).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('birth_month').setLabel('Mois (1-12)')
            .setStyle(TextInputStyle.Short).setPlaceholder('Ex: 6').setMinLength(1).setMaxLength(2).setRequired(true)
        ),
      );

      return interaction.showModal(modal);
    }

    // ── Modal soumis ────────────────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId.startsWith('birthday_modal_')) {
      const memberId = interaction.customId.split('_')[2];
      const day = parseInt(interaction.fields.getTextInputValue('birth_day'));
      const month = parseInt(interaction.fields.getTextInputValue('birth_month'));

      if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12)
        return interaction.reply({ content: '❌ Date invalide. Jour 1-31, mois 1-12.', ephemeral: true });

      birthdays.set(memberId, { day, month });

      const member = await interaction.guild.members.fetch(memberId).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });

      const role = interaction.guild.roles.cache.find(r => r.name === ROLE_NAME);
      if (role) await member.roles.add(role).catch(() => {});

      await interaction.message.delete().catch(() => {});

      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x1D9E75)
        .setTitle('🛫 Bienvenue à bord !')
        .setDescription(`${member} a rejoint l'équipage ! 🎉\nBon vol ! ✈️`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ content: `✅ Date enregistrée ! Tu recevras un message le jour de ton anniversaire 🎂`, ephemeral: true });
      await interaction.channel.send({ embeds: [welcomeEmbed] });
    }
  });

  scheduleBirthdayCheck(client);
};
