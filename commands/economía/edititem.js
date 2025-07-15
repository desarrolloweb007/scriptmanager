const { EmbedBuilder } = require('discord.js');
const { updateShopItem, getShopItems } = require('../../utils/economyUtils');
const { checkShopPermission, validateRole, validatePrice, validateStock } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

module.exports = {
    name: 'edititem',
    description: 'Modifica un campo del objeto existente en la tienda',
    legacy: true,
    data: { name: 'edititem' },

    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        if (!(await hasPrefix(message, 'edititem'))) {
            return;
        }

        // Verificar permisos de administración de tienda
        const hasPermission = await checkShopPermission(message.member);
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para editar objetos de la tienda.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'edititem');
        const joinedArgs = commandArgs.join(' ');
        // nombre | campo | nuevo_valor
        const [nombre, campo, nuevoValor] = joinedArgs.split('|').map(s => s.trim());
        const currentPrefix = await getCurrentPrefix(message.guild.id);

        // Validaciones de argumentos
        if (!nombre || !campo || !nuevoValor) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uso Incorrecto')
                .setDescription('Debes proporcionar el nombre del objeto, el campo a modificar y el nuevo valor.')
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}edititem nombre | campo | nuevo_valor\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}edititem Espada | price | 2000\`\n\`${currentPrefix}edititem VIP | roleId | 123456789012345678\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar existencia del objeto
        const items = await getShopItems(message.guild.id);
        if (!items[nombre]) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Objeto No Encontrado')
                .setDescription(`No existe un objeto llamado **${nombre}** en la tienda.`)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar campo y valor
        let field = campo;
        let value = nuevoValor;
        if (['price', 'stock'].includes(field)) {
            if (field === 'price') {
                const priceValidation = validatePrice(value);
                if (!priceValidation.valid) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Precio Inválido')
                        .setDescription(priceValidation.message)
                        .setTimestamp();
                    return message.reply({ embeds: [embed], flags: 64 });
                }
                value = priceValidation.price;
            } else if (field === 'stock') {
                const stockValidation = validateStock(value);
                if (!stockValidation.valid) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Stock Inválido')
                        .setDescription(stockValidation.message)
                        .setTimestamp();
                    return message.reply({ embeds: [embed], flags: 64 });
                }
                value = stockValidation.stock;
            }
        } else if (field === 'roleId') {
            if (value.toLowerCase() !== 'none') {
                const roleValidation = await validateRole(message.guild, value);
                if (!roleValidation.valid) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Rol Inválido')
                        .setDescription(roleValidation.message)
                        .setTimestamp();
                    return message.reply({ embeds: [embed], flags: 64 });
                }
            } else {
                value = null;
            }
        } else if (field === 'category') {
            // Validar que la categoría exista
            const { getCategories } = require('../../utils/economyUtils');
            const categories = await getCategories(message.guild.id);
            if (!categories[value]) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Categoría Inexistente')
                    .setDescription(`La categoría **${value}** no existe. Crea la categoría primero con \`${currentPrefix}addcategory\`.`)
                    .setTimestamp();
                return message.reply({ embeds: [embed], flags: 64 });
            }
        } else if (!['price', 'stock', 'roleId', 'category'].includes(field)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Campo Inválido')
                .setDescription('Solo puedes modificar los campos: `price`, `stock`, `roleId`, `category`.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Actualizar el objeto
        const result = await updateShopItem(message.guild.id, nombre, field, value);
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Objeto Actualizado')
                .setDescription(`El objeto **${nombre}** ha sido actualizado correctamente.`)
                .addFields({ name: 'Campo Modificado', value: field, inline: true })
                .addFields({ name: 'Nuevo Valor', value: value === null ? 'Ninguno' : value.toString(), inline: true })
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
};
