const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'close',
    description: 'Cierra un ticket de soporte',
    legacy: true,
    data: { name: 'close' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixManager = require('../utils/prefixManager');
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'close')) {
            return;
        }

        // Verificar que estamos en un canal de ticket
        if (!message.channel.name.startsWith('ticket-')) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('⚠️ Comando Incorrecto')
                .setDescription('Este comando solo puede usarse en canales de tickets.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Los canales de tickets tienen el formato `ticket-usuario`.',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Extraer el ID del usuario del nombre del canal
        const channelNameMatch = message.channel.name.match(/^ticket-(\d+)$/);
        if (!channelNameMatch) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Canal Inválido')
                .setDescription('Este canal no tiene el formato correcto de ticket.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const ticketUserId = channelNameMatch[1];
        const ticketUser = message.guild.members.cache.get(ticketUserId);

        // Verificar permisos
        const isTicketOwner = message.author.id === ticketUserId;
        const isSupportStaff = await this.checkSupportPermission(message);

        if (!isTicketOwner && !isSupportStaff) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('Solo el propietario del ticket o el personal de soporte puede cerrarlo.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: [
                        '• El propietario del ticket puede cerrarlo',
                        '• El personal de soporte puede cerrar cualquier ticket'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar permisos del bot para eliminar el canal
        if (!message.channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permisos Insuficientes')
                .setDescription('No tengo permisos para eliminar este canal.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        try {
            // Crear embed de confirmación
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('🔒 Cerrando Ticket')
                .setDescription('Este ticket será cerrado en 5 segundos.')
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Canal:** ${message.channel.name}`,
                        `**Propietario:** ${ticketUser ? ticketUser.user.tag : 'Usuario no encontrado'}`,
                        `**Cerrado por:** ${message.author.tag}`,
                        `**Fecha:** ${new Date().toLocaleString('es-ES')}`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'El canal será eliminado automáticamente.',
                    inline: false
                })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // Esperar 5 segundos antes de eliminar
            setTimeout(async () => {
                try {
                    await message.channel.delete();
                } catch (error) {
                    console.error('Error al eliminar canal de ticket:', error);
                }
            }, 5000);

        } catch (error) {
            console.error('Error al cerrar ticket:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al cerrar el ticket. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    },

    // Función para verificar permisos de soporte
    async checkSupportPermission(message) {
        try {
            const ticketConfigPath = path.join(__dirname, '../data/ticket_config.json');
            const ticketConfigData = await fs.readFile(ticketConfigPath, 'utf8');
            const ticketConfig = JSON.parse(ticketConfigData);

            const guildConfig = ticketConfig[message.guild.id];
            if (!guildConfig || !guildConfig.supportRoleId) {
                return false;
            }

            return message.member.roles.cache.has(guildConfig.supportRoleId);

        } catch (error) {
            console.error('Error al verificar permisos de soporte:', error);
            return false;
        }
    }
}; 