const { EmbedBuilder } = require('discord.js');
const { getCooldown, setCooldown, addUserBalance, getUserBalance, getCurrencyName } = require('../../utils/economyUtils');
const { hasPrefix, getCurrentPrefix } = require('../../utils/prefixUtils');

const DAILY_AMOUNT = 500;
const COOLDOWN_HOURS = 24;

module.exports = {
    name: 'daily',
    description: 'Reclama tu recompensa diaria',
    legacy: true,
    data: { name: 'daily' },

    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        if (!(await hasPrefix(message, 'daily'))) {
            return;
        }

        const userId = message.author.id;
        const guildId = message.guild.id;
        const currentPrefix = await getCurrentPrefix(guildId);
        const currency = await getCurrencyName(guildId);

        // Cooldown
        const lastClaim = await getCooldown(userId, 'daily');
        const now = Date.now();
        if (lastClaim && now - lastClaim < COOLDOWN_HOURS * 60 * 60 * 1000) {
            const remaining = COOLDOWN_HOURS * 60 * 60 * 1000 - (now - lastClaim);
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle('⏳ Cooldown Activo')
                .setDescription(`Ya reclamaste tu recompensa diaria.\nVuelve a intentarlo en **${hours}h ${minutes}m ${seconds}s**.`)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Dar recompensa
        await addUserBalance(userId, guildId, DAILY_AMOUNT);
        await setCooldown(userId, 'daily', now);
        const saldo = await getUserBalance(userId, guildId);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎁 Recompensa Diaria')
            .setDescription(`¡Has recibido **${DAILY_AMOUNT} ${currency}**!`)
            .addFields({ name: 'Tu Nuevo Saldo', value: `**${saldo} ${currency}**`, inline: true })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }
};
