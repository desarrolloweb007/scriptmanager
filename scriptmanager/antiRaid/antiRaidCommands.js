// antiRaidCommands.js
// Registro y manejo de slash commands para el sistema anti-raid
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AntiRaidConfig = require('./antiRaidConfig');
const messages = require('./antiRaidMessages');
const { createEmbed, getMsg } = require('../../utils/embedUtils');

// --- Definición de comandos slash ---
const antiRaidCommands = [
    new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('Comandos de configuración y control del sistema anti-raid')
        .addSubcommand(sub =>
            sub.setName('activar').setDescription('Activa el sistema anti-raid'))
        .addSubcommand(sub =>
            sub.setName('desactivar').setDescription('Desactiva el sistema anti-raid'))
        .addSubcommand(sub =>
            sub.setName('estado').setDescription('Muestra la configuración actual'))
        .addSubcommand(sub =>
            sub.setName('protecciones')
                .setDescription('Muestra el estado de todos los módulos de protección'))
        .addSubcommand(sub =>
            sub.setName('config')
                .setDescription('Configura parámetros del sistema')
                .addStringOption(opt =>
                    opt.setName('opcion')
                        .setDescription('Parámetro a configurar')
                        .setRequired(true)
                        .addChoices(
                            { name: 'logchannel', value: 'logchannel' },
                            { name: 'raid-threshold', value: 'raid-threshold' },
                            { name: 'canalcreate-limit', value: 'canalcreate-limit' },
                            { name: 'delete-limit', value: 'delete-limit' },
                            { name: 'auto-ban', value: 'auto-ban' },
                            { name: 'perms', value: 'perms' },
                            { name: 'adminchannel', value: 'adminchannel' },
                            { name: 'sensibilidad', value: 'sensibilidad' }
                        )
                )
                .addStringOption(opt =>
                    opt.setName('valor1').setDescription('Primer valor (ID, número, true/false, etc.)').setRequired(true))
                .addStringOption(opt =>
                    opt.setName('valor2').setDescription('Segundo valor (opcional)').setRequired(false))
        )
        .addSubcommandGroup(group =>
            group.setName('whitelist')
                .setDescription('Gestiona la whitelist del anti-raid')
                .addSubcommand(sub =>
                    sub.setName('add')
                        .setDescription('Agrega usuario o rol a la whitelist')
                        .addUserOption(opt =>
                            opt.setName('usuario').setDescription('Usuario a agregar').setRequired(false))
                        .addRoleOption(opt =>
                            opt.setName('rol').setDescription('Rol a agregar').setRequired(false))
                )
                .addSubcommand(sub =>
                    sub.setName('remove')
                        .setDescription('Elimina usuario o rol de la whitelist')
                        .addUserOption(opt =>
                            opt.setName('usuario').setDescription('Usuario a eliminar').setRequired(false))
                        .addRoleOption(opt =>
                            opt.setName('rol').setDescription('Rol a eliminar').setRequired(false))
                )
                .addSubcommand(sub =>
                    sub.setName('list').setDescription('Muestra la whitelist actual'))
        )
        .addSubcommandGroup(group =>
            group.setName('whitelisttemp')
                .setDescription('Gestiona la whitelist temporal del anti-raid')
                .addSubcommand(sub =>
                    sub.setName('add')
                        .setDescription('Agrega usuario o rol a la whitelist temporal')
                        .addUserOption(opt =>
                            opt.setName('usuario').setDescription('Usuario a agregar').setRequired(false))
                        .addRoleOption(opt =>
                            opt.setName('rol').setDescription('Rol a agregar').setRequired(false))
                        .addIntegerOption(opt =>
                            opt.setName('minutos').setDescription('Minutos de duración').setRequired(true))
                )
                .addSubcommand(sub =>
                    sub.setName('remove')
                        .setDescription('Elimina usuario o rol de la whitelist temporal')
                        .addUserOption(opt =>
                            opt.setName('usuario').setDescription('Usuario a eliminar').setRequired(false))
                        .addRoleOption(opt =>
                            opt.setName('rol').setDescription('Rol a eliminar').setRequired(false))
                )
                .addSubcommand(sub =>
                    sub.setName('list').setDescription('Muestra la whitelist temporal actual'))
        )
        .addSubcommand(sub =>
            sub.setName('panicmode')
                .setDescription('Activa o desactiva el modo pánico (bloqueo total)')
                .addStringOption(opt =>
                    opt.setName('estado').setDescription('on/off').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('sensibilidad')
                .setDescription('Ajusta la sensibilidad del anti-raid')
                .addStringOption(opt =>
                    opt.setName('nivel').setDescription('bajo/medio/alto').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('mantenimiento')
                .setDescription('Activa o desactiva el modo mantenimiento (desactiva el anti-raid temporalmente)')
                .addStringOption(opt =>
                    opt.setName('estado').setDescription('on/off').setRequired(true))
                .addIntegerOption(opt =>
                    opt.setName('minutos').setDescription('Minutos de duración (opcional)').setRequired(false)))
        .addSubcommandGroup(group =>
            group.setName('excludechannel')
                .setDescription('Gestiona canales excluidos del anti-raid')
                .addSubcommand(sub =>
                    sub.setName('add')
                        .setDescription('Excluye un canal')
                        .addChannelOption(opt =>
                            opt.setName('canal').setDescription('Canal a excluir').setRequired(true)))
                .addSubcommand(sub =>
                    sub.setName('remove')
                        .setDescription('Deja de excluir un canal')
                        .addChannelOption(opt =>
                            opt.setName('canal').setDescription('Canal a incluir').setRequired(true)))
                .addSubcommand(sub =>
                    sub.setName('list').setDescription('Muestra los canales excluidos'))
        )
        .addSubcommand(sub =>
            sub.setName('ayuda')
                .setDescription('Explica cada módulo y cómo configurarlo'))
        .addSubcommand(sub =>
            sub.setName('export')
                .setDescription('Exporta la configuración anti-raid de este servidor'))
        .addSubcommand(sub =>
            sub.setName('import')
                .setDescription('Importa una configuración anti-raid (adjunta un archivo JSON)'))
        .addSubcommand(sub =>
            sub.setName('diagnostico')
                .setDescription('Muestra un diagnóstico completo del sistema anti-raid'))
];

// --- Función para comprobar permisos de configuración ---
function hasAntiRaidPerms(member, guildId) {
    const config = AntiRaidConfig.getGuildConfig(guildId);
    if (!config.permsRole) return member.permissions.has(PermissionFlagsBits.Administrator);
    return member.roles.cache.has(config.permsRole) || member.permissions.has(PermissionFlagsBits.Administrator);
}

// --- Handler de interacción de comandos ---
async function handleAntiRaidCommand(interaction) {
    const guildId = interaction.guild.id;
    const member = interaction.member;
    const config = AntiRaidConfig.getGuildConfig(guildId);
    // Permisos
    if (!hasAntiRaidPerms(member, guildId)) {
        return interaction.reply({ content: '❌ No tienes permisos para usar los comandos de configuración anti-raid.', ephemeral: true });
    }
    // Subcomando principal
    const sub = interaction.options.getSubcommand?.() || interaction.options.getSubcommandGroup?.() || null;
    // --- Activar ---
    if (sub === 'activar') {
        AntiRaidConfig.updateGuildConfig(guildId, { enabled: true });
        return interaction.reply('✅ El sistema anti-raid ha sido **activado**.');
    }
    // --- Desactivar ---
    if (sub === 'desactivar') {
        AntiRaidConfig.updateGuildConfig(guildId, { enabled: false });
        return interaction.reply('⛔ El sistema anti-raid ha sido **desactivado**.');
    }
    // --- Estado ---
    if (sub === 'estado') {
        const estado = config.enabled ? '🟢 Activado' : '🔴 Desactivado';
        const log = config.logChannel ? `<#${config.logChannel}>` : 'No configurado';
        let mantenimiento = 'Desactivado';
        if (config.maintenanceMode && config.maintenanceMode.active) {
            const ms = config.maintenanceMode.until - Date.now();
            mantenimiento = ms > 0 ? `Activado (${Math.ceil(ms/60000)} min restantes)` : 'Activado';
        }
        return interaction.reply(
            `**Estado Anti-Raid:**\n${estado}\n` +
            `**Canal de logs:** ${log}\n` +
            `**Modo mantenimiento:** ${mantenimiento}\n` +
            `**Umbral de raid:** ${config.raidThreshold.users} usuarios en ${config.raidThreshold.seconds}s\n` +
            `**Límite creación canales:** ${config.channelCreateLimit.count} en ${config.channelCreateLimit.seconds}s\n` +
            `**Límite eliminación canales:** ${config.channelDeleteLimit.count} en ${config.channelDeleteLimit.seconds}s\n` +
            `**Auto-ban:** ${config.autoBan ? 'Sí' : 'No'}\n` +
            `**Rol de configuración:** ${config.permsRole ? `<@&${config.permsRole}>` : 'Solo admins'}\n` +
            `**Whitelist usuarios:** ${config.whitelist.users.length}\n` +
            `**Whitelist roles:** ${config.whitelist.roles.length}`
        );
    }
    // --- Configuración ---
    if (sub === 'config') {
        const opcion = interaction.options.getString('opcion');
        const valor1 = interaction.options.getString('valor1');
        const valor2 = interaction.options.getString('valor2');
        let update = {};
        switch (opcion) {
            case 'logchannel':
                update.logChannel = valor1.replace(/[^0-9]/g, '');
                break;
            case 'raid-threshold':
                update.raidThreshold = { users: parseInt(valor1), seconds: parseInt(valor2) };
                break;
            case 'canalcreate-limit':
                update.channelCreateLimit = { count: parseInt(valor1), seconds: parseInt(valor2) };
                break;
            case 'delete-limit':
                update.channelDeleteLimit = { count: parseInt(valor1), seconds: parseInt(valor2) };
                break;
            case 'auto-ban':
                update.autoBan = valor1 === 'true';
                break;
            case 'perms':
                update.permsRole = valor1.replace(/[^0-9]/g, '');
                break;
            case 'adminchannel':
                update.adminAlertChannel = valor1.replace(/[^0-9]/g, '');
                break;
            case 'sensibilidad':
                update.sensitivity = valor1;
                break;
            default:
                return interaction.reply('❌ Opción de configuración no válida.');
        }
        AntiRaidConfig.updateGuildConfig(guildId, update);
        return interaction.reply('✅ Configuración actualizada correctamente.');
    }
    // --- Whitelist ---
    if (sub === 'whitelist') {
        const sub2 = interaction.options.getSubcommand();
        if (sub2 === 'add') {
            const user = interaction.options.getUser('usuario');
            const role = interaction.options.getRole('rol');
            if (!user && !role) return interaction.reply('❌ Debes mencionar un usuario o un rol.');
            if (user && !config.whitelist.users.includes(user.id)) config.whitelist.users.push(user.id);
            if (role && !config.whitelist.roles.includes(role.id)) config.whitelist.roles.push(role.id);
            AntiRaidConfig.updateGuildConfig(guildId, { whitelist: config.whitelist });
            return interaction.reply('✅ Usuario/rol añadido a la whitelist.');
        }
        if (sub2 === 'remove') {
            const user = interaction.options.getUser('usuario');
            const role = interaction.options.getRole('rol');
            if (!user && !role) return interaction.reply('❌ Debes mencionar un usuario o un rol.');
            if (user) config.whitelist.users = config.whitelist.users.filter(id => id !== user.id);
            if (role) config.whitelist.roles = config.whitelist.roles.filter(id => id !== role.id);
            AntiRaidConfig.updateGuildConfig(guildId, { whitelist: config.whitelist });
            return interaction.reply('✅ Usuario/rol eliminado de la whitelist.');
        }
        if (sub2 === 'list') {
            const users = config.whitelist.users.map(id => `<@${id}>`).join(', ') || 'Ninguno';
            const roles = config.whitelist.roles.map(id => `<@&${id}>`).join(', ') || 'Ninguno';
            return interaction.reply(`**Whitelist usuarios:** ${users}\n**Whitelist roles:** ${roles}`);
        }
    }
    // --- Whitelist temporal ---
    if (sub === 'whitelisttemp') {
        const sub2 = interaction.options.getSubcommand();
        const user = interaction.options.getUser('usuario');
        const role = interaction.options.getRole('rol');
        if (sub2 === 'add') {
            const minutos = interaction.options.getInteger('minutos');
            if (!user && !role) return interaction.reply('❌ Debes mencionar un usuario o un rol.');
            if (user && !config.whitelistTemp.users.some(e => e.id === user.id)) {
                config.whitelistTemp.users.push({ id: user.id, expires: Date.now() + minutos * 60000 });
                setTimeout(() => {
                    config.whitelistTemp.users = config.whitelistTemp.users.filter(e => e.id !== user.id);
                    AntiRaidConfig.updateGuildConfig(guildId, { whitelistTemp: config.whitelistTemp });
                }, minutos * 60000);
            }
            if (role && !config.whitelistTemp.roles.some(e => e.id === role.id)) {
                config.whitelistTemp.roles.push({ id: role.id, expires: Date.now() + minutos * 60000 });
                setTimeout(() => {
                    config.whitelistTemp.roles = config.whitelistTemp.roles.filter(e => e.id !== role.id);
                    AntiRaidConfig.updateGuildConfig(guildId, { whitelistTemp: config.whitelistTemp });
                }, minutos * 60000);
            }
            AntiRaidConfig.updateGuildConfig(guildId, { whitelistTemp: config.whitelistTemp });
            return interaction.reply('✅ Usuario/rol añadido a la whitelist temporal.');
        }
        if (sub2 === 'remove') {
            if (!user && !role) return interaction.reply('❌ Debes mencionar un usuario o un rol.');
            if (user) config.whitelistTemp.users = config.whitelistTemp.users.filter(e => e.id !== user.id);
            if (role) config.whitelistTemp.roles = config.whitelistTemp.roles.filter(e => e.id !== role.id);
            AntiRaidConfig.updateGuildConfig(guildId, { whitelistTemp: config.whitelistTemp });
            return interaction.reply('✅ Usuario/rol eliminado de la whitelist temporal.');
        }
        if (sub2 === 'list') {
            const users = config.whitelistTemp.users.map(e => `<@${e.id}> (${Math.ceil((e.expires - Date.now())/60000)} min)`).join(', ') || 'Ninguno';
            const roles = config.whitelistTemp.roles.map(e => `<@&${e.id}> (${Math.ceil((e.expires - Date.now())/60000)} min)`).join(', ') || 'Ninguno';
            return interaction.reply(`**Whitelist temporal usuarios:** ${users}\n**Whitelist temporal roles:** ${roles}`);
        }
    }
    // --- Modo pánico ---
    if (sub === 'panicmode') {
        const estado = interaction.options.getString('estado');
        const guild = interaction.guild;
        if (estado === 'on') {
            // Guardar permisos originales y bloquear todos los canales
            const originalPerms = {};
            for (const [id, channel] of guild.channels.cache) {
                originalPerms[id] = channel.permissionOverwrites.cache.map(ow => ow.toJSON());
                await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false, AddReactions: false, Connect: false }).catch(() => {});
            }
            AntiRaidConfig.updateGuildConfig(guild.id, { panicMode: { active: true, originalPerms } });
            await interaction.reply('🚨 Modo pánico activado: todos los canales bloqueados temporalmente.');
        } else {
            // Restaurar permisos originales
            const config = AntiRaidConfig.getGuildConfig(guild.id);
            if (config.panicMode && config.panicMode.originalPerms) {
                for (const [id, perms] of Object.entries(config.panicMode.originalPerms)) {
                    const channel = guild.channels.cache.get(id);
                    if (channel) {
                        await channel.permissionOverwrites.set(perms).catch(() => {});
                    }
                }
            }
            AntiRaidConfig.updateGuildConfig(guild.id, { panicMode: { active: false, originalPerms: {} } });
            await interaction.reply('✅ Modo pánico desactivado: permisos restaurados.');
        }
        return;
    }
    // --- Modo solo alerta ---
    if (sub === 'alertmode') {
        const estado = interaction.options.getString('estado');
        AntiRaidConfig.updateGuildConfig(guildId, { alertOnly: estado === 'on' });
        return interaction.reply(`🔔 Modo solo alerta ${estado === 'on' ? 'activado' : 'desactivado'}.`);
    }
    // --- Modo mantenimiento ---
    if (sub === 'mantenimiento') {
        const estado = interaction.options.getString('estado');
        const minutos = interaction.options.getInteger('minutos') || 10;
        if (estado === 'on') {
            AntiRaidConfig.updateGuildConfig(guildId, { maintenanceMode: { active: true, until: Date.now() + minutos * 60000 }, enabled: false });
            setTimeout(() => {
                const config = AntiRaidConfig.getGuildConfig(guildId);
                if (config.maintenanceMode && config.maintenanceMode.active) {
                    AntiRaidConfig.updateGuildConfig(guildId, { maintenanceMode: { active: false, until: null }, enabled: true });
                }
            }, minutos * 60000);
            return interaction.reply(`🛠️ Modo mantenimiento activado. El anti-raid estará desactivado durante ${minutos} minutos.`);
        } else {
            AntiRaidConfig.updateGuildConfig(guildId, { maintenanceMode: { active: false, until: null }, enabled: true });
            return interaction.reply('✅ Modo mantenimiento desactivado. El anti-raid ha sido reactivado.');
        }
    }
    // --- Resetear configuración ---
    if (sub === 'reset') {
        AntiRaidConfig.updateGuildConfig(guildId, AntiRaidConfig.defaultConfig());
        return interaction.reply('🔄 Configuración anti-raid reseteada a valores por defecto.');
    }
    // --- Ver logs de eventos ---
    if (sub === 'logs') {
        const history = config.eventHistory.slice(-10).map(e => `• ${e}`).join('\n') || 'Sin eventos recientes.';
        return interaction.reply(`**Últimos eventos anti-raid:**\n${history}`);
    }
    // --- Cambiar idioma ---
    if (sub === 'setlang') {
        const idioma = interaction.options.getString('idioma');
        if (!['es', 'en'].includes(idioma)) return interaction.reply('❌ Idioma no soportado. Usa "es" o "en".');
        AntiRaidConfig.updateGuildConfig(guildId, { language: idioma });
        return interaction.reply(`🌐 Idioma del sistema anti-raid cambiado a: ${idioma === 'es' ? 'Español' : 'Inglés'}`);
    }
    // --- Configurar desban automático ---
    if (sub === 'setunban') {
        const estado = interaction.options.getString('estado');
        const minutos = interaction.options.getInteger('minutos') || 10;
        AntiRaidConfig.updateGuildConfig(guildId, { autoUnban: { enabled: estado === 'on', minutes: minutos } });
        return interaction.reply(`⏳ Desban automático ${estado === 'on' ? 'activado' : 'desactivado'} (${minutos} min).`);
    }
    // --- Configurar cooldown ---
    if (sub === 'setcooldown') {
        const segundos = interaction.options.getInteger('segundos');
        AntiRaidConfig.updateGuildConfig(guildId, { cooldown: segundos });
        return interaction.reply(`⏱️ Cooldown entre acciones anti-raid: ${segundos} segundos.`);
    }
    // --- Blacklist ---
    if (sub === 'blacklist') {
        const sub2 = interaction.options.getSubcommand();
        if (sub2 === 'add') {
            const user = interaction.options.getUser('usuario');
            const role = interaction.options.getRole('rol');
            if (!user && !role) return interaction.reply('❌ Debes mencionar un usuario o un rol.');
            if (user && !config.blacklist.users.includes(user.id)) config.blacklist.users.push(user.id);
            if (role && !config.blacklist.roles.includes(role.id)) config.blacklist.roles.push(role.id);
            AntiRaidConfig.updateGuildConfig(guildId, { blacklist: config.blacklist });
            return interaction.reply('🚫 Usuario/rol añadido a la blacklist.');
        }
        if (sub2 === 'remove') {
            const user = interaction.options.getUser('usuario');
            const role = interaction.options.getRole('rol');
            if (!user && !role) return interaction.reply('❌ Debes mencionar un usuario o un rol.');
            if (user) config.blacklist.users = config.blacklist.users.filter(id => id !== user.id);
            if (role) config.blacklist.roles = config.blacklist.roles.filter(id => id !== role.id);
            AntiRaidConfig.updateGuildConfig(guildId, { blacklist: config.blacklist });
            return interaction.reply('🚫 Usuario/rol eliminado de la blacklist.');
        }
        if (sub2 === 'list') {
            const users = config.blacklist.users.map(id => `<@${id}>`).join(', ') || 'Ninguno';
            const roles = config.blacklist.roles.map(id => `<@&${id}>`).join(', ') || 'Ninguno';
            return interaction.reply(`**Blacklist usuarios:** ${users}\n**Blacklist roles:** ${roles}`);
        }
    }
    // --- Exclusión de canales ---
    if (sub === 'excludechannel') {
        const sub2 = interaction.options.getSubcommand();
        const canal = interaction.options.getChannel('canal');
        const lang = config.language || 'es';
        if (sub2 === 'add') {
            if (!config.excludedChannels.includes(canal.id)) config.excludedChannels.push(canal.id);
            AntiRaidConfig.updateGuildConfig(guildId, { excludedChannels: config.excludedChannels });
            return interaction.reply(getMsg(lang, 'channel_excluded', { channel: canal.id }));
        }
        if (sub2 === 'remove') {
            config.excludedChannels = config.excludedChannels.filter(id => id !== canal.id);
            AntiRaidConfig.updateGuildConfig(guildId, { excludedChannels: config.excludedChannels });
            return interaction.reply(getMsg(lang, 'channel_included', { channel: canal.id }));
        }
        if (sub2 === 'list') {
            const list = config.excludedChannels.map(id => `<#${id}>`).join(', ') || getMsg(lang, 'none', {});
            return interaction.reply(getMsg(lang, 'excluded_channels', { list }));
        }
    }
    // --- Estado de protecciones ---
    if (sub === 'protecciones') {
        let mantenimiento = 'Desactivado';
        if (config.maintenanceMode && config.maintenanceMode.active) {
            const ms = config.maintenanceMode.until - Date.now();
            mantenimiento = ms > 0 ? `Activado (${Math.ceil(ms/60000)} min restantes)` : 'Activado';
        }
        const embed = createEmbed(
            '🛡️ Estado de Protecciones Anti-Raid',
            'Configuración y estado actual de todos los módulos de protección.',
            [
                { name: 'Sensibilidad', value: config.sensitivity, inline: true },
                { name: 'Modo alerta', value: config.alertOnly ? 'Activado' : 'Desactivado', inline: true },
                { name: 'Modo pánico', value: config.panicMode && config.panicMode.active ? 'Activado' : 'Desactivado', inline: true },
                { name: 'Modo mantenimiento', value: mantenimiento, inline: true },
                { name: 'Auto-ban', value: config.autoBan ? 'Sí' : 'No', inline: true },
                { name: 'Desban automático', value: config.autoUnban && config.autoUnban.enabled ? `Sí (${config.autoUnban.minutes} min)` : 'No', inline: true },
                { name: 'Cooldown', value: `${config.cooldown}s`, inline: true },
                { name: 'Canal de logs', value: config.logChannel ? `<#${config.logChannel}>` : 'No configurado', inline: true },
                { name: 'Canal alertas admin', value: config.adminAlertChannel ? `<#${config.adminAlertChannel}>` : 'No configurado', inline: true },
                { name: 'Canales excluidos', value: config.excludedChannels.length ? config.excludedChannels.map(id => `<#${id}>`).join(', ') : 'Ninguno', inline: false },
                { name: 'Protecciones activas', value: [
                    config.enabled ? '🟢 Anti-raid general' : '🔴 Anti-raid general',
                    '🟢 Detección de raids (ingreso masivo, bots, cuentas nuevas)',
                    '🟢 Spam de menciones, flood, emojis, links',
                    '🟢 Cambios masivos de roles, nick, permisos, configuración',
                    '🟢 Eliminación masiva de mensajes, webhooks',
                    '🟢 Global banlist',
                    '🟢 Modo pánico',
                    '🟢 Whitelist temporal',
                    '🟢 Exclusión de canales',
                ].join('\n'), inline: false }
            ]
        );
        return interaction.reply({ embeds: [embed] });
    }
    // --- Ayuda detallada de módulos ---
    if (sub === 'ayuda') {
        const embed = createEmbed(
            '🛡️ Ayuda Anti-Raid',
            'Explicación de cada módulo y ejemplos de configuración.',
            [
                { name: 'Sensibilidad', value: 'Ajusta la agresividad del sistema: `/antiraid sensibilidad bajo/medio/alto`', inline: false },
                { name: 'Canales excluidos', value: 'Excluye canales del anti-raid: `/antiraid excludechannel add/remove/list #canal`', inline: false },
                { name: 'Modo alerta', value: 'Solo alerta, sin ban/kick: `/antiraid alertmode on/off`', inline: false },
                { name: 'Modo pánico', value: 'Bloquea todos los canales: `/antiraid panicmode on/off`', inline: false },
                { name: 'Modo mantenimiento', value: 'Desactiva temporalmente el anti-raid: `/antiraid mantenimiento on/off [minutos]`', inline: false },
                { name: 'Whitelist temporal', value: 'Permite acceso temporal: `/antiraid whitelisttemp add @usuario 10`', inline: false },
                { name: 'Protecciones automáticas', value: 'Incluye detección de raids, spam, flood, cambios masivos, webhooks, invitaciones, global banlist y más.', inline: false },
                { name: 'Exportar/Importar', value: 'Próximamente: `/antiraid export` y `/antiraid import` para respaldos.', inline: false },
                { name: 'Ver estado', value: '`/antiraid estado` o `/antiraid protecciones` para ver la configuración actual.', inline: false }
            ]
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    // --- Exportar configuración ---
    if (sub === 'export') {
        const fs = require('fs');
        const path = require('path');
        const config = AntiRaidConfig.getGuildConfig(guildId);
        const filePath = path.join(__dirname, `../../data/antiraid_export_${guildId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
        await interaction.reply({ content: '📦 Configuración exportada.', files: [filePath] });
        setTimeout(() => { try { fs.unlinkSync(filePath); } catch {} }, 10000);
        return;
    }
    // --- Importar configuración ---
    if (sub === 'import') {
        if (!interaction.options.getAttachment) return interaction.reply('❌ Adjunta un archivo JSON con la configuración.');
        const attachment = interaction.options.getAttachment('archivo');
        if (!attachment || !attachment.url.endsWith('.json')) return interaction.reply('❌ Adjunta un archivo JSON válido.');
        const https = require('https');
        https.get(attachment.url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const imported = JSON.parse(data);
                    AntiRaidConfig.updateGuildConfig(guildId, imported);
                    interaction.reply('✅ Configuración importada correctamente.');
                } catch {
                    interaction.reply('❌ Error al importar la configuración.');
                }
            });
        }).on('error', () => interaction.reply('❌ Error al descargar el archivo.'));
        return;
    }
    // --- Diagnóstico del sistema anti-raid ---
    if (sub === 'diagnostico') {
        const lang = config.language || 'es';
        const problemas = [];
        if (!config.logChannel || !interaction.guild.channels.cache.get(config.logChannel)) problemas.push('No hay canal de logs configurado o no existe.');
        if (!config.adminAlertChannel || !interaction.guild.channels.cache.get(config.adminAlertChannel)) problemas.push('No hay canal privado de admins configurado o no existe.');
        if (!config.enabled) problemas.push('El anti-raid está desactivado.');
        if (config.raidThreshold.users < 3) problemas.push('El umbral de raid es muy bajo.');
        if (config.cooldown < 30) problemas.push('El cooldown entre acciones es muy bajo.');
        if (config.sensitivity === 'alto' && config.whitelist.users.length === 0) problemas.push('Sensibilidad alta sin usuarios en whitelist.');
        const sugerencias = [
            'Configura un canal de logs y un canal privado de admins.',
            'Ajusta la sensibilidad y los umbrales según la actividad de tu servidor.',
            'Revisa la whitelist y blacklist periódicamente.',
            'Activa el modo mantenimiento para pruebas o eventos.',
            'Consulta `/antiraid ayuda` para más información.'
        ];
        const embed = createEmbed(
            lang === 'es' ? '🩺 Diagnóstico Anti-Raid' : '🩺 Anti-Raid Diagnostics',
            lang === 'es'
                ? 'Estado actual y posibles problemas detectados en la configuración anti-raid.'
                : 'Current status and possible issues detected in the anti-raid configuration.',
            [
                { name: lang === 'es' ? 'Problemas detectados' : 'Detected Issues', value: problemas.length ? problemas.join('\n') : (lang === 'es' ? 'Ninguno' : 'None'), inline: false },
                { name: lang === 'es' ? 'Sugerencias' : 'Suggestions', value: sugerencias.join('\n'), inline: false },
                { name: lang === 'es' ? 'Estado general' : 'General Status', value: `
${lang === 'es' ? 'Anti-raid:' : 'Anti-raid:'} ${config.enabled ? '🟢' : '🔴'}
${lang === 'es' ? 'Canal de logs:' : 'Logs channel:'} ${config.logChannel ? `<#${config.logChannel}>` : 'No configurado'}
${lang === 'es' ? 'Canal admins:' : 'Admin channel:'} ${config.adminAlertChannel ? `<#${config.adminAlertChannel}>` : 'No configurado'}
${lang === 'es' ? 'Sensibilidad:' : 'Sensitivity:'} ${config.sensitivity}
${lang === 'es' ? 'Umbral raid:' : 'Raid threshold:'} ${config.raidThreshold.users} / ${config.raidThreshold.seconds}s
${lang === 'es' ? 'Cooldown:' : 'Cooldown:'} ${config.cooldown}s
${lang === 'es' ? 'Usuarios whitelist:' : 'Whitelist users:'} ${config.whitelist.users.length}
${lang === 'es' ? 'Usuarios blacklist:' : 'Blacklist users:'} ${config.blacklist.users.length}
`, inline: false }
            ]
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    // --- Canal privado de admins ---
    if (sub === 'config') {
        const opcion = interaction.options.getString('opcion');
        const valor1 = interaction.options.getString('valor1');
        const valor2 = interaction.options.getString('valor2');
        let update = {};
        switch (opcion) {
            case 'adminchannel':
                update.adminAlertChannel = valor1.replace(/[^0-9]/g, '');
                break;
            default:
                return interaction.reply('❌ Opción de configuración no válida.');
        }
        AntiRaidConfig.updateGuildConfig(guildId, update);
        return interaction.reply('✅ Configuración actualizada correctamente.');
    }
    return interaction.reply('❌ Comando o subcomando no reconocido. Usa `/antiraid help` para ver las opciones.');
}

module.exports = {
    antiRaidCommands,
    handleAntiRaidCommand,
    hasAntiRaidPerms
}; 