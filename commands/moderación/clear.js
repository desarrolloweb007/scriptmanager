const { EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

const configPath = path.join(__dirname, '../../data/clearconfig.json');
const prefixesPath = path.join(__dirname, '../../data/prefixes.json');

async function getAuthorizedRoleId(guildId) {
    try {
        const data = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(data);
        return config[guildId];
    } catch {
        return null;
    }
}

async function getPrefix(guildId) {
    try {
        const data = await fs.readFile(prefixesPath, 'utf8');
        const prefixes = JSON.parse(data);
        return prefixes[guildId] || '!';
    } catch {
        return '!';
    }
}

module.exports = {
    name: 'clear',
    async execute(message, args) {
        const prefix = await getPrefix(message.guild.id);
        if (!message.content.startsWith(prefix + 'clear')) return;

        // Verifica cantidad
        const cantidad = parseInt(args[0]);
        if (isNaN(cantidad) || cantidad < 1 || cantidad > 100) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ Debes indicar una cantidad válida entre 1 y 100.')
                ]
            });
        }

        // Verifica rol autorizado
        const authorizedRoleId = await getAuthorizedRoleId(message.guild.id);
        if (!authorizedRoleId || !message.member.roles.cache.has(authorizedRoleId)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ No tienes permiso para usar este comando.')
                ]
            });
        }

        // Canal destino
        let targetChannel = message.mentions.channels.first() || message.channel;
        if (targetChannel.type !== ChannelType.GuildText) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ Solo puedes limpiar mensajes en canales de texto.')
                ]
            });
        }

        // Eliminar mensajes
        try {
            const messages = await targetChannel.bulkDelete(cantidad, true);
            await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('🧹 Mensajes eliminados')
                        .setDescription(`Se han eliminado **${messages.size}** mensajes en <#${targetChannel.id}>.`)
                        .setFooter({ text: `Solicitado por ${message.author.tag}` })
                        .setTimestamp()
                ]
            });
        } catch (err) {
            await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ No se pudieron eliminar los mensajes. ¿Tengo permisos suficientes?')
                ]
            });
        }
    }
}; 