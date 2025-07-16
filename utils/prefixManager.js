const fs = require('fs');
const path = require('path');

/**
 * Sistema de gestión de prefijos personalizados por servidor
 * Permite a cada servidor configurar su propio prefijo para comandos legacy
 */

const DATA_DIR = path.join(__dirname, '../data');
const PREFIXES_PATH = path.join(DATA_DIR, 'prefixes.json');
const DEFAULT_PREFIX = '!';
const MAX_PREFIX_LENGTH = 5;

// Asegurar que el directorio de datos existe
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inicializar archivo de prefijos si no existe
if (!fs.existsSync(PREFIXES_PATH)) {
    fs.writeFileSync(PREFIXES_PATH, '{}');
}

let prefixes = {};

/**
 * Carga los prefijos desde el archivo JSON
 * @returns {Object} Objeto con los prefijos cargados
 */
function loadPrefixes() {
    try {
        const data = fs.readFileSync(PREFIXES_PATH, 'utf8');
        const parsed = JSON.parse(data);
        
        // Validar que el JSON sea un objeto
        if (typeof parsed === 'object' && parsed !== null) {
            prefixes = parsed;
        } else {
            console.warn('⚠️ Archivo de prefijos corrupto, reiniciando...');
            prefixes = {};
            savePrefixes();
        }
    } catch (error) {
        console.error('❌ Error al cargar prefijos:', error.message);
        prefixes = {};
        savePrefixes();
    }
}

/**
 * Guarda los prefijos en el archivo JSON
 */
function savePrefixes() {
    try {
        fs.writeFileSync(PREFIXES_PATH, JSON.stringify(prefixes, null, 2));
    } catch (error) {
        console.error('❌ Error al guardar prefijos:', error.message);
    }
}

/**
 * Obtiene el prefijo configurado para un servidor
 * @param {string} guildId - ID del servidor
 * @returns {string} Prefijo configurado o el prefijo por defecto
 */
function getPrefix(guildId) {
    if (!guildId) return DEFAULT_PREFIX;
    
    // Recargar prefijos si no están cargados
    if (!prefixes || typeof prefixes !== 'object') {
        loadPrefixes();
    }
    
    const prefix = prefixes[guildId];
    
    // Validar que el prefijo sea una cadena válida
    if (typeof prefix === 'string' && prefix.length > 0 && prefix.length <= MAX_PREFIX_LENGTH) {
        return prefix;
    }
    
    return DEFAULT_PREFIX;
}

/**
 * Establece el prefijo para un servidor
 * @param {string} guildId - ID del servidor
 * @param {string} prefix - Nuevo prefijo
 * @returns {boolean} true si se guardó correctamente, false en caso contrario
 */
function setPrefix(guildId, prefix) {
    if (!guildId) {
        console.error('❌ guildId es requerido para setPrefix');
        return false;
    }
    
    if (!prefix || typeof prefix !== 'string') {
        console.error('❌ prefix debe ser una cadena válida');
        return false;
    }
    
    if (prefix.length > MAX_PREFIX_LENGTH) {
        console.error(`❌ El prefijo no puede tener más de ${MAX_PREFIX_LENGTH} caracteres`);
        return false;
    }
    
    // Recargar prefijos si no están cargados
    if (!prefixes || typeof prefixes !== 'object') {
        loadPrefixes();
    }
    
    prefixes[guildId] = prefix;
    savePrefixes();
    
    console.log(`✅ Prefijo actualizado para ${guildId}: ${prefix}`);
    return true;
}

/**
 * Elimina el prefijo personalizado de un servidor (restaura al prefijo por defecto)
 * @param {string} guildId - ID del servidor
 * @returns {boolean} true si se eliminó correctamente
 */
function resetPrefix(guildId) {
    if (!guildId) return false;
    
    if (!prefixes || typeof prefixes !== 'object') {
        loadPrefixes();
    }
    
    if (prefixes[guildId]) {
        delete prefixes[guildId];
        savePrefixes();
        console.log(`✅ Prefijo reseteado para ${guildId} al valor por defecto`);
        return true;
    }
    
    return false;
}

/**
 * Obtiene todos los prefijos configurados
 * @returns {Object} Objeto con todos los prefijos
 */
function getAllPrefixes() {
    if (!prefixes || typeof prefixes !== 'object') {
        loadPrefixes();
    }
    return { ...prefixes };
}

/**
 * Valida si un prefijo es válido
 * @param {string} prefix - Prefijo a validar
 * @returns {boolean} true si el prefijo es válido
 */
function isValidPrefix(prefix) {
    return typeof prefix === 'string' && 
           prefix.length > 0 && 
           prefix.length <= MAX_PREFIX_LENGTH &&
           !prefix.includes(' ') && // No espacios
           !prefix.includes('\n') && // No saltos de línea
           !prefix.includes('\t'); // No tabulaciones
}

// Cargar prefijos al inicializar el módulo
loadPrefixes();

module.exports = { 
    getPrefix, 
    setPrefix, 
    resetPrefix,
    getAllPrefixes,
    isValidPrefix,
    loadPrefixes, 
    savePrefixes,
    DEFAULT_PREFIX,
    MAX_PREFIX_LENGTH
}; 