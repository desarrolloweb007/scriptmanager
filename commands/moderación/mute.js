const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

function parseDuration(str) {
    const regex = /(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i;
    const match = str.match(regex);
    if (!match) return null;
    const [ , d, h, m, s ] = match.map(x => parseInt(x) || 0);
    return ((d*24*60*60)+(h*60*60)+(m*60)+(s))*1000;
}

async function getOrCreateMutedRole(guild) {
    let role = guild.roles.cache.find(r => r.name === 'Muted');
    if (!role) {
        role = await guild.roles.create({
            name: 'Muted',
            color: 'Grey',
            reason: 'Rol para usuarios muteados',
            permissions: []
        });
        for (const channel of guild.channels.cache.values()) {
            await channel.permissionOverwrites.edit(role, {
                SendMessages: false,
                AddReactions: false,
                Speak: false
            }).catch(() => {});
        }
    }
    return role;
}

module.exports = {
    name: 'mute',
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mutea a un usuario por un tiempo determinado')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Usuario a mutear')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('duracion')
                .setDescription('Duración (ej: 1d 2h 3m 4s)')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('razon')
                .setDescription('Razón del muteo')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const member = await interaction.guild.members.fetch(user.id);
        const durationStr = interaction.options.getString('duracion');
        const reason = interaction.options.getString('razon');
        const moderator = interaction.user;

        if (!interaction.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No tienes permisos para mutear usuarios.')],
                ephemeral: true
            });
        }

        const duration = parseDuration(durationStr);
        if (!duration || duration < 1000) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Duración inválida. Usa el formato: 1d 2h 3m 4s')],
                ephemeral: true
            });
        }

        const mutedRole = await getOrCreateMutedRole(interaction.guild);
        if (member.roles.cache.has(mutedRole.id)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Orange').setDescription('⚠️ El usuario ya está muteado.')],
                ephemeral: true
            });
        }

        await member.roles.add(mutedRole, reason);

        const embed = new EmbedBuilder()
            .setColor('Grey')
            .setTitle('🔇 Usuario muteado')
            .addFields(
                { name: 'Usuario', value: `<@${user.id}>`, inline: true },
                { name: 'Moderador', value: `<@${moderator.id}>`, inline: true },
                { name: 'Razón', value: reason, inline: false },
                { name: 'Duración', value: durationStr, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(`[MUTE] ${moderator.tag} muteó a ${user.tag} en ${interaction.guild.name} por ${durationStr}: ${reason}`);

        setTimeout(async () => {
            if (member.roles.cache.has(mutedRole.id)) {
                await member.roles.remove(mutedRole, 'Mute automático finalizado');
                console.log(`[UNMUTE] ${user.tag} fue desmuteado automáticamente en ${interaction.guild.name}`);
            }
        }, duration);
    },

    // Comando legacy con prefijo dinámico
    legacy: true,
    async executeLegacy(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para mutear usuarios.')]
            });
        }

        if (args.length < 3) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Uso correcto: `[prefijo]mute @usuario duración razón`')]
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

        const member = await message.guild.members.fetch(user.id);
        const durationStr = args[1];
        const reason = args.slice(2).join(' ');
        const moderator = message.author;

        const duration = parseDuration(durationStr);
        if (!duration || duration < 1000) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Duración inválida. Usa el formato: 1d 2h 3m 4s')]
            });
        }

        const mutedRole = await getOrCreateMutedRole(message.guild);
        if (member.roles.cache.has(mutedRole.id)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Orange')
                    .setDescription('⚠️ El usuario ya está muteado.')]
            });
        }

        await member.roles.add(mutedRole, reason);

        const embed = new EmbedBuilder()
            .setColor('Grey')
            .setTitle('🔇 Usuario muteado')
            .addFields(
                { name: 'Usuario', value: `<@${user.id}>`, inline: true },
                { name: 'Moderador', value: `<@${moderator.id}>`, inline: true },
                { name: 'Razón', value: reason, inline: false },
                { name: 'Duración', value: durationStr, inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        console.log(`[MUTE] ${moderator.tag} muteó a ${user.tag} en ${message.guild.name} por ${durationStr}: ${reason}`);

        setTimeout(async () => {
            if (member.roles.cache.has(mutedRole.id)) {
                await member.roles.remove(mutedRole, 'Mute automático finalizado');
                console.log(`[UNMUTE] ${user.tag} fue desmuteado automáticamente en ${message.guild.name}`);
            }
        }, duration);
    }
}; 