// antiRaidManager.js
// Clase principal del sistema anti-raid modular
const { Events, AuditLogEvent, PermissionsBitField } = require('discord.js');
const AntiRaidConfig = require('./antiRaidConfig');
const ANTI_RAID_VERSION = '1.0.0'; // Actualiza este valor en cada release
const messages = require('./antiRaidMessages');
const { createEmbed, getMsg } = require('../../utils/embedUtils');

class AntiRaidManager {
    // --- Bienvenida/documentación automática para nuevos administradores ---
    setupAdminWelcome() {
        this.client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
            const config = AntiRaidConfig.getGuildConfig(newMember.guild.id);
            const permsRole = config.permsRole;
            const isNowAdmin = newMember.permissions.has(PermissionsBitField.Flags.Administrator) || (permsRole && newMember.roles.cache.has(permsRole));
            const wasAdmin = oldMember.permissions.has(PermissionsBitField.Flags.Administrator) || (permsRole && oldMember.roles.cache.has(permsRole));
            if (!wasAdmin && isNowAdmin) {
                const lang = config.language || 'es';
                const embed = createEmbed(
                    lang === 'es' ? '¡Bienvenido al sistema Anti-Raid!' : 'Welcome to the Anti-Raid System!',
                    lang === 'es'
                        ? 'Ahora tienes acceso a la configuración avanzada de protección anti-raid para este servidor.'
                        : 'You now have access to advanced anti-raid protection settings for this server.',
                    [
                        { name: lang === 'es' ? 'Comandos clave' : 'Key Commands', value: '`/antiraid ayuda`, `/antiraid estado`, `/antiraid protecciones`, `/antiraid whitelist`, `/antiraid blacklist`, `/antiraid mantenimiento`, `/antiraid sensibilidad`', inline: false },
                        { name: lang === 'es' ? 'Ayuda' : 'Help', value: lang === 'es' ? 'Usa `/antiraid ayuda` o `/help` para ver toda la documentación y ejemplos.' : 'Use `/antiraid ayuda` or `/help` to see all documentation and examples.', inline: false },
                        { name: lang === 'es' ? 'Recomendaciones' : 'Recommendations', value: lang === 'es'
                            ? '• Configura un canal de logs y un canal privado de admins.\n• Revisa la whitelist y blacklist.\n• Ajusta la sensibilidad y canales excluidos según tu comunidad.'
                            : '• Set up a logs channel and a private admin channel.\n• Review the whitelist and blacklist.\n• Adjust sensitivity and excluded channels as needed.' }
                    ],
                    lang === 'es' ? 'Sistema Anti-Raid avanzado' : 'Advanced Anti-Raid System'
                );
                try {
                    await newMember.send({ embeds: [embed] });
                } catch {}
            }
        });
    }

    constructor(client) {
        this.client = client;
        this.joinLogs = new Map(); // guildId => [{timestamp, userId}]
        this.channelCreateLogs = new Map(); // guildId => { userId: [timestamps] }
        this.channelDeleteLogs = new Map(); // guildId => { userId: [timestamps] }
        this.setupListeners();
        this.startLogCleanup();
        this.checkVersionUpdate();
        this.startWeeklySummary();
        this.setupAdminWelcome();
    }

    setupListeners() {
        this.client.on(Events.GuildMemberAdd, (member) => {
            this.handleMemberJoin(member);
            this.handleBotJoin(member);
        });
        this.client.on(Events.ChannelCreate, (channel) => this.handleChannelCreate(channel));
        this.client.on(Events.ChannelDelete, (channel) => this.handleChannelDelete(channel));
        this.client.on(Events.GuildMemberRemove, (member) => {
            this.cleanupUserLogs(member.guild.id, member.id);
        });
        this.setupMentionSpamProtection();
        this.setupRoleChangeProtection();
        this.setupRolePermissionChangeProtection();
        this.setupMessageDeleteProtection();
        this.setupWebhookProtection();
        this.setupInviteRaidProtection();
        this.setupChannelTopicCategoryProtection();
    }

    // --- Utilidad: obtener admins para alertas ---
    async getAdmins(guild) {
        const members = await guild.members.fetch();
        return members.filter(m => m.permissions.has(PermissionsBitField.Flags.Administrator));
    }

    // --- Enviar alerta a admins por DM ---
    async alertAdmins(guild, message) {
        const admins = await this.getAdmins(guild);
        admins.forEach(async admin => {
            try {
                await admin.send(`[AntiRaid][${guild.name}] ${message}`);
            } catch {}
        });
    }

    // --- Logs visuales (embeds) ---
    sendEmbedLog(guild, title, description, color = 0xff0000, fields = []) {
        const embed = createEmbed(
            title,
            description,
            fields,
            '🛡️ Anti-Raid'
        );
        return embed;
    }

    async notifyAdminsFallback(guild, message) {
        try {
            const admins = await this.getAdmins(guild);
            for (const admin of admins.values()) {
                try { await admin.send(message); } catch {}
            }
        } catch {}
    }

    logAction(guild, message, extra = {}, msgKey = null, msgVars = {}) {
        const config = AntiRaidConfig.getGuildConfig(guild.id);
        const lang = config.language || 'es';
        const now = new Date().toLocaleString();
        let logMsg = `[${now}] ${message}`;
        if (msgKey) logMsg = `[${now}] ` + getMsg(lang, msgKey, msgVars);
        if (extra && Object.keys(extra).length) {
            logMsg += `\nDetalles: ${JSON.stringify(extra)}`;
        }
        // Guardar en historial
        config.eventHistory = config.eventHistory || [];
        config.eventHistory.push(logMsg);
        if (config.eventHistory.length > 50) config.eventHistory = config.eventHistory.slice(-50);
        AntiRaidConfig.updateGuildConfig(guild.id, { eventHistory: config.eventHistory });
        // Log visual en canal
        const embed = this.sendEmbedLog(
            guild,
            '🛡️ Anti-Raid',
            logMsg,
            0xff0000,
            extra && Object.keys(extra).length ? [{ name: 'Detalles', value: '```json\n' + JSON.stringify(extra, null, 2) + '```' }] : []
        );
        let notified = false;
        if (config.logChannel) {
            const channel = guild.channels.cache.get(config.logChannel);
            if (channel) { channel.send({ embeds: [embed] }).catch(() => {}); notified = true; }
        }
        if (config.adminAlertChannel) {
            const channel = guild.channels.cache.get(config.adminAlertChannel);
            if (channel) { channel.send({ embeds: [embed] }).catch(() => {}); notified = true; }
        }
        if (!notified) {
            this.notifyAdminsFallback(guild, logMsg);
        }
        console.log(`[AntiRaid][${guild.name}] ${logMsg}`);
    }

    // --- Manejo de errores críticos ---
    async handleCriticalError(guild, error, context = '') {
        const config = AntiRaidConfig.getGuildConfig(guild.id);
        const lang = config.language || 'es';
        const msg = `❌ [Anti-Raid] Error crítico${context ? ' en ' + context : ''}:\n${error?.stack || error}`;
        if (config.adminAlertChannel) {
            const channel = guild.channels.cache.get(config.adminAlertChannel);
            if (channel) channel.send(msg).catch(() => this.notifyAdminsFallback(guild, msg));
            else this.notifyAdminsFallback(guild, msg);
        } else {
            this.notifyAdminsFallback(guild, msg);
        }
        console.error(msg);
    }

    // --- Cooldown anti-raid ---
    canTriggerAction(guildId) {
        const config = AntiRaidConfig.getGuildConfig(guildId);
        const now = Date.now();
        if (now - (config.lastAction || 0) < (config.cooldown || 120) * 1000) {
            return false;
        }
        AntiRaidConfig.updateGuildConfig(guildId, { lastAction: now });
        return true;
    }

    // --- Consulta a listas públicas de usuarios/bots tóxicos (global banlist) ---
    async isGloballyBanned(userId) {
        // Puedes reemplazar esta URL por una lista real o usar una local
        const globalBanList = [
            '123456789012345678', // Ejemplo de userID baneado globalmente
            '987654321098765432'
        ];
        // También podrías hacer fetch a una API pública aquí
        return globalBanList.includes(userId);
    }

    async handleMemberJoin(member) {
        const guildId = member.guild.id;
        const config = AntiRaidConfig.getGuildConfig(guildId);
        if (!config.enabled) return;
        if (await this.isGloballyBanned(member.id)) {
            await member.ban({ reason: 'Anti-raid: usuario en global banlist' });
            this.logAction(member.guild, `🚫 Usuario <@${member.id}> baneado por estar en la global banlist.`);
            await this.alertAdmins(member.guild, `🚫 Usuario <@${member.id}> baneado por estar en la global banlist.`);
            return;
        }
        if (this.isWhitelisted(guildId, member.id, member)) return;
        // Protección contra bots nuevos
        const minAccountAge = 24 * 60 * 60 * 1000; // 1 día
        if (member.user.createdTimestamp > Date.now() - minAccountAge) {
            await this.logAction(member.guild, `⚠️ Usuario nuevo detectado: <@${member.id}> (cuenta creada hace menos de 1 día)`, { userId: member.id, createdAt: member.user.createdAt });
            if (config.autoBan && this.canTriggerAction(guildId)) {
                await member.ban({ reason: 'Anti-raid: cuenta nueva' });
                await this.alertAdmins(member.guild, `Usuario <@${member.id}> baneado por cuenta nueva.`);
            }
            return;
        }
        const now = Date.now();
        if (!this.joinLogs.has(guildId)) this.joinLogs.set(guildId, []);
        const logs = this.joinLogs.get(guildId);
        logs.push({ timestamp: now, userId: member.id });
        // Limpiar logs antiguos
        const windowMs = config.raidThreshold.seconds * 1000;
        const recent = logs.filter(e => now - e.timestamp < windowMs);
        this.joinLogs.set(guildId, recent);
        if (recent.length >= config.raidThreshold.users && this.canTriggerAction(guildId)) {
            this.logAction(member.guild, `🚨 **Posible raid detectado:** ${recent.length} usuarios en ${config.raidThreshold.seconds}s.`, { users: recent.map(e => e.userId) });
            await this.alertAdmins(member.guild, `🚨 Raid detectado: ${recent.length} usuarios en ${config.raidThreshold.seconds}s.`);
            if (config.autoBan && !config.alertOnly) {
                for (const e of recent) {
                    try {
                        const m = member.guild.members.cache.get(e.userId);
                        if (m && !this.isWhitelisted(guildId, m.id, m)) await this.safeBan(m, 'Anti-raid: ingreso masivo');
                    } catch (err) {
                        this.logAction(member.guild, `❌ Error al banear usuario ${e.userId}: ${err.message}`);
                    }
                }
                this.logAction(member.guild, `🔨 Usuarios baneados automáticamente por raid.`);
            }
        }
    }

    // --- Detección de raids de bots (bots uniéndose en masa) ---
    async handleBotJoin(member) {
        const guildId = member.guild.id;
        const config = AntiRaidConfig.getGuildConfig(guildId);
        if (!config.enabled) return;
        if (!member.user.bot) return;
        if (await this.isGloballyBanned(member.id)) {
            await member.ban({ reason: 'Anti-raid: bot en global banlist' });
            this.logAction(member.guild, `🚫 Bot <@${member.id}> baneado por estar en la global banlist.`);
            await this.alertAdmins(member.guild, `🚫 Bot <@${member.id}> baneado por estar en la global banlist.`);
            return;
        }
        const now = Date.now();
        if (!this.botJoinLogs) this.botJoinLogs = new Map();
        if (!this.botJoinLogs.has(guildId)) this.botJoinLogs.set(guildId, []);
        const logs = this.botJoinLogs.get(guildId);
        logs.push(now);
        // Limpiar logs antiguos
        const windowMs = 60 * 1000;
        const recent = logs.filter(ts => now - ts < windowMs);
        this.botJoinLogs.set(guildId, recent);
        if (recent.length >= 3 && this.canTriggerAction(guildId)) {
            this.logAction(member.guild, `🚨 Raid de bots detectado: ${recent.length} bots en ${windowMs/1000}s.`);
            await this.alertAdmins(member.guild, `🚨 Raid de bots detectado: ${recent.length} bots en ${windowMs/1000}s.`);
            if (config.autoBan && !config.alertOnly) {
                for (const m of member.guild.members.cache.filter(m => m.user.bot)) {
                    try {
                        await this.safeBan(m, 'Anti-raid: raid de bots');
                    } catch {}
                }
                this.logAction(member.guild, `🔨 Bots baneados automáticamente por raid de bots.`);
            }
        }
    }

    // --- Detección de creación rápida de canales ---
    async handleChannelCreate(channel) {
        if (!channel.guild) return;
        const guildId = channel.guild.id;
        const config = AntiRaidConfig.getGuildConfig(guildId);
        if (!config.enabled) return;
        let entry;
        try {
            const audit = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 5 });
            entry = audit.entries.find(e => e.target.id === channel.id);
        } catch (err) {
            this.logAction(channel.guild, `❌ No se pudo obtener logs de auditoría para creación de canal: ${err.message}`);
            return;
        }
        if (!entry) return;
        const userId = entry.executor.id;
        if (this.isWhitelisted(guildId, userId, channel.guild.members.cache.get(userId))) return;
        if (!this.channelCreateLogs.has(guildId)) this.channelCreateLogs.set(guildId, {});
        const userLogs = this.channelCreateLogs.get(guildId);
        if (!userLogs[userId]) userLogs[userId] = [];
        const now = Date.now();
        userLogs[userId].push(now);
        const windowMs = config.channelCreateLimit.seconds * 1000;
        userLogs[userId] = userLogs[userId].filter(ts => now - ts < windowMs);
        if (userLogs[userId].length >= config.channelCreateLimit.count) {
            this.logAction(channel.guild, `🚨 **Creación masiva de canales detectada:** <@${userId}> creó ${userLogs[userId].length} canales en ${config.channelCreateLimit.seconds}s.`);
            if (config.autoBan) {
                try {
                    await this.safeBan(channel.guild.members.cache.get(userId), 'Anti-raid: creación masiva de canales');
                    this.logAction(channel.guild, `🔨 Usuario baneado automáticamente por creación masiva de canales.`);
                } catch (err) {
                    this.logAction(channel.guild, `❌ Error al banear usuario ${userId}: ${err.message}`);
                }
            }
        }
    }

    // --- Detección de eliminación rápida de canales ---
    async handleChannelDelete(channel) {
        if (!channel.guild) return;
        const guildId = channel.guild.id;
        const config = AntiRaidConfig.getGuildConfig(guildId);
        if (!config.enabled) return;
        let entry;
        try {
            const audit = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 5 });
            entry = audit.entries.find(e => e.target.id === channel.id);
        } catch (err) {
            this.logAction(channel.guild, `❌ No se pudo obtener logs de auditoría para eliminación de canal: ${err.message}`);
            return;
        }
        if (!entry) return;
        const userId = entry.executor.id;
        if (this.isWhitelisted(guildId, userId, channel.guild.members.cache.get(userId))) return;
        if (!this.channelDeleteLogs.has(guildId)) this.channelDeleteLogs.set(guildId, {});
        const userLogs = this.channelDeleteLogs.get(guildId);
        if (!userLogs[userId]) userLogs[userId] = [];
        const now = Date.now();
        userLogs[userId].push(now);
        const windowMs = config.channelDeleteLimit.seconds * 1000;
        userLogs[userId] = userLogs[userId].filter(ts => now - ts < windowMs);
        if (userLogs[userId].length >= config.channelDeleteLimit.count) {
            this.logAction(channel.guild, `🚨 **Eliminación masiva de canales detectada:** <@${userId}> eliminó ${userLogs[userId].length} canales en ${config.channelDeleteLimit.seconds}s.`);
            if (config.autoBan) {
                try {
                    await this.safeBan(channel.guild.members.cache.get(userId), 'Anti-raid: eliminación masiva de canales');
                    this.logAction(channel.guild, `🔨 Usuario baneado automáticamente por eliminación masiva de canales.`);
                } catch (err) {
                    this.logAction(channel.guild, `❌ Error al banear usuario ${userId}: ${err.message}`);
                }
            }
        }
    }

    // --- Métodos de whitelist, logs y utilidades ---
    isWhitelisted(guildId, userId, member) {
        const config = AntiRaidConfig.getGuildConfig(guildId);
        if (config.whitelist.users.includes(userId)) return true;
        if (member && member.roles.cache.some(r => config.whitelist.roles.includes(r.id))) return true;
        return false;
    }

    // --- Desban automático tras X minutos ---
    async scheduleUnban(guild, userId, minutes) {
        setTimeout(async () => {
            try {
                await guild.members.unban(userId, 'Desban automático por anti-raid');
                this.logAction(guild, `⏳ Usuario <@${userId}> desbaneado automáticamente tras ${minutes} minutos.`);
            } catch {}
        }, minutes * 60 * 1000);
    }

    // --- Verifica si usuario/rol está en blacklist ---
    isBlacklisted(guildId, userId, member) {
        const config = AntiRaidConfig.getGuildConfig(guildId);
        if (config.blacklist.users.includes(userId)) return true;
        if (member && member.roles.cache.some(r => config.blacklist.roles.includes(r.id))) return true;
        return false;
    }

    // --- Protección antiphishing (links sospechosos) ---
    isSuspiciousLink(content) {
        // Lista básica de dominios sospechosos (puedes expandirla)
        const badDomains = [
            'discord-gift', 'free-nitro', 'airdrop', 'steamgift', 'nitrofree', 'xn--', 'discordapp.gift',
            'discordnitro', 'giveaway', 'gift-discord', 'nitro-discord', 'discord-airdrop', 'bit.ly', 'tinyurl.com'
        ];
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const links = content.match(urlRegex) || [];
        return links.some(link => badDomains.some(domain => link.includes(domain)));
    }

    setupMentionSpamProtection() {
        this.client.on(Events.MessageCreate, async message => {
            if (!message.guild || message.author.bot) return;
            const config = AntiRaidConfig.getGuildConfig(message.guild.id);
            if (!config.enabled) return;
            if (this.isWhitelisted(message.guild.id, message.author.id, message.member)) return;
            if (this.isBlacklisted(message.guild.id, message.author.id, message.member)) {
                await this.safeBan(message.member, 'Anti-raid: usuario en blacklist');
                this.logAction(message.guild, `🚫 Usuario <@${message.author.id}> baneado por estar en blacklist (mensaje).`);
                return;
            }
            // --- Protección antiphishing ---
            if (this.isSuspiciousLink(message.content)) {
                await message.delete().catch(() => {});
                this.logAction(message.guild, `⚠️ Mensaje con link sospechoso eliminado de <@${message.author.id}>`, { content: message.content });
                await this.alertAdmins(message.guild, `⚠️ Mensaje con link sospechoso de <@${message.author.id}> eliminado.`);
                if (config.autoBan && !config.alertOnly && this.canTriggerAction(message.guild.id)) {
                    await this.safeBan(message.member, 'Anti-raid: link sospechoso');
                    this.logAction(message.guild, `🔨 Usuario baneado por link sospechoso.`);
                    if (config.autoUnban && config.autoUnban.enabled) {
                        this.scheduleUnban(message.guild, message.author.id, config.autoUnban.minutes);
                    }
                }
                return;
            }
            // --- Protección contra spam de emojis personalizados ---
            const emojiRegex = /<a?:\w+:\d+>/g;
            const emojiMatches = message.content.match(emojiRegex) || [];
            const emojiLimit = 8;
            if (emojiMatches.length >= emojiLimit) {
                this.logAction(message.guild, `⚠️ Spam de emojis detectado: <@${message.author.id}> usó ${emojiMatches.length} emojis personalizados.`, { emojis: emojiMatches });
                await this.alertAdmins(message.guild, `⚠️ Spam de emojis detectado: <@${message.author.id}> usó ${emojiMatches.length} emojis personalizados.`);
                if (config.autoBan && !config.alertOnly && this.canTriggerAction(message.guild.id)) {
                    await this.safeBan(message.member, 'Anti-raid: spam de emojis personalizados');
                    this.logAction(message.guild, `🔨 Usuario baneado por spam de emojis personalizados.`);
                    if (config.autoUnban && config.autoUnban.enabled) {
                        this.scheduleUnban(message.guild, message.author.id, config.autoUnban.minutes);
                    }
                }
                return;
            }
            // --- Protección anti-flood ---
            const floodLimit = 7; // mensajes
            const floodWindow = 5 * 1000; // 5 segundos
            if (!this.floodLogs) this.floodLogs = new Map();
            if (!this.floodLogs.has(message.guild.id)) this.floodLogs.set(message.guild.id, {});
            const floodUserLogs = this.floodLogs.get(message.guild.id);
            if (!floodUserLogs[message.author.id]) floodUserLogs[message.author.id] = [];
            floodUserLogs[message.author.id].push(Date.now());
            floodUserLogs[message.author.id] = floodUserLogs[message.author.id].filter(ts => Date.now() - ts < floodWindow);
            if (floodUserLogs[message.author.id].length >= floodLimit) {
                this.logAction(message.guild, `⚠️ Anti-flood: <@${message.author.id}> envió ${floodUserLogs[message.author.id].length} mensajes en ${floodWindow/1000}s.`, { count: floodUserLogs[message.author.id].length });
                await this.alertAdmins(message.guild, `⚠️ Anti-flood: <@${message.author.id}> envió ${floodUserLogs[message.author.id].length} mensajes en ${floodWindow/1000}s.`);
                if (config.autoBan && !config.alertOnly && this.canTriggerAction(message.guild.id)) {
                    await this.safeBan(message.member, 'Anti-raid: flood de mensajes');
                    this.logAction(message.guild, `🔨 Usuario baneado por flood de mensajes.`);
                    if (config.autoUnban && config.autoUnban.enabled) {
                        this.scheduleUnban(message.guild, message.author.id, config.autoUnban.minutes);
                    }
                }
                return;
            }
            const mentionLimit = 5;
            const windowMs = 10 * 1000;
            if (!this.mentionLogs) this.mentionLogs = new Map();
            if (!this.mentionLogs.has(message.guild.id)) this.mentionLogs.set(message.guild.id, {});
            const userLogs = this.mentionLogs.get(message.guild.id);
            if (!userLogs[message.author.id]) userLogs[message.author.id] = [];
            const now = Date.now();
            userLogs[message.author.id].push(now);
            userLogs[message.author.id] = userLogs[message.author.id].filter(ts => now - ts < windowMs);
            if (message.mentions.users.size >= mentionLimit || userLogs[message.author.id].length >= 3) {
                this.logAction(message.guild, `⚠️ Spam de menciones detectado: <@${message.author.id}>`, { mentions: message.mentions.users.map(u => u.id) });
                if (config.autoBan && !config.alertOnly && this.canTriggerAction(message.guild.id)) {
                    await this.safeBan(message.member, 'Anti-raid: spam de menciones');
                    this.logAction(message.guild, `🔨 Usuario baneado por spam de menciones.`);
                    if (config.autoUnban && config.autoUnban.enabled) {
                        this.scheduleUnban(message.guild, message.author.id, config.autoUnban.minutes);
                    }
                }
            }
        });
    }

    // --- Protección contra cambios masivos de roles ---
    setupRoleChangeProtection() {
        this.client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
            if (!newMember.guild) return;
            const config = AntiRaidConfig.getGuildConfig(newMember.guild.id);
            if (!config.enabled) return;
            if (this.isWhitelisted(newMember.guild.id, newMember.id, newMember)) return;
            if (this.isBlacklisted(newMember.guild.id, newMember.id, newMember)) {
                await this.safeBan(newMember, 'Anti-raid: usuario en blacklist');
                this.logAction(newMember.guild, `🚫 Usuario <@${newMember.id}> baneado por estar en blacklist (roles).`);
                return;
            }
            // --- Protección contra cambios masivos de roles ---
            const diff = Math.abs(newMember.roles.cache.size - oldMember.roles.cache.size);
            const windowMs = 60 * 1000;
            if (!this.roleChangeLogs) this.roleChangeLogs = new Map();
            if (!this.roleChangeLogs.has(newMember.guild.id)) this.roleChangeLogs.set(newMember.guild.id, {});
            const userLogs = this.roleChangeLogs.get(newMember.guild.id);
            if (!userLogs[newMember.id]) userLogs[newMember.id] = [];
            const now = Date.now();
            userLogs[newMember.id].push(now);
            userLogs[newMember.id] = userLogs[newMember.id].filter(ts => now - ts < windowMs);
            if (diff >= 3 || userLogs[newMember.id].length >= 3) {
                this.logAction(newMember.guild, `⚠️ Cambios masivos de roles detectados: <@${newMember.id}>`, { diff });
                if (config.autoBan && !config.alertOnly && this.canTriggerAction(newMember.guild.id)) {
                    await this.safeBan(newMember, 'Anti-raid: cambios masivos de roles');
                    this.logAction(newMember.guild, `🔨 Usuario baneado por cambios masivos de roles.`);
                    if (config.autoUnban && config.autoUnban.enabled) {
                        this.scheduleUnban(newMember.guild, newMember.id, config.autoUnban.minutes);
                    }
                }
            }
            // --- Protección contra cambios masivos de nick ---
            if (oldMember.nickname !== newMember.nickname) {
                if (!this.nickChangeLogs) this.nickChangeLogs = new Map();
                if (!this.nickChangeLogs.has(newMember.guild.id)) this.nickChangeLogs.set(newMember.guild.id, {});
                const nickLogs = this.nickChangeLogs.get(newMember.guild.id);
                if (!nickLogs[newMember.id]) nickLogs[newMember.id] = [];
                nickLogs[newMember.id].push(now);
                nickLogs[newMember.id] = nickLogs[newMember.id].filter(ts => now - ts < windowMs);
                if (nickLogs[newMember.id].length >= 3) {
                    this.logAction(newMember.guild, `⚠️ Cambios masivos de nick detectados: <@${newMember.id}>`, { count: nickLogs[newMember.id].length });
                    await this.alertAdmins(newMember.guild, `⚠️ Cambios masivos de nick detectados: <@${newMember.id}>`);
                    if (config.autoBan && !config.alertOnly && this.canTriggerAction(newMember.guild.id)) {
                        await this.safeBan(newMember, 'Anti-raid: cambios masivos de nick');
                        this.logAction(newMember.guild, `🔨 Usuario baneado por cambios masivos de nick.`);
                        if (config.autoUnban && config.autoUnban.enabled) {
                            this.scheduleUnban(newMember.guild, newMember.id, config.autoUnban.minutes);
                        }
                    }
                }
            }
        });
    }

    // --- Protección contra cambios masivos de permisos en roles ---
    setupRolePermissionChangeProtection() {
        this.client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
            const config = AntiRaidConfig.getGuildConfig(newGuild.id);
            if (!config.enabled) return;
            // Cambios críticos en configuración del servidor
            let criticalChange = false;
            let changes = [];
            if (oldGuild.name !== newGuild.name) { criticalChange = true; changes.push('nombre'); }
            if (oldGuild.icon !== newGuild.icon) { criticalChange = true; changes.push('icono'); }
            if (oldGuild.afkChannelId !== newGuild.afkChannelId) { criticalChange = true; changes.push('canal AFK'); }
            if (oldGuild.verificationLevel !== newGuild.verificationLevel) { criticalChange = true; changes.push('nivel de verificación'); }
            if (criticalChange) {
                this.logAction(newGuild, `⚠️ Cambio crítico en la configuración del servidor: ${changes.join(', ')}`);
                await this.alertAdmins(newGuild, `⚠️ Cambio crítico en la configuración del servidor: ${changes.join(', ')}`);
            }
        });
        this.client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
            const guild = newRole.guild;
            const config = AntiRaidConfig.getGuildConfig(guild.id);
            if (!config.enabled) return;
            // Detectar permisos peligrosos
            const dangerousPerms = [
                PermissionsBitField.Flags.Administrator,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.ManageRoles,
                PermissionsBitField.Flags.ManageGuild,
                PermissionsBitField.Flags.BanMembers,
                PermissionsBitField.Flags.KickMembers
            ];
            const addedPerms = dangerousPerms.filter(perm => !oldRole.permissions.has(perm) && newRole.permissions.has(perm));
            if (addedPerms.length > 0) {
                this.logAction(guild, `⚠️ Permisos peligrosos añadidos al rol <@&${newRole.id}>: ${addedPerms.map(p => p.toString()).join(', ')}`);
                await this.alertAdmins(guild, `⚠️ Permisos peligrosos añadidos al rol <@&${newRole.id}>.`);
            }
        });
    }

    // --- Protección contra eliminación masiva de mensajes ---
    setupMessageDeleteProtection() {
        this.client.on(Events.MessageDelete, async message => {
            if (!message.guild || !message.author) return;
            const config = AntiRaidConfig.getGuildConfig(message.guild.id);
            if (!config.enabled) return;
            if (!this.massDeleteLogs) this.massDeleteLogs = new Map();
            if (!this.massDeleteLogs.has(message.guild.id)) this.massDeleteLogs.set(message.guild.id, {});
            const userLogs = this.massDeleteLogs.get(message.guild.id);
            const userId = message.author.id;
            if (!userLogs[userId]) userLogs[userId] = [];
            userLogs[userId].push(Date.now());
            userLogs[userId] = userLogs[userId].filter(ts => Date.now() - ts < 10000);
            if (userLogs[userId].length >= 5) {
                this.logAction(message.guild, `⚠️ Eliminación masiva de mensajes detectada: <@${userId}> eliminó ${userLogs[userId].length} mensajes en 10s.`);
                await this.alertAdmins(message.guild, `⚠️ Eliminación masiva de mensajes detectada: <@${userId}> eliminó ${userLogs[userId].length} mensajes en 10s.`);
            }
        });
    }

    // --- Protección contra creación de webhooks sospechosos ---
    setupWebhookProtection() {
        this.client.on(Events.WebhooksUpdate, async channel => {
            const config = AntiRaidConfig.getGuildConfig(channel.guild.id);
            if (!config.enabled) return;
            try {
                const webhooks = await channel.fetchWebhooks();
                for (const webhook of webhooks.values()) {
                    if (!config.whitelist.users.includes(webhook.ownerId)) {
                        this.logAction(channel.guild, `⚠️ Webhook sospechoso creado en <#${channel.id}> por <@${webhook.ownerId}>.`);
                        await this.alertAdmins(channel.guild, `⚠️ Webhook sospechoso creado en <#${channel.id}> por <@${webhook.ownerId}>.`);
                    }
                }
            } catch {}
        });
    }

    // --- Protección contra raids de invitaciones ---
    setupInviteRaidProtection() {
        this.client.on(Events.InviteCreate, async invite => {
            const config = AntiRaidConfig.getGuildConfig(invite.guild.id);
            if (!config.enabled) return;
            if (!this.inviteLogs) this.inviteLogs = new Map();
            if (!this.inviteLogs.has(invite.guild.id)) this.inviteLogs.set(invite.guild.id, []);
            const logs = this.inviteLogs.get(invite.guild.id);
            logs.push(Date.now());
            const now = Date.now();
            const recent = logs.filter(ts => now - ts < 60000);
            this.inviteLogs.set(invite.guild.id, recent);
            if (recent.length >= 5) {
                this.logAction(invite.guild, `⚠️ Raid de invitaciones detectado: ${recent.length} invitaciones creadas en 1 minuto.`);
                await this.alertAdmins(invite.guild, `⚠️ Raid de invitaciones detectado: ${recent.length} invitaciones creadas en 1 minuto.`);
            }
        });
    }

    // --- Protección contra cambios masivos de temas/categorías ---
    setupChannelTopicCategoryProtection() {
        this.client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
            if (!newChannel.guild) return;
            const config = AntiRaidConfig.getGuildConfig(newChannel.guild.id);
            if (!config.enabled) return;
            if (!this.topicLogs) this.topicLogs = new Map();
            if (!this.topicLogs.has(newChannel.guild.id)) this.topicLogs.set(newChannel.guild.id, {});
            const userLogs = this.topicLogs.get(newChannel.guild.id);
            // Solo para canales de texto/categoría
            if (oldChannel.topic !== newChannel.topic || oldChannel.parentId !== newChannel.parentId) {
                const executorId = (await newChannel.guild.fetchAuditLogs({ type: 11, limit: 1 })).entries.first()?.executor?.id;
                if (!executorId) return;
                if (!userLogs[executorId]) userLogs[executorId] = [];
                userLogs[executorId].push(Date.now());
                userLogs[executorId] = userLogs[executorId].filter(ts => Date.now() - ts < 60000);
                if (userLogs[executorId].length >= 3) {
                    this.logAction(newChannel.guild, `⚠️ Cambios masivos de temas/categorías detectados: <@${executorId}>`, { count: userLogs[executorId].length });
                    await this.alertAdmins(newChannel.guild, `⚠️ Cambios masivos de temas/categorías detectados: <@${executorId}>`);
                }
            }
        });
    }

    setupListeners() {
        this.client.on(Events.GuildMemberAdd, (member) => {
            this.handleMemberJoin(member);
            this.handleBotJoin(member);
        });
        this.client.on(Events.ChannelCreate, (channel) => this.handleChannelCreate(channel));
        this.client.on(Events.ChannelDelete, (channel) => this.handleChannelDelete(channel));
        this.client.on(Events.GuildMemberRemove, (member) => {
            this.cleanupUserLogs(member.guild.id, member.id);
        });
        this.setupMentionSpamProtection();
        this.setupRoleChangeProtection();
        this.setupRolePermissionChangeProtection();
        this.setupMessageDeleteProtection();
        this.setupWebhookProtection();
        this.setupInviteRaidProtection();
        this.setupChannelTopicCategoryProtection();
    }

    // Limpieza de logs si un usuario sale del servidor
    cleanupUserLogs(guildId, userId) {
        if (this.joinLogs.has(guildId)) {
            this.joinLogs.set(guildId, this.joinLogs.get(guildId).filter(e => e.userId !== userId));
        }
        if (this.channelCreateLogs.has(guildId)) {
            const userLogs = this.channelCreateLogs.get(guildId);
            delete userLogs[userId];
        }
        if (this.channelDeleteLogs.has(guildId)) {
            const userLogs = this.channelDeleteLogs.get(guildId);
            delete userLogs[userId];
        }
        if (this.mentionLogs && this.mentionLogs.has(guildId)) {
            const userLogs = this.mentionLogs.get(guildId);
            delete userLogs[userId];
        }
        if (this.floodLogs && this.floodLogs.has(guildId)) {
            const userLogs = this.floodLogs.get(guildId);
            delete userLogs[userId];
        }
        if (this.nickChangeLogs && this.nickChangeLogs.has(guildId)) {
            const userLogs = this.nickChangeLogs.get(guildId);
            delete userLogs[userId];
        }
        if (this.roleChangeLogs && this.roleChangeLogs.has(guildId)) {
            const userLogs = this.roleChangeLogs.get(guildId);
            delete userLogs[userId];
        }
        if (this.massDeleteLogs && this.massDeleteLogs.has(guildId)) {
            const userLogs = this.massDeleteLogs.get(guildId);
            delete userLogs[userId];
        }
    }

    // --- Refuerzo: ban inmediato y protección ante evasión ---
    async safeBan(member, reason) {
        try {
            if (!member || !member.guild) return;
            if (member.id === this.client.user.id) return; // No banear al bot
            if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
            if (member.user.bot && member.id !== this.client.user.id) {
                await member.ban({ reason });
                return;
            }
            // No banear a usuarios con permisos críticos
            const criticalPerms = [
                PermissionsBitField.Flags.Administrator,
                PermissionsBitField.Flags.ManageGuild,
                PermissionsBitField.Flags.BanMembers,
                PermissionsBitField.Flags.KickMembers
            ];
            if (criticalPerms.some(p => member.permissions.has(p))) return;
            await member.ban({ reason });
        } catch (err) {
            try {
                await member.guild.members.ban(member.id, { reason });
            } catch {}
        }
    }

    // --- Auto-ajuste de umbrales según actividad ---
    adjustThresholdsIfNeeded(guildId) {
        const config = AntiRaidConfig.getGuildConfig(guildId);
        // Si hay más de 30 mensajes/minuto en general, aumentar umbrales temporalmente
        if (!this.activityLogs) this.activityLogs = new Map();
        if (!this.activityLogs.has(guildId)) this.activityLogs.set(guildId, []);
        const logs = this.activityLogs.get(guildId);
        logs.push(Date.now());
        const now = Date.now();
        const recent = logs.filter(ts => now - ts < 60000);
        this.activityLogs.set(guildId, recent);
        if (recent.length > 30 && !config._ajusteActivo) {
            // Aumentar umbrales temporalmente
            config._ajusteActivo = true;
            config._originalThresholds = {
                raidThreshold: { ...config.raidThreshold },
                channelCreateLimit: { ...config.channelCreateLimit },
                channelDeleteLimit: { ...config.channelDeleteLimit }
            };
            AntiRaidConfig.updateGuildConfig(guildId, {
                raidThreshold: { users: config.raidThreshold.users * 2, seconds: config.raidThreshold.seconds },
                channelCreateLimit: { count: config.channelCreateLimit.count * 2, seconds: config.channelCreateLimit.seconds },
                channelDeleteLimit: { count: config.channelDeleteLimit.count * 2, seconds: config.channelDeleteLimit.seconds },
                _ajusteActivo: true,
                _originalThresholds: config._originalThresholds
            });
            setTimeout(() => {
                const c = AntiRaidConfig.getGuildConfig(guildId);
                if (c._ajusteActivo && c._originalThresholds) {
                    AntiRaidConfig.updateGuildConfig(guildId, {
                        raidThreshold: c._originalThresholds.raidThreshold,
                        channelCreateLimit: c._originalThresholds.channelCreateLimit,
                        channelDeleteLimit: c._originalThresholds.channelDeleteLimit,
                        _ajusteActivo: false,
                        _originalThresholds: null
                    });
                }
            }, 5 * 60 * 1000); // Restaurar tras 5 minutos
            this.logAction({ id: guildId, name: 'Auto-ajuste' }, '⚙️ Umbrales anti-raid aumentados temporalmente por alta actividad.');
        }
    }

    // --- Limpieza periódica de logs internos para evitar memory leaks ---
    startLogCleanup() {
        setInterval(() => {
            const now = Date.now();
            const maxAge = 2 * 60 * 60 * 1000; // 2 horas
            // Limpiar logs de menciones
            if (this.mentionLogs) {
                for (const [guildId, userLogs] of this.mentionLogs.entries()) {
                    for (const userId in userLogs) {
                        userLogs[userId] = userLogs[userId].filter(ts => now - ts < maxAge);
                        if (userLogs[userId].length === 0) delete userLogs[userId];
                    }
                }
            }
            // Limpiar logs de flood
            if (this.floodLogs) {
                for (const [guildId, userLogs] of this.floodLogs.entries()) {
                    for (const userId in userLogs) {
                        userLogs[userId] = userLogs[userId].filter(ts => now - ts < maxAge);
                        if (userLogs[userId].length === 0) delete userLogs[userId];
                    }
                }
            }
            // Limpiar logs de nick/roles
            if (this.nickChangeLogs) {
                for (const [guildId, userLogs] of this.nickChangeLogs.entries()) {
                    for (const userId in userLogs) {
                        userLogs[userId] = userLogs[userId].filter(ts => now - ts < maxAge);
                        if (userLogs[userId].length === 0) delete userLogs[userId];
                    }
                }
            }
            if (this.roleChangeLogs) {
                for (const [guildId, userLogs] of this.roleChangeLogs.entries()) {
                    for (const userId in userLogs) {
                        userLogs[userId] = userLogs[userId].filter(ts => now - ts < maxAge);
                        if (userLogs[userId].length === 0) delete userLogs[userId];
                    }
                }
            }
            // Limpiar logs de actividad/invitaciones/temas
            if (this.activityLogs) {
                for (const [guildId, arr] of this.activityLogs.entries()) {
                    this.activityLogs.set(guildId, arr.filter(ts => now - ts < maxAge));
                }
            }
            if (this.inviteLogs) {
                for (const [guildId, arr] of this.inviteLogs.entries()) {
                    this.inviteLogs.set(guildId, arr.filter(ts => now - ts < maxAge));
                }
            }
            if (this.topicLogs) {
                for (const [guildId, userLogs] of this.topicLogs.entries()) {
                    for (const userId in userLogs) {
                        userLogs[userId] = userLogs[userId].filter(ts => now - ts < maxAge);
                        if (userLogs[userId].length === 0) delete userLogs[userId];
                    }
                }
            }
            // Limitar tamaño de arrays de logs por usuario/guild
            const maxEntries = 100;
            const limitArray = arr => arr.length > maxEntries ? arr.slice(-maxEntries) : arr;
            [this.mentionLogs, this.floodLogs, this.nickChangeLogs, this.roleChangeLogs, this.activityLogs, this.inviteLogs, this.topicLogs].forEach(map => {
                if (!map) return;
                for (const [guildId, userLogs] of map.entries()) {
                    if (Array.isArray(userLogs)) {
                        map.set(guildId, limitArray(userLogs));
                    } else {
                        for (const userId in userLogs) {
                            userLogs[userId] = limitArray(userLogs[userId]);
                        }
                    }
                }
            });
        }, 60 * 60 * 1000); // Cada hora
    }

    // --- Notificación de actualización de versión ---
    checkVersionUpdate() {
        const fs = require('fs');
        const path = require('path');
        const versionFile = path.join(__dirname, '../../data/antiraid_version.json');
        let lastVersion = null;
        try {
            if (fs.existsSync(versionFile)) {
                lastVersion = JSON.parse(fs.readFileSync(versionFile, 'utf8')).version;
            }
        } catch {}
        if (lastVersion !== ANTI_RAID_VERSION) {
            // Notificar a todos los canales de admins configurados
            const configPath = path.join(__dirname, '../../data/antiRaidConfig.json');
            let allConfigs = {};
            try {
                allConfigs = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } catch {}
            for (const guildId in allConfigs) {
                const config = allConfigs[guildId];
                if (config.adminAlertChannel) {
                    this.client.channels.fetch(config.adminAlertChannel).then(channel => {
                        channel.send(`🆕 El sistema anti-raid ha sido actualizado a la versión ${ANTI_RAID_VERSION}. Consulta /antiraid ayuda para ver las novedades.`).catch(() => {});
                    }).catch(() => {});
                }
            }
            fs.writeFileSync(versionFile, JSON.stringify({ version: ANTI_RAID_VERSION }));
        }
    }

    // --- Panel de resumen semanal ---
    startWeeklySummary() {
        setInterval(() => {
            const fs = require('fs');
            const path = require('path');
            const configPath = path.join(__dirname, '../../data/antiRaidConfig.json');
            let allConfigs = {};
            try {
                allConfigs = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } catch {}
            for (const guildId in allConfigs) {
                const config = allConfigs[guildId];
                if (!config.adminAlertChannel) continue;
                const channel = this.client.channels.cache.get(config.adminAlertChannel);
                if (!channel) continue;
                // Analizar historial de eventos
                const events = config.eventHistory || [];
                const now = Date.now();
                const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
                const recent = events.filter(e => {
                    const match = e.match(/^\[(.*?)\]/);
                    if (!match) return false;
                    const date = new Date(match[1]);
                    return date.getTime() > weekAgo;
                });
                const stats = {
                    total: recent.length,
                    bans: recent.filter(e => e.includes('baneado')).length,
                    raids: recent.filter(e => e.includes('raid')).length,
                    spam: recent.filter(e => e.includes('spam')).length,
                    config: recent.filter(e => e.includes('configuración')).length
                };
                // Usuarios más reportados
                const userCounts = {};
                for (const e of recent) {
                    const match = e.match(/<@(\d+)>/g);
                    if (match) {
                        for (const m of match) {
                            const id = m.replace(/<@|>/g, '');
                            userCounts[id] = (userCounts[id] || 0) + 1;
                        }
                    }
                }
                const topUsers = Object.entries(userCounts).sort((a,b) => b[1]-a[1]).slice(0,3);
                const embed = createEmbed(
                    '🛡️ Resumen Semanal Anti-Raid',
                    'Estadísticas y eventos destacados de la última semana.',
                    [
                        { name: 'Eventos detectados', value: String(stats.total), inline: true },
                        { name: 'Baneos automáticos', value: String(stats.bans), inline: true },
                        { name: 'Raids detectados', value: String(stats.raids), inline: true },
                        { name: 'Spam/abuso', value: String(stats.spam), inline: true },
                        { name: 'Cambios de configuración', value: String(stats.config), inline: true },
                        { name: 'Usuarios más reportados', value: topUsers.length ? topUsers.map(([id, c]) => `<@${id}> (${c})`).join(', ') : 'Ninguno', inline: false },
                        { name: 'Recomendación', value: 'Revisa la whitelist, canales excluidos y la configuración si hubo muchos eventos.' }
                    ],
                    '🛡️ Resumen Semanal Anti-Raid'
                );
                channel.send({ embeds: [embed] }).catch(() => {});
            }
        }, 7 * 24 * 60 * 60 * 1000); // Cada semana
    }

    // --- Auto-limpieza de canales/roles eliminados en configuración ---
    cleanConfig(guild) {
        const config = AntiRaidConfig.getGuildConfig(guild.id);
        let changed = false;
        // Limpiar canales
        ['logChannel', 'adminAlertChannel', ...config.excludedChannels].forEach(id => {
            if (id && !guild.channels.cache.get(id)) {
                if (config.logChannel === id) { config.logChannel = null; changed = true; }
                if (config.adminAlertChannel === id) { config.adminAlertChannel = null; changed = true; }
                config.excludedChannels = config.excludedChannels.filter(cid => cid !== id); changed = true;
            }
        });
        // Limpiar roles
        ['permsRole', ...config.whitelist.roles, ...config.blacklist.roles].forEach(id => {
            if (id && !guild.roles.cache.get(id)) {
                if (config.permsRole === id) { config.permsRole = null; changed = true; }
                config.whitelist.roles = config.whitelist.roles.filter(rid => rid !== id); changed = true;
                config.blacklist.roles = config.blacklist.roles.filter(rid => rid !== id); changed = true;
            }
        });
        if (changed) AntiRaidConfig.updateGuildConfig(guild.id, config);
    }
}

module.exports = AntiRaidManager; 