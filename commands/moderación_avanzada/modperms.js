const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'modperms',
    description: 'Configura permisos por comando para roles específicos',
    legacy: true,
    data: { name: 'modperms' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixManager = require('../../utils/prefixManager');
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'modperms')) {
            return;
        }

        // Verificar permisos de administrador
        if (!message.member.permissions.has('Administrator')) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('Solo los administradores pueden configurar permisos de comandos.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar argumentos
        if (args.length < 2) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}modperms <comando> <rol_id>\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}modperms addword 123456789012345678\``,
                        `\`${currentPrefix}modperms removeword 987654321098765432\``,
                        `\`${currentPrefix}modperms listwords 555666777888999000\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: '🛡️ Comandos Disponibles',
                    value: '`addword`, `removeword`, `listwords`, `autopunish`, `checkinfractions`',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const command = args[0].toLowerCase();
        const roleId = args[1];

        // Validar comando
        const validCommands = ['addword', 'removeword', 'listwords', 'autopunish', 'checkinfractions'];
        if (!validCommands.includes(command)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Comando Inválido')
                .setDescription(`El comando \`${command}\` no es válido.`)
                .addFields({
                    name: '✅ Comandos Válidos',
                    value: validCommands.map(cmd => `\`${cmd}\``).join(', '),
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

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
            const modpermsPath = path.join(__dirname, '../../data/modperms.json');
            let modperms = {};
            
            try {
                const modpermsData = await fs.readFile(modpermsPath, 'utf8');
                modperms = JSON.parse(modpermsData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Inicializar configuración del servidor si no existe
            if (!modperms[message.guild.id]) {
                modperms[message.guild.id] = {};
            }

            // Guardar permiso
            modperms[message.guild.id][command] = roleId;

            // Guardar en archivo
            await fs.writeFile(modpermsPath, JSON.stringify(modperms, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Permiso Configurado')
                .setDescription(`El comando \`${command}\` ahora requiere el rol ${role.name}`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Comando:** \`${command}\``,
                        `**Rol:** ${role.name} (\`${roleId}\`)`,
                        `**Servidor:** ${message.guild.name}`
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al configurar permisos:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al configurar los permisos. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    },

    // Función para verificar permisos (usada por otros comandos)
    async checkPermission(message, command) {
        try {
            const modpermsPath = path.join(__dirname, '../../data/modperms.json');
            const modpermsData = await fs.readFile(modpermsPath, 'utf8');
            const modperms = JSON.parse(modpermsData);

            const guildPerms = modperms[message.guild.id];
            if (!guildPerms || !guildPerms[command]) {
                return true; // Sin restricciones si no está configurado
            }

            const requiredRoleId = guildPerms[command];
            return message.member.roles.cache.has(requiredRoleId);

        } catch (error) {
            console.error('Error al verificar permisos:', error);
            return true; // Permitir si hay error
        }
    }
}; 