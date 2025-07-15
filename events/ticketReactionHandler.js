const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'ticketReactionHandler',
    description: 'Maneja las reacciones para crear tickets',
    
    async execute(reaction, user) {
        // Ignorar reacciones del bot
        if (user.bot) return;

        // Obtener el mensaje completo si es parcial
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error al obtener reacción parcial:', error);
                return;
            }
        }

        const message = reaction.message;
        const guild = message.guild;
        const member = await guild.members.fetch(user.id);

        if (!guild || !member) return;

        try {
            // Cargar configuración de mensajes de tickets
            const ticketMessagePath = path.join(__dirname, '../data/ticket_message.json');
            const ticketMessageData = await fs.readFile(ticketMessagePath, 'utf8');
            const ticketMessages = JSON.parse(ticketMessageData);

            const guildTicketMessages = ticketMessages[guild.id];
            if (!guildTicketMessages || !guildTicketMessages[message.id]) {
                return; // No es un mensaje de tickets configurado
            }

            const ticketMessageConfig = guildTicketMessages[message.id];
            const expectedEmoji = ticketMessageConfig.emoji;

            // Verificar si la reacción es la correcta
            if (reaction.emoji.name !== expectedEmoji && reaction.emoji.toString() !== expectedEmoji) {
                return; // No es el emoji esperado
            }

            // Cargar configuración del sistema de tickets
            const ticketConfigPath = path.join(__dirname, '../data/ticket_config.json');
            const ticketConfigData = await fs.readFile(ticketConfigPath, 'utf8');
            const ticketConfig = JSON.parse(ticketConfigData);

            const guildConfig = ticketConfig[guild.id];
            if (!guildConfig) {
                console.error('Configuración de tickets no encontrada para el servidor:', guild.id);
                return;
            }

            // Verificar si el usuario ya tiene un ticket abierto
            const existingTicket = guild.channels.cache.find(
                channel => channel.name === `ticket-${user.id}`
            );

            if (existingTicket) {
                const embed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('⚠️ Ticket Ya Existe')
                    .setDescription(`${user}, ya tienes un ticket abierto.`)
                    .addFields({
                        name: '📋 Información',
                        value: [
                            `**Canal:** ${existingTicket}`,
                            `**Usuario:** ${user.tag}`,
                            `**Estado:** Abierto`
                        ].join('\n'),
                        inline: false
                    })
                    .addFields({
                        name: 'ℹ️ Instrucciones',
                        value: 'Usa el canal existente o cierra el ticket actual con `!close`.',
                        inline: false
                    })
                    .setTimestamp();

                // Enviar mensaje temporal
                const tempMessage = await message.channel.send({ 
                    content: `${user}`,
                    embeds: [embed] 
                });

                // Eliminar mensaje después de 10 segundos
                setTimeout(async () => {
                    try {
                        await tempMessage.delete();
                    } catch (error) {
                        console.error('Error al eliminar mensaje temporal:', error);
                    }
                }, 10000);

                return;
            }

            // Obtener el rol de soporte
            const supportRole = guild.roles.cache.get(guildConfig.supportRoleId);
            if (!supportRole) {
                console.error('Rol de soporte no encontrado:', guildConfig.supportRoleId);
                return;
            }

            // Obtener la categoría configurada
            let category = guild.channels.cache.get(guildConfig.categoryId);
            if (!category || category.type !== ChannelType.GuildCategory) {
                // Si la categoría no existe, crearla
                category = await guild.channels.create({
                    name: 'PANEL TICKET',
                    type: ChannelType.GuildCategory,
                    reason: 'Categoría de tickets creada automáticamente'
                });
            }

            // Crear el canal del ticket dentro de la categoría
            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.id}`,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.id, // @everyone
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: user.id, // Usuario del ticket
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    {
                        id: supportRole.id, // Rol de soporte
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageMessages
                        ]
                    },
                    {
                        id: guild.members.me.id, // Bot
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }
                ]
            });

            // Crear embed de bienvenida
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎫 Ticket Creado')
                .setDescription(`Bienvenido ${user} a tu ticket de soporte.`)
                .addFields({
                    name: '📋 Información',
                    value: [
                        `**Usuario:** ${user.tag}`,
                        `**Canal:** ${ticketChannel}`,
                        `**Fecha:** ${new Date().toLocaleString('es-ES')}`,
                        `**Personal de Soporte:** ${supportRole.name}`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: '📝 Mensaje Personalizado',
                    value: guildConfig.ticketMessage,
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Instrucciones',
                    value: [
                        '• Describe tu problema detalladamente',
                        '• Sé paciente mientras el personal te atiende',
                        '• Usa `!close` para cerrar el ticket cuando termine'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: `Sistema de Tickets - ${guild.name}` });

            // Enviar mensaje de bienvenida
            await ticketChannel.send({ 
                content: `${user} ${supportRole}`,
                embeds: [welcomeEmbed] 
            });

            // Notificar al canal original
            const notificationEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Ticket Creado')
                .setDescription(`${user} ha abierto un ticket de soporte.`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Usuario:** ${user.tag}`,
                        `**Canal:** ${ticketChannel}`,
                        `**Personal:** ${supportRole.name}`
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();

            await message.channel.send({ 
                content: `${supportRole}`,
                embeds: [notificationEmbed] 
            });

            console.log(`Ticket creado para ${user.tag} en ${guild.name}`);

        } catch (error) {
            console.error('Error al manejar reacción de ticket:', error);
            
            // Notificar error al usuario
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error del Sistema')
                    .setDescription('Ocurrió un error al crear el ticket. Inténtalo de nuevo.')
                    .setTimestamp();

                const tempMessage = await message.channel.send({ 
                    content: `${user}`,
                    embeds: [errorEmbed] 
                });

                // Eliminar mensaje después de 10 segundos
                setTimeout(async () => {
                    try {
                        await tempMessage.delete();
                    } catch (error) {
                        console.error('Error al eliminar mensaje de error:', error);
                    }
                }, 10000);

            } catch (notifyError) {
                console.error('Error al notificar error al usuario:', notifyError);
            }
        }
    }
}; 