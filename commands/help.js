const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const prefixUtils = require('../utils/prefixUtils');

// Utilidad para agrupar comandos por categoría
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
            `\`${currentPrefix}pverify\` - Configura permisos de verificación`,
            `\`${currentPrefix}listverify\` - Lista mensajes de verificación activos`,
            `\`${currentPrefix}deleteverify\` - Elimina mensaje de verificación`
        ],
        '🎫 Sistema de Tickets': [
            `\`${currentPrefix}pticket <rol_id>\` - Configura permisos de tickets`,
            `\`${currentPrefix}ticketsetup #canal | mensaje | rolID_soporte\` - Configura sistema`,
            `\`${currentPrefix}ticketmsg Título | Mensaje | Emoji\` - Crea mensaje de tickets`,
            `\`${currentPrefix}close\` - Cierra un ticket (solo en canales de tickets)`
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
            `\`${currentPrefix}warnfilter\` - Activa/desactiva filtro de advertencias`
        ],
        '⚙️ Utilidad': [
            `\`${currentPrefix}help\` - Muestra esta lista de comandos`,
            `\`${currentPrefix}prefix\` - Configura el prefijo del bot`,
            `\`${currentPrefix}info\` - Información del bot ScriptManager`,
            `\`${currentPrefix}help <comando>\` - Información detallada de un comando`
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
            `\`${currentPrefix}antiraid protecciones\` - Estado de todos los módulos`,
            `\`${currentPrefix}antiraid diagnostico\` - Diagnóstico completo del sistema`,
            `\`${currentPrefix}antiraid ayuda\` - Explica cada módulo y cómo configurarlo`,
            `\`${currentPrefix}antiraid sensibilidad bajo/medio/alto\` - Ajusta la sensibilidad`,
            `\`${currentPrefix}antiraid config <opcion> <valor1> [valor2]\` - Configura parámetros (logchannel, raid-threshold, canalcreate-limit, delete-limit, auto-ban, perms, adminchannel, sensibilidad)`,
            `\`${currentPrefix}antiraid whitelist add/remove/list @usuario/@rol\` - Gestiona la whitelist`,
            `\`${currentPrefix}antiraid blacklist add/remove/list @usuario/@rol\` - Gestiona la blacklist`,
            `\`${currentPrefix}antiraid whitelisttemp add/remove/list @usuario/@rol <minutos>\` - Whitelist temporal`,
            `\`${currentPrefix}antiraid excludechannel add/remove/list #canal\` - Excluye canales del anti-raid`,
            `\`${currentPrefix}antiraid alertmode on/off\` - Solo alertas (sin ban/kick)`,
            `\`${currentPrefix}antiraid panicmode on/off\` - Bloqueo total de canales`,
            `\`${currentPrefix}antiraid logs\` - Historial de eventos anti-raid`,
            `\`${currentPrefix}antiraid reset\` - Restaura la configuración`,
            `\`${currentPrefix}antiraid setlang es/en\` - Cambia el idioma`,
            `\`${currentPrefix}antiraid setunban on/off [minutos]\` - Desban automático`,
            `\`${currentPrefix}antiraid setcooldown <segundos>\` - Cooldown entre acciones`,
            `\`${currentPrefix}antiraid mantenimiento on/off [minutos]\` - Modo mantenimiento`,
            `\`${currentPrefix}antiraid export\` - Exporta la configuración anti-raid`,
            `\`${currentPrefix}antiraid import\` - Importa una configuración anti-raid`,
            `\`${currentPrefix}antiraid activar|desactivar|estado|config|whitelist|blacklist|whitelisttemp|excludechannel|alertmode|panicmode|logs|reset|setlang|setunban|setcooldown|mantenimiento|export|import\` (legacy, con prefix)`
        ]
    };
}

// Utilidad para dividir texto en chunks de máximo 1024 caracteres
function splitFields(arr) {
    const fields = [];
    let buffer = '';
    for (const line of arr) {
        if ((buffer + line + '\n').length > 1024) {
            fields.push(buffer);
            buffer = '';
        }
        buffer += line + '\n';
    }
    if (buffer) fields.push(buffer);
    return fields;
}

module.exports = {
    name: 'help',
    description: 'Muestra todos los comandos disponibles del bot',
    async execute(interaction) {
        try {
            const currentPrefix = interaction.guild ? await prefixUtils.getCurrentPrefix(interaction.guild.id) : '!';
            const categories = getCommandsByCategory(currentPrefix);
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('🤖 Comandos del Bot de Roles')
                .setDescription('Aquí tienes todos los comandos disponibles organizados por categorías.')
                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Usa ${currentPrefix}help <comando> para información detallada` });

            for (const [cat, cmds] of Object.entries(categories)) {
                const fields = splitFields(cmds);
                fields.forEach((value, i) => {
                    embed.addFields({
                        name: fields.length > 1 ? `${cat} (${i+1})` : cat,
                        value: value.trim(),
                        inline: false
                    });
                });
            }

            embed.addFields({
                name: 'ℹ️ Información',
                value: [
                    '• Los comandos slash requieren permisos específicos',
                    `• Los comandos legacy funcionan con el prefijo configurado: \`${currentPrefix}\``,
                    '• El sistema de autoasignación usa botones interactivos',
                    '• Todos los comandos incluyen verificaciones de seguridad'
                ].join('\n'),
                inline: false
            });

            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (err) {
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Error al mostrar la ayuda')
                .setDescription('Ocurrió un error al generar la lista de comandos. Es posible que algún campo haya excedido el límite de Discord.')
                .addFields({
                    name: 'Detalles',
                    value: err.message || String(err),
                    inline: false
                })
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
    },
    legacy: true,
    async executeLegacy(message, args) {
        try {
            const currentPrefix = message.guild ? await prefixUtils.getCurrentPrefix(message.guild.id) : '!';
            const categories = getCommandsByCategory(currentPrefix);
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('🤖 Comandos del Bot de Roles')
                .setDescription('Aquí tienes todos los comandos disponibles organizados por categorías.')
                .setTimestamp()
                .setFooter({ text: `Usa ${currentPrefix}help <comando> para información detallada` });

            for (const [cat, cmds] of Object.entries(categories)) {
                const fields = splitFields(cmds);
                fields.forEach((value, i) => {
                    embed.addFields({
                        name: fields.length > 1 ? `${cat} (${i+1})` : cat,
                        value: value.trim(),
                        inline: false
                    });
                });
            }

            embed.addFields({
                name: 'ℹ️ Información',
                value: [
                    '• Los comandos slash requieren permisos específicos',
                    `• Los comandos legacy funcionan con el prefijo configurado: \`${currentPrefix}\``,
                    '• El sistema de autoasignación usa botones interactivos',
                    '• Todos los comandos incluyen verificaciones de seguridad'
                ].join('\n'),
                inline: false
            });

            await message.reply({ embeds: [embed], flags: 64 });
        } catch (err) {
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Error al mostrar la ayuda')
                .setDescription('Ocurrió un error al generar la lista de comandos.')
                .addFields({
                    name: 'Detalles',
                    value: err.message || String(err),
                    inline: false
                })
                .setTimestamp();
            await message.reply({ embeds: [errorEmbed], flags: 64 });
        }
    },
    async showCommandHelp(interaction, commandName) {
        const command = interaction.client.commands.get(commandName);
        if (!command) {
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Comando no encontrado')
                .setDescription(`No se encontró el comando \`${commandName}\`.`);
            return await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle(`📖 Ayuda: /${commandName}`);
        if (command.data) {
            embed.setDescription(command.data.description || 'Sin descripción disponible.');
            if (command.data.options && command.data.options.length > 0) {
                const options = command.data.options.map(option => {
                    const required = option.required ? ' (Requerido)' : ' (Opcional)';
                    return `• \`${option.name}\` - ${option.description}${required}`;
                }).join('\n');
                if (options.length > 1024) {
                    // Dividir en varios campos si excede el límite
                    let start = 0;
                    let idx = 1;
                    while (start < options.length) {
                        embed.addFields({
                            name: `🔧 Opciones (${idx})`,
                            value: options.slice(start, start+1024),
                            inline: false
                        });
                        start += 1024;
                        idx++;
                    }
                } else {
                    embed.addFields({
                        name: '🔧 Opciones',
                        value: options,
                        inline: false
                    });
                }
            }
            if (command.data.default_member_permissions) {
                embed.addFields({
                    name: '🔐 Permisos Requeridos',
                    value: 'Gestionar Roles',
                    inline: true
                });
            }
        }
        const examples = this.getCommandExamples(commandName);
        if (examples) {
            embed.addFields({
                name: '💡 Ejemplos de Uso',
                value: examples.length > 1024 ? examples.slice(0, 1024) : examples,
                inline: false
            });
        }
        const additionalInfo = this.getCommandAdditionalInfo(commandName);
        if (additionalInfo) {
            embed.addFields({
                name: 'ℹ️ Información Adicional',
                value: additionalInfo.length > 1024 ? additionalInfo.slice(0, 1024) : additionalInfo,
                inline: false
            });
        }
        await interaction.reply({ embeds: [embed], flags: 64 });
    },
    getCommandExamples(commandName) {
        const command = interaction.client.commands.get(commandName);
        if (!command) return null;
        return command.examples || null;
    },
    getCommandAdditionalInfo(commandName) {
        const command = interaction.client.commands.get(commandName);
        if (!command) return null;
        return command.additionalInfo || null;
    }
}; 