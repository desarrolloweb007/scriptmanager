// antiRaidConfig.js
// Módulo para gestionar la configuración anti-raid por servidor (guild)
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/antiRaidConfig.json');

class AntiRaidConfig {
    static loadConfig() {
        if (!fs.existsSync(CONFIG_PATH)) {
            fs.writeFileSync(CONFIG_PATH, '{}');
        }
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }

    static saveConfig(config) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    }

    static getGuildConfig(guildId) {
        const config = this.loadConfig();
        if (!config[guildId]) {
            config[guildId] = this.defaultConfig();
            this.saveConfig(config);
        }
        // Auto-reparar campos faltantes
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
    }

    static updateGuildConfig(guildId, newConfig) {
        const config = this.loadConfig();
        config[guildId] = { ...this.defaultConfig(), ...config[guildId], ...newConfig };
        this.saveConfig(config);
    }

    static defaultConfig() {
        return {
            enabled: false,
            logChannel: null,
            adminAlertChannel: null, // Canal privado de admins para alertas
            raidThreshold: { users: 10, seconds: 60 },
            channelCreateLimit: { count: 3, seconds: 60 },
            channelDeleteLimit: { count: 2, seconds: 60 },
            whitelist: { users: [], roles: [] },
            blacklist: { users: [], roles: [] },
            whitelistTemp: { users: [], roles: [] }, // Whitelist temporal
            autoBan: false,
            alertOnly: false,
            cooldown: 120,
            lastAction: 0,
            autoUnban: { enabled: false, minutes: 10 },
            permsRole: null,
            eventHistory: [],
            language: 'es',
            panicMode: { active: false, originalPerms: {} },
            sensitivity: 'medio', // bajo, medio, alto
            excludedChannels: [], // IDs de canales excluidos
            maintenanceMode: { active: false, until: null } // Modo mantenimiento
        };
    }
}

module.exports = AntiRaidConfig; 