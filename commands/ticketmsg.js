const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'ticketmsg',
    description: 'Crea un mensaje de tickets con reacción',
    legacy: true,
    data: { name: 'ticketmsg' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixCommand = require('./prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'ticketmsg')) {
            return;
        }

        // Verificar permisos usando pticket
        const pticketCommand = require('./pticket.js');
        const hasPermission = await pticketCommand.checkPermission(message);
        
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para usar este comando.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Contacta a un administrador para configurar los permisos con `!pticket <rol_id>`',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Parsear argumentos usando | como separador
        const fullCommand = message.content.slice(currentPrefix.length + 'ticketmsg'.length).trim();
        const parts = fullCommand.split('|').map(part => part.trim());

        if (parts.length < 3) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}ticketmsg Título | Mensaje | Emoji\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}ticketmsg Soporte Técnico | Reacciona para abrir un ticket | 🎫\``,
                        `\`${currentPrefix}ticketmsg Ayuda | ¿Necesitas ayuda? Reacciona aquí | ❓\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: [
                        '• Usa `|` para separar los parámetros',
                        '• El emoji puede ser Unicode o personalizado',
                        '• El mensaje se enviará en el canal actual',
                        '• Primero configura el sistema con `!ticketsetup`'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const title = parts[0];
        const description = parts[1];
        const emoji = parts[2];

        // Validar título
        if (title.length < 3) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Título Demasiado Corto')
                .setDescription('El título debe tener al menos 3 caracteres.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        if (title.length > 256) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Título Demasiado Largo')
                .setDescription('El título no puede tener más de 256 caracteres.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Validar descripción
        if (description.length < 5) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Mensaje Demasiado Corto')
                .setDescription('El mensaje debe tener al menos 5 caracteres.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        if (description.length > 2000) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Mensaje Demasiado Largo')
                .setDescription('El mensaje no puede tener más de 2000 caracteres.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Validar emoji
        const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|<a?:.+?:\d+>$/u;
        if (!emojiRegex.test(emoji)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Emoji Inválido')
                .setDescription('El emoji proporcionado no es válido.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar que el sistema esté configurado
        try {
            const ticketConfigPath = path.join(__dirname, '../data/ticket_config.json');
            const ticketConfigData = await fs.readFile(ticketConfigPath, 'utf8');
            const ticketConfig = JSON.parse(ticketConfigData);

            if (!ticketConfig[message.guild.id]) {
                const embed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('⚠️ Sistema No Configurado')
                    .setDescription('El sistema de tickets no está configurado.')
                    .addFields({
                        name: 'ℹ️ Información',
                        value: 'Usa `!ticketsetup` para configurar el sistema antes de crear mensajes.',
                        inline: false
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('⚠️ Sistema No Configurado')
                .setDescription('El sistema de tickets no está configurado.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Usa `!ticketsetup` para configurar el sistema antes de crear mensajes.',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar permisos del bot en el canal
        if (!message.channel.permissionsFor(message.guild.members.me).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions])) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permisos Insuficientes')
                .setDescription('No tengo permisos para enviar mensajes y agregar reacciones en este canal.')
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
                    name: 'ℹ️ Instrucciones',
                    value: `Reacciona con ${emoji} para abrir un ticket de soporte.`,
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: `Sistema de Tickets - ${message.guild.name}` });

            // Enviar mensaje
            const sentMessage = await message.channel.send({ embeds: [embed] });

            // Agregar reacción
            try {
                await sentMessage.react(emoji);
            } catch (error) {
                console.error(`Error al agregar reacción ${emoji}:`, error);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('⚠️ Error al Agregar Reacción')
                    .setDescription('El mensaje se creó pero no se pudo agregar la reacción.')
                    .addFields({
                        name: 'ℹ️ Información',
                        value: 'Verifica que el emoji sea válido y que tenga permisos para agregar reacciones.',
                        inline: false
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [errorEmbed] });
            }

            // Guardar configuración del mensaje
            const ticketMessagePath = path.join(__dirname, '../data/ticket_message.json');
            let ticketMessages = {};
            
            try {
                const ticketMessagesData = await fs.readFile(ticketMessagePath, 'utf8');
                ticketMessages = JSON.parse(ticketMessagesData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Inicializar configuración del servidor si no existe
            if (!ticketMessages[message.guild.id]) {
                ticketMessages[message.guild.id] = {};
            }

            // Guardar configuración del mensaje
            ticketMessages[message.guild.id][sentMessage.id] = {
                channelId: message.channel.id,
                title: title,
                description: description,
                emoji: emoji,
                createdBy: message.author.id,
                createdAt: new Date().toISOString()
            };

            // Guardar en archivo
            await fs.writeFile(ticketMessagePath, JSON.stringify(ticketMessages, null, 2));

            // Confirmación
            const confirmEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Mensaje de Tickets Creado')
                .setDescription(`Se ha creado el mensaje de tickets en ${message.channel}`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Canal:** ${message.channel.name}`,
                        `**Título:** ${title}`,
                        `**Emoji:** ${emoji}`,
                        `**ID del Mensaje:** ${sentMessage.id}`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Los usuarios pueden reaccionar para abrir tickets de soporte.',
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [confirmEmbed] });

        } catch (error) {
            console.error('Error al crear mensaje de tickets:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al crear el mensaje de tickets. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
}; 