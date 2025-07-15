const { EmbedBuilder } = require('discord.js');
const { getUserBalance, removeUserBalance, addUserBalance, getCurrencyName } = require('../../utils/economyUtils');
const { validateAmount } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

module.exports = {
    name: 'pay',
    description: 'Transfiere monedas de un usuario a otro',
    legacy: true,
    data: { name: 'pay' },

    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        if (!(await hasPrefix(message, 'pay'))) {
            return;
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'pay');
        const currentPrefix = await getCurrentPrefix(message.guild.id);

        // Validar argumentos
        const target = message.mentions.users.first();
        const cantidad = commandArgs.filter(arg => !arg.startsWith('<@')).join(' ').trim();
        if (!target || !cantidad) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uso Incorrecto')
                .setDescription('Debes mencionar a un usuario y especificar la cantidad a transferir.')
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}pay @usuario cantidad\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}pay @Juan 1000\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // No permitir transferirse a sí mismo
        if (target.id === message.author.id) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ No Permitido')
                .setDescription('No puedes transferirte monedas a ti mismo.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar cantidad
        const amountValidation = validateAmount(cantidad);
        if (!amountValidation.valid) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Cantidad Inválida')
                .setDescription(amountValidation.message)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
        const amount = amountValidation.amount;

        // Validar saldo suficiente
        const saldo = await getUserBalance(message.author.id, message.guild.id);
        if (saldo < amount) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Saldo Insuficiente')
                .setDescription(`No tienes suficiente saldo para transferir **${amount}**.`)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Realizar transferencia
        await removeUserBalance(message.author.id, message.guild.id, amount);
        await addUserBalance(target.id, message.guild.id, amount);
        const currency = await getCurrencyName(message.guild.id);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Transferencia Exitosa')
            .setDescription(`Has transferido **${amount} ${currency}** a ${target}.`)
            .addFields({ name: 'Tu Nuevo Saldo', value: `**${saldo - amount} ${currency}**`, inline: true })
            .setTimestamp();
        return message.reply({ embeds: [embed], flags: 64 });
    }
};
