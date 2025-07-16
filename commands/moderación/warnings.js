const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

const warningsPath = path.join(__dirname, '../../data/warnings.json');

async function loadWarnings() {
    try {
        const data = await fs.readFile(warningsPath, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

module.exports = {
    name: 'warnings',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Muestra las advertencias de un usuario')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Usuario del cual ver advertencias')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        // Verificar permisos
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para ver advertencias.')],
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('usuario');
        const guildId = interaction.guild.id;
        
        try {
            const warnings = await loadWarnings();
            const userWarnings = warnings[guildId]?.[user.id] || [];

            if (userWarnings.length === 0) {
                return await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('Green')
                        .setDescription(`✅ ${user} no tiene advertencias.`)]
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
            
        } catch (error) {
            console.error('Error al cargar advertencias:', error);
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Error al cargar las advertencias.')],
                ephemeral: true
            });
        }
    },

    async executeLegacy(message, args) {
        // Verificar permisos
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para ver advertencias.')]
            });
        }

        // Verificar argumentos
        if (args.length < 1) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Uso correcto: `[prefijo]warnings @usuario`')]
            });
        }

        const user = message.mentions.users.first();
        if (!user) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Debes mencionar a un usuario válido.')]
            });
        }

        const guildId = message.guild.id;
        
        try {
            const warnings = await loadWarnings();
            const userWarnings = warnings[guildId]?.[user.id] || [];

            if (userWarnings.length === 0) {
                return await message.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('Green')
                        .setDescription(`✅ ${user} no tiene advertencias.`)]
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

            await message.reply({ embeds: [embed] });
            console.log(`[WARNINGS] ${message.author.tag} consultó advertencias de ${user.tag} en ${message.guild.name}`);
            
        } catch (error) {
            console.error('Error al cargar advertencias:', error);
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Error al cargar las advertencias.')]
            });
        }
    }
}; 