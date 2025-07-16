const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'sgblock',
    description: 'Bloquea un comando específico para todos excepto un rol permitido',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('sgblock')
        .setDescription('Comando sgblock'),
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
        
        if (!message.content.startsWith(currentPrefix + 'sgblock')) {
            return;
        }

        // Verificar permisos usando sgconfig
        const sgconfigCommand = require('./sgconfig.js');
        const hasPermission = await sgconfigCommand.checkPermission(message);
        
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para usar este comando.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Contacta a un administrador para configurar los permisos con `!sgconfig <rol_id>`',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Verificar argumentos
        if (args.length < 3) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}sgblock <comando> <rol_id> <permitido>\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}sgblock warn 123456789012345678 true\` - Bloquea warn para todos excepto el rol`,
                        `\`${currentPrefix}sgblock ban 987654321098765432 false\` - Bloquea ban completamente`,
                        `\`${currentPrefix}sgblock clear 123456789012345678 true\` - Solo el rol puede usar clear`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: [
                        '• `<comando>` - Nombre del comando a bloquear',
                        '• `<rol_id>` - ID del rol que puede usar el comando',
                        '• `<permitido>` - true/false si el rol puede usar el comando'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed], flags: 64 });
        }

        const commandName = args[0].toLowerCase();
        const roleId = args[1];
        const allowed = args[2].toLowerCase();

        // Validar nombre del comando
        if (commandName.length < 2) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Nombre de Comando Inválido')
                .setDescription('El nombre del comando debe tener al menos 2 caracteres.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar ID del rol
        if (!/^\d{17,19}$/.test(roleId)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ ID de Rol Inválido')
                .setDescription('El ID del rol debe ser un número válido de Discord.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Verificar que el rol existe
        const role = message.guild.roles.cache.get(roleId);
        if (!role) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Rol No Encontrado')
                .setDescription(`No se encontró un rol con el ID \`${roleId}\` en este servidor.`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar valor de permitido
        if (allowed !== 'true' && allowed !== 'false') {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Valor Inválido')
                .setDescription('El valor de permitido debe ser `true` o `false`.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed], flags: 64 });
        }

        const isAllowed = allowed === 'true';

        try {
            // Cargar configuración actual
            const commandBlockPath = path.join(__dirname, '../data/command_block.json');
            let commandBlock = {};
            
            try {
                const commandBlockData = await fs.readFile(commandBlockPath, 'utf8');
                commandBlock = JSON.parse(commandBlockData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Inicializar configuración del servidor si no existe
            if (!commandBlock[message.guild.id]) {
                commandBlock[message.guild.id] = {};
            }

            // Guardar configuración del comando
            commandBlock[message.guild.id][commandName] = {
                roleId: roleId,
                allowed: isAllowed,
                blockedBy: message.author.id,
                blockedAt: new Date().toISOString()
            };

            // Guardar en archivo
            await fs.writeFile(commandBlockPath, JSON.stringify(commandBlock, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Comando Bloqueado')
                .setDescription(`El comando \`${commandName}\` ha sido configurado.`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Comando:** \`${commandName}\``,
                        `**Rol:** ${role.name} (\`${roleId}\`)`,
                        `**Permitido:** ${isAllowed ? '✅ Sí' : '❌ No'}`,
                        `**Servidor:** ${message.guild.name}`,
                        `**Configurado por:** ${message.author.tag}`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: isAllowed 
                        ? `Solo usuarios con el rol ${role.name} pueden usar el comando \`${commandName}\`.`
                        : `El comando \`${commandName}\` está completamente bloqueado.`,
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [embed], flags: 64 });

        } catch (error) {
            console.error('Error al bloquear comando:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al bloquear el comando. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed], flags: 64 });
        }
    },

    // Función para verificar si un comando está bloqueado (usada por otros comandos)
    async checkCommandBlock(message, commandName) {
        try {
            const commandBlockPath = path.join(__dirname, '../data/command_block.json');
            const commandBlockData = await fs.readFile(commandBlockPath, 'utf8');
            const commandBlock = JSON.parse(commandBlockData);

            const guildBlocks = commandBlock[message.guild.id];
            if (!guildBlocks || !guildBlocks[commandName]) {
                return { blocked: false }; // Comando no bloqueado
            }

            const blockConfig = guildBlocks[commandName];
            
            // Si el rol no está permitido, el comando está bloqueado
            if (!blockConfig.allowed) {
                return { 
                    blocked: true, 
                    reason: 'Comando completamente bloqueado',
                    roleId: blockConfig.roleId
                };
            }

            // Si el rol está permitido, verificar si el usuario tiene el rol
            const hasRole = message.member.roles.cache.has(blockConfig.roleId);
            
            return { 
                blocked: !hasRole, 
                reason: hasRole ? 'Usuario autorizado' : 'Usuario no autorizado',
                roleId: blockConfig.roleId
            };

        } catch (error) {
            console.error('Error al verificar bloqueo de comando:', error);
            return { blocked: false }; // En caso de error, permitir el comando
        }
    }
}; 