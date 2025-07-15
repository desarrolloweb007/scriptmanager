const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

const warningsPath = path.join(__dirname, '../../data/warnings.json');
const prefixesPath = path.join(__dirname, '../../data/prefixes.json');

async function getPrefix(guildId) {
    try {
        const data = await fs.readFile(prefixesPath, 'utf8');
        const prefixes = JSON.parse(data);
        return prefixes[guildId] || '!';
    } catch {
        return '!';
    }
}

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
    data: { name: 'warnings' },
    async executeLegacy(message, args) {
        const prefix = await getPrefix(message.guild.id);
        if (!message.content.startsWith(prefix + 'warnings')) return;

        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para ver advertencias.')]
            });
        }

        if (args.length < 1) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Uso correcto: `[prefijo]warnings @usuario`')]
            });
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Debes mencionar a un usuario válido.')]
            });
        }

        const guildId = message.guild.id;
        const warnings = await loadWarnings();
        const userWarnings = warnings[guildId]?.[user.id] || [];

        if (userWarnings.length === 0) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(`✅ <@${user.id}> no tiene advertencias.`)]
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
    }
}; 