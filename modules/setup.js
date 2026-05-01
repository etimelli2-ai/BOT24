const { EmbedBuilder, Events, PermissionFlagsBits } = require('discord.js');

function getSalonContent(guild) {
  const ch = (name) => {
    const c = guild.channels.cache.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
    return c ? `<#${c.id}>` : `#${name}`;
  };
  return {
    'règles': new EmbedBuilder().setColor(0xE24B4A).setTitle('📋 Règles du serveur MSFS 2024 FR')
      .setDescription('Bienvenue ! Merci de respecter ces règles.')
      .addFields(
        { name: '1️⃣ Respect', value: 'Respectez tous les membres, quel que soit leur niveau.' },
        { name: '2️⃣ Contenu', value: 'Pas de spam, pub, contenu NSFW ou hors-sujet.' },
        { name: '3️⃣ Piratage', value: 'Aucun lien vers du contenu piraté.' },
        { name: '4️⃣ Modération', value: 'Les décisions des modérateurs sont finales.' },
        { name: '5️⃣ Langue', value: 'Ce serveur est francophone.' },
        { name: '⚠️ Sanctions', value: 'Avertissement → Mute → Kick → Ban' },
      ).setFooter({ text: 'En rejoignant le serveur, vous acceptez ces règles.' }),

    'annonces': new EmbedBuilder().setColor(0xBA7517).setTitle('📣 Annonces — MSFS 2024 FR')
      .setDescription('Salon réservé aux annonces officielles.')
      .addFields(
        { name: '🔔 Notifications', value: 'Active les notifications pour ne rien manquer !' },
        { name: '📡 Liens officiels', value: '[Site officiel](https://www.flightsimulator.com)\n[Forums Asobo](https://forums.flightsimulator.com)' },
      ),

    'présentations': new EmbedBuilder().setColor(0x185FA5).setTitle('✈️ Présentations')
      .setDescription('Présente-toi à la communauté !')
      .addFields({ name: '📝 Template', value: '**Pseudo :** ...\n**Pays :** ...\n**Niveau :** Débutant/Intermédiaire/Expert\n**Avion préféré :** ...\n**Setup :** Clavier/Manette/Joystick/HOTAS' }),

    'liens-utiles': new EmbedBuilder().setColor(0x1D9E75).setTitle('🔗 Liens utiles — MSFS 2024')
      .addFields(
        { name: '🗺️ Plan de vol', value: '[Simbrief](https://www.simbrief.com)\n[LittleNavmap](https://albar965.github.io/littlenavmap.html)' },
        { name: '🧩 Add-ons', value: '[flightsim.to](https://flightsim.to)\n[MSFS Addons Linker](https://github.com/musaffa/MSFS-Addons-Linker)' },
        { name: '🌐 En ligne', value: '[VATSIM](https://vatsim.net)\n[IVAO](https://ivao.aero)\n[Navigraph](https://navigraph.com)' },
        { name: '📡 Météo', value: '[CheckWX](https://www.checkwxapi.com)\n[Windy](https://www.windy.com)' },
        { name: '📚 Formation', value: '[FS Academy](https://www.fsacademy.co.uk)\n[SKYbrary](https://skybrary.aero)' },
        { name: '🐛 Support', value: '[Zendesk Microsoft](https://flightsimulator.zendesk.com)' },
      ),

    'aide-débutants': new EmbedBuilder().setColor(0x1D9E75).setTitle('🆘 Aide Débutants')
      .setDescription('**Aucune question n\'est stupide ici !**')
      .addFields(
        { name: '🛩️ Par où commencer ?', value: '1. Mode Découverte\n2. Leçons Cessna 152\n3. Vol libre VFR\n4. Explorer le réalisme' },
        { name: '🎮 Quel setup ?', value: '• Manette Xbox : bon début\n• Joystick : Thrustmaster T.16000M\n• HOTAS : TCA Airbus' },
      ),

    'tutoriels': new EmbedBuilder().setColor(0x185FA5).setTitle('📚 Tutoriels')
      .addFields(
        { name: '🛫 VFR', value: 'Décoller, atterrir, lire une carte VFR' },
        { name: '🛬 IFR', value: 'Simbrief, SID/STAR, ILS par mauvais temps' },
        { name: '🎙️ ATC', value: 'Phraséologie radio, VATSIM, IVAO' },
      ),

    'bugs-et-crashes': new EmbedBuilder().setColor(0xE24B4A).setTitle('🐛 Bugs & Crashes')
      .addFields(
        { name: '📋 Format signalement', value: '**Problème :** ...\n**Quand :** ...\n**Add-ons actifs :** ...\n**Specs PC :** CPU/GPU/RAM' },
        { name: '🔧 Solutions courantes', value: '• CTD : Désactive les add-ons\n• Freeze : Vérifie ta VRAM\n• Stutters : Baisse les LOD' },
      ),

    'performance-pc': new EmbedBuilder().setColor(0xBA7517).setTitle('⚡ Performance PC')
      .addFields(
        { name: '🖥️ Configs', value: '**Min :** RTX 2070/i7-9700/32Go\n**Reco :** RTX 3080/i9-12900/32Go\n**Ultra :** RTX 4090/i9-13900K/64Go' },
        { name: '🚀 Astuces', value: '• MSFS sur SSD NVMe\n• Ferme tous les autres programmes\n• Mode haute performance Windows' },
      ),

    'add-ons-recommandés': new EmbedBuilder().setColor(0xBA7517).setTitle('⭐ Add-ons Recommandés')
      .addFields(
        { name: '🆓 Gratuits', value: '• FSLTL — Trafic IA\n• FlyByWire A32NX — A320 gratuit\n• MSFS Addons Linker\n• Toolbar Pushback' },
        { name: '💰 Payants', value: '• GSX Pro (~30€)\n• Active Sky (~50€)\n• Navigraph (~10€/mois)\n• PMDG 737 (~75€)\n• Fenix A320 (~55€)' },
        { name: '🔗 Trouver', value: '[flightsim.to](https://flightsim.to)\n[SimMarket](https://secure.simmarket.com)' },
      ),

    'navigation-ifr-vfr': new EmbedBuilder().setColor(0x185FA5).setTitle('🗺️ Navigation IFR & VFR')
      .addFields(
        { name: '🛫 VFR', value: 'Routes visuelles, altitude min 500ft\nOutils : LittleNavmap' },
        { name: '🛬 IFR', value: 'Plan sur Simbrief, SID/STAR, ILS\nCartes Navigraph' },
        { name: '🔧 Outils', value: '[LittleNavmap](https://albar965.github.io/littlenavmap.html)\n[Simbrief](https://www.simbrief.com)\n[SkyVector](https://skyvector.com)' },
      ),

    'procédures-atc': new EmbedBuilder().setColor(0x7F77DD).setTitle('🎙️ Procédures ATC')
      .addFields(
        { name: '📻 Phraséologie', value: '"[Callsign] à [Station], bonjour"\n"Demande clairance IFR pour [dest]"' },
        { name: '🌐 En ligne', value: '[VATSIM](https://vatsim.net)\n[IVAO](https://ivao.aero)\n[LiveATC](https://www.liveatc.net)' },
      ),

    'screenshots': new EmbedBuilder().setColor(0x1D9E75).setTitle('📸 Screenshots')
      .addFields(
        { name: '📷 Conseils', value: '• Ctrl+F11 : Caméra libre\n• Golden hour = meilleurs résultats\n• Désactive le HUD' },
        { name: '🔧 Outils', value: '• Reshade — Post-processing\n• Drone Camera intégrée MSFS' },
      ),

    'vols-en-groupe': new EmbedBuilder().setColor(0x185FA5).setTitle('👥 Vols en Groupe')
      .addFields(
        { name: '🌐 Comment ?', value: '• Multijoueur MSFS natif\n• VATSIM\n• IVAO' },
        { name: '📋 Proposer un vol', value: '**Départ :** ICAO\n**Arrivée :** ICAO\n**Avion :** ...\n**Date/Heure :** ...\n**Niveau :** Débutant/Confirmé' },
      ),

    'suggestions': new EmbedBuilder().setColor(0x1D9E75).setTitle('💡 Suggestions')
      .addFields(
        { name: '📝 Format', value: '**Type :** ...\n**Suggestion :** ...\n**Pourquoi :** ...' },
        { name: '⏳ Traitement', value: '✅ = Acceptée | ❌ = Refusée' },
      ),

    'modération': new EmbedBuilder().setColor(0xE24B4A).setTitle('🛡️ Modération')
      .addFields(
        { name: '🚨 Signaler', value: '**Utilisateur :** @mention\n**Problème :** ...\n**Preuve :** Screenshot' },
        { name: '⚖️ Sanctions', value: '1. Avertissement\n2. Mute\n3. Kick\n4. Ban' },
      ),
  };
}

async function runSetup(guild) {
  const content = getSalonContent(guild);
  let count = 0;
  for (const [keyword, embed] of Object.entries(content)) {
    const channel = guild.channels.cache.find(c =>
      c.name.toLowerCase().includes(keyword.toLowerCase()) && c.isTextBased()
    );
    if (!channel) continue;
    try { await channel.send({ embeds: [embed] }); count++; } catch (_) {}
  }
  return count;
}

function scheduleWeeklyRefresh(client) {
  const now = new Date();
  const next = new Date();
  next.setHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  next.setDate(now.getDate() + daysUntilMonday);
  setTimeout(async () => {
    for (const [, guild] of client.guilds.cache) await runSetup(guild);
    setInterval(async () => {
      for (const [, guild] of client.guilds.cache) await runSetup(guild);
    }, 7 * 24 * 60 * 60 * 1000);
  }, next - now);
}

module.exports = (client) => {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'setup') return;
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
      return interaction.reply({ content: '❌ Réservé aux admins.', ephemeral: true });
    await interaction.reply({ content: '⏳ Setup en cours...', ephemeral: true });
    const count = await runSetup(interaction.guild);
    return interaction.editReply({ content: `✅ ${count} salons remplis !` });
  });

  client.once(Events.ClientReady, () => scheduleWeeklyRefresh(client));
};
