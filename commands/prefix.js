const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Almacenamiento temporal de prefijos por servidor
const serverPrefixes = new Map();

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