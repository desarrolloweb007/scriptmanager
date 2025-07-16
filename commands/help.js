const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prefixManager = require('../utils/prefixManager');

// Utilidad para agrupar comandos por categoría y mostrar ejemplos
function getCommandsByCategory(currentPrefix = '!') {
    const useSlash = currentPrefix === '!';
    return {
        '🎭 Gestión de Roles': [
            useSlash ? '`/rol` - Asigna un rol a un usuario' : `\`${currentPrefix}rol\` - Asigna un rol a un usuario`,
            useSlash ? '`/removerol` - Remueve un rol a un usuario' : `\`${currentPrefix}removerol\` - Remueve un rol a un usuario`,
            useSlash ? '`/roles` - Lista todos los roles disponibles' : `\`${currentPrefix}roles\` - Lista todos los roles disponibles`,
            useSlash ? '`/autorol` - Crea panel de autoasignación' : `\`${currentPrefix}autorol\` - Crea panel de autoasignación`
        ],
        '🛡️ Moderación': [
            useSlash ? '`/warn` - Advierte a un usuario' : `\`${currentPrefix}warn\` - Advierte a un usuario`,
            useSlash ? '`/warnings` - Muestra advertencias de un usuario' : `\`${currentPrefix}warnings\` - Muestra advertencias de un usuario`,
            useSlash ? '`/mute` - Mutea a un usuario por tiempo' : `\`${currentPrefix}mute\` - Mutea a un usuario por tiempo`,
            useSlash ? '`/unmute` - Desmutea a un usuario' : `\`${currentPrefix}unmute\` - Desmutea a un usuario`,
            useSlash ? '`/kick` - Expulsa a un usuario' : `\`${currentPrefix}kick\` - Expulsa a un usuario`,
            useSlash ? '`/ban` - Banea a un usuario' : `\`${currentPrefix}ban\` - Banea a un usuario`,
            useSlash ? '`/clear` - Borra mensajes del canal' : `\`${currentPrefix}clear\` - Borra mensajes del canal`,
            useSlash ? '`/pclear` - Configura rol para clear' : `\`${currentPrefix}pclear\` - Configura rol para clear`,
            useSlash ? '`/settingsmod` - Configura canal de logs' : `\`${currentPrefix}settingsmod\` - Configura canal de logs`,
            useSlash ? '`/rolsettingsmod` - Configura permisos de comandos' : `\`${currentPrefix}rolsettingsmod\` - Configura permisos de comandos`
        ],
        '🔐 Verificación': [
            useSlash ? '`/verifymsg` - Crea mensaje de verificación con reacciones' : `\`${currentPrefix}verifymsg\` - Crea mensaje de verificación con reacciones`,
            useSlash ? '`/listverify` - Lista mensajes de verificación activos' : `\`${currentPrefix}listverify\` - Lista mensajes de verificación activos`,
            useSlash ? '`/deleteverify` - Elimina mensaje de verificación' : `\`${currentPrefix}deleteverify\` - Elimina mensaje de verificación`,
            useSlash ? '`/pverify` - Configura permisos de verificación' : `\`${currentPrefix}pverify\` - Configura permisos de verificación`
        ],
        '🎫 Sistema de Tickets': [
            useSlash ? '`/close` - Cierra un ticket (solo en canales de tickets)' : `\`${currentPrefix}close\` - Cierra un ticket (solo en canales de tickets)`,
            useSlash ? '`/pticket <rol_id>` - Configura permisos de tickets' : `\`${currentPrefix}pticket <rol_id>\` - Configura permisos de tickets`,
            useSlash ? '`/ticketsetup #canal | mensaje | rolID_soporte` - Configura sistema' : `\`${currentPrefix}ticketsetup #canal | mensaje | rolID_soporte\` - Configura sistema`,
            useSlash ? '`/ticketmsg Título | Mensaje | Emoji` - Crea mensaje de tickets' : `\`${currentPrefix}ticketmsg Título | Mensaje | Emoji\` - Crea mensaje de tickets`
        ],
        '🚫 Sistema de Bloqueo': [
            useSlash ? '`/sgconfig <rol_id>` - Configura permisos de bloqueo' : `\`${currentPrefix}sgconfig <rol_id>\` - Configura permisos de bloqueo`,
            useSlash ? '`/sgblock <comando> <rol_id> <permitido>` - Bloquea comandos' : `\`${currentPrefix}sgblock <comando> <rol_id> <permitido>\` - Bloquea comandos`
        ],
        '🛡️ Moderación Avanzada': [
            useSlash ? '`/addword palabra` - Añade palabra prohibida' : `\`${currentPrefix}addword palabra\` - Añade palabra prohibida`,
            useSlash ? '`/removeword palabra` - Elimina palabra prohibida' : `\`${currentPrefix}removeword palabra\` - Elimina palabra prohibida`,
            useSlash ? '`/listwords` - Lista palabras prohibidas' : `\`${currentPrefix}listwords\` - Lista palabras prohibidas`,
            useSlash ? '`/autopunish tipo cantidad` - Configura castigo automático' : `\`${currentPrefix}autopunish tipo cantidad\` - Configura castigo automático`,
            useSlash ? '`/checkinfractions @usuario` - Verifica infracciones' : `\`${currentPrefix}checkinfractions @usuario\` - Verifica infracciones`,
            useSlash ? '`/modperms <rol_id> <comando> <permitido>` - Permisos de moderación' : `\`${currentPrefix}modperms <rol_id> <comando> <permitido>\` - Permisos de moderación`,
            useSlash ? '`/warnfilter` - Activa/desactiva filtro de advertencias' : `\`${currentPrefix}warnfilter\` - Activa/desactiva filtro de advertencias`,
            useSlash ? '`/setuptest` - Configura palabra de prueba' : `\`${currentPrefix}setuptest\` - Configura palabra de prueba`
        ],
        '⚙️ Utilidad': [
            useSlash ? '`/help` - Muestra esta lista de comandos' : `\`${currentPrefix}help\` - Muestra esta lista de comandos`,
            useSlash ? '`/prefix` - Muestra el prefijo actual' : `\`${currentPrefix}prefix\` - Muestra el prefijo actual`,
            useSlash ? '`/setprefix <nuevo>` - Cambia el prefijo del servidor' : `\`${currentPrefix}setprefix <nuevo>\` - Cambia el prefijo del servidor`,
            useSlash ? '`/info` - Información del bot ScriptManager' : `\`${currentPrefix}info\` - Información del bot ScriptManager`,
            useSlash ? '`/testcommands` - Verifica que todos los comandos se cargan correctamente' : `\`${currentPrefix}testcommands\` - Verifica que todos los comandos se cargan correctamente`
        ],
        '💸 Economía': [
            useSlash ? '`/econconfig [nombre_moneda]` - Configura el nombre de la moneda' : `\`${currentPrefix}econconfig [nombre_moneda]\` - Configura el nombre de la moneda`,
            useSlash ? '`/setdaily cantidad` - Establece la recompensa diaria' : `\`${currentPrefix}setdaily cantidad\` - Establece la recompensa diaria`,
            useSlash ? '`/addcategory nombre | descripción` - Crea una categoría de tienda' : `\`${currentPrefix}addcategory nombre | descripción\` - Crea una categoría de tienda`,
            useSlash ? '`/additem nombre | categoría | roleID (opcional) | precio | cantidad` - Agrega objeto a la tienda' : `\`${currentPrefix}additem nombre | categoría | roleID (opcional) | precio | cantidad\` - Agrega objeto a la tienda`,
            useSlash ? '`/edititem nombre | campo | nuevo_valor` - Edita un objeto de la tienda' : `\`${currentPrefix}edititem nombre | campo | nuevo_valor\` - Edita un objeto de la tienda`,
            useSlash ? '`/removeitem nombre` - Elimina un objeto de la tienda' : `\`${currentPrefix}removeitem nombre\` - Elimina un objeto de la tienda`,
            useSlash ? '`/shop [categoría]` - Muestra la tienda' : `\`${currentPrefix}shop [categoría]\` - Muestra la tienda`,
            useSlash ? '`/buy nombre_objeto` - Compra un objeto' : `\`${currentPrefix}buy nombre_objeto\` - Compra un objeto`,
            useSlash ? '`/balance [@usuario]` - Muestra el saldo' : `\`${currentPrefix}balance [@usuario]\` - Muestra el saldo`,
            useSlash ? '`/daily` - Reclama recompensa diaria' : `\`${currentPrefix}daily\` - Reclama recompensa diaria`,
            useSlash ? '`/work` - Trabaja por monedas' : `\`${currentPrefix}work\` - Trabaja por monedas`,
            useSlash ? '`/pay @usuario cantidad` - Transfiere monedas' : `\`${currentPrefix}pay @usuario cantidad\` - Transfiere monedas`,
            useSlash ? '`/leaderboard` - Ranking de usuarios' : `\`${currentPrefix}leaderboard\` - Ranking de usuarios`,
            useSlash ? '`/ptienda rolID` - Configura rol admin de tienda' : `\`${currentPrefix}ptienda rolID\` - Configura rol admin de tienda`,
            useSlash ? '`/worktime set segundos` - Configura cooldown de work' : `\`${currentPrefix}worktime set segundos\` - Configura cooldown de work`,
            useSlash ? '`/workpay min max` - Configura pago de work' : `\`${currentPrefix}workpay min max\` - Configura pago de work`,
            useSlash ? '`/configword add nombre | descripción` - Agrega trabajo personalizado' : `\`${currentPrefix}configword add nombre | descripción\` - Agrega trabajo personalizado`,
            useSlash ? '`/work add nombre | descripción` - Alias para agregar trabajo' : `\`${currentPrefix}work add nombre | descripción\` - Alias para agregar trabajo`,
            useSlash ? '`/permseconomy rolID comando1,comando2,...` - Permisos de economía por rol' : `\`${currentPrefix}permseconomy rolID comando1,comando2,...\` - Permisos de economía por rol`
        ],
        '🛡️ Anti-Raid': [
            useSlash ? '`/antiraid activar` - Activa el sistema anti-raid' : `\`${currentPrefix}antiraid activar\` - Activa el sistema anti-raid`,
            useSlash ? '`/antiraid desactivar` - Desactiva el sistema anti-raid' : `\`${currentPrefix}antiraid desactivar\` - Desactiva el sistema anti-raid`,
            useSlash ? '`/antiraid estado` - Muestra la configuración actual' : `\`${currentPrefix}antiraid estado\` - Muestra la configuración actual`,
            useSlash ? '`/antiraid protecciones` - Estado de todos los módulos' : `\`${currentPrefix}antiraid protecciones\` - Estado de todos los módulos`,
            useSlash ? '`/antiraid diagnostico` - Diagnóstico completo del sistema' : `\`${currentPrefix}antiraid diagnostico\` - Diagnóstico completo del sistema`,
            useSlash ? '`/antiraid ayuda` - Explica cada módulo y cómo configurarlo' : `\`${currentPrefix}antiraid ayuda\` - Explica cada módulo y cómo configurarlo`,
            useSlash ? '`/antiraid sensibilidad bajo/medio/alto` - Ajusta la sensibilidad' : `\`${currentPrefix}antiraid sensibilidad bajo/medio/alto\` - Ajusta la sensibilidad`,
            useSlash ? '`/antiraid config <opcion> <valor1> [valor2]` - Configura parámetros' : `\`${currentPrefix}antiraid config <opcion> <valor1> [valor2]\` - Configura parámetros`,
            useSlash ? '`/antiraid whitelist add/remove/list @usuario/@rol` - Gestiona la whitelist' : `\`${currentPrefix}antiraid whitelist add/remove/list @usuario/@rol\` - Gestiona la whitelist`,
            useSlash ? '`/antiraid blacklist add/remove/list @usuario/@rol` - Gestiona la blacklist' : `\`${currentPrefix}antiraid blacklist add/remove/list @usuario/@rol\` - Gestiona la blacklist`,
            useSlash ? '`/antiraid whitelisttemp add/remove/list @usuario/@rol <minutos>` - Whitelist temporal' : `\`${currentPrefix}antiraid whitelisttemp add/remove/list @usuario/@rol <minutos>\` - Whitelist temporal`,
            useSlash ? '`/antiraid excludechannel add/remove/list #canal` - Excluye canales del anti-raid' : `\`${currentPrefix}antiraid excludechannel add/remove/list #canal\` - Excluye canales del anti-raid`,
            useSlash ? '`/antiraid alertmode on/off` - Solo alertas (sin ban/kick)' : `\`${currentPrefix}antiraid alertmode on/off\` - Solo alertas (sin ban/kick)`,
            useSlash ? '`/antiraid panicmode on/off` - Bloqueo total de canales' : `\`${currentPrefix}antiraid panicmode on/off\` - Bloqueo total de canales`,
            useSlash ? '`/antiraid logs` - Historial de eventos anti-raid' : `\`${currentPrefix}antiraid logs\` - Historial de eventos anti-raid`,
            useSlash ? '`/antiraid reset` - Restaura la configuración' : `\`${currentPrefix}antiraid reset\` - Restaura la configuración`,
            useSlash ? '`/antiraid setlang es/en` - Cambia el idioma' : `\`${currentPrefix}antiraid setlang es/en\` - Cambia el idioma`,
            useSlash ? '`/antiraid setunban on/off [minutos]` - Desban automático' : `\`${currentPrefix}antiraid setunban on/off [minutos]\` - Desban automático`,
            useSlash ? '`/antiraid setcooldown <segundos>` - Cooldown entre acciones' : `\`${currentPrefix}antiraid setcooldown <segundos>\` - Cooldown entre acciones`,
            useSlash ? '`/antiraid mantenimiento on/off [minutos]` - Modo mantenimiento' : `\`${currentPrefix}antiraid mantenimiento on/off [minutos]\` - Modo mantenimiento`,
            useSlash ? '`/antiraid export` - Exporta la configuración anti-raid' : `\`${currentPrefix}antiraid export\` - Exporta la configuración anti-raid`,
            useSlash ? '`/antiraid import` - Importa una configuración anti-raid' : `\`${currentPrefix}antiraid import\` - Importa una configuración anti-raid`,
            useSlash ? '`/antiraid activar|desactivar|estado|config|whitelist|blacklist|whitelisttemp|excludechannel|alertmode|panicmode|logs|reset|setlang|setunban|setcooldown|mantenimiento|export|import` (legacy, con prefix)' : `\`${currentPrefix}antiraid activar|desactivar|estado|config|whitelist|blacklist|whitelisttemp|excludechannel|alertmode|panicmode|logs|reset|setlang|setunban|setcooldown|mantenimiento|export|import\` (legacy, con prefix)`
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
        const currentPrefix = interaction.guild ? require('../utils/prefixManager').getPrefix(interaction.guild.id) : '!';
        const categories = getCommandsByCategory(currentPrefix);
        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('🤖 Comandos del Bot de Roles')
            .setDescription('Aquí tienes todos los comandos disponibles organizados por categorías.')
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: currentPrefix === '!' ? 'Usa /help <comando> para información detallada' : `Usa ${currentPrefix}help <comando> para información detallada` });
        for (const [cat, cmds] of Object.entries(categories)) {
            embed.addFields({
                name: cat,
                value: cmds.join('\n'),
                inline: false
            });
        }
        embed.addFields({
            name: 'ℹ️ Información',
            value: [
                '• Los comandos slash requieren permisos específicos',
                currentPrefix === '!' ? '• Los comandos legacy usan /comando por defecto (puedes configurar un prefix con /setprefix)' : `• Los comandos legacy funcionan con el prefijo configurado: \`${currentPrefix}\``,
                '• El sistema de autoasignación usa botones interactivos',
                '• Todos los comandos incluyen verificaciones de seguridad'
            ].join('\n'),
            inline: false
        });
        await interaction.reply({ embeds: [embed], flags: 64 });
    },
    async executeLegacy(message, args) {
        const currentPrefix = message.guild ? require('../utils/prefixManager').getPrefix(message.guild.id) : '!';
        const categories = getCommandsByCategory(currentPrefix);
        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('🤖 Comandos del Bot de Roles')
            .setDescription('Aquí tienes todos los comandos disponibles organizados por categorías.')
            .setTimestamp()
            .setFooter({ text: currentPrefix === '!' ? 'Usa /help <comando> para información detallada' : `Usa ${currentPrefix}help <comando> para información detallada` });
        for (const [cat, cmds] of Object.entries(categories)) {
            embed.addFields({
                name: cat,
                value: cmds.join('\n'),
                inline: false
            });
        }
        embed.addFields({
            name: 'ℹ️ Información',
            value: [
                '• Los comandos slash requieren permisos específicos',
                currentPrefix === '!' ? '• Los comandos legacy usan /comando por defecto (puedes configurar un prefix con /setprefix)' : `• Los comandos legacy funcionan con el prefijo configurado: \`${currentPrefix}\``,
                '• El sistema de autoasignación usa botones interactivos',
                '• Todos los comandos incluyen verificaciones de seguridad'
            ].join('\n'),
            inline: false
        });
        await message.reply({ embeds: [embed], flags: 64 });
    }
}; 