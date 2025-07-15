const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Muestra todos los comandos disponibles del bot')
        .addStringOption(option =>
            option.setName('comando')
                .setDescription('Comando específico para ver información detallada')
                .setRequired(false)),

    async execute(interaction) {
        const specificCommand = interaction.options.getString('comando');
        
        if (specificCommand) {
            await this.showCommandHelp(interaction, specificCommand);
        } else {
            await this.showAllCommands(interaction);
        }
    },

    async showAllCommands(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('🤖 Comandos del Bot de Roles')
            .setDescription('Aquí tienes todos los comandos disponibles organizados por categorías.')
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: 'Usa /help <comando> para información detallada' });

        // Comandos de gestión de roles
        embed.addFields({
            name: '🎭 Gestión de Roles',
            value: [
                '`/rol` - Asigna un rol a un usuario',
                '`/removerol` - Remueve un rol de un usuario',
                '`/roles` - Lista todos los roles disponibles',
                '`/autorol` - Crea panel de autoasignación'
            ].join('\n'),
            inline: false
        });

        // Comandos de moderación
        embed.addFields({
            name: '🛡️ Moderación',
            value: [
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
            ].join('\n'),
            inline: false
        });

        // Comandos de verificación
        embed.addFields({
            name: '🔐 Verificación',
            value: [
                '`/verifymsg` - Crea mensaje de verificación con reacciones',
                '`/pverify` - Configura permisos de verificación',
                '`/listverify` - Lista mensajes de verificación activos',
                '`/deleteverify` - Elimina mensaje de verificación'
            ].join('\n'),
            inline: false
        });

        // Comandos de tickets
        embed.addFields({
            name: '🎫 Sistema de Tickets',
            value: [
                '`!pticket <rol_id>` - Configura permisos de tickets',
                '`!ticketsetup #canal | mensaje | rolID_soporte` - Configura sistema',
                '`!ticketmsg Título | Mensaje | Emoji` - Crea mensaje de tickets',
                '`!close` - Cierra un ticket (solo en canales de tickets)'
            ].join('\n'),
            inline: false
        });

        // Comandos de bloqueo
        embed.addFields({
            name: '🚫 Sistema de Bloqueo',
            value: [
                '`!sgconfig <rol_id>` - Configura permisos de bloqueo',
                '`!sgblock <comando> <rol_id> <permitido>` - Bloquea comandos'
            ].join('\n'),
            inline: false
        });

        // Comandos de utilidad
        embed.addFields({
            name: '⚙️ Utilidad',
            value: [
                '`/help` - Muestra esta lista de comandos',
                '`/prefix` - Configura el prefijo del bot',
                '`/info` - Información del bot ScriptManager',
                '`/help <comando>` - Información detallada de un comando'
            ].join('\n'),
            inline: false
        });

        // Comandos legacy
        embed.addFields({
            name: '📝 Comandos Legacy (con prefijo)',
            value: [
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
            ].join('\n'),
            inline: false
        });

        // Información adicional
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

        await interaction.reply({ embeds: [embed] });
    },

    async showCommandHelp(interaction, commandName) {
        const command = interaction.client.commands.get(commandName);
        
        if (!command) {
            return await interaction.reply({
                content: `❌ No se encontró el comando \`${commandName}\`.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle(`📖 Ayuda: /${commandName}`)
            .setTimestamp();

        // Información del comando
        if (command.data) {
            embed.setDescription(command.data.description || 'Sin descripción disponible.');
            
            // Opciones del comando
            if (command.data.options && command.data.options.length > 0) {
                const options = command.data.options.map(option => {
                    const required = option.required ? ' (Requerido)' : ' (Opcional)';
                    return `• \`${option.name}\` - ${option.description}${required}`;
                }).join('\n');
                
                embed.addFields({
                    name: '🔧 Opciones',
                    value: options,
                    inline: false
                });
            }

            // Permisos requeridos
            if (command.data.default_member_permissions) {
                embed.addFields({
                    name: '🔐 Permisos Requeridos',
                    value: 'Gestionar Roles',
                    inline: true
                });
            }
        }

        // Ejemplos de uso
        const examples = this.getCommandExamples(commandName);
        if (examples) {
            embed.addFields({
                name: '💡 Ejemplos de Uso',
                value: examples,
                inline: false
            });
        }

        // Información adicional
        const additionalInfo = this.getCommandAdditionalInfo(commandName);
        if (additionalInfo) {
            embed.addFields({
                name: 'ℹ️ Información Adicional',
                value: additionalInfo,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    },

    getCommandExamples(commandName) {
        const examples = {
            'rol': [
                '`/rol usuario:@usuario rol:@RolEjemplo`',
                '`!rol @usuario RolEjemplo`'
            ],
            'removerol': [
                '`/removerol usuario:@usuario rol:@RolEjemplo`',
                '`!removerol @usuario RolEjemplo`'
            ],
            'roles': [
                '`/roles`',
                '`!roles`'
            ],
            'autorol': [
                '`/autorol titulo:"Roles de Juegos" descripcion:"Selecciona tus juegos favoritos" rol1:@Gamer rol2:@Streamer`',
                '`!autorol "Roles de Juegos" "Selecciona tus juegos favoritos" @Gamer @Streamer`'
            ],
            'prefix': [
                '`/prefix nuevo_prefijo:?`',
                '`!prefix ?`',
                '`!prefix` (para ver el prefijo actual)'
            ],
            'info': [
                '`/info`',
                '`!info`'
            ],
            'warn': [
                '`/warn usuario:@usuario razon:Spam`',
                '`!warn @usuario Spam`'
            ],
            'warnings': [
                '`/warnings usuario:@usuario`',
                '`!warnings @usuario`'
            ],
            'mute': [
                '`/mute usuario:@usuario duracion:1h razon:Spam`',
                '`!mute @usuario 1h Spam`'
            ],
            'unmute': [
                '`/unmute usuario:@usuario razon:Arrepentimiento`',
                '`!unmute @usuario Arrepentimiento`'
            ],
            'kick': [
                '`/kick usuario:@usuario razon:Violación de reglas`',
                '`!kick @usuario Violación de reglas`'
            ],
            'ban': [
                '`/ban usuario:@usuario razon:Spam masivo duracion:7d`',
                '`!ban @usuario Spam masivo 7d`'
            ],
            'clear': [
                '`/clear cantidad:10` - Borra 10 mensajes del canal actual',
                '`/clear cantidad:50 canal:#general` - Borra 50 mensajes del canal #general',
                '`!clear 10` - Borra 10 mensajes del canal actual',
                '`!clear 50 #general` - Borra 50 mensajes del canal #general'
            ],
            'pclear': [
                '`/pclear rol:@Moderador` - Configura el rol Moderador para usar clear',
                '`!pclear @Moderador` - Configura el rol Moderador para usar clear'
            ],
            'pticket': [
                '`!pticket 123456789012345678` - Configura rol con ID para usar comandos de tickets',
                '`!pticket 987654321098765432` - Configura otro rol para permisos de tickets'
            ],
            'ticketsetup': [
                '`!ticketsetup #tickets | Bienvenido al ticket! Describe tu problema. | 123456789012345678`',
                '`!ticketsetup #soporte | Hola! ¿En qué puedo ayudarte? | 987654321098765432`'
            ],
            'ticketmsg': [
                '`!ticketmsg Soporte Técnico | Reacciona para abrir un ticket | 🎫`',
                '`!ticketmsg Ayuda | ¿Necesitas ayuda? Reacciona aquí | ❓`'
            ],
            'close': [
                '`!close` - Cierra el ticket actual (solo funciona en canales de tickets)'
            ],
            'sgconfig': [
                '`!sgconfig 123456789012345678` - Configura rol con ID para usar comandos de bloqueo',
                '`!sgconfig 987654321098765432` - Configura otro rol para permisos de bloqueo'
            ],
            'sgblock': [
                '`!sgblock warn 123456789012345678 true` - Solo el rol puede usar warn',
                '`!sgblock ban 987654321098765432 false` - Bloquea ban completamente',
                '`!sgblock clear 123456789012345678 true` - Solo el rol puede usar clear'
            ]
        };

        return examples[commandName] ? examples[commandName].join('\n') : null;
    },

    getCommandAdditionalInfo(commandName) {
        const info = {
            'rol': '• Verifica que el usuario no tenga ya el rol\n• Comprueba permisos del bot y usuario\n• Previene asignación de roles superiores al bot',
            'removerol': '• Verifica que el usuario tenga el rol\n• Comprueba permisos del bot y usuario\n• Previene remoción de roles superiores al bot',
            'roles': '• Muestra roles ordenados por jerarquía\n• Incluye número de miembros por rol\n• Excluye roles gestionados por integraciones',
            'autorol': '• Crea botones interactivos para autoasignación\n• Máximo 5 roles por panel\n• Los usuarios pueden asignarse/removerse roles',
            'prefix': '• Cambia el prefijo solo para este servidor\n• Máximo 5 caracteres\n• No puede contener espacios\n• Se mantiene en memoria',
            'info': '• Muestra información detallada del bot\n• Incluye estadísticas en tiempo real\n• Muestra uptime del bot\n• Información del desarrollador',
            'warn': '• Registra advertencias en data/warnings.json\n• Verifica permisos de moderación\n• Muestra total de advertencias del usuario\n• Incluye fecha y moderador',
            'warnings': '• Muestra las últimas 10 advertencias\n• Incluye razón, moderador y fecha\n• Formato de timestamp legible\n• Ordenadas por más recientes',
            'mute': '• Crea rol Muted si no existe\n• Configura permisos automáticamente\n• Desmutea automáticamente tras la duración\n• Formato: 1d 2h 3m 4s',
            'unmute': '• Remueve el rol Muted\n• Verifica que el usuario esté muteado\n• Registra la acción en logs\n• Solo para usuarios muteados',
            'kick': '• Expulsa al usuario del servidor\n• Verifica jerarquía de roles\n• Comprueba permisos del bot\n• Registra en logs de moderación',
            'ban': '• Banea temporal o permanentemente\n• Formato: 1d 2h 3m 4s o permanente\n• Desbanea automáticamente tras duración\n• Verifica permisos y jerarquía',
            'clear': '• Borra mensajes del canal actual o mencionado\n• Requiere rol autorizado configurado con pclear\n• Máximo 100 mensajes por comando\n• Solo borra mensajes de los últimos 14 días\n• Verifica permisos del bot y usuario',
            'pclear': '• Configura el rol autorizado para usar clear\n• Solo administradores pueden configurar\n• Se guarda en data/clearconfig.json\n• Un rol por servidor\n• Requiere permisos de administrador',
            'pticket': '• Configura qué rol puede usar comandos de tickets\n• Solo administradores pueden configurar\n• Se guarda en data/ticket_permisos.json\n• Un rol por servidor\n• Requiere permisos de administrador',
            'ticketsetup': '• Configura el sistema de tickets del servidor\n• Define canal, mensaje personalizado y rol de soporte\n• Se guarda en data/ticket_config.json\n• Requiere permisos configurados con pticket\n• Usa | como separador de parámetros',
            'ticketmsg': '• Crea mensaje de tickets con reacción\n• Define título, mensaje y emoji personalizado\n• Se guarda en data/ticket_message.json\n• Requiere sistema configurado con ticketsetup\n• Los usuarios reaccionan para abrir tickets',
            'close': '• Cierra un ticket de soporte\n• Solo funciona en canales de tickets\n• Solo el propietario o personal de soporte puede cerrar\n• Elimina el canal automáticamente\n• Espera 5 segundos antes de eliminar',
            'sgconfig': '• Configura qué rol puede usar comandos de bloqueo\n• Solo administradores pueden configurar\n• Se guarda en data/sgconfig.json\n• Un rol por servidor\n• Requiere permisos de administrador',
            'sgblock': '• Bloquea un comando específico para todos excepto un rol\n• Requiere permisos configurados con sgconfig\n• Se guarda en data/command_block.json\n• Permite bloquear completamente o solo para un rol\n• Verifica permisos antes de ejecutar comandos'
        };

        return info[commandName] || null;
    },

    // Comando legacy con prefijo dinámico
    legacy: true,
    async executeLegacy(message, args) {
        const specificCommand = args[0];
        
        if (specificCommand) {
            await this.showCommandHelpLegacy(message, specificCommand);
        } else {
            await this.showAllCommandsLegacy(message);
        }
    },

    async showAllCommandsLegacy(message) {
        // Obtener el prefijo actual del servidor
        const prefixCommand = require('./prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);

        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('🤖 Comandos del Bot de Roles')
            .setDescription(`Aquí tienes todos los comandos disponibles. Prefijo actual: **${currentPrefix}**`)
            .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Usa ${currentPrefix}help <comando> para información detallada` });

        // Comandos de gestión de roles
        embed.addFields({
            name: '🎭 Gestión de Roles',
            value: [
                `\`${currentPrefix}rol @usuario RolEjemplo\` - Asigna un rol`,
                `\`${currentPrefix}removerol @usuario RolEjemplo\` - Remueve un rol`,
                `\`${currentPrefix}roles\` - Lista todos los roles`,
                `\`${currentPrefix}autorol "Título" "Descripción" @rol1 @rol2\` - Panel autoasignación`
            ].join('\n'),
            inline: false
        });

        // Comandos de moderación
        embed.addFields({
            name: '🛡️ Moderación',
            value: [
                `\`${currentPrefix}warn @usuario razón\` - Advierte usuario`,
                `\`${currentPrefix}warnings @usuario\` - Muestra advertencias`,
                `\`${currentPrefix}mute @usuario duración razón\` - Mutea usuario`,
                `\`${currentPrefix}unmute @usuario razón\` - Desmutea usuario`,
                `\`${currentPrefix}kick @usuario razón\` - Expulsa usuario`,
                `\`${currentPrefix}ban @usuario razón duración\` - Banea usuario`,
                `\`${currentPrefix}clear [cantidad] [#canal]\` - Borra mensajes`,
                `\`${currentPrefix}pclear @rol\` - Configura rol para clear`
            ].join('\n'),
            inline: false
        });

        // Comandos de tickets
        embed.addFields({
            name: '🎫 Sistema de Tickets',
            value: [
                `\`${currentPrefix}pticket <rol_id>\` - Configura permisos de tickets`,
                `\`${currentPrefix}ticketsetup #canal | mensaje | rolID_soporte\` - Configura sistema`,
                `\`${currentPrefix}ticketmsg Título | Mensaje | Emoji\` - Crea mensaje de tickets`,
                `\`${currentPrefix}close\` - Cierra un ticket (solo en canales de tickets)`
            ].join('\n'),
            inline: false
        });

        // Comandos de bloqueo
        embed.addFields({
            name: '🚫 Sistema de Bloqueo',
            value: [
                `\`${currentPrefix}sgconfig <rol_id>\` - Configura permisos de bloqueo`,
                `\`${currentPrefix}sgblock <comando> <rol_id> <permitido>\` - Bloquea comandos`
            ].join('\n'),
            inline: false
        });

        // Comandos de utilidad
        embed.addFields({
            name: '⚙️ Utilidad',
            value: [
                `\`${currentPrefix}help\` - Muestra esta lista`,
                `\`${currentPrefix}prefix [nuevo_prefijo]\` - Configura prefijo`,
                `\`${currentPrefix}info\` - Información del bot`,
                `\`${currentPrefix}help <comando>\` - Información detallada`
            ].join('\n'),
            inline: false
        });

        // Información adicional
        embed.addFields({
            name: 'ℹ️ Información',
            value: [
                '• Los comandos requieren permisos específicos',
                '• El sistema incluye verificaciones de seguridad',
                '• Los paneles de autoasignación usan botones interactivos',
                '• El prefijo se puede personalizar por servidor'
            ].join('\n'),
            inline: false
        });

        await message.reply({ embeds: [embed] });
    },

    async showCommandHelpLegacy(message, commandName) {
        const command = message.client.commands.get(commandName);
        
        if (!command) {
            return await message.reply(`❌ No se encontró el comando \`${commandName}\`.`);
        }

        const prefixCommand = require('./prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);

        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle(`📖 Ayuda: ${currentPrefix}${commandName}`)
            .setTimestamp();

        // Información del comando
        if (command.data) {
            embed.setDescription(command.data.description || 'Sin descripción disponible.');
        }

        // Ejemplos de uso
        const examples = this.getCommandExamples(commandName);
        if (examples) {
            // Convertir ejemplos slash a legacy
            const legacyExamples = examples.replace(/\/[a-z]+/g, `${currentPrefix}${commandName}`);
            embed.addFields({
                name: '💡 Ejemplos de Uso',
                value: legacyExamples,
                inline: false
            });
        }

        // Información adicional
        const additionalInfo = this.getCommandAdditionalInfo(commandName);
        if (additionalInfo) {
            embed.addFields({
                name: 'ℹ️ Información Adicional',
                value: additionalInfo,
                inline: false
            });
        }

        await message.reply({ embeds: [embed] });
    }
}; 