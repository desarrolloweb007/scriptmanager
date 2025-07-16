const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prefixManager = require('../utils/prefixManager');

// Utilidad para agrupar comandos por categoría y mostrar ejemplos
function getCommandsByCategory(currentPrefix = '!') {
    return {
        '🎭 Gestión de Roles': [
            `\`${currentPrefix}rol\` - Asigna un rol a un usuario`,
            `\`${currentPrefix}removerol\` - Remueve un rol a un usuario`,
            `\`${currentPrefix}roles\` - Lista todos los roles disponibles`,
            `\`${currentPrefix}autorol\` - Crea panel de autoasignación`
        ],
        '🛡️ Moderación': [
            `\`${currentPrefix}warn\` - Advierte a un usuario`,
            `\`${currentPrefix}warnings\` - Muestra advertencias de un usuario`,
            `\`${currentPrefix}mute\` - Mutea a un usuario por tiempo`,
            `\`${currentPrefix}unmute\` - Desmutea a un usuario`,
            `\`${currentPrefix}kick\` - Expulsa a un usuario`,
            `\`${currentPrefix}ban\` - Banea a un usuario`,
            `\`${currentPrefix}clear\` - Borra mensajes del canal`,
            `\`${currentPrefix}pclear\` - Configura rol para clear`,
            `\`${currentPrefix}settingsmod\` - Configura canal de logs`,
            `\`${currentPrefix}rolsettingsmod\` - Configura permisos de comandos`
        ],
        '🔐 Verificación': [
            `\`${currentPrefix}verifymsg\` - Crea mensaje de verificación con reacciones`,
            `\`${currentPrefix}listverify\` - Lista mensajes de verificación activos`,
            `\`${currentPrefix}deleteverify\` - Elimina mensaje de verificación`,
            `\`${currentPrefix}pverify\` - Configura permisos de verificación`
        ],
        '🎫 Sistema de Tickets': [
            `\`${currentPrefix}close\` - Cierra un ticket (solo en canales de tickets)`,
            `\`${currentPrefix}pticket <rol_id>\` - Configura permisos de tickets`,
            `\`${currentPrefix}ticketsetup #canal | mensaje | rolID_soporte\` - Configura sistema`,
            `\`${currentPrefix}ticketmsg Título | Mensaje | Emoji\` - Crea mensaje de tickets`
        ],
        '🚫 Sistema de Bloqueo': [
            `\`${currentPrefix}sgconfig <rol_id>\` - Configura permisos de bloqueo`,
            `\`${currentPrefix}sgblock <comando> <rol_id> <permitido>\` - Bloquea comandos`
        ],
        '🛡️ Moderación Avanzada': [
            `\`${currentPrefix}addword palabra\` - Añade palabra prohibida`,
            `\`${currentPrefix}removeword palabra\` - Elimina palabra prohibida`,
            `\`${currentPrefix}listwords\` - Lista palabras prohibidas`,
            `\`${currentPrefix}autopunish tipo cantidad\` - Configura castigo automático`,
            `\`${currentPrefix}checkinfractions @usuario\` - Verifica infracciones`,
            `\`${currentPrefix}modperms <rol_id> <comando> <permitido>\` - Permisos de moderación`,
            `\`${currentPrefix}warnfilter\` - Activa/desactiva filtro de advertencias`,
            `\`${currentPrefix}setuptest\` - Configura palabra de prueba`
        ],
        '⚙️ Utilidad': [
            `\`${currentPrefix}help\` - Muestra esta lista de comandos`,
            `\`${currentPrefix}prefix\` - Muestra el prefijo actual`,
            `\`${currentPrefix}setprefix <nuevo>\` - Cambia el prefijo del servidor`,
            `\`${currentPrefix}resetprefix\` - Resetea el prefijo al valor por defecto`,
            `\`${currentPrefix}info\` - Información del bot ScriptManager`,
            `\`${currentPrefix}testcommands\` - Verifica que todos los comandos se cargan correctamente`
        ],
        '💸 Economía': [
            `\`${currentPrefix}econconfig [nombre_moneda]\` - Configura el nombre de la moneda`,
            `\`${currentPrefix}setdaily cantidad\` - Establece la recompensa diaria`,
            `\`${currentPrefix}addcategory nombre | descripción\` - Crea una categoría de tienda`,
            `\`${currentPrefix}additem nombre | categoría | roleID (opcional) | precio | cantidad\` - Agrega objeto a la tienda`,
            `\`${currentPrefix}edititem nombre | campo | nuevo_valor\` - Edita un objeto de la tienda`,
            `\`${currentPrefix}removeitem nombre\` - Elimina un objeto de la tienda`,
            `\`${currentPrefix}shop [categoría]\` - Muestra la tienda`,
            `\`${currentPrefix}buy nombre_objeto\` - Compra un objeto`,
            `\`${currentPrefix}balance [@usuario]\` - Muestra el saldo`,
            `\`${currentPrefix}daily\` - Reclama recompensa diaria`,
            `\`${currentPrefix}work\` - Trabaja por monedas`,
            `\`${currentPrefix}pay @usuario cantidad\` - Transfiere monedas`,
            `\`${currentPrefix}leaderboard\` - Ranking de usuarios`,
            `\`${currentPrefix}ptienda rolID\` - Configura rol admin de tienda`,
            `\`${currentPrefix}worktime set segundos\` - Configura cooldown de work`,
            `\`${currentPrefix}workpay min max\` - Configura pago de work`,
            `\`${currentPrefix}configword add nombre | descripción\` - Agrega trabajo personalizado`,
            `\`${currentPrefix}work add nombre | descripción\` - Alias para agregar trabajo`,
            `\`${currentPrefix}permseconomy rolID comando1,comando2,...\` - Permisos de economía por rol`
        ],
        '🛡️ Anti-Raid': [
            `\`${currentPrefix}antiraid activar\` - Activa el sistema anti-raid`,
            `\`${currentPrefix}antiraid desactivar\` - Desactiva el sistema anti-raid`,
            `\`${currentPrefix}antiraid estado\` - Muestra la configuración actual`,
            `\`${currentPrefix}antiraid config <opcion> <valor1> [valor2]\` - Configura parámetros`,
            `\`${currentPrefix}antiraid whitelist add/remove/list @usuario/@rol\` - Gestiona la whitelist`,
            `\`${currentPrefix}antiraid blacklist add/remove/list @usuario/@rol\` - Gestiona la blacklist`,
            `\`${currentPrefix}antiraid excludechannel add/remove/list #canal\` - Excluye canales del anti-raid`,
            `\`${currentPrefix}antiraid alertmode on/off\` - Solo alertas (sin ban/kick)`,
            `\`${currentPrefix}antiraid reset\` - Restaura la configuración`,
            `\`${currentPrefix}antiraid ayuda\` - Explica cada módulo y cómo configurarlo`
        ]
    };
}

module.exports = {
    name: 'help',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Muestra todos los comandos disponibles del bot'),
    async execute(interaction) {
        const currentPrefix = prefixManager.getPrefix(interaction.guild.id);
        const isDefault = currentPrefix === prefixManager.DEFAULT_PREFIX;
        const categories = getCommandsByCategory(currentPrefix);
        
        const embed = new EmbedBuilder()
            .setColor(isDefault ? '#7289da' : '#00ff00')
            .setTitle('🤖 Comandos del Bot ScriptManager')
            .setDescription(`Aquí tienes todos los comandos disponibles organizados por categorías.\n**Prefijo actual:** \`${currentPrefix}\``)
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ 
                text: `Prefijo: ${currentPrefix} | Usa ${currentPrefix}help <comando> para información detallada` 
            });
        
        for (const [cat, cmds] of Object.entries(categories)) {
            embed.addFields({
                name: cat,
                value: cmds.join('\n'),
                inline: false
            });
        }
        
        embed.addFields({
            name: 'ℹ️ Información del Sistema',
            value: [
                `• **Prefijo Configurado**: \`${currentPrefix}\` ${isDefault ? '(por defecto)' : '(personalizado)'}`,
                `• **Comandos Legacy**: Usan el prefijo \`${currentPrefix}\``,
                `• **Comandos Slash**: Siempre disponibles con \`/\``,
                `• **Cambiar Prefijo**: Solo administradores pueden usar \`${currentPrefix}setprefix <nuevo>\``,
                `• **Ver Prefijo**: Usa \`${currentPrefix}prefix\` para ver el prefijo actual`,
                `• **Sistema Seguro**: Todos los comandos incluyen verificaciones de permisos`
            ].join('\n'),
            inline: false
        });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
    
    async executeLegacy(message, args) {
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        const isDefault = currentPrefix === prefixManager.DEFAULT_PREFIX;
        const categories = getCommandsByCategory(currentPrefix);
        
        const embed = new EmbedBuilder()
            .setColor(isDefault ? '#7289da' : '#00ff00')
            .setTitle('🤖 Comandos del Bot ScriptManager')
            .setDescription(`Aquí tienes todos los comandos disponibles organizados por categorías.\n**Prefijo actual:** \`${currentPrefix}\``)
            .setTimestamp()
            .setFooter({ 
                text: `Prefijo: ${currentPrefix} | Usa ${currentPrefix}help <comando> para información detallada` 
            });
        
        for (const [cat, cmds] of Object.entries(categories)) {
            embed.addFields({
                name: cat,
                value: cmds.join('\n'),
                inline: false
            });
        }
        
        embed.addFields({
            name: 'ℹ️ Información del Sistema',
            value: [
                `• **Prefijo Configurado**: \`${currentPrefix}\` ${isDefault ? '(por defecto)' : '(personalizado)'}`,
                `• **Comandos Legacy**: Usan el prefijo \`${currentPrefix}\``,
                `• **Comandos Slash**: Siempre disponibles con \`/\``,
                `• **Cambiar Prefijo**: Solo administradores pueden usar \`${currentPrefix}setprefix <nuevo>\``,
                `• **Ver Prefijo**: Usa \`${currentPrefix}prefix\` para ver el prefijo actual`,
                `• **Sistema Seguro**: Todos los comandos incluyen verificaciones de permisos`
            ].join('\n'),
            inline: false
        });
        
        await message.reply({ embeds: [embed] });
    }
}; 