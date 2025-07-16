const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'autopunish',
    description: 'Configura el sistema automático de castigos según advertencias',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('autopunish')
        .setDescription('Comando autopunish'),
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

        // Verificar permisos usando modperms
        const modpermsCommand = require('./modperms.js');
        const hasPermission = await modpermsCommand.checkPermission(message, 'autopunish');
        
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para usar este comando.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Contacta a un administrador para configurar los permisos con `!modperms autopunish <rol_id>`',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar argumentos
        if (args.length < 1) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}autopunish <acción> [parámetros]\``)
                .addFields({
                    name: '📝 Acciones Disponibles',
                    value: [
                        '`on` - Activa el sistema automático',
                        '`off` - Desactiva el sistema automático',
                        '`config` - Muestra configuración actual',
                        '`set <advertencias> <castigo> [duración]` - Configura castigo automático'
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}autopunish on\` - Activa sistema`,
                        `\`${currentPrefix}autopunish set 3 mute 1h\` - Mutea tras 3 advertencias`,
                        `\`${currentPrefix}autopunish set 5 kick\` - Expulsa tras 5 advertencias`,
                        `\`${currentPrefix}autopunish set 10 ban 7d\` - Banea 7 días tras 10 advertencias`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: '🛡️ Castigos Disponibles',
                    value: '`mute`, `kick`, `ban`',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const action = args[0].toLowerCase();

        try {
            // Cargar configuración actual
            const autopunishPath = path.join(__dirname, '../../data/autopunish.json');
            let autopunish = {};
            
            try {
                const autopunishData = await fs.readFile(autopunishPath, 'utf8');
                autopunish = JSON.parse(autopunishData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Inicializar configuración del servidor si no existe
            if (!autopunish[message.guild.id]) {
                autopunish[message.guild.id] = {
                    enabled: false,
                    punishments: {}
                };
            }

            switch (action) {
                case 'on':
                    autopunish[message.guild.id].enabled = true;
                    await fs.writeFile(autopunishPath, JSON.stringify(autopunish, null, 2));
                    
                    const embedOn = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Sistema Automático Activado')
                        .setDescription('El sistema de castigos automáticos está ahora activo.')
                        .addFields({
                            name: 'ℹ️ Información',
                            value: 'Los usuarios recibirán castigos automáticos según las advertencias acumuladas.',
                            inline: false
                        })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embedOn] });

                case 'off':
                    autopunish[message.guild.id].enabled = false;
                    await fs.writeFile(autopunishPath, JSON.stringify(autopunish, null, 2));
                    
                    const embedOff = new EmbedBuilder()
                        .setColor('#ff9900')
                        .setTitle('⚠️ Sistema Automático Desactivado')
                        .setDescription('El sistema de castigos automáticos está ahora desactivado.')
                        .addFields({
                            name: 'ℹ️ Información',
                            value: 'Los usuarios no recibirán castigos automáticos.',
                            inline: false
                        })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embedOff] });

                case 'config':
                    const config = autopunish[message.guild.id];
                    const status = config.enabled ? '🟢 Activado' : '🔴 Desactivado';
                    
                    let punishmentsList = 'No hay castigos configurados';
                    if (Object.keys(config.punishments).length > 0) {
                        punishmentsList = Object.entries(config.punishments)
                            .map(([warnings, punishment]) => `${warnings} advertencias → ${punishment.type}${punishment.duration ? ` (${punishment.duration})` : ''}`)
                            .join('\n');
                    }
                    
                    const embedConfig = new EmbedBuilder()
                        .setColor('#7289da')
                        .setTitle('⚙️ Configuración del Sistema Automático')
                        .addFields({
                            name: '📊 Estado',
                            value: status,
                            inline: true
                        })
                        .addFields({
                            name: '🛡️ Castigos Configurados',
                            value: punishmentsList,
                            inline: false
                        })
                        .addFields({
                            name: 'ℹ️ Información',
                            value: 'Usa `!autopunish set <advertencias> <castigo> [duración]` para configurar castigos.',
                            inline: false
                        })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embedConfig] });

                case 'set':
                    if (args.length < 3) {
                        const embedSetHelp = new EmbedBuilder()
                            .setColor('#ff9900')
                            .setTitle('📋 Uso de Configuración')
                            .setDescription(`**Sintaxis:** \`${currentPrefix}autopunish set <advertencias> <castigo> [duración]\``)
                            .addFields({
                                name: '📝 Ejemplos',
                                value: [
                                    `\`${currentPrefix}autopunish set 3 mute 1h\``,
                                    `\`${currentPrefix}autopunish set 5 kick\``,
                                    `\`${currentPrefix}autopunish set 10 ban 7d\``
                                ].join('\n'),
                                inline: false
                            })
                            .setTimestamp();
                        
                        return message.reply({ embeds: [embedSetHelp] });
                    }

                    const warnings = parseInt(args[1]);
                    const punishmentType = args[2].toLowerCase();
                    const duration = args[3] || null;

                    // Validar número de advertencias
                    if (isNaN(warnings) || warnings < 1 || warnings > 50) {
                        const embedInvalidWarnings = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('❌ Número de Advertencias Inválido')
                            .setDescription('El número de advertencias debe ser entre 1 y 50.')
                            .setTimestamp();
                        
                        return message.reply({ embeds: [embedInvalidWarnings] });
                    }

                    // Validar tipo de castigo
                    const validPunishments = ['mute', 'kick', 'ban'];
                    if (!validPunishments.includes(punishmentType)) {
                        const embedInvalidPunishment = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('❌ Tipo de Castigo Inválido')
                            .setDescription(`Tipo de castigo inválido. Tipos válidos: ${validPunishments.join(', ')}`)
                            .setTimestamp();
                        
                        return message.reply({ embeds: [embedInvalidPunishment] });
                    }

                    // Validar duración para mute y ban
                    if ((punishmentType === 'mute' || punishmentType === 'ban') && !duration) {
                        const embedDurationRequired = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('❌ Duración Requerida')
                            .setDescription(`El castigo \`${punishmentType}\` requiere una duración.`)
                            .addFields({
                                name: '📝 Ejemplos de Duración',
                                value: '`1h`, `2d`, `1w`, `30m`',
                                inline: false
                            })
                            .setTimestamp();
                        
                        return message.reply({ embeds: [embedDurationRequired] });
                    }

                    // Guardar configuración
                    autopunish[message.guild.id].punishments[warnings] = {
                        type: punishmentType,
                        duration: duration
                    };

                    await fs.writeFile(autopunishPath, JSON.stringify(autopunish, null, 2));

                    const embedSet = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Castigo Automático Configurado')
                        .setDescription(`Castigo configurado para ${warnings} advertencias.`)
                        .addFields({
                            name: '📋 Detalles',
                            value: [
                                `**Advertencias:** ${warnings}`,
                                `**Castigo:** ${punishmentType}`,
                                `**Duración:** ${duration || 'N/A'}`
                            ].join('\n'),
                            inline: false
                        })
                        .setTimestamp();

                    return message.reply({ embeds: [embedSet] });

                default:
                    const embedInvalidAction = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Acción Inválida')
                        .setDescription(`La acción \`${action}\` no es válida.`)
                        .addFields({
                            name: '✅ Acciones Válidas',
                            value: '`on`, `off`, `config`, `set`',
                            inline: false
                        })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embedInvalidAction] });
            }

        } catch (error) {
            console.error('Error al configurar autopunish:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al configurar el sistema automático. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
}; 