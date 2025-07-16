const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { setShopAdminRole, getShopAdminRole, validateRole } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

module.exports = {
    name: 'ptienda',
    description: 'Configura el rol autorizado para administrar la tienda',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('ptienda')
        .setDescription('Comando ptienda'),
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
        // Verificación de prefijo manejada por el middleware

        // Verificar permisos de administrador
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('Solo los administradores pueden configurar permisos de tienda.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'ptienda');
        
        // Si no hay argumentos, mostrar configuración actual
        if (commandArgs.length === 0) {
            const currentRoleId = await getShopAdminRole(message.guild.id);
            const currentPrefix = await getCurrentPrefix(message.guild.id);
            
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('🛡️ Permisos de Tienda')
                .setDescription(`Configuración actual del servidor **${message.guild.name}**`)
                .addFields({
                    name: 'Rol Administrador',
                    value: currentRoleId ? `<@&${currentRoleId}>` : '**No configurado** (solo administradores)',
                    inline: true
                })
                .addFields({
                    name: 'Comando para configurar',
                    value: `\`${currentPrefix}ptienda <rol_id>\``,
                    inline: true
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}ptienda 123456789012345678\``,
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Los usuarios con este rol podrán usar comandos administrativos de tienda:\n• `econconfig` • `addcategory` • `additem` • `edititem` • `removeitem`',
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: 'Sistema de Permisos' });
            
            return message.reply({ embeds: [embed] });
        }

        // Validar el ID del rol
        const roleId = commandArgs[0];
        const roleValidation = await validateRole(message.guild, roleId);
        
        if (!roleValidation.valid) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Rol Inválido')
                .setDescription(roleValidation.message)
                .addFields({
                    name: 'ℹ️ Ayuda',
                    value: 'Para obtener el ID de un rol:\n1. Activa el modo desarrollador en Discord\n2. Haz clic derecho en el rol\n3. Selecciona "Copiar ID"',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Guardar la nueva configuración
        const success = await setShopAdminRole(message.guild.id, roleId);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Permisos Configurados')
                .setDescription(`Los permisos de administración de tienda han sido configurados correctamente.`)
                .addFields({
                    name: 'Rol Administrador',
                    value: `${roleValidation.role}`,
                    inline: true
                })
                .addFields({
                    name: 'Configurado por',
                    value: `${message.author}`,
                    inline: true
                })
                .addFields({
                    name: 'Servidor',
                    value: `${message.guild.name}`,
                    inline: true
                })
                .addFields({
                    name: 'Comandos Administrativos',
                    value: '• `econconfig` - Configurar moneda\n• `addcategory` - Agregar categorías\n• `additem` - Agregar objetos\n• `edititem` - Editar objetos\n• `removeitem` - Eliminar objetos',
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: 'Sistema de Permisos' });
            
            return message.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Hubo un error al guardar la configuración de permisos.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
    }
};
