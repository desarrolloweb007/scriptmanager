const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'warnfilter',
    description: 'Sistema automático de filtro de palabras prohibidas',
    legacy: true,
    data: { name: 'warnfilter' }, // Agregar data para compatibilidad
    
    // Función para verificar y filtrar mensajes
    async checkMessage(message) {
        // Ignorar mensajes del bot y usuarios sin permisos
        if (message.author.bot || !message.guild) {
            return;
        }

        console.log(`🔍 Verificando mensaje: "${message.content}" de ${message.author.tag}`);

        try {
            // Cargar palabras prohibidas
            const warnwordsPath = path.join(__dirname, '../../data/warnwords.json');
            let warnwords = {};
            
            try {
                const warnwordsData = await fs.readFile(warnwordsPath, 'utf8');
                warnwords = JSON.parse(warnwordsData);
            } catch (error) {
                // Archivo no existe, no hay palabras filtradas
                return;
            }

            // Verificar si el servidor tiene palabras configuradas
            const serverWords = warnwords[message.guild.id];
            console.log(`📝 Palabras configuradas para ${message.guild.name}:`, serverWords);
            
            if (!serverWords || serverWords.length === 0) {
                console.log('❌ No hay palabras configuradas para este servidor');
                return;
            }

            // Verificar si el mensaje contiene palabras prohibidas
            const messageContent = message.content.toLowerCase();
            const foundWords = serverWords.filter(word => messageContent.includes(word));
            
            console.log(`🔍 Palabras encontradas:`, foundWords);

            if (foundWords.length > 0) {
                console.log(`🚫 Eliminando mensaje con palabras prohibidas:`, foundWords);
                // Eliminar mensaje
                await message.delete();

                // Crear embed de advertencia
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🚫 Mensaje Eliminado')
                    .setDescription(`El mensaje de ${message.author} ha sido eliminado por contener palabras prohibidas.`)
                    .addFields({
                        name: '📝 Palabras Detectadas',
                        value: foundWords.map(word => `\`${word}\``).join(', '),
                        inline: false
                    })
                    .addFields({
                        name: '👤 Usuario',
                        value: `${message.author.tag} (${message.author.id})`,
                        inline: true
                    })
                    .addFields({
                        name: '📅 Fecha',
                        value: new Date().toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        inline: true
                    })
                    .setTimestamp();

                // Enviar advertencia al canal
                await message.channel.send({ embeds: [embed] });

                // Registrar advertencia automática
                await this.recordAutomaticWarning(message, foundWords);

                // Verificar castigos automáticos
                await this.checkAutomaticPunishments(message);
            }

        } catch (error) {
            console.error('Error en warnfilter:', error);
        }
    },

    // Función para registrar advertencia automática
    async recordAutomaticWarning(message, foundWords) {
        try {
            const warningsPath = path.join(__dirname, '../../data/warnings.json');
            let warnings = {};
            
            try {
                const warningsData = await fs.readFile(warningsPath, 'utf8');
                warnings = JSON.parse(warningsData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Inicializar estructura del servidor si no existe
            if (!warnings[message.guild.id]) {
                warnings[message.guild.id] = {};
            }

            if (!warnings[message.guild.id][message.author.id]) {
                warnings[message.guild.id][message.author.id] = [];
            }

            // Agregar advertencia automática
            const warning = {
                reason: `Palabras prohibidas detectadas: ${foundWords.join(', ')}`,
                moderator: 'Sistema Automático',
                timestamp: new Date().toISOString()
            };

            warnings[message.guild.id][message.author.id].push(warning);

            // Guardar en archivo
            await fs.writeFile(warningsPath, JSON.stringify(warnings, null, 2));

        } catch (error) {
            console.error('Error al registrar advertencia automática:', error);
        }
    },

    // Función para verificar castigos automáticos
    async checkAutomaticPunishments(message) {
        try {
            // Cargar configuración de autopunish
            const autopunishPath = path.join(__dirname, '../../data/autopunish.json');
            let autopunish = {};
            
            try {
                const autopunishData = await fs.readFile(autopunishPath, 'utf8');
                autopunish = JSON.parse(autopunishData);
            } catch (error) {
                // Archivo no existe, sistema no configurado
                return;
            }

            const guildConfig = autopunish[message.guild.id];
            if (!guildConfig || !guildConfig.enabled || Object.keys(guildConfig.punishments).length === 0) {
                return;
            }

            // Cargar advertencias del usuario
            const warningsPath = path.join(__dirname, '../../data/warnings.json');
            let warnings = {};
            
            try {
                const warningsData = await fs.readFile(warningsPath, 'utf8');
                warnings = JSON.parse(warningsData);
            } catch (error) {
                return;
            }

            const userWarnings = warnings[message.guild.id]?.[message.author.id] || [];
            const totalWarnings = userWarnings.length;

            // Verificar si se debe aplicar un castigo automático
            const punishments = Object.entries(guildConfig.punishments)
                .sort(([a], [b]) => parseInt(a) - parseInt(b));

            for (const [warningsThreshold, punishment] of punishments) {
                if (totalWarnings >= parseInt(warningsThreshold)) {
                    await this.applyAutomaticPunishment(message, punishment, totalWarnings);
                    break; // Aplicar solo el primer castigo que coincida
                }
            }

        } catch (error) {
            console.error('Error al verificar castigos automáticos:', error);
        }
    },

    // Función para aplicar castigo automático
    async applyAutomaticPunishment(message, punishment, totalWarnings) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('⚠️ Castigo Automático Aplicado')
                .setDescription(`Se ha aplicado un castigo automático a ${message.author.tag}`)
                .addFields({
                    name: '📊 Razón',
                    value: `Usuario alcanzó ${totalWarnings} advertencias`,
                    inline: true
                })
                .addFields({
                    name: '🛡️ Castigo',
                    value: punishment.type.toUpperCase(),
                    inline: true
                })
                .setTimestamp();

            if (punishment.duration) {
                embed.addFields({
                    name: '⏰ Duración',
                    value: punishment.duration,
                    inline: true
                });
            }

            switch (punishment.type) {
                case 'mute':
                    await this.applyMute(message, punishment.duration);
                    break;
                case 'kick':
                    await this.applyKick(message);
                    break;
                case 'ban':
                    await this.applyBan(message, punishment.duration);
                    break;
            }

            // Enviar notificación
            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error al aplicar castigo automático:', error);
        }
    },

    // Función para aplicar mute automático
    async applyMute(message, duration) {
        try {
            // Crear rol Muted si no existe
            let mutedRole = message.guild.roles.cache.find(role => role.name === 'Muted');
            
            if (!mutedRole) {
                mutedRole = await message.guild.roles.create({
                    name: 'Muted',
                    color: '#808080',
                    reason: 'Rol para sistema automático de mute'
                });

                // Configurar permisos del rol
                message.guild.channels.cache.forEach(async (channel) => {
                    if (channel.type === 0) { // Text channel
                        await channel.permissionOverwrites.create(mutedRole, {
                            SendMessages: false,
                            AddReactions: false,
                            CreatePublicThreads: false,
                            CreatePrivateThreads: false,
                            SendMessagesInThreads: false
                        });
                    }
                });
            }

            // Aplicar rol al usuario
            await message.member.roles.add(mutedRole, 'Castigo automático por advertencias');

            // Programar desmute si hay duración
            if (duration) {
                const durationMs = this.parseDuration(duration);
                if (durationMs > 0) {
                    setTimeout(async () => {
                        try {
                            await message.member.roles.remove(mutedRole, 'Fin de castigo automático');
                        } catch (error) {
                            console.error('Error al desmutear automáticamente:', error);
                        }
                    }, durationMs);
                }
            }

        } catch (error) {
            console.error('Error al aplicar mute automático:', error);
        }
    },

    // Función para aplicar kick automático
    async applyKick(message) {
        try {
            await message.member.kick('Castigo automático por advertencias');
        } catch (error) {
            console.error('Error al aplicar kick automático:', error);
        }
    },

    // Función para aplicar ban automático
    async applyBan(message, duration) {
        try {
            const options = {
                reason: 'Castigo automático por advertencias'
            };

            if (duration) {
                const durationMs = this.parseDuration(duration);
                if (durationMs > 0) {
                    options.deleteMessageDays = 1;
                    // Programar desban
                    setTimeout(async () => {
                        try {
                            await message.guild.members.unban(message.author.id, 'Fin de castigo automático');
                        } catch (error) {
                            console.error('Error al desbanear automáticamente:', error);
                        }
                    }, durationMs);
                }
            }

            await message.guild.members.ban(message.author, options);

        } catch (error) {
            console.error('Error al aplicar ban automático:', error);
        }
    },

    // Función para parsear duración
    parseDuration(duration) {
        const timeUnits = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000
        };

        const match = duration.match(/^(\d+)([smhdw])$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            return value * timeUnits[unit];
        }

        return 0;
    }
}; 