// antiRaidCommands.js
// Registro y manejo de slash commands para el sistema anti-raid
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AntiRaidConfig = require('./antiRaidConfig');

// --- Definición de comandos slash ---
const antiRaidCommands = [
    new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('Comandos de configuración y control del sistema anti-raid')
        .addSubcommand(sub =>
            sub.setName('activar').setDescription('Activa el sistema anti-raid'))
        .addSubcommand(sub =>
            sub.setName('desactivar').setDescription('Desactiva el sistema anti-raid'))
        .addSubcommand(sub =>
            sub.setName('estado').setDescription('Muestra la configuración actual'))
        // ...agrega aquí más subcomandos según tus necesidades...
];

// --- Utilidad para comprobar permisos de configuración ---
function hasAntiRaidPerms(member, guildId) {
    const config = AntiRaidConfig.getGuildConfig(guildId);
    if (!config.permsRole) return member.permissions.has(PermissionFlagsBits.Administrator);
    return member.roles.cache.has(config.permsRole) || member.permissions.has(PermissionFlagsBits.Administrator);
}

// --- Handler principal para slash y legacy ---
async function handleAntiRaidCommand(interaction) {
    const guildId = interaction.guild.id;
    const member = interaction.member;
    const config = AntiRaidConfig.getGuildConfig(guildId);
    // Permisos
    if (!hasAntiRaidPerms(member, guildId)) {
        return interaction.reply({ content: '❌ No tienes permisos para usar los comandos de configuración anti-raid.', ephemeral: true });
    }
    // Subcomando principal
    const sub = interaction.options.getSubcommand?.() || interaction.options.getSubcommandGroup?.() || null;
    if (sub === 'activar') {
        AntiRaidConfig.updateGuildConfig(guildId, { enabled: true });
        return interaction.reply('✅ El sistema anti-raid ha sido **activado**.');
    }
    if (sub === 'desactivar') {
        AntiRaidConfig.updateGuildConfig(guildId, { enabled: false });
        return interaction.reply('⛔ El sistema anti-raid ha sido **desactivado**.');
    }
    if (sub === 'estado') {
        const estado = config.enabled ? '🟢 Activado' : '🔴 Desactivado';
        return interaction.reply(`**Estado Anti-Raid:**\n${estado}`);
    }
    // ...agrega aquí la lógica de otros subcomandos...
}

// --- Exportaciones principales ---
module.exports = {
    antiRaidCommands, // Array de SlashCommandBuilder para registro
    handleAntiRaidCommand, // Handler principal para slash y legacy
    hasAntiRaidPerms // Utilidad de permisos
}; 