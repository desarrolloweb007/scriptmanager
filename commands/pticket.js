const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'pticket',
    description: 'Configura el rol autorizado para usar comandos de tickets',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('pticket')
        .setDescription('Comando pticket'),
    async execute(interaction) {
        await interaction.reply({ 
            content: 'Comando en desarrollo. Usa la versión legacy por ahora.', 
            ephemeral: true 
        });
    },
    
    async executeLegacy(message, args) {
        try {
        try {
        // Verificar prefijo dinámico
        const prefixManager = require('../utils/prefixManager');
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'pticket')) {
            return;
        }

        // Verificar permisos de administrador
        if (!message.member.permissions.has('Administrator')) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('Solo los administradores pueden configurar permisos de tickets.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar argumentos
        if (args.length < 1) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}pticket <rol_id>\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}pticket 123456789012345678\``,
                        `\`${currentPrefix}pticket 987654321098765432\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Configura qué rol puede usar los comandos `!ticketmsg` y `!ticketsetup`',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const roleId = args[0];

        // Validar ID del rol
        if (!/^\d{17,19}$/.test(roleId)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ ID de Rol Inválido')
                .setDescription('El ID del rol debe ser un número válido de Discord.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar que el rol existe
        const role = message.guild.roles.cache.get(roleId);
        if (!role) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Rol No Encontrado')
                .setDescription(`No se encontró un rol con el ID \`${roleId}\` en este servidor.`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        try {
            // Cargar configuración actual
            const ticketPermisosPath = path.join(__dirname, '../data/ticket_permisos.json');
            let ticketPermisos = {};
            
            try {
                const ticketPermisosData = await fs.readFile(ticketPermisosPath, 'utf8');
                ticketPermisos = JSON.parse(ticketPermisosData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Guardar configuración
            ticketPermisos[message.guild.id] = roleId;

            // Guardar en archivo
            await fs.writeFile(ticketPermisosPath, JSON.stringify(ticketPermisos, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Permiso de Tickets Configurado')
                .setDescription(`El rol ${role.name} ahora puede usar comandos de tickets.`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Rol:** ${role.name} (\`${roleId}\`)`,
                        `**Servidor:** ${message.guild.name}`,
                        `**Comandos:** \`${currentPrefix}ticketmsg\`, \`${currentPrefix}ticketsetup\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Los usuarios con este rol pueden crear mensajes de tickets y configurar el sistema.',
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al configurar permisos de tickets:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al configurar los permisos. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    },

    // Función para verificar permisos (usada por otros comandos)
    async checkPermission(message) {
        try {
            const ticketPermisosPath = path.join(__dirname, '../data/ticket_permisos.json');
            const ticketPermisosData = await fs.readFile(ticketPermisosPath, 'utf8');
            const ticketPermisos = JSON.parse(ticketPermisosData);

            const authorizedRoleId = ticketPermisos[message.guild.id];
            if (!authorizedRoleId) {
                return false; // Sin rol configurado
            }

            return message.member.roles.cache.has(authorizedRoleId);

        } catch (error) {
            console.error('Error al verificar permisos de tickets:', error);
            return false;
        }
    }
}; 