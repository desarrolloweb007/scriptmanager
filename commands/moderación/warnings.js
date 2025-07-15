const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsPath)) return {};
    return JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Muestra las advertencias de un usuario')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Usuario a consultar')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const guildId = interaction.guild.id;

        // Verificar permisos
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para ver advertencias.')],
                ephemeral: true
            });
        }

        const warnings = loadWarnings();
        const userWarnings = warnings[guildId]?.[user.id] || [];

        if (userWarnings.length === 0) {
            return await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(`✅ <@${user.id}> no tiene advertencias.`)],
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle(`⚠️ Advertencias de ${user.tag}`)
            .setThumbnail(user.displayAvatarURL())
            .setDescription(`Total: **${userWarnings.length}**`)
            .setTimestamp();

        userWarnings.slice(-10).reverse().forEach((warn, i) => {
            embed.addFields({
                name: `Advertencia #${userWarnings.length - i}`,
                value: `**Razón:** ${warn.reason}\n**Moderador:** <@${warn.moderator}>\n**Fecha:** <t:${Math.floor(new Date(warn.date).getTime()/1000)}:f>`
            });
        });

        await interaction.reply({ embeds: [embed] });
        console.log(`[WARNINGS] ${interaction.user.tag} consultó advertencias de ${user.tag} en ${interaction.guild.name}`);
    }
}; 