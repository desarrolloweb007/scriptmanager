const fs = require('fs/promises');
const path = require('path');

const PREFIXES_PATH = path.join(__dirname, '../data/prefixes.json');

// Función para obtener el prefijo del servidor
async function getPrefix(guildId) {
    try {
        const data = await fs.readFile(PREFIXES_PATH, 'utf8');
        const prefixes = JSON.parse(data);
        return prefixes[guildId] || '!';
    } catch (error) {
        // Si el archivo no existe o hay error, usar prefijo por defecto
        return '!';
    }
}

// Función para establecer el prefijo del servidor
async function setPrefix(guildId, prefix) {
    try {
        let prefixes = {};
        try {
            const data = await fs.readFile(PREFIXES_PATH, 'utf8');
            prefixes = JSON.parse(data);
        } catch (error) {
            // Si el archivo no existe, crear objeto vacío
        }
        
        prefixes[guildId] = prefix;
        await fs.writeFile(PREFIXES_PATH, JSON.stringify(prefixs, null, 2));
        return true;
    } catch (error) {
        console.error('Error al guardar prefijo:', error);
        return false;
    }
}

// Función para verificar si un mensaje comienza con el prefijo correcto
async function hasPrefix(message, commandName) {
    const prefix = await getPrefix(message.guild.id);
    return message.content.startsWith(prefix + commandName);
}

// Función para extraer argumentos del mensaje
async function getArgs(message, commandName) {
    const prefix = await getPrefix(message.guild.id);
    const content = message.content.slice(prefix.length + commandName.length).trim();
    return content.split(/ +/);
}

// Función para obtener el prefijo actual para mostrar en mensajes
async function getCurrentPrefix(guildId) {
    return await getPrefix(guildId);
}

module.exports = {
    getPrefix,
    setPrefix,
    hasPrefix,
    getArgs,
    getCurrentPrefix
};
