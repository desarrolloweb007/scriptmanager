const { EmbedBuilder, PermissionFlagsBits, ChannelType, SlashCommandBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'verifymsg',
    description: 'Crea un mensaje de verificación con reacciones para asignar roles',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('verifymsg')
        .setDescription('Comando verifymsg'),
    async execute(interaction) {
        await interaction.reply({ 
            content: 'Comando en desarrollo. Usa la versión legacy por ahora.', 
            ephemeral: true 
        });
    },
    
    async executeLegacy(message, args) {
        try {
        try {
        // Verificar prefijo dinámico
        const prefixManager = require('../utils/prefixManager');
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        if (!message.content.startsWith(currentPrefix + 'verifymsg')) {
            return;
        }

        // Verificar permisos usando pverify
        const pverifyCommand = require('./pverify.js');
        const hasPermission = await pverifyCommand.checkPermission(message);
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para usar este comando.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Contacta a un administrador para configurar los permisos con `!pverify <rol_id>`',
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Parsear argumentos usando | como separador
        const fullCommand = message.content.slice(currentPrefix.length + 'verifymsg'.length).trim();
        const parts = fullCommand.split('|').map(part => part.trim()).filter(Boolean);

        let categoryArg, channelArg, title, description, roleEmojiPairs;
        if (parts.length >= 6) {
            // !verifymsg categoria canal | título | mensaje | rolID1 | emoji1 ...
            categoryArg = parts[0];
            channelArg = parts[1];
            title = parts[2];
            description = parts[3];
            roleEmojiPairs = parts.slice(4);
        } else if (parts.length >= 4) {
            // !verifymsg | título | mensaje | rolID1 | emoji1 ... (usar por defecto)
            categoryArg = 'verification';
            channelArg = 'verify';
            title = parts[0];
            description = parts[1];
            roleEmojiPairs = parts.slice(2);
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}verifymsg [categoria] [canal] | título | mensaje | rolID1 | emoji1 | [rolID2 | emoji2]...\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}verifymsg | Verificación | Reacciona para obtener roles | 123456789012345678 | ✅\` - Por defecto (verification/verify)` ,
                        `\`${currentPrefix}verifymsg Juegos Roles | Juegos | Selecciona tus juegos | 111111111111111111 | 🎮\` - Especificando categoría y canal`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: [
                        '• Puedes omitir la categoría y canal para usar los valores por defecto',
                        '• Si la categoría o canal no existen, se crearán automáticamente',
                        '• Puedes usar nombre, mención o ID para categoría y canal',
                        '• Usa `|` para separar los parámetros',
                        '• Puedes usar 1 rol o más roles',
                        '• Máximo 10 pares de rol-emoji por mensaje'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar pares rol-emoji
        if (roleEmojiPairs.length % 2 !== 0 || roleEmojiPairs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Pares Inválidos')
                .setDescription('Debes proporcionar pares de rol-emoji (rolID emoji).')
                .addFields({
                    name: 'ℹ️ Ejemplo',
                    value: '`!verifymsg | Título | Mensaje | 123456789012345678 | ✅`',
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
        if (roleEmojiPairs.length > 20) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Demasiados Roles')
                .setDescription('Máximo 10 pares de rol-emoji por mensaje.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Buscar o crear la categoría
        let category = null;
        let categoryId = categoryArg.match(/^<#!?(\d+)>$/)?.[1] || categoryArg.match(/^(\d{17,19})$/)?.[1];
        if (categoryId) {
            category = message.guild.channels.cache.get(categoryId);
        } else {
            category = message.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === categoryArg.toLowerCase());
        }
        if (!category) {
            try {
                category = await message.guild.channels.create({
                    name: categoryArg,
                    type: ChannelType.GuildCategory,
                    reason: 'Categoría de verificación creada automáticamente'
                });
            } catch (error) {
                return message.reply({ content: `❌ Error al crear la categoría: ${error.message}`, flags: 64 });
            }
        }

        // Buscar o crear el canal
        let channel = null;
        let channelId = channelArg.match(/^<#(\d+)>$/)?.[1] || channelArg.match(/^(\d{17,19})$/)?.[1];
        if (channelId) {
            channel = message.guild.channels.cache.get(channelId);
        } else {
            channel = message.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name.toLowerCase() === channelArg.toLowerCase() && c.parentId === category.id);
        }
        if (!channel) {
            try {
                channel = await message.guild.channels.create({
                    name: channelArg,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    reason: 'Canal de verificación creado automáticamente'
                });
            } catch (error) {
                return message.reply({ content: `❌ Error al crear el canal: ${error.message}`, flags: 64 });
            }
        }

        // Verificar permisos del bot en el canal
        const botMember = await message.guild.members.fetchMe();
        if (!channel.permissionsFor(botMember).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.ManageMessages])) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permisos Insuficientes')
                .setDescription('No tengo permisos para enviar mensajes, agregar reacciones y gestionar mensajes en ese canal.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar roles y emojis
        const validPairs = [];
        const invalidRoles = [];
        const invalidEmojis = [];
        for (let i = 0; i < roleEmojiPairs.length; i += 2) {
            const roleId = roleEmojiPairs[i];
            const emoji = roleEmojiPairs[i + 1];
            // Validar rol
            if (!/^\d{17,19}$/.test(roleId)) {
                invalidRoles.push(roleId);
                continue;
            }
            const role = message.guild.roles.cache.get(roleId);
            if (!role) {
                invalidRoles.push(roleId);
                continue;
            }
            // Validar emoji (permite emojis estándar y custom)
            const emojiRegex = /^[\p{Emoji}]|<a?:.+?:\d+>$/u;
            if (!emojiRegex.test(emoji)) {
                invalidEmojis.push(emoji);
                continue;
            }
            validPairs.push({ roleId, emoji, roleName: role.name });
        }
        if (invalidRoles.length > 0 || invalidEmojis.length > 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('⚠️ Errores de Validación')
                .setDescription('Algunos roles o emojis son inválidos:');
            if (invalidRoles.length > 0) {
                embed.addFields({
                    name: '❌ Roles Inválidos',
                    value: invalidRoles.map(id => `\`${id}\``).join(', '),
                    inline: false
                });
            }
            if (invalidEmojis.length > 0) {
                embed.addFields({
                    name: '❌ Emojis Inválidos',
                    value: invalidEmojis.map(emoji => `\`${emoji}\``).join(', '),
                    inline: false
                });
            }
            embed.addFields({
                name: 'ℹ️ Información',
                value: 'Solo se usarán los pares válidos para crear el mensaje.',
                inline: false
            });
            await message.reply({ embeds: [embed], flags: 64 });
        }
        if (validPairs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sin Pares Válidos')
                .setDescription('No hay pares rol-emoji válidos para crear el mensaje.')
                .addFields({
                    name: 'ℹ️ Ejemplo',
                    value: '`!verifymsg | Título | Mensaje | 123456789012345678 | ✅`',
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
        try {
            // Crear embed
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle(title)
                .setDescription(description)
                .addFields({
                    name: '📋 Roles Disponibles',
                    value: validPairs.map((pair) => `${pair.emoji} - ${pair.roleName}`).join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Instrucciones',
                    value: 'Reacciona a este mensaje para obtener o remover roles automáticamente.',
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: `Sistema de Verificación - ${message.guild.name}` });
            // Enviar mensaje
            const sentMessage = await channel.send({ embeds: [embed] });
            // Agregar reacciones
            for (const pair of validPairs) {
                try {
                    await sentMessage.react(pair.emoji);
                } catch (error) {
                    await message.reply({ content: `⚠️ No se pudo agregar la reacción ${pair.emoji}: ${error.message}`, flags: 64 });
                }
            }
            // Guardar configuración
            const verifyMessagesPath = path.join(__dirname, '../data/verifymessages.json');
            let verifyMessages = {};
            try {
                const verifyMessagesData = await fs.readFile(verifyMessagesPath, 'utf8');
                verifyMessages = JSON.parse(verifyMessagesData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }
            if (!verifyMessages[message.guild.id]) {
                verifyMessages[message.guild.id] = {};
            }
            verifyMessages[message.guild.id][sentMessage.id] = {
                channelId: channel.id,
                categoryId: category.id,
                title: title,
                description: description,
                pairs: validPairs,
                createdBy: message.author.id,
                createdAt: new Date().toISOString()
            };
            await fs.writeFile(verifyMessagesPath, JSON.stringify(verifyMessages, null, 2));
            // Confirmación
            const confirmEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Mensaje de Verificación Creado')
                .setDescription(`Se ha creado el mensaje de verificación en ${channel}`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Categoría:** ${category.name}`,
                        `**Canal:** ${channel.name}`,
                        `**Título:** ${title}`,
                        `**Roles:** ${validPairs.length}`,
                        `**ID del Mensaje:** ${sentMessage.id}`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: '🛡️ Roles Configurados',
                    value: validPairs.map(pair => `${pair.emoji} - ${pair.roleName}`).join('\n'),
                    inline: false
                })
                .setTimestamp();
            message.reply({ embeds: [confirmEmbed] });
        } catch (error) {
            console.error('Error al crear mensaje de verificación:', error);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al crear el mensaje de verificación. Inténtalo de nuevo.')
                .setTimestamp();
            message.reply({ embeds: [embed], flags: 64 });
        }
    }
}; 