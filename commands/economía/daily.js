const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCooldown, setCooldown, addUserBalance, getUserBalance, getCurrencyName } = require('../../utils/economyUtils');

const DAILY_AMOUNT = 500;
const COOLDOWN_HOURS = 24;

module.exports = {
    name: 'daily',
    description: 'Reclama tu recompensa diaria',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Reclama tu recompensa diaria'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
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
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Dar recompensa
            await addUserBalance(userId, guildId, DAILY_AMOUNT);
            await setCooldown(userId, 'daily', now);
            const saldo = await getUserBalance(userId, guildId);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎁 Recompensa Diaria')
                .setDescription(`¡Has recibido **${DAILY_AMOUNT} ${currency}**!`)
                .addFields({ 
                    name: 'Tu Nuevo Saldo', 
                    value: `**${saldo} ${currency}**`, 
                    inline: true 
                })
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            console.log(`[DAILY] ${interaction.user.tag} reclamó recompensa diaria en ${interaction.guild.name}`);
            
        } catch (error) {
            console.error('Error en comando daily:', error);
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error')
                    .setDescription('Hubo un error al procesar tu recompensa diaria. Inténtalo de nuevo.')],
                ephemeral: true
            });
        }
    },

    async executeLegacy(message, args) {
        try {
        try {
        try {
            const userId = message.author.id;
            const guildId = message.guild.id;
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
                
                return await message.reply({ embeds: [embed] });
            }

            // Dar recompensa
            await addUserBalance(userId, guildId, DAILY_AMOUNT);
            await setCooldown(userId, 'daily', now);
            const saldo = await getUserBalance(userId, guildId);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎁 Recompensa Diaria')
                .setDescription(`¡Has recibido **${DAILY_AMOUNT} ${currency}**!`)
                .addFields({ 
                    name: 'Tu Nuevo Saldo', 
                    value: `**${saldo} ${currency}**`, 
                    inline: true 
                })
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            
            console.log(`[DAILY] ${message.author.tag} reclamó recompensa diaria en ${message.guild.name}`);
            
        } catch (error) {
            console.error('Error en comando daily:', error);
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error')
                    .setDescription('Hubo un error al procesar tu recompensa diaria. Inténtalo de nuevo.')]
            });
        }
    }
};
