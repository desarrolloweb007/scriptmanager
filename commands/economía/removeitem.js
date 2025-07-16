const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { removeShopItem, getShopItems } = require('../../utils/economyUtils');
const { checkShopPermission } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

module.exports = {
    name: 'removeitem',
    description: 'Elimina un objeto de la tienda',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('removeitem')
        .setDescription('Comando removeitem'),
    async execute(interaction) {
        await interaction.reply({ 
            content: 'Comando en desarrollo. Usa la versión legacy por ahora.', 
            ephemeral: true 
        });
    },

    async executeLegacy(message, args) {
        try {
        try {
        // Verificar prefijo dinámico
        // Verificación de prefijo manejada por el middleware

        // Verificar permisos de administración de tienda
        const hasPermission = await checkShopPermission(message.member);
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para eliminar objetos de la tienda.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'removeitem');
        const nombre = commandArgs.join(' ').trim();
        const currentPrefix = await getCurrentPrefix(message.guild.id);

        // Validaciones de argumentos
        if (!nombre) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uso Incorrecto')
                .setDescription('Debes proporcionar el nombre del objeto a eliminar.')
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}removeitem nombre_objeto\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}removeitem Espada\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Validar existencia del objeto
        const items = await getShopItems(message.guild.id);
        if (!items[nombre]) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Objeto No Encontrado')
                .setDescription(`No existe un objeto llamado **${nombre}** en la tienda.`)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Eliminar el objeto
        const result = await removeShopItem(message.guild.id, nombre);
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Objeto Eliminado')
                .setDescription(`El objeto **${nombre}** ha sido eliminado de la tienda.`)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription(result.message)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
    }
};
