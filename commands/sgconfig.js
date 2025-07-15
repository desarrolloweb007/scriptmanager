const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'sgconfig',
    description: 'Configura el rol autorizado para usar comandos de bloqueo',
    legacy: true,
    data: { name: 'sgconfig' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixCommand = require('./prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'sgconfig')) {
            return;
        }

        // Buscar o crear el rol 'all-permissions'
        let allPermRole = message.guild.roles.cache.find(r => r.name === 'all-permissions');
        if (!allPermRole) {
            try {
                allPermRole = await message.guild.roles.create({
                    name: 'all-permissions',
                    color: 'Orange',
                    reason: 'Rol requerido para usar el comando sgconfig',
                    permissions: [] // No permisos especiales por defecto
                });
                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#00bfff')
                            .setTitle('🔑 Rol "all-permissions" creado')
                            .setDescription('Se ha creado el rol **all-permissions**. Asigna este rol a los usuarios que podrán usar `sgconfig`.')
                            .setTimestamp()
                    ]
                });
            } catch (error) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('❌ Error al crear el rol')
                            .setDescription('No se pudo crear el rol **all-permissions**. Verifica mis permisos.')
                            .setTimestamp()
                    ]
                });
            }
        }

        // Verificar que el usuario tenga el rol 'all-permissions'
        if (!message.member.roles.cache.has(allPermRole.id)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Permiso Denegado')
                        .setDescription('Solo los usuarios con el rol **all-permissions** pueden usar este comando.')
                        .addFields({
                            name: 'ℹ️ Información',
                            value: 'Pide a un administrador que te asigne el rol **all-permissions**.'
                        })
                        .setTimestamp()
                ]
            });
        }

        // Verificar argumentos
        if (args.length < 1) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}sgconfig <rol_id>\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}sgconfig 123456789012345678\``,
                        `\`${currentPrefix}sgconfig 987654321098765432\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Configura qué rol puede usar los comandos `!sgblock` y `!sgconfig`',
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
            const sgconfigPath = path.join(__dirname, '../data/sgconfig.json');
            let sgconfig = {};
            
            try {
                const sgconfigData = await fs.readFile(sgconfigPath, 'utf8');
                sgconfig = JSON.parse(sgconfigData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Guardar configuración
            sgconfig[message.guild.id] = roleId;

            // Guardar en archivo
            await fs.writeFile(sgconfigPath, JSON.stringify(sgconfig, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Permiso de Bloqueo Configurado')
                .setDescription(`El rol ${role.name} ahora puede usar comandos de bloqueo.`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Rol:** ${role.name} (\`${roleId}\`)`,
                        `**Servidor:** ${message.guild.name}`,
                        `**Comandos:** \`${currentPrefix}sgblock\`, \`${currentPrefix}sgconfig\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Los usuarios con este rol pueden bloquear comandos y configurar el sistema.',
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al configurar permisos de bloqueo:', error);
            
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
        // Solo el rol all-permissions puede usar sgconfig
        let allPermRole = message.guild.roles.cache.find(r => r.name === 'all-permissions');
        if (!allPermRole) return false;
        return message.member.roles.cache.has(allPermRole.id);
    }
}; 