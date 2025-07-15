const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

const configPath = path.join(__dirname, '../../data/clearconfig.json');
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

module.exports = {
    name: 'pclear',
    legacy: true,
    data: { name: 'pclear' },
    async executeLegacy(message, args) {
        const prefix = await getPrefix(message.guild.id);
        if (!message.content.startsWith(prefix + 'pclear')) return;

        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ Solo administradores pueden usar este comando.')
                ]
            });
        }

        const rolId = args[0];
        if (!rolId || !/^\d{17,20}$/.test(rolId)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ Debes indicar un ID de rol válido.')
                ]
            });
        }

        // Guardar configuración
        try {
            let config = {};
            try {
                const data = await fs.readFile(configPath, 'utf8');
                config = JSON.parse(data);
            } catch {}
            config[message.guild.id] = rolId;
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        } catch (err) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ No se pudo guardar la configuración.')
                ]
            });
        }

        await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('🔒 Rol autorizado para clear')
                    .setDescription(`El rol <@&${rolId}> ahora puede usar el comando \`${prefix}clear\`.`)
                    .setFooter({ text: `Configurado por ${message.author.tag}` })
                    .setTimestamp()
            ]
        });
    }
}; 