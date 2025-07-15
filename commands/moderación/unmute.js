const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Desmutea a un usuario removiendo el rol Muted')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Usuario a desmutear')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('razon')
                .setDescription('Razón del desmuteo')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const member = await interaction.guild.members.fetch(user.id);
        const reason = interaction.options.getString('razon');
        const moderator = interaction.user;

        if (!interaction.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No tienes permisos para desmutear usuarios.')],
                ephemeral: true
            });
        }

        const mutedRole = interaction.guild.roles.cache.find(r => r.name === 'Muted');
        if (!mutedRole || !member.roles.cache.has(mutedRole.id)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Orange').setDescription('⚠️ El usuario no está muteado.')],
                ephemeral: true
            });
        }

        await member.roles.remove(mutedRole, reason);

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('🔊 Usuario desmuteado')
            .addFields(
                { name: 'Usuario', value: `<@${user.id}>`, inline: true },
                { name: 'Moderador', value: `<@${moderator.id}>`, inline: true },
                { name: 'Razón', value: reason, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(`[UNMUTE] ${moderator.tag} desmuteó a ${user.tag} en ${interaction.guild.name}: ${reason}`);
    }
}; 