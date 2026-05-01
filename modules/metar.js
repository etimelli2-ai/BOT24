const { EmbedBuilder, Events } = require('discord.js');

module.exports = (client) => {
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.channel.name.toLowerCase().includes('metar')) return;

    const icao = message.content.trim().toUpperCase();

    if (!/^[A-Z]{4}$/.test(icao)) {
      const reply = await message.reply('❌ Entre un code ICAO valide (4 lettres). Ex: `LFPG`, `EGLL`, `KJFK`');
      setTimeout(() => { message.delete().catch(() => {}); reply.delete().catch(() => {}); }, 5000);
      return;
    }

    await message.delete().catch(() => {});

    try {
      const res = await fetch(`https://api.checkwx.com/metar/${icao}/decoded`, {
        headers: { 'X-API-Key': process.env.CHECKWX_API_KEY }
      });
      const json = await res.json();

      if (!json.data || json.data.length === 0)
        return message.channel.send({ content: `❌ Aucun METAR trouvé pour **${icao}**.` });

      const d = json.data[0];

      const conditionMap = {
        'CLR': '☀️ Ciel dégagé', 'SKC': '☀️ Ciel dégagé', 'NSC': '☀️ Pas de nuages',
        'FEW': '🌤️ Quelques nuages', 'SCT': '⛅ Nuages épars',
        'BKN': '🌥️ Nuageux (BKN)', 'OVC': '☁️ Ciel couvert',
      };

      // Couleur VFR/MVFR/IFR/LIFR
      let color = 0x1D9E75; let vfrStatus = '✅ VFR';
      const vis = d.visibility?.meters_float || 9999;
      const ceiling = d.ceiling?.feet_agl || 9999;
      if (vis < 1500 || ceiling < 500) { color = 0xE24B4A; vfrStatus = '🔴 LIFR'; }
      else if (vis < 5000 || ceiling < 1000) { color = 0xE24B4A; vfrStatus = '❌ IFR'; }
      else if (vis < 8000 || ceiling < 3000) { color = 0xBA7517; vfrStatus = '⚠️ MVFR'; }

      const clouds = d.clouds?.map(c => {
        const label = conditionMap[c.code] || c.code;
        return c.base_feet_agl ? `${label} à ${c.base_feet_agl} ft` : label;
      }).join('\n') || '☀️ Ciel dégagé';

      let vent = 'Calme';
      if (d.wind) {
        vent = d.wind.degrees ? `${d.wind.degrees}° à ${d.wind.speed_kts} kts` : `Variable à ${d.wind.speed_kts} kts`;
        if (d.wind.gust_kts) vent += ` (rafales ${d.wind.gust_kts} kts)`;
      }

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`📡 METAR — ${icao} ${vfrStatus}`)
        .setDescription(`\`\`\`${d.raw_text || 'N/A'}\`\`\``)
        .addFields(
          { name: '💨 Vent', value: vent, inline: true },
          { name: '👁️ Visibilité', value: d.visibility?.meters ? `${d.visibility.meters} m` : 'N/A', inline: true },
          { name: '☁️ Nuages', value: clouds, inline: false },
          { name: '🌡️ Température', value: d.temperature?.celsius !== undefined ? `${d.temperature.celsius}°C` : 'N/A', inline: true },
          { name: '💧 Point de rosée', value: d.dewpoint?.celsius !== undefined ? `${d.dewpoint.celsius}°C` : 'N/A', inline: true },
          { name: '🔵 QNH', value: d.barometer?.hpa ? `${d.barometer.hpa} hPa` : 'N/A', inline: true },
        )
        .setFooter({ text: `Demandé par ${message.author.tag} • CheckWX` })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error('METAR error:', err);
      return message.channel.send({ content: '❌ Erreur lors de la récupération du METAR.' });
    }
  });
};
