// antiRaidManager.js
// Sistema anti-raid robusto y modular
const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const AntiRaidConfig = require('./antiRaidConfig');

class AntiRaidManager {
    constructor(client) {
        this.client = client;
        this.raidEvents = new Map(); // Para tracking de eventos de raid
        this.lastActions = new Map(); // Para cooldowns
        this.setupListeners();
        console.log('[AntiRaidManager] ✅ Sistema anti-raid inicializado');
    }

    setupListeners() {
        // Evento de miembros uniéndose
        this.client.on(Events.GuildMemberAdd, this.handleMemberJoin.bind(this));
        
        // Evento de creación de canales
        this.client.on(Events.ChannelCreate, this.handleChannelCreate.bind(this));
        
        // Evento de eliminación de canales
        this.client.on(Events.ChannelDelete, this.handleChannelDelete.bind(this));
        
        // Evento de mensajes masivos
        this.client.on(Events.MessageCreate, this.handleMessageSpam.bind(this));
        
        console.log('[AntiRaidManager] ✅ Listeners de anti-raid registrados');
    }

    async handleMemberJoin(member) {
        try {
            const config = AntiRaidConfig.getGuildConfig(member.guild.id);
            if (!config.enabled) return;

            const guildId = member.guild.id;
            const now = Date.now();

            // Verificar whitelist
            if (this.isWhitelisted(member, config)) {
                console.log(`[AntiRaidManager] ✅ Usuario ${member.user.tag} está en whitelist`);
                return;
            }

            // Verificar blacklist
            if (this.isBlacklisted(member, config)) {
                await this.takeAction(member, 'blacklist', config);
                return;
            }

            // Tracking de joins
            if (!this.raidEvents.has(guildId)) {
                this.raidEvents.set(guildId, []);
            }

            const events = this.raidEvents.get(guildId);
            events.push({ timestamp: now, userId: member.user.id });

            // Limpiar eventos antiguos
            const threshold = config.raidThreshold.seconds * 1000;
            const recentEvents = events.filter(e => now - e.timestamp < threshold);
            this.raidEvents.set(guildId, recentEvents);

            // Verificar si es raid
            if (recentEvents.length >= config.raidThreshold.users) {
                await this.handleRaid(member.guild, recentEvents, config);
            }

        } catch (error) {
            console.error('[AntiRaidManager] ❌ Error en handleMemberJoin:', error);
        }
    }

    async handleChannelCreate(channel) {
        try {
            const config = AntiRaidConfig.getGuildConfig(channel.guild.id);
            if (!config.enabled) return;

            const guildId = channel.guild.id;
            const now = Date.now();

            // Verificar límite de creación de canales
            if (!this.lastActions.has(guildId)) {
                this.lastActions.set(guildId, { channelCreate: [] });
            }

            const actions = this.lastActions.get(guildId);
            actions.channelCreate.push(now);

            // Limpiar acciones antiguas
            const threshold = config.channelCreateLimit.seconds * 1000;
            const recentCreates = actions.channelCreate.filter(t => now - t < threshold);
            actions.channelCreate = recentCreates;

            if (recentCreates.length >= config.channelCreateLimit.count) {
                await this.takeAction(channel.guild.members.me, 'channel_spam', config);
            }

        } catch (error) {
            console.error('[AntiRaidManager] ❌ Error en handleChannelCreate:', error);
        }
    }

    async handleChannelDelete(channel) {
        try {
            const config = AntiRaidConfig.getGuildConfig(channel.guild.id);
            if (!config.enabled) return;

            const guildId = channel.guild.id;
            const now = Date.now();

            if (!this.lastActions.has(guildId)) {
                this.lastActions.set(guildId, { channelDelete: [] });
            }

            const actions = this.lastActions.get(guildId);
            actions.channelDelete.push(now);

            const threshold = config.channelDeleteLimit.seconds * 1000;
            const recentDeletes = actions.channelDelete.filter(t => now - t < threshold);
            actions.channelDelete = recentDeletes;

            if (recentDeletes.length >= config.channelDeleteLimit.count) {
                await this.takeAction(channel.guild.members.me, 'channel_delete_spam', config);
            }

        } catch (error) {
            console.error('[AntiRaidManager] ❌ Error en handleChannelDelete:', error);
        }
    }

    async handleMessageSpam(message) {
        try {
            if (message.author.bot) return;

            const config = AntiRaidConfig.getGuildConfig(message.guild.id);
            if (!config.enabled) return;

            // Verificar si el canal está excluido
            if (config.excludedChannels.includes(message.channel.id)) return;

            const guildId = message.guild.id;
            const now = Date.now();

            if (!this.lastActions.has(guildId)) {
                this.lastActions.set(guildId, { messages: new Map() });
            }

            const actions = this.lastActions.get(guildId);
            const userId = message.author.id;

            if (!actions.messages.has(userId)) {
                actions.messages.set(userId, []);
            }

            const userMessages = actions.messages.get(userId);
            userMessages.push(now);

            // Limpiar mensajes antiguos (últimos 10 segundos)
            const recentMessages = userMessages.filter(t => now - t < 10000);
            actions.messages.set(userId, recentMessages);

            // Si un usuario envía más de 5 mensajes en 10 segundos
            if (recentMessages.length > 5) {
                await this.takeAction(message.member, 'message_spam', config);
            }

        } catch (error) {
            console.error('[AntiRaidManager] ❌ Error en handleMessageSpam:', error);
        }
    }

    isWhitelisted(member, config) {
        return config.whitelist.users.includes(member.user.id) ||
               member.roles.cache.some(role => config.whitelist.roles.includes(role.id));
    }

    isBlacklisted(member, config) {
        return config.blacklist.users.includes(member.user.id) ||
               member.roles.cache.some(role => config.blacklist.roles.includes(role.id));
    }

    async handleRaid(guild, events, config) {
        try {
            console.log(`[AntiRaidManager] 🚨 RAID DETECTADO en ${guild.name}! ${events.length} usuarios en ${config.raidThreshold.seconds}s`);

            // Enviar alerta
            await this.sendAlert(guild, 'raid', events, config);

            // Tomar acción si está habilitado
            if (config.autoBan) {
                for (const event of events) {
                    try {
                        const member = await guild.members.fetch(event.userId);
                        if (member && !this.isWhitelisted(member, config)) {
                            await member.ban({ reason: 'Anti-Raid: Detección automática de raid' });
                            console.log(`[AntiRaidManager] ✅ Usuario ${member.user.tag} baneado por raid`);
                        }
                    } catch (error) {
                        console.error(`[AntiRaidManager] ❌ Error baneando usuario:`, error);
                    }
                }
            }

            // Limpiar eventos
            this.raidEvents.delete(guild.id);

        } catch (error) {
            console.error('[AntiRaidManager] ❌ Error manejando raid:', error);
        }
    }

    async takeAction(member, actionType, config) {
        try {
            console.log(`[AntiRaidManager] 🛡️ Acción anti-raid: ${actionType} en ${member.guild.name}`);

            // Verificar cooldown
            const now = Date.now();
            const lastAction = config.lastAction || 0;
            if (now - lastAction < config.cooldown * 1000) {
                console.log('[AntiRaidManager] ⏰ Cooldown activo, saltando acción');
                return;
            }

            // Enviar alerta
            await this.sendAlert(member.guild, actionType, [], config);

            // Actualizar último tiempo de acción
            AntiRaidConfig.updateGuildConfig(member.guild.id, { lastAction: now });

        } catch (error) {
            console.error('[AntiRaidManager] ❌ Error tomando acción:', error);
        }
    }

    async sendAlert(guild, alertType, events = [], config) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🚨 Alerta Anti-Raid')
                .setDescription(`Se ha detectado actividad sospechosa en **${guild.name}**`)
                .addFields(
                    { name: 'Tipo de Alerta', value: alertType, inline: true },
                    { name: 'Servidor', value: guild.name, inline: true },
                    { name: 'Timestamp', value: new Date().toLocaleString(), inline: true }
                )
                .setTimestamp();

            if (events.length > 0) {
                embed.addFields({
                    name: 'Eventos Detectados',
                    value: `${events.length} eventos en los últimos ${config.raidThreshold.seconds} segundos`,
                    inline: false
                });
            }

            // Enviar a canal de logs si está configurado
            if (config.logChannel) {
                try {
                    const logChannel = await guild.channels.fetch(config.logChannel);
                    if (logChannel) {
                        await logChannel.send({ embeds: [embed] });
                    }
                } catch (error) {
                    console.error('[AntiRaidManager] ❌ Error enviando a canal de logs:', error);
                }
            }

            // Enviar a canal de alertas admin si está configurado
            if (config.adminAlertChannel) {
                try {
                    const adminChannel = await guild.channels.fetch(config.adminAlertChannel);
                    if (adminChannel) {
                        await adminChannel.send({ embeds: [embed] });
                    }
                } catch (error) {
                    console.error('[AntiRaidManager] ❌ Error enviando a canal de admin:', error);
                }
            }

        } catch (error) {
            console.error('[AntiRaidManager] ❌ Error enviando alerta:', error);
        }
    }

    // Método para activar/desactivar el sistema
    setEnabled(guildId, enabled) {
        try {
            AntiRaidConfig.updateGuildConfig(guildId, { enabled });
            console.log(`[AntiRaidManager] ${enabled ? '✅' : '❌'} Anti-raid ${enabled ? 'activado' : 'desactivado'} para ${guildId}`);
        } catch (error) {
            console.error('[AntiRaidManager] ❌ Error cambiando estado:', error);
        }
    }

    // Método para obtener estado
    getStatus(guildId) {
        try {
            return AntiRaidConfig.getGuildConfig(guildId);
        } catch (error) {
            console.error('[AntiRaidManager] ❌ Error obteniendo estado:', error);
            return null;
        }
    }
}

module.exports = AntiRaidManager; 