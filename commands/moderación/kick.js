const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'kick',
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa a un usuario del servidor')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Usuario a expulsar')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('razon')
                .setDescription('Razón de la expulsión')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const reason = interaction.options.getString('razon');
        const moderator = interaction.user;

        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No tienes permisos para expulsar usuarios.')],
                flags: 64
            });
        }

        if (!member) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Orange').setDescription('⚠️ El usuario no está en el servidor.')],
                flags: 64
            });
        }

        if (!member.kickable) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No puedo expulsar a este usuario (jerarquía o permisos insuficientes).')],
                flags: 64
            });
        }

        await member.kick(reason);

        const embed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle('👢 Usuario expulsado')
            .addFields(
                { name: 'Usuario', value: `<@${user.id}>`, inline: true },
                { name: 'Moderador', value: `<@${moderator.id}>`, inline: true },
                { name: 'Razón', value: reason, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(`[KICK] ${moderator.tag} expulsó a ${user.tag} en ${interaction.guild.name}: ${reason}`);
    },

    // Comando legacy con prefijo dinámico
    legacy: true,
    async executeLegacy(message, args) {
        try {
        try {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para expulsar usuarios.')]
            });
        }

        if (args.length < 2) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Uso correcto: `[prefijo]kick @usuario razón`')]
            });
        }

        const user = message.mentions.users.first();
        if (!user) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Debes mencionar a un usuario válido.')]
            });
        }

        const member = await message.guild.members.fetch(user.id).catch(() => null);
        const reason = args.slice(1).join(' ');
        const moderator = message.author;

        if (!member) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Orange')
                    .setDescription('⚠️ El usuario no está en el servidor.')]
            });
        }

        if (!member.kickable) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No puedo expulsar a este usuario (jerarquía o permisos insuficientes).')]
            });
        }

        await member.kick(reason);

        const embed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle('👢 Usuario expulsado')
            .addFields(
                { name: 'Usuario', value: `<@${user.id}>`, inline: true },
                { name: 'Moderador', value: `<@${moderator.id}>`, inline: true },
                { name: 'Razón', value: reason, inline: false }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        console.log(`[KICK] ${moderator.tag} expulsó a ${user.tag} en ${message.guild.name}: ${reason}`);
    }
}; 