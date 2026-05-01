const { SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('setup').setDescription('Remplit tous les salons (Admin)'),
  new SlashCommandBuilder().setName('setup-tickets').setDescription('Crée la catégorie tickets (Admin)'),
  new SlashCommandBuilder().setName('events').setDescription('Affiche les events IVAO et VATSIM en cours'),

  new SlashCommandBuilder().setName('warn').setDescription('Avertir un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('La raison').setRequired(false)),

  new SlashCommandBuilder().setName('mute').setDescription('Mute un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Durée en minutes').setRequired(false))
    .addStringOption(o => o.setName('raison').setDescription('La raison').setRequired(false)),

  new SlashCommandBuilder().setName('unmute').setDescription('Unmute un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true)),

  new SlashCommandBuilder().setName('kick').setDescription('Expulser un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('La raison').setRequired(false)),

  new SlashCommandBuilder().setName('ban').setDescription('Bannir un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('La raison').setRequired(false)),

  new SlashCommandBuilder().setName('purge').setDescription('Supprimer des messages')
    .addIntegerOption(o => o.setName('nombre').setDescription('Nombre (max 100)').setRequired(true)),

  new SlashCommandBuilder().setName('help').setDescription('Afficher les commandes'),
].map(c => c.toJSON());

function getCommands() { return commands; }
module.exports = { getCommands };
