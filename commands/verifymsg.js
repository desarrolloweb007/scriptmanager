const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'verifymsg',
    description: 'Crea un mensaje de verificación con reacciones para asignar roles',
    legacy: true,
    data: { name: 'verifymsg' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixCommand = require('./prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);
        
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
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar argumentos mínimos
        if (args.length < 4) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}verifymsg #canal | título | mensaje | rolID1 | emoji1 | [rolID2 | emoji2]...\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}verifymsg #verificación | Verificación | Reacciona para obtener roles | 123456789012345678 | ✅ | 987654321098765432 | ❌\``,
                        `\`${currentPrefix}verifymsg #roles | Roles de Juegos | Selecciona tus juegos | 111111111111111111 | 🎮 | 222222222222222222 | 🎯\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: [
                        '• Usa `|` para separar los parámetros',
                        '• El canal debe ser mencionado con #',
                        '• Los emojis pueden ser Unicode o personalizados',
                        '• Máximo 10 pares de rol-emoji por mensaje'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Parsear argumentos usando | como separador
        const fullCommand = message.content.slice(currentPrefix.length + 'verifymsg'.length).trim();
        const parts = fullCommand.split('|').map(part => part.trim());

        if (parts.length < 4) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Formato Inválido')
                .setDescription('Debes usar `|` para separar los parámetros.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const channelMention = parts[0];
        const title = parts[1];
        const description = parts[2];
        const roleEmojiPairs = parts.slice(3);

        // Validar mención del canal
        const channelMatch = channelMention.match(/<#(\d+)>/);
        if (!channelMatch) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Canal Inválido')
                .setDescription('Debes mencionar un canal válido con #.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const channelId = channelMatch[1];
        const channel = message.guild.channels.cache.get(channelId);

        if (!channel) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Canal No Encontrado')
                .setDescription('No se encontró el canal especificado.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar permisos del bot en el canal
        if (!channel.permissionsFor(message.guild.members.me).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.ManageMessages])) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permisos Insuficientes')
                .setDescription('No tengo permisos para enviar mensajes y agregar reacciones en ese canal.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Validar pares rol-emoji
        if (roleEmojiPairs.length % 2 !== 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Pares Inválidos')
                .setDescription('Debes proporcionar pares de rol-emoji (rolID emoji).')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        if (roleEmojiPairs.length > 20) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Demasiados Roles')
                .setDescription('Máximo 10 pares de rol-emoji por mensaje.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
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

            // Validar emoji
            const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|<a?:.+?:\d+>$/u;
            if (!emojiRegex.test(emoji)) {
                invalidEmojis.push(emoji);
                continue;
            }

            validPairs.push({ roleId, emoji, roleName: role.name });
        }

        // Mostrar errores si los hay
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

            await message.reply({ embeds: [embed] });
        }

        if (validPairs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sin Pares Válidos')
                .setDescription('No hay pares rol-emoji válidos para crear el mensaje.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        try {
            // Crear embed
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle(title)
                .setDescription(description)
                .addFields({
                    name: '📋 Roles Disponibles',
                    value: validPairs.map((pair, index) => `${pair.emoji} - ${pair.roleName}`).join('\n'),
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
                    console.error(`Error al agregar reacción ${pair.emoji}:`, error);
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

            // Inicializar configuración del servidor si no existe
            if (!verifyMessages[message.guild.id]) {
                verifyMessages[message.guild.id] = {};
            }

            // Guardar configuración del mensaje
            verifyMessages[message.guild.id][sentMessage.id] = {
                channelId: channel.id,
                title: title,
                description: description,
                pairs: validPairs,
                createdBy: message.author.id,
                createdAt: new Date().toISOString()
            };

            // Guardar en archivo
            await fs.writeFile(verifyMessagesPath, JSON.stringify(verifyMessages, null, 2));

            // Confirmación
            const confirmEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Mensaje de Verificación Creado')
                .setDescription(`Se ha creado el mensaje de verificación en ${channel}`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
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
            
            message.reply({ embeds: [embed] });
        }
    }
}; 