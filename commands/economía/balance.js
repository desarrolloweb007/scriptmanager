const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserBalance, getCurrencyName } = require('../../utils/economyUtils');

module.exports = {
    name: 'balance',
    description: 'Muestra el saldo actual del usuario o del mencionado',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Muestra el saldo actual del usuario')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Usuario del cual ver el saldo (opcional)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Determinar usuario objetivo
            const target = interaction.options.getUser('usuario') || interaction.user;

            // Obtener saldo
            const saldo = await getUserBalance(target.id, interaction.guild.id);
            const currency = await getCurrencyName(interaction.guild.id);

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
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            console.log(`[BALANCE] ${interaction.user.tag} consultó saldo de ${target.tag} en ${interaction.guild.name}`);
            
        } catch (error) {
            console.error('Error en comando balance:', error);
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error')
                    .setDescription('Hubo un error al obtener el saldo. Inténtalo de nuevo.')],
                ephemeral: true
            });
        }
    },

    async executeLegacy(message, args) {
        try {
            // Determinar usuario objetivo
            let target = message.mentions.users.first() || message.author;
            if (args.length > 0 && !message.mentions.users.first()) {
                // Intentar buscar por ID o nombre
                const userIdOrName = args[0];
                const member = message.guild.members.cache.find(m => 
                    m.user.username === userIdOrName || 
                    m.user.id === userIdOrName ||
                    m.displayName === userIdOrName
                );
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
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            
            console.log(`[BALANCE] ${message.author.tag} consultó saldo de ${target.tag} en ${message.guild.name}`);
            
        } catch (error) {
            console.error('Error en comando balance:', error);
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error')
                    .setDescription('Hubo un error al obtener el saldo. Inténtalo de nuevo.')]
            });
        }
    }
};
