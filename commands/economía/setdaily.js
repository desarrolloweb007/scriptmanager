const { EmbedBuilder } = require('discord.js');
const { readJsonFile, writeJsonFile, getCurrencyName } = require('../../utils/economyUtils');
const { checkShopPermission, validateAmount } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');
const path = require('path');

const ECON_CONFIG_PATH = path.join(__dirname, '../../data/econ_config.json');

module.exports = {
    name: 'setdaily',
    description: 'Establece la cantidad de dinero que da el comando daily',
    legacy: true,
    data: { name: 'setdaily' },

    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        if (!(await hasPrefix(message, 'setdaily'))) {
            return;
        }

        // Verificar permisos de administración de tienda
        const hasPermission = await checkShopPermission(message.member);
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para configurar la economía.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'setdaily');
        const cantidad = commandArgs[0];
        const currentPrefix = await getCurrentPrefix(message.guild.id);
        const currency = await getCurrencyName(message.guild.id);

        // Validar cantidad
        const amountValidation = validateAmount(cantidad);
        if (!amountValidation.valid) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Cantidad Inválida')
                .setDescription(amountValidation.message)
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}setdaily cantidad\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}setdaily 1000\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
        const amount = amountValidation.amount;

        // Guardar configuración
        const config = await readJsonFile(ECON_CONFIG_PATH);
        if (!config[message.guild.id]) config[message.guild.id] = {};
        config[message.guild.id].daily = amount;
        await writeJsonFile(ECON_CONFIG_PATH, config);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Recompensa Diaria Configurada')
            .setDescription(`La recompensa diaria ahora es de **${amount} ${currency}**.`)
            .setTimestamp();
        return message.reply({ embeds: [embed], flags: 64 });
    }
}; 