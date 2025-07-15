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
                '`!info` - Información del bot'
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
            'info': '• Muestra información detallada del bot\n• Incluye estadísticas en tiempo real\n• Muestra uptime del bot\n• Información del desarrollador'
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