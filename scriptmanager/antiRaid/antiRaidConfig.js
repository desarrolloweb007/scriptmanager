// antiRaidConfig.js
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

module.exports = AntiRaidConfig;