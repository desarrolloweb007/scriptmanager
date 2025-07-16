const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const prefixManager = require('../utils/prefixManager');

module.exports = {
    name: 'resetprefix',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('resetprefix')
        .setDescription('Resetea el prefijo del servidor al valor por defecto (!)'),
    async execute(interaction) {
        // Verificar permisos
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permisos Insuficientes')
                .setDescription('Solo los administradores pueden resetear el prefijo del servidor.')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const currentPrefix = prefixManager.getPrefix(interaction.guild.id);
        const isDefault = currentPrefix === prefixManager.DEFAULT_PREFIX;
        
        if (isDefault) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('ℹ️ Prefijo ya es por Defecto')
                .setDescription(`El prefijo actual ya es el valor por defecto: \`${currentPrefix}\``)
                .addFields({
                    name: '💡 Información',
                    value: 'No es necesario resetear el prefijo ya que está en su valor por defecto.',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Intentar resetear el prefijo
        const success = prefixManager.resetPrefix(interaction.guild.id);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Prefijo Reseteado')
                .setDescription(`El prefijo del servidor ha sido reseteado exitosamente.`)
                .addFields(
                    { name: '🔄 Cambio', value: `\`${currentPrefix}\` → \`${prefixManager.DEFAULT_PREFIX}\``, inline: true },
                    { name: '📝 Uso', value: `Ahora usa \`${prefixManager.DEFAULT_PREFIX}comando\` para ejecutar comandos`, inline: true }
                )
                .addFields({
                    name: 'ℹ️ Información',
                    value: `• El cambio es inmediato y no requiere reiniciar el bot
• Los comandos slash siguen funcionando con \`/\`
• Usa \`${prefixManager.DEFAULT_PREFIX}help\` para ver todos los comandos disponibles
• Para cambiar el prefijo nuevamente usa \`${prefixManager.DEFAULT_PREFIX}setprefix <nuevo>\``,
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error al Resetear Prefijo')
                .setDescription('Hubo un error al resetear el prefijo. Inténtalo de nuevo.')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
    
    async executeLegacy(message, args) {
        try {
        try {
        // Verificar permisos
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permisos Insuficientes')
                .setDescription('Solo los administradores pueden resetear el prefijo del servidor.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        const isDefault = currentPrefix === prefixManager.DEFAULT_PREFIX;
        
        if (isDefault) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('ℹ️ Prefijo ya es por Defecto')
                .setDescription(`El prefijo actual ya es el valor por defecto: \`${currentPrefix}\``)
                .addFields({
                    name: '💡 Información',
                    value: 'No es necesario resetear el prefijo ya que está en su valor por defecto.',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Intentar resetear el prefijo
        const success = prefixManager.resetPrefix(message.guild.id);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Prefijo Reseteado')
                .setDescription(`El prefijo del servidor ha sido reseteado exitosamente.`)
                .addFields(
                    { name: '🔄 Cambio', value: `\`${currentPrefix}\` → \`${prefixManager.DEFAULT_PREFIX}\``, inline: true },
                    { name: '📝 Uso', value: `Ahora usa \`${prefixManager.DEFAULT_PREFIX}comando\` para ejecutar comandos`, inline: true }
                )
                .addFields({
                    name: 'ℹ️ Información',
                    value: `• El cambio es inmediato y no requiere reiniciar el bot
• Los comandos slash siguen funcionando con \`/\`
• Usa \`${prefixManager.DEFAULT_PREFIX}help\` para ver todos los comandos disponibles
• Para cambiar el prefijo nuevamente usa \`${prefixManager.DEFAULT_PREFIX}setprefix <nuevo>\``,
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error al Resetear Prefijo')
                .setDescription('Hubo un error al resetear el prefijo. Inténtalo de nuevo.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
    }
}; 