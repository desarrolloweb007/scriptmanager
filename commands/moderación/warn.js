const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsPath)) return {};
    return JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
}

function saveWarnings(warnings) {
    fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
}

module.exports = {
    name: 'warn',
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Advierte a un usuario y registra la advertencia')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Usuario a advertir')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('razon')
                .setDescription('Razón de la advertencia')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon');
        const moderator = interaction.user;
        const guildId = interaction.guild.id;

        // Verificar permisos
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para advertir usuarios.')],
                flags: 64
            });
        }

        // Registrar advertencia
        const warnings = loadWarnings();
        if (!warnings[guildId]) warnings[guildId] = {};
        if (!warnings[guildId][user.id]) warnings[guildId][user.id] = [];
        warnings[guildId][user.id].push({
            reason,
            date: new Date().toISOString(),
            moderator: moderator.id
        });
        saveWarnings(warnings);

        // Embed de confirmación
        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ Usuario advertido')
            .addFields(
                { name: 'Usuario', value: `<@${user.id}>`, inline: true },
                { name: 'Moderador', value: `<@${moderator.id}>`, inline: true },
                { name: 'Razón', value: reason, inline: false },
                { name: 'Total de advertencias', value: warnings[guildId][user.id].length.toString(), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(`[WARN] ${moderator.tag} advirtió a ${user.tag} en ${interaction.guild.name}: ${reason}`);
    },

    // Comando legacy con prefijo dinámico
    legacy: true,
    async executeLegacy(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No tienes permisos para advertir usuarios.')]
            });
        }

        if (args.length < 2) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Uso correcto: `[prefijo]warn @usuario razón`')]
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

        const reason = args.slice(1).join(' ');
        const moderator = message.author;
        const guildId = message.guild.id;

        // Registrar advertencia
        const warnings = loadWarnings();
        if (!warnings[guildId]) warnings[guildId] = {};
        if (!warnings[guildId][user.id]) warnings[guildId][user.id] = [];
        warnings[guildId][user.id].push({
            reason,
            date: new Date().toISOString(),
            moderator: moderator.id
        });
        saveWarnings(warnings);

        // Embed de confirmación
        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ Usuario advertido')
            .addFields(
                { name: 'Usuario', value: `<@${user.id}>`, inline: true },
                { name: 'Moderador', value: `<@${moderator.id}>`, inline: true },
                { name: 'Razón', value: reason, inline: false },
                { name: 'Total de advertencias', value: warnings[guildId][user.id].length.toString(), inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        console.log(`[WARN] ${moderator.tag} advirtió a ${user.tag} en ${message.guild.name}: ${reason}`);
    }
}; 