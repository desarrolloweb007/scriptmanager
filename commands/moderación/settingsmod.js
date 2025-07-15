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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settingsmod')
        .setDescription('Configura el canal de logs de moderación')
        .addChannelOption(opt =>
            opt.setName('canal')
                .setDescription('Canal de logs de moderación')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Solo administradores pueden usar este comando.')],
                ephemeral: true
            });
        }
        const channel = interaction.options.getChannel('canal');
        const guildId = interaction.guild.id;
        const settings = loadSettings();
        if (!settings[guildId]) settings[guildId] = {};
        settings[guildId].logChannel = channel.id;
        saveSettings(settings);

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('🔧 Canal de logs de moderación configurado')
            .addFields(
                { name: 'Canal', value: `<#${channel.id}>`, inline: true },
                { name: 'Configurado por', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(`[SETTINGS] ${interaction.user.tag} configuró el canal de logs de moderación en ${interaction.guild.name}: #${channel.name}`);
    }
}; 