const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'listverify',
    description: 'Lista los mensajes de verificación activos del servidor',
    legacy: true,
    data: { name: 'listverify' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixCommand = require('./prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'listverify')) {
            return;
        }

        try {
            // Cargar configuración de mensajes de verificación
            const verifyMessagesPath = path.join(__dirname, '../data/verifymessages.json');
            let verifyMessages = {};
            
            try {
                const verifyMessagesData = await fs.readFile(verifyMessagesPath, 'utf8');
                verifyMessages = JSON.parse(verifyMessagesData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Obtener mensajes del servidor actual
            const guildMessages = verifyMessages[message.guild.id] || {};

            if (Object.keys(guildMessages).length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('📝 Mensajes de Verificación')
                    .setDescription('No hay mensajes de verificación activos en este servidor.')
                    .addFields({
                        name: 'ℹ️ Información',
                        value: [
                            'Usa `!verifymsg` para crear un mensaje de verificación',
                            'Usa `!pverify <rol_id>` para configurar permisos'
                        ].join('\n'),
                        inline: false
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('📝 Mensajes de Verificación Activos')
                .setDescription(`**Total de mensajes:** ${Object.keys(guildMessages).length}`)
                .setTimestamp();

            // Mostrar cada mensaje
            for (const [messageId, messageConfig] of Object.entries(guildMessages)) {
                const channel = message.guild.channels.cache.get(messageConfig.channelId);
                const channelName = channel ? channel.name : 'Canal no encontrado';
                
                const rolesList = messageConfig.pairs.map(pair => `${pair.emoji} - ${pair.roleName}`).join('\n');
                
                embed.addFields({
                    name: `📋 ${messageConfig.title}`,
                    value: [
                        `**Canal:** #${channelName}`,
                        `**ID del Mensaje:** ${messageId}`,
                        `**Roles:** ${messageConfig.pairs.length}`,
                        `**Creado:** <t:${Math.floor(new Date(messageConfig.createdAt).getTime()/1000)}:R>`,
                        '',
                        '**Roles Configurados:**',
                        rolesList
                    ].join('\n'),
                    inline: false
                });
            }

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al listar mensajes de verificación:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al cargar los mensajes de verificación.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
}; 