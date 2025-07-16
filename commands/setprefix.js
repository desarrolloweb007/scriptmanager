const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const prefixManager = require('../utils/prefixManager');

module.exports = {
    name: 'setprefix',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Cambia el prefijo de comandos para este servidor')
        .addStringOption(opt =>
            opt.setName('nuevo').setDescription('Nuevo prefijo').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Solo administradores pueden cambiar el prefijo.', ephemeral: true });
        }
        const nuevo = interaction.options.getString('nuevo');
        if (!nuevo || nuevo.length > 5) {
            return interaction.reply({ content: '❌ Prefijo inválido. Usa máximo 5 caracteres.', ephemeral: true });
        }
        prefixManager.setPrefix(interaction.guild.id, nuevo);
        return interaction.reply({ content: `✅ Prefijo actualizado a: \`${nuevo}\``, ephemeral: true });
    },
    async executeLegacy(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Solo administradores pueden cambiar el prefijo.');
        }
        const nuevo = args[0];
        if (!nuevo || nuevo.length > 5) {
            return message.reply('❌ Prefijo inválido. Usa máximo 5 caracteres.');
        }
        prefixManager.setPrefix(message.guild.id, nuevo);
        return message.reply(`✅ Prefijo actualizado a: \`${nuevo}\``);
    }
}; 