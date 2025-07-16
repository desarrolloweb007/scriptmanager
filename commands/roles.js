const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Muestra la lista de roles disponibles en el servidor'),

    async execute(interaction) {
        const guild = interaction.guild;
        const roles = guild.roles.cache
            .filter(role => !role.managed && role.name !== '@everyone')
            .sort((a, b) => b.position - a.position);

        if (roles.size === 0) {
            return await interaction.reply({
                content: '❌ No hay roles disponibles en este servidor.',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('📋 Roles Disponibles')
            .setDescription(`Lista de roles en **${guild.name}**`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Total: ${roles.size} roles` });

        // Dividir roles en chunks para evitar límites de Discord
        const roleChunks = [];
        let currentChunk = [];
        let charCount = 0;

        for (const [id, role] of roles) {
            const roleText = `• ${role} - ${role.members.size} miembros\n`;
            
            if (charCount + roleText.length > 1024) {
                roleChunks.push(currentChunk);
                currentChunk = [roleText];
                charCount = roleText.length;
            } else {
                currentChunk.push(roleText);
                charCount += roleText.length;
            }
        }
        
        if (currentChunk.length > 0) {
            roleChunks.push(currentChunk);
        }

        // Crear campos para cada chunk
        roleChunks.forEach((chunk, index) => {
            embed.addFields({
                name: index === 0 ? 'Roles del Servidor' : `Roles (continuación ${index + 1})`,
                value: chunk.join(''),
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });
    },

    // Comando legacy con prefijo !
    legacy: true,
    async executeLegacy(message, args) {
        try {
        try {
        const guild = message.guild;
        const roles = guild.roles.cache
            .filter(role => !role.managed && role.name !== '@everyone')
            .sort((a, b) => b.position - a.position);

        if (roles.size === 0) {
            return await message.reply('❌ No hay roles disponibles en este servidor.');
        }

        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('📋 Roles Disponibles')
            .setDescription(`Lista de roles en **${guild.name}**`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Total: ${roles.size} roles` });

        // Dividir roles en chunks para evitar límites de Discord
        const roleChunks = [];
        let currentChunk = [];
        let charCount = 0;

        for (const [id, role] of roles) {
            const roleText = `• ${role} - ${role.members.size} miembros\n`;
            
            if (charCount + roleText.length > 1024) {
                roleChunks.push(currentChunk);
                currentChunk = [roleText];
                charCount = roleText.length;
            } else {
                currentChunk.push(roleText);
                charCount += roleText.length;
            }
        }
        
        if (currentChunk.length > 0) {
            roleChunks.push(currentChunk);
        }

        // Crear campos para cada chunk
        roleChunks.forEach((chunk, index) => {
            embed.addFields({
                name: index === 0 ? 'Roles del Servidor' : `Roles (continuación ${index + 1})`,
                value: chunk.join(''),
                inline: false
            });
        });

        await message.reply({ embeds: [embed] });
    }
}; 