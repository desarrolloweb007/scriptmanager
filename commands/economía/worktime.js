const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { readJsonFile, writeJsonFile } = require('../../utils/economyUtils');
const { checkShopPermission, validateAmount } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');
const path = require('path');

const ECON_CONFIG_PATH = path.join(__dirname, '../../data/econ_config.json');

module.exports = {
    name: 'worktime',
    description: 'Configura el cooldown del comando work',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('worktime')
        .setDescription('Comando worktime'),
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
                .setDescription('No tienes permisos para configurar la economía.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'worktime');
        const subcmd = commandArgs[0];
        const value = commandArgs[1];
        const currentPrefix = await getCurrentPrefix(message.guild.id);

        if (subcmd !== 'set' || !value) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uso Incorrecto')
                .setDescription('Debes usar el subcomando set y especificar los segundos.')
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}worktime set segundos\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}worktime set 120\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar cantidad
        const amountValidation = validateAmount(value);
        if (!amountValidation.valid) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Valor Inválido')
                .setDescription(amountValidation.message)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
        const seconds = amountValidation.amount;
        if (seconds < 10 || seconds > 86400) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Valor Inválido')
                .setDescription('El tiempo debe ser entre 10 segundos y 86400 segundos (24h).')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Guardar configuración
        const config = await readJsonFile(ECON_CONFIG_PATH);
        if (!config[message.guild.id]) config[message.guild.id] = {};
        config[message.guild.id].worktime = seconds;
        await writeJsonFile(ECON_CONFIG_PATH, config);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Cooldown de Work Configurado')
            .setDescription(`El cooldown de \`work\` ahora es de **${seconds} segundos**.`)
            .setTimestamp();
        return message.reply({ embeds: [embed], flags: 64 });
    }
}; 