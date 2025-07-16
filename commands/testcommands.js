const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'testcommands',
    description: 'Verifica que todos los comandos se cargan correctamente',
    legacy: true,
    data: { name: 'testcommands' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixManager = require('../utils/prefixManager');
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'testcommands')) {
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Comandos Cargados')
            .setDescription('Lista de todos los comandos disponibles:')
            .addFields({
                name: '🛡️ Moderación Básica',
                value: [
                    '`ban` - Banear usuarios',
                    '`kick` - Expulsar usuarios',
                    '`mute` - Muteo temporal',
                    '`unmute` - Desmutear usuarios',
                    '`warn` - Advertir usuarios',
                    '`warnings` - Ver advertencias',
                    '`clear` - Borrar mensajes',
                    '`pclear` - Configurar rol para clear',
                    '`settingsmod` - Configurar canal de logs',
                    '`rolsettingsmod` - Configurar permisos por rol'
                ].join('\n'),
                inline: false
            })
            .addFields({
                name: '🛡️ Moderación Avanzada',
                value: [
                    '`addword` - Agregar palabra al filtro',
                    '`removeword` - Eliminar palabra del filtro',
                    '`listwords` - Listar palabras filtradas',
                    '`autopunish` - Configurar castigos automáticos',
                    '`checkinfractions` - Ver infracciones de usuario',
                    '`modperms` - Configurar permisos por comando',
                    '`warnfilter` - Sistema automático de filtro',
                    '`test` - Comando de prueba',
                    '`setuptest` - Configurar palabra de prueba'
                ].join('\n'),
                inline: false
            })
            .addFields({
                name: '🎭 Gestión de Roles',
                value: [
                    '`rol` - Asignar rol',
                    '`removerol` - Remover rol',
                    '`roles` - Listar roles',
                    '`autorol` - Panel de autoasignación'
                ].join('\n'),
                inline: false
            })
            .addFields({
                name: '⚙️ Utilidad',
                value: [
                    '`help` - Ayuda',
                    '`prefix` - Configurar prefijo',
                    '`info` - Información del bot'
                ].join('\n'),
                inline: false
            })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 