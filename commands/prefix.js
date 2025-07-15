const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const PREFIXES_PATH = path.join(__dirname, '../data/prefixes.json');

// Almacenamiento temporal de prefijos por servidor
const serverPrefixes = new Map();

// Cargar prefijos desde el archivo al iniciar
function loadPrefixes() {
    try {
        if (fs.existsSync(PREFIXES_PATH)) {
            const data = fs.readFileSync(PREFIXES_PATH, 'utf8');
            const prefixes = JSON.parse(data);
            for (const guildId in prefixes) {
                serverPrefixes.set(guildId, prefixes[guildId]);
            }
        }
    } catch (e) {
        console.error('Error al cargar prefixes.json:', e);
    }
}

// Guardar prefijos en el archivo
function savePrefixes() {
    const obj = {};
    for (const [guildId, prefix] of serverPrefixes.entries()) {
        obj[guildId] = prefix;
    }
    fs.writeFileSync(PREFIXES_PATH, JSON.stringify(obj, null, 2));
}

// Cargar prefijos al iniciar
loadPrefixes();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Configura el prefijo del bot para este servidor')
        .addStringOption(option =>
            option.setName('nuevo_prefijo')
                .setDescription('El nuevo prefijo para los comandos (ej: !, ?, >)')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(5))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const newPrefix = interaction.options.getString('nuevo_prefijo');
        const guildId = interaction.guild.id;

        // Validar el prefijo
        if (newPrefix.includes(' ')) {
            return await interaction.reply({
                content: '❌ El prefijo no puede contener espacios.',
                ephemeral: true
            });
        }

        // Guardar el nuevo prefijo
        serverPrefixes.set(guildId, newPrefix);
        savePrefixes();

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Prefijo Actualizado')
            .setDescription(`El prefijo del bot ha sido cambiado a: **${newPrefix}**`)
            .addFields(
                { name: 'Nuevo Prefijo', value: `\`${newPrefix}\``, inline: true },
                { name: 'Configurado por', value: `${interaction.user}`, inline: true },
                { name: 'Servidor', value: `${interaction.guild.name}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Sistema de Configuración' });

        await interaction.reply({ embeds: [embed] });
    },

    // Comando legacy con prefijo dinámico
    legacy: true,
    async executeLegacy(message, args) {
        // Verificar permisos del usuario
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return await message.reply('❌ No tienes permisos para gestionar el servidor.');
        }

        // Verificar argumentos
        if (args.length === 0) {
            const currentPrefix = serverPrefixes.get(message.guild.id) || '!';
            return await message.reply(`📋 El prefijo actual es: **${currentPrefix}**\n\nPara cambiarlo usa: \`${currentPrefix}prefix nuevo_prefijo\``);
        }

        const newPrefix = args[0];

        // Validar el prefijo
        if (newPrefix.length > 5) {
            return await message.reply('❌ El prefijo no puede tener más de 5 caracteres.');
        }

        if (newPrefix.includes(' ')) {
            return await message.reply('❌ El prefijo no puede contener espacios.');
        }

        // Guardar el nuevo prefijo
        serverPrefixes.set(message.guild.id, newPrefix);
        savePrefixes();

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Prefijo Actualizado')
            .setDescription(`El prefijo del bot ha sido cambiado a: **${newPrefix}**`)
            .addFields(
                { name: 'Nuevo Prefijo', value: `\`${newPrefix}\``, inline: true },
                { name: 'Configurado por', value: `${message.author}`, inline: true },
                { name: 'Servidor', value: `${message.guild.name}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Sistema de Configuración' });

        await message.reply({ embeds: [embed] });
    },

    // Función para obtener el prefijo de un servidor
    getPrefix(guildId) {
        return serverPrefixes.get(guildId) || '!';
    }
}; 