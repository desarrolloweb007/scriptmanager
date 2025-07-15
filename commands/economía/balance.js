const { EmbedBuilder } = require('discord.js');
const { getUserBalance, getCurrencyName } = require('../../utils/economyUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

module.exports = {
    name: 'balance',
    description: 'Muestra el saldo actual del usuario o del mencionado',
    legacy: true,
    data: { name: 'balance' },

    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        if (!(await hasPrefix(message, 'balance'))) {
            return;
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'balance');
        const currentPrefix = await getCurrentPrefix(message.guild.id);

        // Determinar usuario objetivo
        let target = message.mentions.users.first() || message.author;
        if (commandArgs.length > 0 && !message.mentions.users.first()) {
            // Intentar buscar por ID o nombre
            const userIdOrName = commandArgs[0];
            const member = message.guild.members.cache.find(m => m.user.username === userIdOrName || m.user.id === userIdOrName);
            if (member) target = member.user;
        }

        // Validar usuario
        if (!target) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Usuario No Encontrado')
                .setDescription('No se pudo encontrar el usuario especificado.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Obtener saldo
        const saldo = await getUserBalance(target.id, message.guild.id);
        const currency = await getCurrencyName(message.guild.id);

        // Mostrar embed
        const embed = new EmbedBuilder()
            .setColor('#00bfff')
            .setTitle('💰 Saldo de Usuario')
            .setDescription(`Saldo actual de ${target}`)
            .addFields({
                name: 'Saldo',
                value: `**${saldo} ${currency}**`,
                inline: true
            })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }
};
