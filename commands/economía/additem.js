const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { addShopItem, getCategories } = require('../../utils/economyUtils');
const { checkShopPermission, validateRole, validatePrice, validateStock } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

module.exports = {
    name: 'additem',
    description: 'Agrega un nuevo objeto a la tienda',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('additem')
        .setDescription('Comando additem'),
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
                .setDescription('No tienes permisos para agregar objetos a la tienda.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'additem');
        const joinedArgs = commandArgs.join(' ');
        // nombre | categoría | roleID (opcional) | precio | cantidad
        const [nombre, categoria, roleId, precio, cantidad] = joinedArgs.split('|').map(s => s.trim());

        // Validaciones de argumentos
        const currentPrefix = await getCurrentPrefix(message.guild.id);
        if (!nombre || !categoria || !precio || !cantidad) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uso Incorrecto')
                .setDescription('Debes proporcionar todos los datos requeridos.')
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}additem nombre | categoría | roleID (opcional) | precio | cantidad\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}additem Espada | Armas | none | 1000 | 5\`\n\`${currentPrefix}additem VIP | Membresías | 123456789012345678 | 5000 | 1\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar categoría existente
        const categories = await getCategories(message.guild.id);
        if (!categories[categoria]) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Categoría Inexistente')
                .setDescription(`La categoría **${categoria}** no existe. Crea la categoría primero con \`${currentPrefix}addcategory\`.`)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar precio
        const priceValidation = validatePrice(precio);
        if (!priceValidation.valid) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Precio Inválido')
                .setDescription(priceValidation.message)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar stock
        const stockValidation = validateStock(cantidad);
        if (!stockValidation.valid) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Stock Inválido')
                .setDescription(stockValidation.message)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar roleId si se especifica
        let finalRoleId = 'none';
        if (roleId && roleId.toLowerCase() !== 'none') {
            const roleValidation = await validateRole(message.guild, roleId);
            if (!roleValidation.valid) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Rol Inválido')
                    .setDescription(roleValidation.message)
                    .setTimestamp();
                return message.reply({ embeds: [embed], flags: 64 });
            }
            finalRoleId = roleId;
        }

        // Guardar el objeto en la tienda
        const result = await addShopItem(
            message.guild.id,
            nombre,
            categoria,
            finalRoleId,
            priceValidation.price,
            stockValidation.stock
        );
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Objeto Agregado')
                .setDescription(`El objeto **${nombre}** ha sido agregado a la tienda.`)
                .addFields(
                    { name: 'Categoría', value: categoria, inline: true },
                    { name: 'Precio', value: priceValidation.price.toString(), inline: true },
                    { name: 'Cantidad', value: stockValidation.stock.toString(), inline: true },
                    { name: 'Rol Asociado', value: finalRoleId === 'none' ? 'Ninguno' : `<@&${finalRoleId}>`, inline: true }
                )
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription(result.message)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
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