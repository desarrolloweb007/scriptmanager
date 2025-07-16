const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getShopItems, getCategories, getCurrencyName } = require('../../utils/economyUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

module.exports = {
    name: 'shop',
    description: 'Muestra todos los objetos de la tienda o de una categoría',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Comando shop'),
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

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'shop');
        const categoriaFiltro = commandArgs.join(' ').trim();
        const currentPrefix = await getCurrentPrefix(message.guild.id);

        // Obtener datos
        const items = await getShopItems(message.guild.id);
        const categories = await getCategories(message.guild.id);
        const currency = await getCurrencyName(message.guild.id);

        // Filtrar por categoría si se especifica
        let itemsFiltrados = Object.entries(items);
        let categoriaValida = null;
        if (categoriaFiltro) {
            if (!categories[categoriaFiltro]) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Categoría No Encontrada')
                    .setDescription(`La categoría **${categoriaFiltro}** no existe.`)
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            categoriaValida = categoriaFiltro;
            itemsFiltrados = itemsFiltrados.filter(([_, obj]) => obj.category === categoriaFiltro);
        }

        if (itemsFiltrados.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle('🛒 Tienda Vacía')
                .setDescription(categoriaValida ? `No hay objetos en la categoría **${categoriaValida}**.` : 'No hay objetos en la tienda.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Construir embed de tienda
        const embed = new EmbedBuilder()
            .setColor('#00bfff')
            .setTitle('🛒 Tienda del Servidor')
            .setDescription(categoriaValida ? `Categoría: **${categoriaValida}**` : 'Todos los objetos disponibles')
            .setFooter({ text: `Usa ${currentPrefix}buy <nombre_objeto> para comprar` })
            .setTimestamp();

        for (const [nombre, obj] of itemsFiltrados) {
            embed.addFields({
                name: `🔹 ${nombre}`,
                value: [
                    `**Precio:** ${obj.price} ${currency}`,
                    `**Stock:** ${obj.stock}`,
                    `**Categoría:** ${obj.category}`,
                    obj.roleId ? `**Rol:** <@&${obj.roleId}>` : '**Rol:** Ninguno'
                ].join('\n'),
                inline: false
            });
        }

        return message.reply({ embeds: [embed] });
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