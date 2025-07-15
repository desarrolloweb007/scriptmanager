const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'ticketsetup',
    description: 'Configura el sistema de tickets del servidor',
    legacy: true,
    data: { name: 'ticketsetup' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixCommand = require('./prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'ticketsetup')) {
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
        const fullCommand = message.content.slice(currentPrefix.length + 'ticketsetup'.length).trim();
        const parts = fullCommand.split('|').map(part => part.trim());

        if (parts.length < 3) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}ticketsetup #canal | mensaje_embed | rolID_soporte\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}ticketsetup #tickets | Bienvenido al ticket! Describe tu problema. | 123456789012345678\``,
                        `\`${currentPrefix}ticketsetup #soporte | Hola! ¿En qué puedo ayudarte? | 987654321098765432\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: [
                        '• Usa `|` para separar los parámetros',
                        '• El canal debe ser mencionado con #',
                        '• El mensaje se mostrará cuando se abra un ticket',
                        '• El rol de soporte tendrá acceso a todos los tickets'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const channelMention = parts[0];
        const ticketMessage = parts[1];
        const supportRoleId = parts[2];

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

        // Validar ID del rol de soporte
        if (!/^\d{17,19}$/.test(supportRoleId)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ ID de Rol Inválido')
                .setDescription('El ID del rol de soporte debe ser un número válido de Discord.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar que el rol existe
        const supportRole = message.guild.roles.cache.get(supportRoleId);
        if (!supportRole) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Rol de Soporte No Encontrado')
                .setDescription(`No se encontró un rol con el ID \`${supportRoleId}\` en este servidor.`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Validar mensaje
        if (ticketMessage.length < 5) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Mensaje Demasiado Corto')
                .setDescription('El mensaje del ticket debe tener al menos 5 caracteres.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        if (ticketMessage.length > 2000) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Mensaje Demasiado Largo')
                .setDescription('El mensaje del ticket no puede tener más de 2000 caracteres.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        try {
            // Cargar configuración actual
            const ticketConfigPath = path.join(__dirname, '../data/ticket_config.json');
            let ticketConfig = {};
            
            try {
                const ticketConfigData = await fs.readFile(ticketConfigPath, 'utf8');
                ticketConfig = JSON.parse(ticketConfigData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Guardar configuración
            ticketConfig[message.guild.id] = {
                channelId: channelId,
                ticketMessage: ticketMessage,
                supportRoleId: supportRoleId,
                configuredBy: message.author.id,
                configuredAt: new Date().toISOString()
            };

            // Guardar en archivo
            await fs.writeFile(ticketConfigPath, JSON.stringify(ticketConfig, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Sistema de Tickets Configurado')
                .setDescription('El sistema de tickets ha sido configurado correctamente.')
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Canal:** ${channel.name} (\`${channelId}\`)`,
                        `**Rol de Soporte:** ${supportRole.name} (\`${supportRoleId}\`)`,
                        `**Servidor:** ${message.guild.name}`,
                        `**Configurado por:** ${message.author.tag}`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: '📝 Mensaje del Ticket',
                    value: ticketMessage,
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Próximos Pasos',
                    value: [
                        '1. Usa `!ticketmsg` para crear el mensaje de tickets',
                        '2. Los usuarios podrán reaccionar para abrir tickets',
                        '3. Usa `!close` dentro de un ticket para cerrarlo'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al configurar sistema de tickets:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al configurar el sistema de tickets. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
}; 