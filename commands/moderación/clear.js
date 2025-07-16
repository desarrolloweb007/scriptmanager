const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

const configPath = path.join(__dirname, '../../data/clearconfig.json');

async function getAuthorizedRoleId(guildId) {
    try {
        const data = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(data);
        return config[guildId];
    } catch {
        return null;
    }
}

module.exports = {
    name: 'clear',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Elimina mensajes del canal')
        .addIntegerOption(opt =>
            opt.setName('cantidad')
                .setDescription('Cantidad de mensajes a eliminar (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addChannelOption(opt =>
            opt.setName('canal')
                .setDescription('Canal donde eliminar mensajes (opcional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Verificar permisos
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para eliminar mensajes.')],
                ephemeral: true
            });
        }

        const cantidad = interaction.options.getInteger('cantidad');
        const targetChannel = interaction.options.getChannel('canal') || interaction.channel;

        // Verificar que sea un canal de texto
        if (targetChannel.type !== ChannelType.GuildText) {
            return await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Solo puedes eliminar mensajes en canales de texto.')],
                ephemeral: true
            });
        }

        // Verificar permisos en el canal
        if (!targetChannel.permissionsFor(interaction.member).has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para eliminar mensajes en este canal.')],
                ephemeral: true
            });
        }

        // Verificar rol autorizado (si está configurado)
        const authorizedRoleId = await getAuthorizedRoleId(interaction.guild.id);
        if (authorizedRoleId && !interaction.member.roles.cache.has(authorizedRoleId)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes el rol autorizado para usar este comando.')],
                ephemeral: true
            });
        }

        try {
            const messages = await targetChannel.bulkDelete(cantidad, true);
            
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🧹 Mensajes eliminados')
                .setDescription(`Se han eliminado **${messages.size}** mensajes en ${targetChannel}.`)
                .addFields(
                    { name: '📊 Cantidad', value: `${messages.size} mensajes`, inline: true },
                    { name: '📍 Canal', value: `${targetChannel}`, inline: true },
                    { name: '👤 Moderador', value: `${interaction.user}`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            console.log(`[CLEAR] ${interaction.user.tag} eliminó ${messages.size} mensajes en ${targetChannel.name} (${interaction.guild.name})`);
            
        } catch (error) {
            console.error('Error al eliminar mensajes:', error);
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No se pudieron eliminar los mensajes. Verifica que tengo permisos suficientes y que los mensajes no sean más antiguos de 14 días.')],
                ephemeral: true
            });
        }
    },

    async executeLegacy(message, args) {
        try {
        try {
        // Verificar permisos
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para eliminar mensajes.')]
            });
        }

        // Verificar argumentos
        if (args.length < 1) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Uso correcto: `[prefijo]clear <cantidad> [#canal]`\nEjemplo: `!clear 10` o `!clear 5 #general`')]
            });
        }

        // Verificar cantidad
        const cantidad = parseInt(args[0]);
        if (isNaN(cantidad) || cantidad < 1 || cantidad > 100) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Debes indicar una cantidad válida entre 1 y 100.')]
            });
        }

        // Verificar rol autorizado (si está configurado)
        const authorizedRoleId = await getAuthorizedRoleId(message.guild.id);
        if (authorizedRoleId && !message.member.roles.cache.has(authorizedRoleId)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes el rol autorizado para usar este comando.')]
            });
        }

        // Canal destino
        let targetChannel = message.mentions.channels.first() || message.channel;
        if (targetChannel.type !== ChannelType.GuildText) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Solo puedes eliminar mensajes en canales de texto.')]
            });
        }

        // Verificar permisos en el canal
        if (!targetChannel.permissionsFor(message.member).has(PermissionFlagsBits.ManageMessages)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para eliminar mensajes en este canal.')]
            });
        }

        try {
            const messages = await targetChannel.bulkDelete(cantidad, true);
            
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🧹 Mensajes eliminados')
                .setDescription(`Se han eliminado **${messages.size}** mensajes en ${targetChannel}.`)
                .addFields(
                    { name: '📊 Cantidad', value: `${messages.size} mensajes`, inline: true },
                    { name: '📍 Canal', value: `${targetChannel}`, inline: true },
                    { name: '👤 Moderador', value: `${message.author}`, inline: true }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            
            console.log(`[CLEAR] ${message.author.tag} eliminó ${messages.size} mensajes en ${targetChannel.name} (${message.guild.name})`);
            
        } catch (error) {
            console.error('Error al eliminar mensajes:', error);
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No se pudieron eliminar los mensajes. Verifica que tengo permisos suficientes y que los mensajes no sean más antiguos de 14 días.')]
            });
        }
    }
}; 