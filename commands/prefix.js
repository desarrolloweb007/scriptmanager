const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prefixManager = require('../utils/prefixManager');

module.exports = {
    name: 'prefix',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Muestra el prefijo actual del servidor'),
    async execute(interaction) {
        const currentPrefix = prefixManager.getPrefix(interaction.guild.id);
        const isDefault = currentPrefix === prefixManager.DEFAULT_PREFIX;
        
        const embed = new EmbedBuilder()
            .setColor(isDefault ? '#7289da' : '#00ff00')
            .setTitle('📝 Prefijo del Servidor')
            .setDescription(`El prefijo actual de este servidor es: **\`${currentPrefix}\`**`)
            .addFields(
                { 
                    name: '🔧 Estado', 
                    value: isDefault ? 'Prefijo por defecto' : 'Prefijo personalizado', 
                    inline: true 
                },
                { 
                    name: '📝 Uso', 
                    value: `\`${currentPrefix}comando\` para ejecutar comandos`, 
                    inline: true 
                }
            )
            .addFields({
                name: 'ℹ️ Información',
                value: [
                    `• **Comandos Legacy**: \`${currentPrefix}comando\``,
                    `• **Comandos Slash**: \`/comando\` (siempre disponibles)`,
                    `• **Cambiar Prefijo**: Solo administradores pueden usar \`${currentPrefix}setprefix <nuevo>\``,
                    `• **Ver Comandos**: Usa \`${currentPrefix}help\` para ver todos los comandos`
                ].join('\n'),
                inline: false
            })
            .setTimestamp()
            .setFooter({ 
                text: isDefault ? 'Usa /setprefix para personalizar el prefijo' : 'Prefijo personalizado configurado' 
            });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
    
    async executeLegacy(message, args) {
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        const isDefault = currentPrefix === prefixManager.DEFAULT_PREFIX;
        
        const embed = new EmbedBuilder()
            .setColor(isDefault ? '#7289da' : '#00ff00')
            .setTitle('📝 Prefijo del Servidor')
            .setDescription(`El prefijo actual de este servidor es: **\`${currentPrefix}\`**`)
            .addFields(
                { 
                    name: '🔧 Estado', 
                    value: isDefault ? 'Prefijo por defecto' : 'Prefijo personalizado', 
                    inline: true 
                },
                { 
                    name: '📝 Uso', 
                    value: `\`${currentPrefix}comando\` para ejecutar comandos`, 
                    inline: true 
                }
            )
            .addFields({
                name: 'ℹ️ Información',
                value: [
                    `• **Comandos Legacy**: \`${currentPrefix}comando\``,
                    `• **Comandos Slash**: \`/comando\` (siempre disponibles)`,
                    `• **Cambiar Prefijo**: Solo administradores pueden usar \`${currentPrefix}setprefix <nuevo>\``,
                    `• **Ver Comandos**: Usa \`${currentPrefix}help\` para ver todos los comandos`
                ].join('\n'),
                inline: false
            })
            .setTimestamp()
            .setFooter({ 
                text: isDefault ? 'Usa /setprefix para personalizar el prefijo' : 'Prefijo personalizado configurado' 
            });
        
        await message.reply({ embeds: [embed] });
    }
}; 