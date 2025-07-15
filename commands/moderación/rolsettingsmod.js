const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../../data/modsettings.json');

function loadSettings() {
    if (!fs.existsSync(settingsPath)) return {};
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

function saveSettings(settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

const comandosModeracion = [
    'warn', 'warnings', 'mute', 'unmute', 'kick', 'ban'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolsettingsmod')
        .setDescription('Configura qué rol puede usar un comando de moderación')
        .addRoleOption(opt =>
            opt.setName('rol')
                .setDescription('Rol de moderación')
                .setRequired(false))
        .addStringOption(opt =>
            opt.setName('rolid')
                .setDescription('ID del rol de moderación (opcional si no seleccionas rol)')
                .setRequired(false))
        .addStringOption(opt =>
            opt.setName('comando')
                .setDescription('Comando de moderación permitido')
                .setRequired(true)
                .addChoices(...comandosModeracion.map(c => ({ name: c, value: c }))))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Solo administradores pueden usar este comando.')],
                ephemeral: true
            });
        }
        const role = interaction.options.getRole('rol');
        const roleId = interaction.options.getString('rolid');
        const command = interaction.options.getString('comando');
        const guildId = interaction.guild.id;

        let finalRoleId = role ? role.id : roleId;
        if (!finalRoleId) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Debes seleccionar un rol o proporcionar un ID de rol.')],
                ephemeral: true
            });
        }

        // Guardar en settings
        const settings = loadSettings();
        if (!settings[guildId]) settings[guildId] = {};
        if (!settings[guildId].modRoles) settings[guildId].modRoles = {};
        if (!settings[guildId].modRoles[command]) settings[guildId].modRoles[command] = [];
        if (!settings[guildId].modRoles[command].includes(finalRoleId)) {
            settings[guildId].modRoles[command].push(finalRoleId);
        }
        saveSettings(settings);

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('🔧 Permiso de comando de moderación configurado')
            .addFields(
                { name: 'Rol', value: `<@&${finalRoleId}>`, inline: true },
                { name: 'Comando', value: `/${command}`, inline: true },
                { name: 'Configurado por', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(`[SETTINGS] ${interaction.user.tag} configuró el rol <@&${finalRoleId}> para usar /${command} en ${interaction.guild.name}`);
    }
}; 