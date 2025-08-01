const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prefixManager = require('../utils/prefixManager');

// Utilidad para agrupar comandos por categoría y mostrar ejemplos
function getCommandsByCategory(currentPrefix = '!') {
    return {
        '🛡️ Sistema Anti-Raid': [
            `\`${currentPrefix}antiraid\` - Comandos de configuración anti-raid (solo slash)`,
            `\`/antiraid activar\` - Activa el sistema anti-raid`,
            `\`/antiraid desactivar\` - Desactiva el sistema anti-raid`,
            `\`/antiraid estado\` - Muestra la configuración actual`,
            `\`/antiraid ayuda\` - Explica cada módulo y cómo configurarlo`,
            `\`/antiraid whitelist add/remove/list\` - Gestiona la whitelist`,
            `\`/antiraid blacklist add/remove/list\` - Gestiona la blacklist`,
            `\`/antiraid excludechannel add/remove/list\` - Excluye canales`,
            `\`/antiraid alertmode on/off\` - Solo alertas (sin ban/kick)`,
            `\`/antiraid panicmode on/off\` - Modo pánico (bloqueo total)`,
            `\`/antiraid mantenimiento on/off\` - Modo mantenimiento`,
            `\`/antiraid sensibilidad bajo/medio/alto\` - Ajusta agresividad`,
            `\`/antiraid reset\` - Restaura configuración por defecto`
        ],
        '🎭 Gestión de Roles': [
            `\`${currentPrefix}rol @usuario @rol\` - Asigna un rol a un usuario`,
            `\`${currentPrefix}removerol @usuario @rol\` - Remueve un rol a un usuario`,
            `\`${currentPrefix}roles\` - Lista todos los roles disponibles`,
            `\`${currentPrefix}autorol "Título" "Descripción" @rol1 @rol2...\` - Crea panel de autoasignación`
        ],
        '🛡️ Moderación Básica': [
            `\`${currentPrefix}warn @usuario razón\` - Advierte a un usuario`,
            `\`${currentPrefix}warnings @usuario\` - Muestra advertencias de un usuario`,
            `\`${currentPrefix}mute @usuario tiempo razón\` - Mutea a un usuario por tiempo`,
            `\`${currentPrefix}unmute @usuario razón\` - Desmutea a un usuario`,
            `\`${currentPrefix}kick @usuario razón\` - Expulsa a un usuario`,
            `\`${currentPrefix}ban @usuario razón\` - Banea a un usuario`,
            `\`${currentPrefix}clear cantidad\` - Borra mensajes del canal`,
            `\`${currentPrefix}pclear @rol\` - Configura rol para clear`,
            `\`${currentPrefix}settingsmod #canal\` - Configura canal de logs`,
            `\`${currentPrefix}rolsettingsmod @rol comando permitido\` - Permisos de comandos`
        ],
        '🔐 Sistema de Verificación': [
            `\`${currentPrefix}verifymsg "Título" "Mensaje" emoji\` - Crea mensaje de verificación`,
            `\`${currentPrefix}listverify\` - Lista mensajes de verificación activos`,
            `\`${currentPrefix}deleteverify ID\` - Elimina mensaje de verificación`,
            `\`${currentPrefix}pverify @rol\` - Configura permisos de verificación`
        ],
        '🎫 Sistema de Tickets': [
            `\`${currentPrefix}close\` - Cierra un ticket (solo en canales de tickets)`,
            `\`${currentPrefix}pticket @rol\` - Configura permisos de tickets`,
            `\`${currentPrefix}ticketsetup #canal mensaje rolID_soporte\` - Configura sistema`,
            `\`${currentPrefix}ticketmsg "Título" "Mensaje" emoji\` - Crea mensaje de tickets`
        ],
        '🚫 Sistema de Bloqueo': [
            `\`${currentPrefix}sgconfig @rol\` - Configura permisos de bloqueo`,
            `\`${currentPrefix}sgblock comando @rol permitido\` - Bloquea comandos`
        ],
        '🛡️ Moderación Avanzada': [
            `\`${currentPrefix}addword palabra\` - Añade palabra prohibida`,
            `\`${currentPrefix}removeword palabra\` - Elimina palabra prohibida`,
            `\`${currentPrefix}listwords\` - Lista palabras prohibidas`,
            `\`${currentPrefix}autopunish tipo cantidad\` - Configura castigo automático`,
            `\`${currentPrefix}checkinfractions @usuario\` - Verifica infracciones`,
            `\`${currentPrefix}modperms @rol comando permitido\` - Permisos de moderación`,
            `\`${currentPrefix}warnfilter\` - Activa/desactiva filtro de advertencias`,
            `\`${currentPrefix}setuptest\` - Configura palabra de prueba`
        ],
        '💰 Sistema de Economía': [
            `\`${currentPrefix}balance\` - Muestra tu balance`,
            `\`${currentPrefix}daily\` - Reclama tu recompensa diaria`,
            `\`${currentPrefix}work\` - Trabaja para ganar dinero`,
            `\`${currentPrefix}pay @usuario cantidad\` - Transfiere dinero`,
            `\`${currentPrefix}shop\` - Muestra la tienda`,
            `\`${currentPrefix}buy item\` - Compra un item`,
            `\`${currentPrefix}leaderboard\` - Muestra el ranking de riqueza`,
            `\`${currentPrefix}additem nombre precio descripción\` - Añade item a la tienda`,
            `\`${currentPrefix}removeitem nombre\` - Elimina item de la tienda`,
            `\`${currentPrefix}edititem nombre precio descripción\` - Edita item`,
            `\`${currentPrefix}addcategory nombre\` - Añade categoría`,
            `\`${currentPrefix}econconfig\` - Configura sistema de economía`,
            `\`${currentPrefix}permseconomy @rol\` - Permisos de economía`,
            `\`${currentPrefix}setdaily cantidad\` - Configura recompensa diaria`,
            `\`${currentPrefix}workpay cantidad\` - Configura pago por trabajo`,
            `\`${currentPrefix}worktime segundos\` - Configura cooldown de trabajo`,
            `\`${currentPrefix}ptienda @rol\` - Permisos de tienda`,
            `\`${currentPrefix}configword palabra\` - Configura palabra de trabajo`
        ],
        '⚙️ Utilidad y Configuración': [
            `\`${currentPrefix}help\` - Muestra esta lista de comandos`,
            `\`${currentPrefix}prefix\` - Muestra el prefijo actual`,
            `\`${currentPrefix}setprefix nuevo\` - Cambia el prefijo del servidor`,
            `\`${currentPrefix}resetprefix\` - Resetea el prefijo al valor por defecto`,
            `\`${currentPrefix}info\` - Información del bot ScriptManager`,
            `\`${currentPrefix}testcommands\` - Verifica que todos los comandos se cargan correctamente`
        ]
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Muestra todos los comandos y funcionalidades del bot')
        .addStringOption(option =>
            option.setName('categoria')
                .setDescription('Categoría específica de comandos')
                .setRequired(false)
                .addChoices(
                    { name: '🛡️ Anti-Raid', value: 'antiraid' },
                    { name: '🎭 Gestión de Roles', value: 'roles' },
                    { name: '🛡️ Moderación Básica', value: 'moderacion' },
                    { name: '🔐 Verificación', value: 'verificacion' },
                    { name: '🎫 Tickets', value: 'tickets' },
                    { name: '🚫 Bloqueo', value: 'bloqueo' },
                    { name: '🛡️ Moderación Avanzada', value: 'moderacion_avanzada' },
                    { name: '💰 Economía', value: 'economia' },
                    { name: '⚙️ Utilidad', value: 'utilidad' }
                )),

    async execute(interaction) {
        const categoria = interaction.options.getString('categoria');
        const currentPrefix = prefixManager.getPrefix(interaction.guild.id);
        const commandsByCategory = getCommandsByCategory(currentPrefix);

        if (categoria) {
            // Mostrar categoría específica
            const categoryKey = Object.keys(commandsByCategory).find(key => 
                key.toLowerCase().includes(categoria.toLowerCase())
            );
            
            if (categoryKey) {
                const embed = new EmbedBuilder()
                    .setColor('#7289da')
                    .setTitle(categoryKey)
                    .setDescription('Comandos disponibles en esta categoría:')
                    .addFields(
                        commandsByCategory[categoryKey].map(cmd => ({
                            name: '📋',
                            value: cmd,
                            inline: false
                        }))
                    )
                    .setFooter({ text: `Prefijo actual: ${currentPrefix}` })
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ 
                    content: '❌ Categoría no encontrada. Usa `/help` para ver todas las categorías.', 
                    ephemeral: true 
                });
            }
        } else {
            // Mostrar todas las categorías
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('🤖 **ScriptManager Bot - Comandos y Funcionalidades**')
                .setDescription('Un bot especializado en gestión, automatización y administración de servidores Discord.')
                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { 
                        name: '📋 Información General', 
                        value: [
                            '**Nombre:** ScriptManager',
                            '**Versión:** v1.0',
                            '**Creador:** TheAprilGamer',
                            '**Lenguaje:** Node.js',
                            '**Framework:** Discord.js v14',
                            `**Prefijo actual:** ${currentPrefix}`,
                            `**Servidores:** ${interaction.client.guilds.cache.size}`,
                            `**Comandos:** ${interaction.client.commands.size}`
                        ].join('\n'),
                        inline: false 
                    },
                    { 
                        name: '🎭 Funcionalidades Principales', 
                        value: [
                            '• Sistema anti-raid avanzado con detección automática',
                            '• Gestión completa de roles y permisos',
                            '• Sistema de moderación con advertencias automáticas',
                            '• Sistema de verificación con reacciones',
                            '• Sistema de tickets personalizable',
                            '• Sistema de economía con tienda y trabajos',
                            '• Comandos slash y legacy con prefijos dinámicos',
                            '• Protección contra spam y raids',
                            '• Sistema de bloqueo de comandos por roles'
                        ].join('\n'),
                        inline: false 
                    }
                );

            // Agregar categorías de comandos
            Object.entries(commandsByCategory).forEach(([category, commands]) => {
                const commandCount = commands.length;
                embed.addFields({
                    name: category,
                    value: `${commandCount} comandos disponibles\nUsa \`/help ${category.toLowerCase().replace(/[^a-z]/g, '')}\` para ver detalles`,
                    inline: true
                });
            });

            embed.addFields({
                name: '🔗 Comandos Especiales',
                value: [
                    '• **Comandos Slash:** Usa `/` para comandos interactivos',
                    '• **Comandos Legacy:** Usa el prefijo para comandos tradicionales',
                    '• **Anti-Raid:** Solo disponible como comandos slash',
                    '• **Economía:** Sistema completo con tienda y trabajos',
                    '• **Moderación:** Sistema automático con filtros'
                ].join('\n'),
                inline: false
            });

            embed.addFields({
                name: '📚 Categorías Disponibles',
                value: Object.keys(commandsByCategory).map(cat => 
                    `• ${cat}`
                ).join('\n'),
                inline: false
            });

            embed.setFooter({ 
                text: `ScriptManager Bot v1.0 • Prefijo: ${currentPrefix} • Usa /help <categoria> para más detalles`,
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
            });

            await interaction.reply({ embeds: [embed] });
        }
    },

    // Comando legacy con prefijo dinámico
    legacy: true,
    async executeLegacy(message, args) {
        try {
            const currentPrefix = prefixManager.getPrefix(message.guild.id);
            const commandsByCategory = getCommandsByCategory(currentPrefix);

            if (args.length > 0) {
                // Mostrar categoría específica
                const categoria = args[0].toLowerCase();
                const categoryKey = Object.keys(commandsByCategory).find(key => 
                    key.toLowerCase().includes(categoria)
                );
                
                if (categoryKey) {
                    const embed = new EmbedBuilder()
                        .setColor('#7289da')
                        .setTitle(categoryKey)
                        .setDescription('Comandos disponibles en esta categoría:')
                        .addFields(
                            commandsByCategory[categoryKey].map(cmd => ({
                                name: '📋',
                                value: cmd,
                                inline: false
                            }))
                        )
                        .setFooter({ text: `Prefijo actual: ${currentPrefix}` })
                        .setTimestamp();
                    
                    await message.reply({ embeds: [embed] });
                } else {
                    await message.reply('❌ Categoría no encontrada. Usa `' + currentPrefix + 'help` para ver todas las categorías.');
                }
            } else {
                // Mostrar todas las categorías
                const embed = new EmbedBuilder()
                    .setColor('#7289da')
                    .setTitle('🤖 **ScriptManager Bot - Comandos y Funcionalidades**')
                    .setDescription('Un bot especializado en gestión, automatización y administración de servidores Discord.')
                    .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { 
                            name: '📋 Información General', 
                            value: [
                                '**Nombre:** ScriptManager',
                                '**Versión:** v1.0',
                                '**Creador:** TheAprilGamer',
                                '**Lenguaje:** Node.js',
                                '**Framework:** Discord.js v14',
                                `**Prefijo actual:** ${currentPrefix}`,
                                `**Servidores:** ${message.client.guilds.cache.size}`,
                                `**Comandos:** ${message.client.commands.size}`
                            ].join('\n'),
                            inline: false 
                        },
                        { 
                            name: '🎭 Funcionalidades Principales', 
                            value: [
                                '• Sistema anti-raid avanzado con detección automática',
                                '• Gestión completa de roles y permisos',
                                '• Sistema de moderación con advertencias automáticas',
                                '• Sistema de verificación con reacciones',
                                '• Sistema de tickets personalizable',
                                '• Sistema de economía con tienda y trabajos',
                                '• Comandos slash y legacy con prefijos dinámicos',
                                '• Protección contra spam y raids',
                                '• Sistema de bloqueo de comandos por roles'
                            ].join('\n'),
                            inline: false 
                        }
                    );

                // Agregar categorías de comandos
                Object.entries(commandsByCategory).forEach(([category, commands]) => {
                    const commandCount = commands.length;
                    embed.addFields({
                        name: category,
                        value: `${commandCount} comandos disponibles\nUsa \`${currentPrefix}help ${category.toLowerCase().replace(/[^a-z]/g, '')}\` para ver detalles`,
                        inline: true
                    });
                });

                embed.addFields({
                    name: '🔗 Comandos Especiales',
                    value: [
                        '• **Comandos Slash:** Usa `/` para comandos interactivos',
                        '• **Comandos Legacy:** Usa el prefijo para comandos tradicionales',
                        '• **Anti-Raid:** Solo disponible como comandos slash',
                        '• **Economía:** Sistema completo con tienda y trabajos',
                        '• **Moderación:** Sistema automático con filtros'
                    ].join('\n'),
                    inline: false
                });

                embed.addFields({
                    name: '📚 Categorías Disponibles',
                    value: Object.keys(commandsByCategory).map(cat => 
                        `• ${cat}`
                    ).join('\n'),
                    inline: false
                });

                embed.setFooter({ 
                    text: `ScriptManager Bot v1.0 • Prefijo: ${currentPrefix} • Usa ${currentPrefix}help <categoria> para más detalles`,
                    iconURL: message.client.user.displayAvatarURL({ dynamic: true })
                });

                await message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error en comando help:', error);
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ Hubo un error al mostrar la ayuda.')]
            });
        }
    }
}; 