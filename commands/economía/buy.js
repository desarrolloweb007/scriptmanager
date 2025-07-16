const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { getShopItems, getUserBalance, removeUserBalance, addToInventory, getUserInventory, getCurrencyName, getUserInventory: getInventory } = require('../../utils/economyUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

module.exports = {
    name: 'buy',
    description: 'Compra un objeto de la tienda',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Comando buy'),
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

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'buy');
        const nombre = commandArgs.join(' ').trim();
        const currentPrefix = await getCurrentPrefix(message.guild.id);

        // Validaciones de argumentos
        if (!nombre) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uso Incorrecto')
                .setDescription('Debes proporcionar el nombre del objeto que deseas comprar.')
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}buy nombre_objeto\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}buy Espada\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Obtener objeto de la tienda
        const items = await getShopItems(message.guild.id);
        const objeto = items[nombre];
        const currency = await getCurrencyName(message.guild.id);
        if (!objeto) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Objeto No Encontrado')
                .setDescription(`No existe un objeto llamado **${nombre}** en la tienda.`)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar stock
        if (objeto.stock <= 0) {
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle('⚠️ Sin Stock')
                .setDescription(`El objeto **${nombre}** está agotado.`)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar saldo
        const saldo = await getUserBalance(message.author.id, message.guild.id);
        if (saldo < objeto.price) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Saldo Insuficiente')
                .setDescription(`No tienes suficiente saldo para comprar **${nombre}**.\n\nTu saldo: **${saldo} ${currency}**\nPrecio: **${objeto.price} ${currency}**`)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar inventario si tiene roleId
        if (objeto.roleId) {
            // Verificar si ya tiene el rol
            if (message.member.roles.cache.has(objeto.roleId)) {
                const embed = new EmbedBuilder()
                    .setColor('#ffcc00')
                    .setTitle('⚠️ Ya Tienes Este Rol')
                    .setDescription('Ya tienes este objeto en tu cuenta (rol asignado).')
                    .setTimestamp();
                return message.reply({ embeds: [embed], flags: 64 });
            }
            // Verificar si ya está en inventario
            const inventory = await getInventory(message.author.id, message.guild.id);
            if (inventory.includes(nombre)) {
                const embed = new EmbedBuilder()
                    .setColor('#ffcc00')
                    .setTitle('⚠️ Ya Tienes Este Objeto')
                    .setDescription('Ya tienes este objeto en tu inventario.')
                    .setTimestamp();
                return message.reply({ embeds: [embed], flags: 64 });
            }
        }

        // Asignar rol si corresponde
        if (objeto.roleId) {
            if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Permiso Insuficiente')
                    .setDescription('No tengo permisos para asignar roles. Solicita a un administrador que me otorgue el permiso "Gestionar Roles".')
                    .setTimestamp();
                return message.reply({ embeds: [embed], flags: 64 });
            }
            try {
                await message.member.roles.add(objeto.roleId, `Compra de objeto ${nombre} en la tienda`);
            } catch (e) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error al Asignar Rol')
                    .setDescription('No pude asignar el rol. Verifica la jerarquía de roles y mis permisos.')
                    .setTimestamp();
                return message.reply({ embeds: [embed], flags: 64 });
            }
        }

        // Descontar saldo y stock
        await removeUserBalance(message.author.id, message.guild.id, objeto.price);
        objeto.stock -= 1;
        // Guardar nuevo stock
        const { writeJsonFile } = require('../../utils/economyUtils');
        const path = require('path');
        const SHOP_PATH = path.join(__dirname, '../../data/shop.json');
        const shop = require(SHOP_PATH);
        shop[message.guild.id][nombre].stock = objeto.stock;
        await writeJsonFile(SHOP_PATH, shop);

        // Registrar en inventario
        await addToInventory(message.author.id, message.guild.id, nombre);

        // Mensaje de éxito
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Compra Exitosa')
            .setDescription(`Has comprado **${nombre}** por **${objeto.price} ${currency}**.`)
            .addFields(
                { name: 'Stock Restante', value: objeto.stock.toString(), inline: true },
                { name: 'Tu Nuevo Saldo', value: (saldo - objeto.price).toString() + ' ' + currency, inline: true },
                { name: 'Rol Asignado', value: objeto.roleId ? `<@&${objeto.roleId}>` : 'Ninguno', inline: true }
            )
            .setTimestamp();
        return message.reply({ embeds: [embed], flags: 64 });
    }
};
