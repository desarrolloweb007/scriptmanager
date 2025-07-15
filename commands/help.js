const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Utilidad para agrupar comandos por categoría
function getCommandsByCategory() {
    return {
        '🎭 Gestión de Roles': [
            '`/rol` - Asigna un rol a un usuario',
            '`/removerol` - Remueve un rol de un usuario',
            '`/roles` - Lista todos los roles disponibles',
            '`/autorol` - Crea panel de autoasignación'
        ],
        '🛡️ Moderación': [
            '`/warn` - Advierte a un usuario',
            '`/warnings` - Muestra advertencias de un usuario',
            '`/mute` - Mutea a un usuario por tiempo',
            '`/unmute` - Desmutea a un usuario',
            '`/kick` - Expulsa a un usuario',
            '`/ban` - Banea a un usuario',
            '`/clear` - Borra mensajes del canal',
            '`/pclear` - Configura rol para clear',
            '`/settingsmod` - Configura canal de logs',
            '`/rolsettingsmod` - Configura permisos de comandos'
        ],
        '🔐 Verificación': [
            '`/verifymsg` - Crea mensaje de verificación con reacciones',
            '`/pverify` - Configura permisos de verificación',
            '`/listverify` - Lista mensajes de verificación activos',
            '`/deleteverify` - Elimina mensaje de verificación'
        ],
        '🎫 Sistema de Tickets': [
            '`!pticket <rol_id>` - Configura permisos de tickets',
            '`!ticketsetup #canal | mensaje | rolID_soporte` - Configura sistema',
            '`!ticketmsg Título | Mensaje | Emoji` - Crea mensaje de tickets',
            '`/close` - Cierra un ticket (solo en canales de tickets)'
        ],
        '🚫 Sistema de Bloqueo': [
            '`!sgconfig <rol_id>` - Configura permisos de bloqueo',
            '`!sgblock <comando> <rol_id> <permitido>` - Bloquea comandos'
        ],
        '🛡️ Moderación Avanzada': [
            '`!addword palabra` - Añade palabra prohibida',
            '`!removeword palabra` - Elimina palabra prohibida',
            '`!listwords` - Lista palabras prohibidas',
            '`!autopunish tipo cantidad` - Configura castigo automático',
            '`!checkinfractions @usuario` - Verifica infracciones',
            '`!modperms <rol_id> <comando> <permitido>` - Permisos de moderación',
            '`!warnfilter` - Activa/desactiva filtro de advertencias'
        ],
        '⚙️ Utilidad': [
            '`/help` - Muestra esta lista de comandos',
            '`/prefix` - Configura el prefijo del bot',
            '`/info` - Información del bot ScriptManager',
            '`/help <comando>` - Información detallada de un comando'
        ],
        '💸 Economía': [
            '`!econconfig [nombre_moneda]` - Configura el nombre de la moneda',
            '`!setdaily cantidad` - Establece la recompensa diaria',
            '`!addcategory nombre | descripción` - Crea una categoría de tienda',
            '`!additem nombre | categoría | roleID (opcional) | precio | cantidad` - Agrega objeto a la tienda',
            '`!edititem nombre | campo | nuevo_valor` - Edita un objeto de la tienda',
            '`!removeitem nombre` - Elimina un objeto de la tienda',
            '`!shop [categoría]` - Muestra la tienda',
            '`!buy nombre_objeto` - Compra un objeto',
            '`!balance [@usuario]` - Muestra el saldo',
            '`!daily` - Reclama recompensa diaria',
            '`!work` - Trabaja por monedas',
            '`!pay @usuario cantidad` - Transfiere monedas',
            '`!leaderboard` - Ranking de usuarios',
            '`!ptienda rolID` - Configura rol admin de tienda',
            '`!worktime set segundos` - Configura cooldown de work',
            '`!workpay min max` - Configura pago de work',
            '`!configword add nombre | descripción` - Agrega trabajo personalizado',
            '`!work add nombre | descripción` - Alias para agregar trabajo',
            '`!permseconomy rolID comando1,comando2,...` - Permisos de economía por rol'
        ],
        '📝 Comandos Legacy (con prefijo)': [
            '`!rol @usuario RolEjemplo` - Asigna rol',
            '`!removerol @usuario RolEjemplo` - Remueve rol',
            '`!roles` - Lista roles disponibles',
            '`!autorol "Título" "Descripción" @rol1 @rol2` - Panel autoasignación',
            '`!prefix [nuevo_prefijo]` - Configura prefijo',
            '`!help` - Muestra comandos',
            '`!info` - Información del bot',
            '`!warn @usuario razón` - Advierte usuario',
            '`!warnings @usuario` - Muestra advertencias',
            '`!mute @usuario duración razón` - Mutea usuario',
            '`!unmute @usuario razón` - Desmutea usuario',
            '`!kick @usuario razón` - Expulsa usuario',
            '`!ban @usuario razón duración` - Banea usuario',
            '`!clear [cantidad] [#canal]` - Borra mensajes',
            '`!pclear @rol` - Configura rol para clear',
            '`!verifymsg #canal | título | mensaje | rolID | emoji` - Crea verificación',
            '`!pverify <rol_id>` - Configura permisos de verificación',
            '`!listverify` - Lista mensajes de verificación',
            '`!deleteverify <id>` - Elimina mensaje de verificación',
            '`!pticket <rol_id>` - Configura permisos de tickets',
            '`!ticketsetup #canal | mensaje | rolID_soporte` - Configura sistema de tickets',
            '`!ticketmsg Título | Mensaje | Emoji` - Crea mensaje de tickets',
            '`!close` - Cierra un ticket',
            '`!sgconfig <rol_id>` - Configura permisos de bloqueo',
            '`!sgblock <comando> <rol_id> <permitido>` - Bloquea comandos'
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
            const categories = getCommandsByCategory();
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('🤖 Comandos del Bot de Roles')
                .setDescription('Aquí tienes todos los comandos disponibles organizados por categorías.')
                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Usa !help <comando> para información detallada' });

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
                    '• Los comandos legacy funcionan con el prefijo configurado',
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