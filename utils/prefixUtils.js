const prefixManager = require('./prefixManager');

// Función para obtener el prefijo del servidor
async function getPrefix(guildId) {
    return prefixManager.getPrefix(guildId);
}

// Función para establecer el prefijo del servidor
async function setPrefix(guildId, prefix) {
    return prefixManager.setPrefix(guildId, prefix);
}

// Función para verificar si un mensaje comienza con el prefijo correcto
async function hasPrefix(message, commandName) {
    const prefix = prefixManager.getPrefix(message.guild.id);
    return message.content.startsWith(prefix + commandName);
}

// Función para extraer argumentos del mensaje
async function getArgs(message, commandName) {
    const prefix = prefixManager.getPrefix(message.guild.id);
    const content = message.content.slice(prefix.length + commandName.length).trim();
    return content.split(/ +/);
}

// Función para obtener el prefijo actual para mostrar en mensajes
async function getCurrentPrefix(guildId) {
    return prefixManager.getPrefix(guildId);
}

module.exports = {
    getPrefix,
    setPrefix,
    hasPrefix,
    getArgs,
    getCurrentPrefix
};
