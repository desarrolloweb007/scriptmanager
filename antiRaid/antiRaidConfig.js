// antiRaidConfig.js
// Módulo de configuración persistente para el sistema anti-raid
const fs = require('fs');
const path = require('path');

// Función robusta para crear directorios y archivos
function ensureDataStructure() {
    try {
        // Crear directorio data si no existe
        const DATA_DIR = path.join(__dirname, '../data');
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
            console.log('[AntiRaidConfig] ✅ Directorio data creado');
        }
        
        // Crear archivo de configuración si no existe
        const CONFIG_PATH = path.join(DATA_DIR, 'antiRaidConfig.json');
        if (!fs.existsSync(CONFIG_PATH)) {
            fs.writeFileSync(CONFIG_PATH, '{}');
            console.log('[AntiRaidConfig] ✅ Archivo antiRaidConfig.json creado');
        }
        
        return CONFIG_PATH;
    } catch (error) {
        console.error('[AntiRaidConfig] ❌ Error creando estructura de datos:', error);
        throw error;
    }
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
        const CONFIG_PATH = ensureDataStructure();
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        const parsed = JSON.parse(data);
        console.log('[AntiRaidConfig] ✅ Configuración cargada correctamente');
        return parsed;
    } catch (e) {
        console.error('[AntiRaidConfig] ❌ Error leyendo configuración:', e);
        console.log('[AntiRaidConfig] 🔄 Creando configuración por defecto...');
        return {};
    }
}

function writeConfigFile(config) {
    try {
        const CONFIG_PATH = ensureDataStructure();
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        console.log('[AntiRaidConfig] ✅ Configuración guardada correctamente');
    } catch (e) {
        console.error('[AntiRaidConfig] ❌ Error guardando configuración:', e);
        throw e;
    }
}

function getGuildConfig(guildId) {
    try {
        const all = readConfigFile();
        if (!all[guildId]) {
            all[guildId] = defaultConfig();
            writeConfigFile(all);
            console.log(`[AntiRaidConfig] ✅ Configuración creada para servidor ${guildId}`);
        }
        return all[guildId];
    } catch (error) {
        console.error(`[AntiRaidConfig] ❌ Error obteniendo configuración para ${guildId}:`, error);
        return defaultConfig();
    }
}

function updateGuildConfig(guildId, update) {
    try {
        const all = readConfigFile();
        if (!all[guildId]) all[guildId] = defaultConfig();
        all[guildId] = { ...all[guildId], ...update };
        writeConfigFile(all);
        console.log(`[AntiRaidConfig] ✅ Configuración actualizada para servidor ${guildId}`);
    } catch (error) {
        console.error(`[AntiRaidConfig] ❌ Error actualizando configuración para ${guildId}:`, error);
        throw error;
    }
}

// Inicializar estructura al cargar el módulo
try {
    ensureDataStructure();
    console.log('[AntiRaidConfig] ✅ Sistema anti-raid inicializado correctamente');
} catch (error) {
    console.error('[AntiRaidConfig] ❌ Error inicializando sistema anti-raid:', error);
}

module.exports = {
    getGuildConfig,
    updateGuildConfig,
    defaultConfig,
    ensureDataStructure
}; 