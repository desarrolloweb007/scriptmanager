const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

function parseDuration(str) {
    if (!str || str.toLowerCase() === 'permanente') return null;
    const regex = /(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i;
    const match = str.match(regex);
    if (!match) return null;
    const [ , d, h, m, s ] = match.map(x => parseInt(x) || 0);
    return ((d*24*60*60)+(h*60*60)+(m*60)+(s))*1000;
}

module.exports = {
    name: 'ban',
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea a un usuario del servidor')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Usuario a banear')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('razon')
                .setDescription('Razón del baneo')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('duracion')
                .setDescription('Duración (ej: 1d 2h 3m 4s o permanente)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const reason = interaction.options.getString('razon');
        const durationStr = interaction.options.getString('duracion');
        const moderator = interaction.user;

        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No tienes permisos para banear usuarios.')],
                flags: 64
            });
        }

        if (!member) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Orange').setDescription('⚠️ El usuario no está en el servidor.')],
                flags: 64
            });
        }

        if (!member.bannable) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No puedo banear a este usuario (jerarquía o permisos insuficientes).')],
                flags: 64
            });
        }

        const duration = parseDuration(durationStr);
        await member.ban({ reason });

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('⛔ Usuario baneado')
            .addFields(
                { name: 'Usuario', value: `<@${user.id}>`, inline: true },
                { name: 'Moderador', value: `<@${moderator.id}>`, inline: true },
                { name: 'Razón', value: reason, inline: false },
                { name: 'Duración', value: duration ? durationStr : 'Permanente', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(`[BAN] ${moderator.tag} baneó a ${user.tag} en ${interaction.guild.name} por ${duration ? durationStr : 'permanente'}: ${reason}`);

        if (duration) {
            setTimeout(async () => {
                await interaction.guild.members.unban(user.id, 'Ban temporal finalizado').catch(() => {});
                console.log(`[UNBAN] ${user.tag} fue desbaneado automáticamente en ${interaction.guild.name}`);
            }, duration);
        }
    },

    // Comando legacy con prefijo dinámico
    legacy: true,
    async executeLegacy(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para banear usuarios.')]
            });
        }

        if (args.length < 3) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Uso correcto: `[prefijo]ban @usuario razón duración`')]
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
        const reason = args.slice(1, -1).join(' ');
        const durationStr = args[args.length - 1];
        const moderator = message.author;

        if (!member) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Orange')
                    .setDescription('⚠️ El usuario no está en el servidor.')]
            });
        }

        if (!member.bannable) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No puedo banear a este usuario (jerarquía o permisos insuficientes).')]
            });
        }

        const duration = parseDuration(durationStr);
        await member.ban({ reason });

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('⛔ Usuario baneado')
            .addFields(
                { name: 'Usuario', value: `<@${user.id}>`, inline: true },
                { name: 'Moderador', value: `<@${moderator.id}>`, inline: true },
                { name: 'Razón', value: reason, inline: false },
                { name: 'Duración', value: duration ? durationStr : 'Permanente', inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        console.log(`[BAN] ${moderator.tag} baneó a ${user.tag} en ${message.guild.name} por ${duration ? durationStr : 'permanente'}: ${reason}`);

        if (duration) {
            setTimeout(async () => {
                await message.guild.members.unban(user.id, 'Ban temporal finalizado').catch(() => {});
                console.log(`[UNBAN] ${user.tag} fue desbaneado automáticamente en ${message.guild.name}`);
            }, duration);
        }
    }
}; 