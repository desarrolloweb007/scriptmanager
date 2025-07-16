const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const prefixManager = require('../utils/prefixManager');

module.exports = {
    name: 'setprefix',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Cambia el prefijo de comandos para este servidor')
        .addStringOption(opt =>
            opt.setName('nuevo')
                .setDescription('Nuevo prefijo (máximo 5 caracteres)')
                .setRequired(true)
                .setMaxLength(5)),
    async execute(interaction) {
        // Verificar permisos
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permisos Insuficientes')
                .setDescription('Solo los administradores pueden cambiar el prefijo del servidor.')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const nuevo = interaction.options.getString('nuevo');
        
        // Validar el prefijo
        if (!prefixManager.isValidPrefix(nuevo)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Prefijo Inválido')
                .setDescription(`El prefijo debe cumplir las siguientes condiciones:
• Máximo ${prefixManager.MAX_PREFIX_LENGTH} caracteres
• No puede contener espacios
• No puede estar vacío`)
                .addFields({
                    name: '📝 Ejemplos válidos',
                    value: '`!`, `?`, `$`, `>`, `bot`',
                    inline: true
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const oldPrefix = prefixManager.getPrefix(interaction.guild.id);
        
        // Intentar cambiar el prefijo
        const success = prefixManager.setPrefix(interaction.guild.id, nuevo);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Prefijo Actualizado')
                .setDescription(`El prefijo del servidor ha sido cambiado exitosamente.`)
                .addFields(
                    { name: '🔄 Cambio', value: `\`${oldPrefix}\` → \`${nuevo}\``, inline: true },
                    { name: '📝 Uso', value: `Ahora usa \`${nuevo}comando\` para ejecutar comandos`, inline: true }
                )
                .addFields({
                    name: 'ℹ️ Información',
                    value: `• El cambio es inmediato y no requiere reiniciar el bot
• Los comandos slash siguen funcionando con \`/\`
• Usa \`${nuevo}help\` para ver todos los comandos disponibles`,
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error al Cambiar Prefijo')
                .setDescription('Hubo un error al guardar el nuevo prefijo. Inténtalo de nuevo.')
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
                .setDescription('Solo los administradores pueden cambiar el prefijo del servidor.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const nuevo = args[0];
        
        // Verificar que se proporcione un prefijo
        if (!nuevo) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📝 Uso del Comando')
                .setDescription('Debes especificar el nuevo prefijo.')
                .addFields({
                    name: '💡 Sintaxis',
                    value: `\`${message.content.split(' ')[0]} <nuevo_prefijo>\``,
                    inline: false
                })
                .addFields({
                    name: '📝 Ejemplos',
                    value: `\`${message.content.split(' ')[0]} ?\`
\`${message.content.split(' ')[0]} $\`
\`${message.content.split(' ')[0]} bot\``,
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Validar el prefijo
        if (!prefixManager.isValidPrefix(nuevo)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Prefijo Inválido')
                .setDescription(`El prefijo debe cumplir las siguientes condiciones:
• Máximo ${prefixManager.MAX_PREFIX_LENGTH} caracteres
• No puede contener espacios
• No puede estar vacío`)
                .addFields({
                    name: '📝 Ejemplos válidos',
                    value: '`!`, `?`, `$`, `>`, `bot`',
                    inline: true
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const oldPrefix = prefixManager.getPrefix(message.guild.id);
        
        // Intentar cambiar el prefijo
        const success = prefixManager.setPrefix(message.guild.id, nuevo);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Prefijo Actualizado')
                .setDescription(`El prefijo del servidor ha sido cambiado exitosamente.`)
                .addFields(
                    { name: '🔄 Cambio', value: `\`${oldPrefix}\` → \`${nuevo}\``, inline: true },
                    { name: '📝 Uso', value: `Ahora usa \`${nuevo}comando\` para ejecutar comandos`, inline: true }
                )
                .addFields({
                    name: 'ℹ️ Información',
                    value: `• El cambio es inmediato y no requiere reiniciar el bot
• Los comandos slash siguen funcionando con \`/\`
• Usa \`${nuevo}help\` para ver todos los comandos disponibles`,
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error al Cambiar Prefijo')
                .setDescription('Hubo un error al guardar el nuevo prefijo. Inténtalo de nuevo.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
    }
}; 