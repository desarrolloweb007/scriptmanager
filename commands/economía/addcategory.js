const { EmbedBuilder } = require('discord.js');
const { addCategory } = require('../../utils/economyUtils');
const { checkShopPermission } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

module.exports = {
    name: 'addcategory',
    description: 'Crea una categoría personalizada de productos para la tienda',
    legacy: true,
    data: { name: 'addcategory' },

    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        if (!(await hasPrefix(message, 'addcategory'))) {
            return;
        }

        // Verificar permisos de administración de tienda
        const hasPermission = await checkShopPermission(message.member);
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para crear categorías en la tienda.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'addcategory');
        const joinedArgs = commandArgs.join(' ');
        const [nombre, descripcion] = joinedArgs.split('|').map(s => s.trim());

        // Validaciones
        if (!nombre || !descripcion) {
            const currentPrefix = await getCurrentPrefix(message.guild.id);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uso Incorrecto')
                .setDescription('Debes proporcionar un nombre y una descripción para la categoría.')
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}addcategory nombre | descripción\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}addcategory Juegos | Roles de juegos populares\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        if (nombre.length < 2 || nombre.length > 30) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Nombre Inválido')
                .setDescription('El nombre de la categoría debe tener entre 2 y 30 caracteres.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        if (descripcion.length < 2 || descripcion.length > 100) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Descripción Inválida')
                .setDescription('La descripción debe tener entre 2 y 100 caracteres.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Guardar la categoría
        const result = await addCategory(message.guild.id, nombre, descripcion);
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Categoría Creada')
                .setDescription(`La categoría **${nombre}** ha sido creada correctamente.`)
                .addFields({
                    name: 'Descripción',
                    value: descripcion,
                    inline: false
                })
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
