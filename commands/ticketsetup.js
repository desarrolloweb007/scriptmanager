const { EmbedBuilder, ChannelType, SlashCommandBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'ticketsetup',
    description: 'Configura el sistema de tickets del servidor',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Comando ticketsetup'),
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
        
        if (!message.content.startsWith(currentPrefix + 'ticketsetup')) {
            return;
        }

        // Verificar permisos usando pticket
        const pticketCommand = require('./pticket.js');
        const hasPermission = await pticketCommand.checkPermission(message);
        
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para usar este comando.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Contacta a un administrador para configurar los permisos con `!pticket <rol_id>`',
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Parsear argumentos usando | como separador
        const fullCommand = message.content.slice(currentPrefix.length + 'ticketsetup'.length).trim();
        const parts = fullCommand.split('|').map(part => part.trim());

        // Determinar si el usuario especificó categoría y canal
        let categoryArg, channelArg, ticketMessage, supportRoleId;
        if (parts.length >= 4) {
            // !ticketsetup categoria | #canal | mensaje_embed | rolID_soporte
            categoryArg = parts[0];
            channelArg = parts[1];
            ticketMessage = parts[2];
            supportRoleId = parts[3];
        } else if (parts.length >= 2) {
            // !ticketsetup | mensaje_embed | rolID_soporte (por defecto)
            categoryArg = 'PANEL TICKET';
            channelArg = 'tickets';
            ticketMessage = parts[0];
            supportRoleId = parts[1];
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}ticketsetup [categoria] | [canal] | mensaje_embed | rolID_soporte\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}ticketsetup | Bienvenido al ticket! Describe tu problema. | 123456789012345678\` - Por defecto (PANEL TICKET/tickets)`,
                        `\`${currentPrefix}ticketsetup Soporte | #tickets | Hola! ¿En qué puedo ayudarte? | 987654321098765432\` - Especificando categoría y canal`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: [
                        '• Puedes omitir la categoría y canal para usar los valores por defecto',
                        '• Si la categoría o canal no existen, se crearán automáticamente',
                        '• Puedes usar nombre, mención o ID para categoría y canal',
                        '• Usa `|` para separar los parámetros',
                        '• El mensaje se mostrará cuando se abra un ticket',
                        '• El rol de soporte tendrá acceso a todos los tickets'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Buscar o crear la categoría
        let category = null;
        let categoryId = categoryArg.match(/^<#!?(\d+)>$/)?.[1] || categoryArg.match(/^(\d{17,19})$/)?.[1];
        if (categoryId) {
            category = message.guild.channels.cache.get(categoryId);
        } else {
            category = message.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === categoryArg.toLowerCase());
        }
        if (!category) {
            // Crear la categoría
            category = await message.guild.channels.create({
                name: categoryArg,
                type: ChannelType.GuildCategory,
                reason: 'Categoría de tickets creada automáticamente'
            });
        }

        // Buscar o crear el canal
        let channel = null;
        let channelId = channelArg.match(/^<#(\d+)>$/)?.[1] || channelArg.match(/^(\d{17,19})$/)?.[1];
        if (channelId) {
            channel = message.guild.channels.cache.get(channelId);
        } else {
            channel = message.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name.toLowerCase() === channelArg.toLowerCase() && c.parentId === category.id);
        }
        if (!channel) {
            // Crear el canal dentro de la categoría
            channel = await message.guild.channels.create({
                name: channelArg,
                type: ChannelType.GuildText,
                parent: category.id,
                reason: 'Canal de tickets creado automáticamente'
            });
        }

        // Validar ID del rol de soporte
        if (!/^\d{17,19}$/.test(supportRoleId)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ ID de Rol Inválido')
                .setDescription('El ID del rol de soporte debe ser un número válido de Discord.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
        // Verificar que el rol existe
        const supportRole = message.guild.roles.cache.get(supportRoleId);
        if (!supportRole) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Rol de Soporte No Encontrado')
                .setDescription(`No se encontró un rol con el ID \`${supportRoleId}\` en este servidor.`)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
        // Validar mensaje
        if (ticketMessage.length < 5) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Mensaje Demasiado Corto')
                .setDescription('El mensaje del ticket debe tener al menos 5 caracteres.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
        if (ticketMessage.length > 2000) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Mensaje Demasiado Largo')
                .setDescription('El mensaje del ticket no puede tener más de 2000 caracteres.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
        try {
            // Cargar configuración actual
            const ticketConfigPath = path.join(__dirname, '../data/ticket_config.json');
            let ticketConfig = {};
            try {
                const ticketConfigData = await fs.readFile(ticketConfigPath, 'utf8');
                ticketConfig = JSON.parse(ticketConfigData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }
            // Guardar configuración
            ticketConfig[message.guild.id] = {
                categoryId: category.id,
                channelId: channel.id,
                ticketMessage: ticketMessage,
                supportRoleId: supportRoleId,
                configuredBy: message.author.id,
                configuredAt: new Date().toISOString()
            };
            // Guardar en archivo
            await fs.writeFile(ticketConfigPath, JSON.stringify(ticketConfig, null, 2));
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Sistema de Tickets Configurado')
                .setDescription('El sistema de tickets ha sido configurado correctamente.')
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Categoría:** ${category.name}`,
                        `**Canal:** ${channel.name} ( [${channel.id}\`)`,
                        `**Rol de Soporte:** ${supportRole.name} ( [${supportRoleId}\`)`,
                        `**Servidor:** ${message.guild.name}`,
                        `**Configurado por:** ${message.author.tag}`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: '📝 Mensaje del Ticket',
                    value: ticketMessage,
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Próximos Pasos',
                    value: [
                        `1. Usa \`${currentPrefix}ticketmsg\` para crear el mensaje de tickets`,
                        '2. Los usuarios podrán reaccionar para abrir tickets',
                        `3. Los tickets se crearán en la categoría **${category.name}** y solo serán visibles para el usuario y soporte`,
                        '4. Usa `!close` dentro de un ticket para cerrarlo'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();
            message.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            console.error('Error al configurar sistema de tickets:', error);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al configurar el sistema de tickets. Inténtalo de nuevo.')
                .setTimestamp();
            message.reply({ embeds: [embed], flags: 64 });
        }
    }
}; 