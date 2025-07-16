const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'checkinfractions',
    description: 'Muestra las advertencias activas de un usuario',
    legacy: true,
    data: { name: 'checkinfractions' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixManager = require('../../utils/prefixManager');
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'checkinfractions')) {
            return;
        }

        // Verificar permisos usando modperms
        const modpermsCommand = require('./modperms.js');
        const hasPermission = await modpermsCommand.checkPermission(message, 'checkinfractions');
        
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para usar este comando.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Contacta a un administrador para configurar los permisos con `!modperms checkinfractions <rol_id>`',
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
                .setDescription(`**Sintaxis:** \`${currentPrefix}checkinfractions @usuario\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}checkinfractions @usuario\``,
                        `\`${currentPrefix}checkinfractions 123456789012345678\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Muestra todas las advertencias activas del usuario especificado.',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Obtener usuario
        let targetUser;
        const userMention = args[0].match(/<@!?(\d+)>/);
        
        if (userMention) {
            targetUser = message.guild.members.cache.get(userMention[1]);
        } else if (/^\d{17,19}$/.test(args[0])) {
            targetUser = message.guild.members.cache.get(args[0]);
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Usuario Inválido')
                .setDescription('Debes mencionar un usuario o proporcionar un ID válido.')
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}checkinfractions @usuario\``,
                        `\`${currentPrefix}checkinfractions 123456789012345678\``
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        if (!targetUser) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Usuario No Encontrado')
                .setDescription('No se encontró el usuario especificado en este servidor.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        try {
            // Cargar advertencias
            const warningsPath = path.join(__dirname, '../../data/warnings.json');
            let warnings = {};
            
            try {
                const warningsData = await fs.readFile(warningsPath, 'utf8');
                warnings = JSON.parse(warningsData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Obtener advertencias del usuario en este servidor
            const userWarnings = warnings[message.guild.id]?.[targetUser.id] || [];
            const activeWarnings = userWarnings.filter(warning => {
                // Considerar advertencias de los últimos 30 días como "activas"
                const warningDate = new Date(warning.timestamp);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return warningDate > thirtyDaysAgo;
            });

            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('📋 Infracciones del Usuario')
                .setThumbnail(targetUser.user.displayAvatarURL({ dynamic: true }))
                .addFields({
                    name: '👤 Usuario',
                    value: `${targetUser.user.tag} (${targetUser.id})`,
                    inline: true
                })
                .addFields({
                    name: '📊 Estadísticas',
                    value: [
                        `**Total advertencias:** ${userWarnings.length}`,
                        `**Advertencias activas:** ${activeWarnings.length}`,
                        `**Última advertencia:** ${userWarnings.length > 0 ? new Date(userWarnings[userWarnings.length - 1].timestamp).toLocaleDateString('es-ES') : 'N/A'}`
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();

            // Mostrar advertencias activas
            if (activeWarnings.length > 0) {
                const warningsList = activeWarnings.slice(-10).map((warning, index) => {
                    const date = new Date(warning.timestamp).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    return `${activeWarnings.length - 9 + index}. **${warning.reason}** - ${date} (por ${warning.moderator})`;
                }).join('\n');

                embed.addFields({
                    name: '🛡️ Advertencias Activas (Últimas 10)',
                    value: warningsList,
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '✅ Sin Advertencias Activas',
                    value: 'Este usuario no tiene advertencias activas (últimos 30 días).',
                    inline: false
                });
            }

            // Información sobre sistema automático
            try {
                const autopunishPath = path.join(__dirname, '../../data/autopunish.json');
                const autopunishData = await fs.readFile(autopunishPath, 'utf8');
                const autopunish = JSON.parse(autopunishData);
                
                const guildConfig = autopunish[message.guild.id];
                if (guildConfig && guildConfig.enabled && Object.keys(guildConfig.punishments).length > 0) {
                    const punishments = Object.entries(guildConfig.punishments)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b));
                    
                    const nextPunishment = punishments.find(([warnings]) => parseInt(warnings) > userWarnings.length);
                    
                    if (nextPunishment) {
                        const [warnings, punishment] = nextPunishment;
                        const remaining = parseInt(warnings) - userWarnings.length;
                        
                        embed.addFields({
                            name: '⚠️ Próximo Castigo Automático',
                            value: `Faltan **${remaining}** advertencias para recibir **${punishment.type}**${punishment.duration ? ` (${punishment.duration})` : ''}`,
                            inline: false
                        });
                    } else {
                        embed.addFields({
                            name: '✅ Sin Castigos Pendientes',
                            value: 'El usuario ha superado todos los umbrales de castigos automáticos.',
                            inline: false
                        });
                    }
                }
            } catch (error) {
                // Sistema automático no configurado o error
            }

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al verificar infracciones:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al verificar las infracciones. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
}; 