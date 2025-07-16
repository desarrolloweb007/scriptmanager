const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'deleteverify',
    description: 'Elimina un mensaje de verificación específico',
    legacy: true,
    data: { name: 'deleteverify' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixManager = require('../utils/prefixManager');
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'deleteverify')) {
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

        // Verificar argumentos
        if (args.length < 1) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}deleteverify <message_id>\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}deleteverify 1234567890123456789\``,
                        `\`${currentPrefix}deleteverify 9876543210987654321\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: [
                        'Usa `!listverify` para ver los IDs de los mensajes',
                        'El mensaje será eliminado de la base de datos',
                        'El mensaje físico en Discord no se eliminará'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const messageId = args[0];

        // Validar ID del mensaje
        if (!/^\d{17,19}$/.test(messageId)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ ID de Mensaje Inválido')
                .setDescription('El ID del mensaje debe ser un número válido de Discord.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
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

            // Verificar si el mensaje existe
            const guildMessages = verifyMessages[message.guild.id] || {};
            if (!guildMessages[messageId]) {
                const embed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('⚠️ Mensaje No Encontrado')
                    .setDescription(`No se encontró un mensaje de verificación con el ID \`${messageId}\`.`)
                    .addFields({
                        name: 'ℹ️ Información',
                        value: 'Usa `!listverify` para ver los mensajes de verificación activos.',
                        inline: false
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const messageConfig = guildMessages[messageId];

            // Eliminar mensaje de la configuración
            delete guildMessages[messageId];

            // Si no quedan mensajes en el servidor, eliminar el servidor
            if (Object.keys(guildMessages).length === 0) {
                delete verifyMessages[message.guild.id];
            }

            // Guardar cambios
            await fs.writeFile(verifyMessagesPath, JSON.stringify(verifyMessages, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Mensaje de Verificación Eliminado')
                .setDescription(`Se ha eliminado el mensaje de verificación de la base de datos.`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Título:** ${messageConfig.title}`,
                        `**ID del Mensaje:** ${messageId}`,
                        `**Roles Configurados:** ${messageConfig.pairs.length}`,
                        `**Canal:** <#${messageConfig.channelId}>`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'El mensaje físico en Discord no se eliminará automáticamente.',
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al eliminar mensaje de verificación:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al eliminar el mensaje de verificación.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
}; 