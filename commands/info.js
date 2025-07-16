const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Muestra información detallada del bot ScriptManager'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('🤖 **ScriptManager Bot**')
            .setDescription('Un bot especializado en gestión, automatización y administración de scripts y comandos personalizados dentro del servidor.')
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { 
                    name: '📋 Información General', 
                    value: [
                        '**Nombre:** ScriptManager',
                        '**Versión:** v1.0',
                        '**Creador:** TheAprilGamer',
                        '**Lenguaje:** Node.js',
                        '**Framework:** Discord.js v14'
                    ].join('\n'),
                    inline: false 
                },
                { 
                    name: '🎭 Funcionalidades Principales', 
                    value: [
                        '• Gestión avanzada de roles',
                        '• Sistema de autoasignación con botones',
                        '• Comandos slash y legacy',
                        '• Prefijos personalizables por servidor',
                        '• Verificaciones de seguridad completas',
                        '• Sistema de ayuda integrado'
                    ].join('\n'),
                    inline: false 
                },
                { 
                    name: '⚙️ Estadísticas del Bot', 
                    value: [
                        `**Servidores:** ${interaction.client.guilds.cache.size}`,
                        `**Usuarios:** ${interaction.client.users.cache.size}`,
                        `**Comandos:** ${interaction.client.commands.size}`,
                        `**Uptime:** ${this.formatUptime(interaction.client.uptime)}`
                    ].join('\n'),
                    inline: true 
                },
                { 
                    name: '🔧 Tecnologías', 
                    value: [
                        '• Discord.js v14',
                        '• Node.js',
                        '• dotenv',
                        '• Railway (Deployment)'
                    ].join('\n'),
                    inline: true 
                }
            )
            .addFields({
                name: '🔗 Enlaces Útiles',
                value: [
                    '• [Discord.js Documentation](https://discord.js.org/)',
                    '• [Discord Developer Portal](https://discord.com/developers/)',
                    '• [Railway](https://railway.app/)'
                ].join('\n'),
                inline: false
            })
            .setTimestamp()
            .setFooter({ 
                text: 'ScriptManager Bot v1.0 • Desarrollado por TheAprilGamer',
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
            });

        await interaction.reply({ embeds: [embed] });
    },

    // Comando legacy con prefijo dinámico
    legacy: true,
    async executeLegacy(message, args) {
        try {
        try {
        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('🤖 **ScriptManager Bot**')
            .setDescription('Un bot especializado en gestión, automatización y administración de scripts y comandos personalizados dentro del servidor.')
            .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { 
                    name: '📋 Información General', 
                    value: [
                        '**Nombre:** ScriptManager',
                        '**Versión:** v1.0',
                        '**Creador:** TheAprilGamer',
                        '**Lenguaje:** Node.js',
                        '**Framework:** Discord.js v14'
                    ].join('\n'),
                    inline: false 
                },
                { 
                    name: '🎭 Funcionalidades Principales', 
                    value: [
                        '• Gestión avanzada de roles',
                        '• Sistema de autoasignación con botones',
                        '• Comandos slash y legacy',
                        '• Prefijos personalizables por servidor',
                        '• Verificaciones de seguridad completas',
                        '• Sistema de ayuda integrado'
                    ].join('\n'),
                    inline: false 
                },
                { 
                    name: '⚙️ Estadísticas del Bot', 
                    value: [
                        `**Servidores:** ${message.client.guilds.cache.size}`,
                        `**Usuarios:** ${message.client.users.cache.size}`,
                        `**Comandos:** ${message.client.commands.size}`,
                        `**Uptime:** ${this.formatUptime(message.client.uptime)}`
                    ].join('\n'),
                    inline: true 
                },
                { 
                    name: '🔧 Tecnologías', 
                    value: [
                        '• Discord.js v14',
                        '• Node.js',
                        '• dotenv',
                        '• Railway (Deployment)'
                    ].join('\n'),
                    inline: true 
                }
            )
            .addFields({
                name: '🔗 Enlaces Útiles',
                value: [
                    '• [Discord.js Documentation](https://discord.js.org/)',
                    '• [Discord Developer Portal](https://discord.com/developers/)',
                    '• [Railway](https://railway.app/)'
                ].join('\n'),
                inline: false
            })
            .setTimestamp()
            .setFooter({ 
                text: 'ScriptManager Bot v1.0 • Desarrollado por TheAprilGamer',
                iconURL: message.client.user.displayAvatarURL({ dynamic: true })
            });

        await message.reply({ embeds: [embed] });
    },

    // Función para formatear el uptime
    formatUptime(uptime) {
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);

        return parts.join(' ') || '0s';
    }
}; 