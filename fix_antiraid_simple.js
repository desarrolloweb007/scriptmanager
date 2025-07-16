/**
 * Script simple para arreglar problemas del sistema antiraid
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Arreglando sistema antiraid...');

// 1. Verificar y crear archivos de configuración necesarios
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Directorio data creado');
}

const antiRaidConfigPath = path.join(__dirname, 'data/antiRaidConfig.json');
if (!fs.existsSync(antiRaidConfigPath)) {
    const defaultConfig = {};
    fs.writeFileSync(antiRaidConfigPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Archivo antiRaidConfig.json creado');
}

// 2. Arreglar antiRaidConfig.js
const antiRaidConfigPath2 = path.join(__dirname, 'scriptmanager/antiRaid/antiRaidConfig.js');
if (fs.existsSync(antiRaidConfigPath2)) {
    const improvedContent = `// antiRaidConfig.js
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/antiRaidConfig.json');

class AntiRaidConfig {
    static loadConfig() {
        try {
            if (!fs.existsSync(CONFIG_PATH)) {
                const defaultConfig = {};
                fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
                return defaultConfig;
            }
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('[AntiRaidConfig] Error cargando configuración:', error);
            return {};
        }
    }

    static saveConfig(config) {
        try {
            const dir = path.dirname(CONFIG_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('[AntiRaidConfig] Error guardando configuración:', error);
        }
    }

    static getGuildConfig(guildId) {
        try {
            const config = this.loadConfig();
            if (!config[guildId]) {
                config[guildId] = this.defaultConfig();
                this.saveConfig(config);
            }
            const def = this.defaultConfig();
            let changed = false;
            for (const key in def) {
                if (!(key in config[guildId])) {
                    config[guildId][key] = def[key];
                    changed = true;
                }
            }
            if (changed) this.saveConfig(config);
            return config[guildId];
        } catch (error) {
            console.error('[AntiRaidConfig] Error obteniendo configuración del guild:', error);
            return this.defaultConfig();
        }
    }

    static updateGuildConfig(guildId, newConfig) {
        try {
            const config = this.loadConfig();
            config[guildId] = { ...this.defaultConfig(), ...config[guildId], ...newConfig };
            this.saveConfig(config);
        } catch (error) {
            console.error('[AntiRaidConfig] Error actualizando configuración:', error);
        }
    }

    static defaultConfig() {
        return {
            enabled: false,
            logChannel: null,
            adminAlertChannel: null,
            raidThreshold: { users: 10, seconds: 60 },
            channelCreateLimit: { count: 3, seconds: 60 },
            channelDeleteLimit: { count: 2, seconds: 60 },
            whitelist: { users: [], roles: [] },
            blacklist: { users: [], roles: [] },
            whitelistTemp: { users: [], roles: [] },
            autoBan: false,
            alertOnly: false,
            cooldown: 120,
            lastAction: 0,
            autoUnban: { enabled: false, minutes: 10 },
            permsRole: null,
            eventHistory: [],
            language: 'es',
            panicMode: { active: false, originalPerms: {} },
            sensitivity: 'medio',
            excludedChannels: [],
            maintenanceMode: { active: false, until: null }
        };
    }
}

module.exports = AntiRaidConfig;`;
    
    fs.writeFileSync(antiRaidConfigPath2, improvedContent);
    console.log('✅ antiRaidConfig.js mejorado con manejo de errores');
}

// 3. Arreglar antiRaidCommands.js
const antiRaidCommandsPath = path.join(__dirname, 'scriptmanager/antiRaid/antiRaidCommands.js');
if (fs.existsSync(antiRaidCommandsPath)) {
    let content = fs.readFileSync(antiRaidCommandsPath, 'utf8');
    
    // Reemplazar el handler principal con uno más simple y robusto
    const simpleHandler = `async function handleAntiRaidCommand(interaction) {
    try {
        const guildId = interaction.guild.id;
        const member = interaction.member;
        
        if (!guildId) {
            return await interaction.reply({ 
                content: '❌ Error: No se pudo identificar el servidor.', 
                ephemeral: true 
            });
        }
        
        const config = AntiRaidConfig.getGuildConfig(guildId);
        
        if (!hasAntiRaidPerms(member, guildId)) {
            return await interaction.reply({ 
                content: '❌ No tienes permisos para usar los comandos de configuración anti-raid.', 
                ephemeral: true 
            });
        }
        
        const sub = interaction.options.getSubcommand?.() || interaction.options.getSubcommandGroup?.() || null;
        
        if (sub === 'activar') {
            try {
                AntiRaidConfig.updateGuildConfig(guildId, { enabled: true });
                return await interaction.reply('✅ El sistema anti-raid ha sido activado.');
            } catch (error) {
                console.error('[AntiRaidCommands] Error activando:', error);
                return await interaction.reply({ 
                    content: '❌ Error al activar el sistema anti-raid.', 
                    ephemeral: true 
                });
            }
        }
        
        if (sub === 'desactivar') {
            try {
                AntiRaidConfig.updateGuildConfig(guildId, { enabled: false });
                return await interaction.reply('⛔ El sistema anti-raid ha sido desactivado.');
            } catch (error) {
                console.error('[AntiRaidCommands] Error desactivando:', error);
                return await interaction.reply({ 
                    content: '❌ Error al desactivar el sistema anti-raid.', 
                    ephemeral: true 
                });
            }
        }
        
        if (sub === 'estado') {
            try {
                const estado = config.enabled ? '🟢 Activado' : '🔴 Desactivado';
                const log = config.logChannel ? '<#' + config.logChannel + '>' : 'No configurado';
                let mantenimiento = 'Desactivado';
                if (config.maintenanceMode && config.maintenanceMode.active) {
                    const ms = config.maintenanceMode.until - Date.now();
                    mantenimiento = ms > 0 ? 'Activado (' + Math.ceil(ms/60000) + ' min restantes)' : 'Activado';
                }
                const response = '**Estado Anti-Raid:**\\n' + estado + '\\n' +
                    '**Canal de logs:** ' + log + '\\n' +
                    '**Modo mantenimiento:** ' + mantenimiento + '\\n' +
                    '**Umbral de raid:** ' + config.raidThreshold.users + ' usuarios en ' + config.raidThreshold.seconds + 's\\n' +
                    '**Límite creación canales:** ' + config.channelCreateLimit.count + ' en ' + config.channelCreateLimit.seconds + 's\\n' +
                    '**Límite eliminación canales:** ' + config.channelDeleteLimit.count + ' en ' + config.channelDeleteLimit.seconds + 's\\n' +
                    '**Auto-ban:** ' + (config.autoBan ? 'Sí' : 'No') + '\\n' +
                    '**Rol de configuración:** ' + (config.permsRole ? '<@&' + config.permsRole + '>' : 'Solo admins') + '\\n' +
                    '**Whitelist usuarios:** ' + config.whitelist.users.length + '\\n' +
                    '**Whitelist roles:** ' + config.whitelist.roles.length;
                return await interaction.reply(response);
            } catch (error) {
                console.error('[AntiRaidCommands] Error mostrando estado:', error);
                return await interaction.reply({ 
                    content: '❌ Error al mostrar el estado del sistema anti-raid.', 
                    ephemeral: true 
                });
            }
        }
        
        if (sub === 'ayuda') {
            try {
                const embed = {
                    title: '🛡️ Ayuda Anti-Raid',
                    description: 'Explicación de cada módulo y ejemplos de configuración.',
                    fields: [
                        { name: 'Sensibilidad', value: 'Ajusta la agresividad del sistema: /antiraid sensibilidad bajo/medio/alto', inline: false },
                        { name: 'Canales excluidos', value: 'Excluye canales del anti-raid: /antiraid excludechannel add/remove/list #canal', inline: false },
                        { name: 'Modo alerta', value: 'Solo alerta, sin ban/kick: /antiraid alertmode on/off', inline: false },
                        { name: 'Modo pánico', value: 'Bloquea todos los canales: /antiraid panicmode on/off', inline: false },
                        { name: 'Modo mantenimiento', value: 'Desactiva temporalmente el anti-raid: /antiraid mantenimiento on/off [minutos]', inline: false },
                        { name: 'Whitelist temporal', value: 'Permite acceso temporal: /antiraid whitelisttemp add @usuario 10', inline: false },
                        { name: 'Protecciones automáticas', value: 'Incluye detección de raids, spam, flood, cambios masivos, webhooks, invitaciones, global banlist y más.', inline: false },
                        { name: 'Exportar/Importar', value: 'Próximamente: /antiraid export y /antiraid import para respaldos.', inline: false },
                        { name: 'Ver estado', value: '/antiraid estado o /antiraid protecciones para ver la configuración actual.', inline: false }
                    ]
                };
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                console.error('[AntiRaidCommands] Error mostrando ayuda:', error);
                return await interaction.reply({ 
                    content: '❌ Error al mostrar la ayuda.', 
                    ephemeral: true 
                });
            }
        }
        
        return await interaction.reply({ 
            content: '❌ Comando o subcomando no reconocido. Usa /antiraid ayuda para ver las opciones.', 
            ephemeral: true 
        });
        
    } catch (error) {
        console.error('[AntiRaidCommands] Error general en handleAntiRaidCommand:', error);
        return await interaction.reply({ 
            content: '❌ Ocurrió un error inesperado. Revisa la consola para más detalles.', 
            ephemeral: true 
        });
    }
}`;
    
    // Reemplazar el handler existente
    content = content.replace(
        /async function handleAntiRaidCommand\(interaction\) \{[\s\S]*?\}/,
        simpleHandler
    );
    
    fs.writeFileSync(antiRaidCommandsPath, content);
    console.log('✅ antiRaidCommands.js mejorado con manejo de errores robusto');
}

// 4. Verificar que el archivo de mensajes existe
const antiRaidMessagesPath = path.join(__dirname, 'scriptmanager/antiRaid/antiRaidMessages.js');
if (!fs.existsSync(antiRaidMessagesPath)) {
    const messagesContent = `module.exports = {
  es: {
    raid_detected: '🚨 Posible raid detectado: {count} usuarios en {seconds}s.',
    ban_success: '🔨 Usuario baneado automáticamente por {reason}.',
    user_banned_global: '🚫 Usuario <@{id}> baneado por estar en la global banlist.',
    bot_banned_global: '🚫 Bot <@{id}> baneado por estar en la global banlist.',
    spam_mentions: '⚠️ Spam de menciones detectado: <@{id}>',
    spam_emojis: '⚠️ Spam de emojis detectado: <@{id}> usó {count} emojis personalizados.',
    flood_detected: '⚠️ Anti-flood: <@{id}> envió {count} mensajes en {window}s.',
    link_suspicious: '⚠️ Mensaje con link sospechoso eliminado de <@{id}>',
    mass_delete: '⚠️ Eliminación masiva de mensajes detectada: <@{id}> eliminó {count} mensajes en 10s.',
    webhook_created: '⚠️ Webhook sospechoso creado en <#{channel}> por <@{id}>.',
    panic_on: '🚨 Modo pánico activado: todos los canales bloqueados temporalmente.',
    panic_off: '✅ Modo pánico desactivado: permisos restaurados.',
    maintenance_on: '🛠️ Modo mantenimiento activado. El anti-raid estará desactivado durante {minutes} minutos.',
    maintenance_off: '✅ Modo mantenimiento desactivado. El anti-raid ha sido reactivado.',
    whitelist_temp_added: '✅ Usuario/rol añadido a la whitelist temporal.',
    whitelist_temp_removed: '✅ Usuario/rol eliminado de la whitelist temporal.',
    export_success: '📦 Configuración exportada.',
    import_success: '✅ Configuración importada correctamente.',
    import_error: '❌ Error al importar la configuración.',
    version_update: '🆕 El sistema anti-raid ha sido actualizado a la versión {version}. Consulta /antiraid ayuda para ver las novedades.',
    weekly_summary_title: '🛡️ Resumen Semanal Anti-Raid',
    weekly_summary_desc: 'Estadísticas y eventos destacados de la última semana.'
  },
  en: {
    raid_detected: '🚨 Possible raid detected: {count} users in {seconds}s.',
    ban_success: '🔨 User automatically banned for {reason}.',
    user_banned_global: '🚫 User <@{id}> banned for being in the global banlist.',
    bot_banned_global: '🚫 Bot <@{id}> banned for being in the global banlist.',
    spam_mentions: '⚠️ Mention spam detected: <@{id}>',
    spam_emojis: '⚠️ Emoji spam detected: <@{id}> used {count} custom emojis.',
    flood_detected: '⚠️ Anti-flood: <@{id}> sent {count} messages in {window}s.',
    link_suspicious: '⚠️ Suspicious link message deleted from <@{id}>',
    mass_delete: '⚠️ Mass message deletion detected: <@{id}> deleted {count} messages in 10s.',
    webhook_created: '⚠️ Suspicious webhook created in <#{channel}> by <@{id}>.',
    panic_on: '🚨 Panic mode activated: all channels temporarily locked.',
    panic_off: '✅ Panic mode deactivated: permissions restored.',
    maintenance_on: '🛠️ Maintenance mode activated. Anti-raid will be disabled for {minutes} minutes.',
    maintenance_off: '✅ Maintenance mode deactivated. Anti-raid has been re-enabled.',
    whitelist_temp_added: '✅ User/role added to temporary whitelist.',
    whitelist_temp_removed: '✅ User/role removed from temporary whitelist.',
    export_success: '📦 Configuration exported.',
    import_success: '✅ Configuration imported successfully.',
    import_error: '❌ Error importing configuration.',
    version_update: '🆕 Anti-raid system updated to version {version}. See /antiraid ayuda for details.',
    weekly_summary_title: '🛡️ Weekly Anti-Raid Summary',
    weekly_summary_desc: 'Statistics and highlights from the last week.'
  }
};`;
    
    fs.writeFileSync(antiRaidMessagesPath, messagesContent);
    console.log('✅ antiRaidMessages.js creado');
}

// 5. Verificar que el archivo embedUtils existe
const embedUtilsPath = path.join(__dirname, 'utils/embedUtils.js');
if (!fs.existsSync(embedUtilsPath)) {
    const embedUtilsContent = `const { EmbedBuilder } = require('discord.js');

function createEmbed(title, description, fields = []) {
    const embed = new EmbedBuilder()
        .setColor('#7289da')
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
    
    fields.forEach(field => {
        embed.addFields(field);
    });
    
    return embed;
}

function getMsg(key, lang = 'es', replacements = {}) {
    const messages = require('../scriptmanager/antiRaid/antiRaidMessages');
    let msg = messages[lang]?.[key] || messages.es[key] || key;
    
    Object.entries(replacements).forEach(([key, value]) => {
        msg = msg.replace(new RegExp('{' + key + '}', 'g'), value);
    });
    
    return msg;
}

module.exports = { createEmbed, getMsg };`;
    
    fs.writeFileSync(embedUtilsPath, embedUtilsContent);
    console.log('✅ embedUtils.js creado');
}

console.log('✅ Sistema antiraid arreglado correctamente');
console.log('📋 Cambios realizados:');
console.log('• Manejo de errores robusto en antiRaidConfig.js');
console.log('• Manejo de errores robusto en antiRaidCommands.js');
console.log('• Archivos de configuración verificados y creados');
console.log('• Archivos de mensajes y utilidades verificados');
console.log('');
console.log('🔄 Reinicia el bot para aplicar los cambios'); 