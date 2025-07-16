const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { getCurrencyName, setCurrencyName } = require('../../utils/economyUtils');
const { checkShopPermission } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

module.exports = {
    name: 'econconfig',
    description: 'Configura el nombre de la moneda del servidor',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('econconfig')
        .setDescription('Comando econconfig'),
    async execute(interaction) {
        await interaction.reply({ 
            content: 'Comando en desarrollo. Usa la versión legacy por ahora.', 
            ephemeral: true 
        },);
    },
    
    async executeLegacy(message, args) {
        try {
        // Verificar prefijo dinámico
        // Verificación de prefijo manejada por el middleware

        // Verificar permisos de administración de tienda
        const hasPermission = await checkShopPermission(message.member);
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para configurar la economía.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Contacta a un administrador para configurar los permisos con `!ptienda <rol_id>`',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'econconfig');
        
        // Si no hay argumentos, mostrar la moneda actual
        if (commandArgs.length === 0) {
            const currentCurrency = await getCurrencyName(message.guild.id);
            const currentPrefix = await getCurrentPrefix(message.guild.id);
            
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('💰 Configuración de Economía')
                .setDescription(`Configuración actual del servidor **${message.guild.name}**`)
                .addFields({
                    name: 'Moneda Actual',
                    value: `**${currentCurrency}**`,
                    inline: true
                })
                .addFields({
                    name: 'Comando para cambiar',
                    value: `\`${currentPrefix}econconfig <nuevo_nombre>\``,
                    inline: true
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}econconfig créditos\``,
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: 'Sistema de Economía' });
            
            return message.reply({ embeds: [embed] });
        }

        // Validar el nuevo nombre de moneda
        const newCurrencyName = commandArgs.join(' ').trim();
        
        if (newCurrencyName.length < 2) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Nombre Inválido')
                .setDescription('El nombre de la moneda debe tener al menos 2 caracteres.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (newCurrencyName.length > 20) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Nombre Demasiado Largo')
                .setDescription('El nombre de la moneda no puede tener más de 20 caracteres.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar que solo contenga caracteres válidos
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(newCurrencyName)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Caracteres Inválidos')
                .setDescription('El nombre de la moneda solo puede contener letras y espacios.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Guardar la nueva configuración
        const success = await setCurrencyName(message.guild.id, newCurrencyName);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Moneda Configurada')
                .setDescription(`La moneda del servidor ha sido configurada correctamente.`)
                .addFields({
                    name: 'Nueva Moneda',
                    value: `**${newCurrencyName}**`,
                    inline: true
                })
                .addFields({
                    name: 'Configurado por',
                    value: `${message.author}`,
                    inline: true
                })
                .addFields({
                    name: 'Servidor',
                    value: `${message.guild.name}`,
                    inline: true
                })
                .setTimestamp()
                .setFooter({ text: 'Sistema de Economía' });
            
            return message.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Hubo un error al guardar la configuración de la moneda.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
    }
        } catch (error) {
            console.error(`Error en comando ${fileName}:`, error);
            const { EmbedBuilder } = require("discord.js");
            const embed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle("❌ Error")
                .setDescription("Hubo un error al ejecutar este comando.")
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
};