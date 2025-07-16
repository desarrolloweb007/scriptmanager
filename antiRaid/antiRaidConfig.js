// antiRaidConfig.js
// Módulo de configuración persistente para el sistema anti-raid
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const CONFIG_PATH = path.join(DATA_DIR, 'antiRaidConfig.json');
if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, '{}');
}

// --- Configuración por defecto ---
function defaultConfig() {
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

function readConfigFile() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return {};
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error('[AntiRaidConfig] Error leyendo configuración:', e);
        return {};
    }
}

function writeConfigFile(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (e) {
        console.error('[AntiRaidConfig] Error guardando configuración:', e);
    }
}

function getGuildConfig(guildId) {
    const all = readConfigFile();
    if (!all[guildId]) {
        all[guildId] = defaultConfig();
        writeConfigFile(all);
    }
    return all[guildId];
}

function updateGuildConfig(guildId, update) {
    const all = readConfigFile();
    if (!all[guildId]) all[guildId] = defaultConfig();
    all[guildId] = { ...all[guildId], ...update };
    writeConfigFile(all);
}

module.exports = {
    getGuildConfig,
    updateGuildConfig,
    defaultConfig
}; 