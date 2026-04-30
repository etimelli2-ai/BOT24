const { EmbedBuilder, Events } = require('discord.js');

function findChannel(guild, name) {
  return guild.channels.cache.find(c => c.name === name);
}

module.exports = (client) => {
  client.on(Events.GuildMemberAdd, async (member) => {
    const channel = findChannel(member.guild, 'bienvenue');
    if (!channel) return;

    const rulesChannel  = findChannel(member.guild, 'règles');
    const helpChannel   = findChannel(member.guild, 'aide-débutants');
    const addonsChannel = findChannel(member.guild, 'add-ons-recommandés');

    const embed = new EmbedBuilder()
      .setColor(0x185FA5)
      .setTitle('✈️ Nouveau pilote dans les airs !')
      .setDescription(
        `Bienvenue sur **MSFS 2024 FR**, ${member} ! 🛫\n\n` +
        `**Pour commencer :**\n` +
        `📋 Lis les règles ${rulesChannel  ? `<#${rulesChannel.id}>`  : 'dans #règles'}\n` +
        `❓ Pose tes questions ${helpChannel ? `<#${helpChannel.id}>` : 'dans #aide-débutants'}\n` +
        `🧩 Découvre les add-ons ${addonsChannel ? `<#${addonsChannel.id}>` : 'dans #add-ons-recommandés'}\n\n` +
        `Bon vol ! ✈️`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Membre #${member.guild.memberCount}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  });
};
