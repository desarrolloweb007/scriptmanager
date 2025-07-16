const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { readJsonFile, getCurrencyName } = require('../../utils/economyUtils');
const { hasPrefix, getCurrentPrefix } = require('../../utils/prefixUtils');
const path = require('path');

module.exports = {
    name: 'leaderboard',
    description: 'Muestra el ranking de los 10 usuarios con más saldo en el servidor',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Comando leaderboard'),
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

        const guildId = message.guild.id;
        const currentPrefix = await getCurrentPrefix(guildId);
        const currency = await getCurrencyName(guildId);
        const ECONOMY_PATH = path.join(__dirname, '../../data/economy.json');
        const economy = await readJsonFile(ECONOMY_PATH);
        const guildEconomy = economy[guildId] || {};

        // Obtener top 10
        const sorted = Object.entries(guildEconomy)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        if (sorted.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle('🏆 Leaderboard')
                .setDescription('No hay usuarios con saldo en este servidor.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        let desc = '';
        for (let i = 0; i < sorted.length; i++) {
            const [userId, amount] = sorted[i];
            const user = await message.guild.members.fetch(userId).catch(() => null);
            desc += `**${i + 1}.** ${user ? user.user.tag : `Usuario (${userId})`} — **${amount} ${currency}**\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🏆 Leaderboard')
            .setDescription(desc)
            .setFooter({ text: `Solo se muestran los 10 usuarios con más saldo` })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }
};
