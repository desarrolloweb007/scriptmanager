const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'pverify',
    description: 'Configura el rol autorizado para usar comandos de verificación',
    legacy: true,
    data: { name: 'pverify' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixManager = require('../utils/prefixManager');
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'pverify')) {
            return;
        }

        // Verificar permisos de administrador
        if (!message.member.permissions.has('Administrator')) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('Solo los administradores pueden configurar permisos de verificación.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar argumentos
        if (args.length < 1) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}pverify <rol_id>\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}pverify 123456789012345678\``,
                        `\`${currentPrefix}pverify 987654321098765432\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Configura qué rol puede usar el comando `!verifymsg`',
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
            const verifyConfigPath = path.join(__dirname, '../data/verifyconfig.json');
            let verifyConfig = {};
            
            try {
                const verifyConfigData = await fs.readFile(verifyConfigPath, 'utf8');
                verifyConfig = JSON.parse(verifyConfigData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Guardar configuración
            verifyConfig[message.guild.id] = roleId;

            // Guardar en archivo
            await fs.writeFile(verifyConfigPath, JSON.stringify(verifyConfig, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Permiso de Verificación Configurado')
                .setDescription(`El rol ${role.name} ahora puede usar comandos de verificación.`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Rol:** ${role.name} (\`${roleId}\`)`,
                        `**Servidor:** ${message.guild.name}`,
                        `**Comando:** \`${currentPrefix}verifymsg\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Los usuarios con este rol pueden crear mensajes de verificación con reacciones.',
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al configurar permisos de verificación:', error);
            
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
            const verifyConfigPath = path.join(__dirname, '../data/verifyconfig.json');
            const verifyConfigData = await fs.readFile(verifyConfigPath, 'utf8');
            const verifyConfig = JSON.parse(verifyConfigData);

            const authorizedRoleId = verifyConfig[message.guild.id];
            if (!authorizedRoleId) {
                return false; // Sin rol configurado
            }

            return message.member.roles.cache.has(authorizedRoleId);

        } catch (error) {
            console.error('Error al verificar permisos de verificación:', error);
            return false;
        }
    }
}; 