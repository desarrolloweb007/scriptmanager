const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { readJsonFile, writeJsonFile, getCurrencyName } = require('../../utils/economyUtils');
const { checkShopPermission, validateAmount } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');
const path = require('path');

const ECON_CONFIG_PATH = path.join(__dirname, '../../data/econ_config.json');

module.exports = {
    name: 'workpay',
    description: 'Configura el pago mínimo y máximo del comando work',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('workpay')
        .setDescription('Comando workpay'),
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
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'workpay');
        const min = commandArgs[0];
        const max = commandArgs[1];
        const currentPrefix = await getCurrentPrefix(message.guild.id);
        const currency = await getCurrencyName(message.guild.id);

        if (!min || !max) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uso Incorrecto')
                .setDescription('Debes especificar el pago mínimo y máximo.')
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}workpay min max\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}workpay 100 750\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar cantidades
        const minValidation = validateAmount(min);
        const maxValidation = validateAmount(max);
        if (!minValidation.valid || !maxValidation.valid) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Valor Inválido')
                .setDescription('El pago mínimo y máximo deben ser números válidos y mayores a 0.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
        if (minValidation.amount > maxValidation.amount) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Valor Inválido')
                .setDescription('El pago mínimo no puede ser mayor que el máximo.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Guardar configuración
        const config = await readJsonFile(ECON_CONFIG_PATH);
        if (!config[message.guild.id]) config[message.guild.id] = {};
        config[message.guild.id].workpay = {
            min: minValidation.amount,
            max: maxValidation.amount
        };
        await writeJsonFile(ECON_CONFIG_PATH, config);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Pago de Work Configurado')
            .setDescription(`El pago de \`work\` ahora es entre **${minValidation.amount} y ${maxValidation.amount} ${currency}**.`)
            .setTimestamp();
        return message.reply({ embeds: [embed], flags: 64 });
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