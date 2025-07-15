const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'reactionHandler',
    
    // Manejar reacciones agregadas
    async handleReactionAdd(reaction, user) {
        // Ignorar reacciones del bot
        if (user.bot) return;

        try {
            // Obtener el mensaje completo si es parcial
            if (reaction.partial) {
                await reaction.fetch();
            }

            const message = reaction.message;
            const guild = message.guild;
            const member = await guild.members.fetch(user.id);

            // Cargar configuración de mensajes de verificación
            const verifyMessagesPath = path.join(__dirname, '../data/verifymessages.json');
            let verifyMessages = {};
            
            try {
                const verifyMessagesData = await fs.readFile(verifyMessagesPath, 'utf8');
                verifyMessages = JSON.parse(verifyMessagesData);
            } catch (error) {
                // Archivo no existe, no hay mensajes configurados
                return;
            }

            // Verificar si este mensaje está configurado para verificación
            const guildMessages = verifyMessages[guild.id];
            if (!guildMessages || !guildMessages[message.id]) {
                return;
            }

            const messageConfig = guildMessages[message.id];
            const emoji = reaction.emoji.name || reaction.emoji.toString();

            // Buscar el rol correspondiente al emoji
            const rolePair = messageConfig.pairs.find(pair => 
                pair.emoji === emoji || pair.emoji === reaction.emoji.toString()
            );

            if (!rolePair) {
                console.log(`Emoji no configurado: ${emoji}`);
                return;
            }

            // Obtener el rol
            const role = guild.roles.cache.get(rolePair.roleId);
            if (!role) {
                console.error(`Rol no encontrado: ${rolePair.roleId}`);
                return;
            }

            // Verificar permisos del bot
            if (!guild.members.me.permissions.has('ManageRoles')) {
                console.error('Bot no tiene permisos para gestionar roles');
                return;
            }

            if (role.position >= guild.members.me.roles.highest.position) {
                console.error(`No puedo gestionar el rol ${role.name} - jerarquía insuficiente`);
                return;
            }

            // Verificar si el usuario ya tiene el rol
            if (member.roles.cache.has(role.id)) {
                console.log(`Usuario ${user.tag} ya tiene el rol ${role.name}`);
                return;
            }

            // Asignar rol al usuario
            try {
                await member.roles.add(role, `Verificación automática - ${emoji}`);
                
                console.log(`✅ Rol ${role.name} asignado a ${user.tag} por reacción ${emoji}`);
                
                // Enviar confirmación al usuario (opcional)
                try {
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Rol Asignado')
                        .setDescription(`Se te ha asignado el rol **${role.name}**`)
                        .addFields({
                            name: '📋 Detalles',
                            value: [
                                `**Rol:** ${role.name}`,
                                `**Servidor:** ${guild.name}`,
                                `**Reacción:** ${emoji}`
                            ].join('\n'),
                            inline: false
                        })
                        .setTimestamp();

                    await user.send({ embeds: [embed] }).catch(() => {
                        // Ignorar si no se puede enviar DM
                    });
                } catch (error) {
                    // Ignorar errores de DM
                }

            } catch (error) {
                console.error(`Error al asignar rol ${role.name} a ${user.tag}:`, error);
            }

        } catch (error) {
            console.error('Error en handleReactionAdd:', error);
        }
    },

    // Manejar reacciones removidas
    async handleReactionRemove(reaction, user) {
        // Ignorar reacciones del bot
        if (user.bot) return;

        try {
            // Obtener el mensaje completo si es parcial
            if (reaction.partial) {
                await reaction.fetch();
            }

            const message = reaction.message;
            const guild = message.guild;
            const member = await guild.members.fetch(user.id);

            // Cargar configuración de mensajes de verificación
            const verifyMessagesPath = path.join(__dirname, '../data/verifymessages.json');
            let verifyMessages = {};
            
            try {
                const verifyMessagesData = await fs.readFile(verifyMessagesPath, 'utf8');
                verifyMessages = JSON.parse(verifyMessagesData);
            } catch (error) {
                // Archivo no existe, no hay mensajes configurados
                return;
            }

            // Verificar si este mensaje está configurado para verificación
            const guildMessages = verifyMessages[guild.id];
            if (!guildMessages || !guildMessages[message.id]) {
                return;
            }

            const messageConfig = guildMessages[message.id];
            const emoji = reaction.emoji.name || reaction.emoji.toString();

            // Buscar el rol correspondiente al emoji
            const rolePair = messageConfig.pairs.find(pair => 
                pair.emoji === emoji || pair.emoji === reaction.emoji.toString()
            );

            if (!rolePair) {
                console.log(`Emoji no configurado: ${emoji}`);
                return;
            }

            // Obtener el rol
            const role = guild.roles.cache.get(rolePair.roleId);
            if (!role) {
                console.error(`Rol no encontrado: ${rolePair.roleId}`);
                return;
            }

            // Verificar permisos del bot
            if (!guild.members.me.permissions.has('ManageRoles')) {
                console.error('Bot no tiene permisos para gestionar roles');
                return;
            }

            if (role.position >= guild.members.me.roles.highest.position) {
                console.error(`No puedo gestionar el rol ${role.name} - jerarquía insuficiente`);
                return;
            }

            // Verificar si el usuario tiene el rol
            if (!member.roles.cache.has(role.id)) {
                console.log(`Usuario ${user.tag} no tiene el rol ${role.name}`);
                return;
            }

            // Remover rol al usuario
            try {
                await member.roles.remove(role, `Verificación automática - ${emoji} removido`);
                
                console.log(`❌ Rol ${role.name} removido de ${user.tag} por remoción de reacción ${emoji}`);
                
                // Enviar confirmación al usuario (opcional)
                try {
                    const embed = new EmbedBuilder()
                        .setColor('#ff9900')
                        .setTitle('❌ Rol Removido')
                        .setDescription(`Se te ha removido el rol **${role.name}**`)
                        .addFields({
                            name: '📋 Detalles',
                            value: [
                                `**Rol:** ${role.name}`,
                                `**Servidor:** ${guild.name}`,
                                `**Reacción:** ${emoji}`
                            ].join('\n'),
                            inline: false
                        })
                        .setTimestamp();

                    await user.send({ embeds: [embed] }).catch(() => {
                        // Ignorar si no se puede enviar DM
                    });
                } catch (error) {
                    // Ignorar errores de DM
                }

            } catch (error) {
                console.error(`Error al remover rol ${role.name} de ${user.tag}:`, error);
            }

        } catch (error) {
            console.error('Error en handleReactionRemove:', error);
        }
    },

    // Función para limpiar mensajes de verificación eliminados
    async cleanupDeletedMessages() {
        try {
            const verifyMessagesPath = path.join(__dirname, '../data/verifymessages.json');
            let verifyMessages = {};
            
            try {
                const verifyMessagesData = await fs.readFile(verifyMessagesPath, 'utf8');
                verifyMessages = JSON.parse(verifyMessagesData);
            } catch (error) {
                return;
            }

            let hasChanges = false;

            // Verificar cada servidor
            for (const [guildId, guildMessages] of Object.entries(verifyMessages)) {
                const guild = global.client?.guilds.cache.get(guildId);
                if (!guild) {
                    // Servidor no encontrado, limpiar
                    delete verifyMessages[guildId];
                    hasChanges = true;
                    continue;
                }

                // Verificar cada mensaje
                for (const [messageId, messageConfig] of Object.entries(guildMessages)) {
                    try {
                        const channel = guild.channels.cache.get(messageConfig.channelId);
                        if (!channel) {
                            // Canal no encontrado, eliminar mensaje
                            delete guildMessages[messageId];
                            hasChanges = true;
                            continue;
                        }

                        // Intentar obtener el mensaje
                        await channel.messages.fetch(messageId);
                    } catch (error) {
                        // Mensaje no encontrado, eliminar
                        delete guildMessages[messageId];
                        hasChanges = true;
                    }
                }

                // Si no quedan mensajes en el servidor, eliminar el servidor
                if (Object.keys(guildMessages).length === 0) {
                    delete verifyMessages[guildId];
                    hasChanges = true;
                }
            }

            // Guardar cambios si los hay
            if (hasChanges) {
                await fs.writeFile(verifyMessagesPath, JSON.stringify(verifyMessages, null, 2));
                console.log('🧹 Limpieza de mensajes de verificación completada');
            }

        } catch (error) {
            console.error('Error en cleanupDeletedMessages:', error);
        }
    }
}; 