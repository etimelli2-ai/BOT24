const { EmbedBuilder, Events } = require('discord.js');

const msgCount = new Map(); // userId -> count

const GRADES = [
  { count: 0,    role: '🪂 Pilote débutant' },
  { count: 200,  role: '🎓 Pilote confirmé' },
  { count: 1000, role: '🏅 Pilote de ligne' },
];

module.exports = (client) => {
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const count = (msgCount.get(userId) || 0) + 1;
    msgCount.set(userId, count);

    const newGrade = [...GRADES].reverse().find(g => count >= g.count);
    if (!newGrade) return;

    const member = message.member;
    const hasRole = member.roles.cache.some(r => r.name === newGrade.role);
    if (hasRole) return;

    // Retire les anciens grades
    for (const g of GRADES) {
      const r = message.guild.roles.cache.find(r => r.name === g.role);
      if (r) await member.roles.remove(r).catch(() => {});
    }

    // Attribue le nouveau grade
    const newRole = message.guild.roles.cache.find(r => r.name === newGrade.role);
    if (newRole) await member.roles.add(newRole).catch(() => {});

    // Annonce dans #bienvenue
    const channel = message.guild.channels.cache.find(c => c.name.toLowerCase().includes('bienvenue'));
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('🎖️ Nouveau grade !')
        .setDescription(`Félicitations ${member} ! Tu viens d'obtenir le grade **${newGrade.role}** 🎉\nContinue comme ça ! ✈️`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
      await channel.send({ embeds: [embed] }).catch(() => {});
    }

    // DM
    try {
      await member.send(`🎖️ Félicitations ! Tu viens d'obtenir le grade **${newGrade.role}** sur **MSFS 2024 FR** ! ✈️`);
    } catch (_) {}
  });
};
