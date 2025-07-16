const { EmbedBuilder } = require('discord.js');
const messages = require('../scriptmanager/antiRaid/antiRaidMessages');

/**
 * Obtiene un mensaje multi-idioma interpolando variables.
 * @param {string} lang - Idioma ('es' o 'en')
 * @param {string} key - Clave del mensaje
 * @param {object} vars - Variables a interpolar
 * @returns {string}
 */
function getMsg(lang, key, vars = {}) {
    const msg = (messages[lang] && messages[lang][key]) || messages['es'][key] || key;
    return Object.entries(vars).reduce((str, [k, v]) => str.replace(new RegExp(`{${k}}`, 'g'), v), msg);
}

/**
 * Genera un embed visual estándar multi-idioma.
 * @param {object} options
 * @param {string} options.lang - Idioma ('es' o 'en')
 * @param {string} options.titleKey - Clave del título en messages
 * @param {string} options.descKey - Clave de la descripción en messages
 * @param {object} [options.vars] - Variables para interpolar
 * @param {number|string} [options.color] - Color del embed
 * @param {Array} [options.fields] - Campos adicionales
 * @param {object} [options.footer] - Footer opcional
 * @returns {EmbedBuilder}
 */
function createEmbed({ lang = 'es', titleKey, descKey, vars = {}, color = 0x00bfff, fields = [], footer = null }) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(getMsg(lang, titleKey, vars))
        .setDescription(getMsg(lang, descKey, vars))
        .setTimestamp();
    if (fields && fields.length) embed.addFields(fields);
    if (footer) embed.setFooter(footer);
    return embed;
}

module.exports = {
    getMsg,
    createEmbed
}; 