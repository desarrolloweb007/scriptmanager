// antiRaidCommands.js
// Registro y manejo de slash commands para el sistema anti-raid
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AntiRaidConfig = require('./antiRaidConfig');
const messages = require('./antiRaidMessages');
const { createEmbed, getMsg } = require('../../utils/embedUtils');

// --- Definición de comandos slash ---
const antiRaidCommands = [
    new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('Comandos de configuración y control del sistema anti-raid')
        .addSubcommand(sub =>
            sub.setName('activar').setDescription('Activa el sistema anti-raid'))
        .addSubcommand(sub =>
            sub.setName('desactivar').setDescription('Desactiva el sistema anti-raid'))
        .addSubcommand(sub =>
            sub.setName('estado').setDescription('Muestra la configuración actual'))
        .addSubcommand(sub =>
            sub.setName('protecciones')
                .setDescription('Muestra el estado de todos los módulos de protección'))
        .addSubcommand(sub =>
            sub.setName('config')
                .setDescription('Configura parámetros del sistema')
                .addStringOption(opt =>
                    opt.setName('opcion')
                        .setDescription('Parámetro a configurar')
                        .setRequired(true)
                        .addChoices(
                            { name: 'logchannel', value: 'logchannel' },
                            { name: 'raid-threshold', value: 'raid-threshold' },
                            { name: 'canalcreate-limit', value: 'canalcreate-limit' },
                            { name: 'delete-limit', value: 'delete-limit' },
                            { name: 'auto-ban', value: 'auto-ban' },
                            { name: 'perms', value: 'perms' },
                            { name: 'adminchannel', value: 'adminchannel' },
                            { name: 'sensibilidad', value: 'sensibilidad' }
                        )
                )
                .addStringOption(opt =>
                    opt.setName('valor1').setDescription('Primer valor (ID, número, true/false, etc.)').setRequired(true))
                .addStringOption(opt =>
                    opt.setName('valor2').setDescription('Segundo valor (opcional)').setRequired(false))
        )
        .addSubcommandGroup(group =>
            group.setName('whitelist')
                .setDescription('Gestiona la whitelist del anti-raid')
                .addSubcommand(sub =>
                    sub.setName('add')
                        .setDescription('Agrega usuario o rol a la whitelist')
                        .addUserOption(opt =>
                            opt.setName('usuario').setDescription('Usuario a agregar').setRequired(false))
                        .addRoleOption(opt =>
                            opt.setName('rol').setDescription('Rol a agregar').setRequired(false))
                )
                .addSubcommand(sub =>
                    sub.setName('remove')
                        .setDescription('Elimina usuario o rol de la whitelist')
                        .addUserOption(opt =>
                            opt.setName('usuario').setDescription('Usuario a eliminar').setRequired(false))
                        .addRoleOption(opt =>
                            opt.setName('rol').setDescription('Rol a eliminar').setRequired(false))
                )
                .addSubcommand(sub =>
                    sub.setName('list').setDescription('Muestra la whitelist actual'))
        )
        .addSubcommandGroup(group =>
            group.setName('whitelisttemp')
                .setDescription('Gestiona la whitelist temporal del anti-raid')
                .addSubcommand(sub =>
                    sub.setName('add')
                        .setDescription('Agrega usuario o rol a la whitelist temporal')
                        .addUserOption(opt =>
                            opt.setName('usuario').setDescription('Usuario a agregar').setRequired(false))
                        .addRoleOption(opt =>
                            opt.setName('rol').setDescription('Rol a agregar').setRequired(false))
                        .addIntegerOption(opt =>
                            opt.setName('minutos').setDescription('Minutos de duración').setRequired(true))
                )
                .addSubcommand(sub =>
                    sub.setName('remove')
                        .setDescription('Elimina usuario o rol de la whitelist temporal')
                        .addUserOption(opt =>
                            opt.setName('usuario').setDescription('Usuario a eliminar').setRequired(false))
                        .addRoleOption(opt =>
                            opt.setName('rol').setDescription('Rol a eliminar').setRequired(false))
                )
                .addSubcommand(sub =>
                    sub.setName('list').setDescription('Muestra la whitelist temporal actual'))
        )
        .addSubcommand(sub =>
            sub.setName('panicmode')
                .setDescription('Activa o desactiva el modo pánico (bloqueo total)')
                .addStringOption(opt =>
                    opt.setName('estado').setDescription('on/off').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('sensibilidad')
                .setDescription('Ajusta la sensibilidad del anti-raid')
                .addStringOption(opt =>
                    opt.setName('nivel').setDescription('bajo/medio/alto').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('mantenimiento')
                .setDescription('Activa o desactiva el modo mantenimiento (desactiva el anti-raid temporalmente)')
                .addStringOption(opt =>
                    opt.setName('estado').setDescription('on/off').setRequired(true))
                .addIntegerOption(opt =>
                    opt.setName('minutos').setDescription('Minutos de duración (opcional)').setRequired(false)))
        .addSubcommandGroup(group =>
            group.setName('excludechannel')
                .setDescription('Gestiona canales excluidos del anti-raid')
                .addSubcommand(sub =>
                    sub.setName('add')
                        .setDescription('Excluye un canal')
                        .addChannelOption(opt =>
                            opt.setName('canal').setDescription('Canal a excluir').setRequired(true)))
                .addSubcommand(sub =>
                    sub.setName('remove')
                        .setDescription('Deja de excluir un canal')
                        .addChannelOption(opt =>
                            opt.setName('canal').setDescription('Canal a incluir').setRequired(true)))
                .addSubcommand(sub =>
                    sub.setName('list').setDescription('Muestra los canales excluidos'))
        )
        .addSubcommand(sub =>
            sub.setName('ayuda')
                .setDescription('Explica cada módulo y cómo configurarlo'))
        .addSubcommand(sub =>
            sub.setName('export')
                .setDescription('Exporta la configuración anti-raid de este servidor'))
        .addSubcommand(sub =>
            sub.setName('import')
                .setDescription('Importa una configuración anti-raid (adjunta un archivo JSON)'))
        .addSubcommand(sub =>
            sub.setName('diagnostico')
                .setDescription('Muestra un diagnóstico completo del sistema anti-raid'))
];

// --- Función para comprobar permisos de configuración ---
function hasAntiRaidPerms(member, guildId) {
    const config = AntiRaidConfig.getGuildConfig(guildId);
    if (!config.permsRole) return member.permissions.has(PermissionFlagsBits.Administrator);
    return member.roles.cache.has(config.permsRole) || member.permissions.has(PermissionFlagsBits.Administrator);
}

// --- Handler de interacción de comandos ---
async function handleAntiRaidCommand(interaction) {
    try {
        const guildId = interaction.guild.id;
        const member = interaction.member;
        
        if (!guildId) {
            return await interaction.reply({ 
                content: '❌ Error: No se pudo identificar el servidor.', 
                ephemeral: true 
            });
        }
        
        const config = AntiRaidConfig.getGuildConfig(guildId);
        
        if (!hasAntiRaidPerms(member, guildId)) {
            return await interaction.reply({ 
                content: '❌ No tienes permisos para usar los comandos de configuración anti-raid.', 
                ephemeral: true 
            });
        }
        
        const sub = interaction.options.getSubcommand?.() || interaction.options.getSubcommandGroup?.() || null;
        
        if (sub === 'activar') {
            try {
                AntiRaidConfig.updateGuildConfig(guildId, { enabled: true });
                return await interaction.reply('✅ El sistema anti-raid ha sido activado.');
            } catch (error) {
                console.error('[AntiRaidCommands] Error activando:', error);
                return await interaction.reply({ 
                    content: '❌ Error al activar el sistema anti-raid.', 
                    ephemeral: true 
                });
            }
        }
        
        if (sub === 'desactivar') {
            try {
                AntiRaidConfig.updateGuildConfig(guildId, { enabled: false });
                return await interaction.reply('⛔ El sistema anti-raid ha sido desactivado.');
            } catch (error) {
                console.error('[AntiRaidCommands] Error desactivando:', error);
                return await interaction.reply({ 
                    content: '❌ Error al desactivar el sistema anti-raid.', 
                    ephemeral: true 
                });
            }
        }
        
        if (sub === 'estado') {
            try {
                const estado = config.enabled ? '🟢 Activado' : '🔴 Desactivado';
                const log = config.logChannel ? '<#' + config.logChannel + '>' : 'No configurado';
                let mantenimiento = 'Desactivado';
                if (config.maintenanceMode && config.maintenanceMode.active) {
                    const ms = config.maintenanceMode.until - Date.now();
                    mantenimiento = ms > 0 ? 'Activado (' + Math.ceil(ms/60000) + ' min restantes)' : 'Activado';
                }
                const response = '**Estado Anti-Raid:**\n' + estado + '\n' +
                    '**Canal de logs:** ' + log + '\n' +
                    '**Modo mantenimiento:** ' + mantenimiento + '\n' +
                    '**Umbral de raid:** ' + config.raidThreshold.users + ' usuarios en ' + config.raidThreshold.seconds + 's\n' +
                    '**Límite creación canales:** ' + config.channelCreateLimit.count + ' en ' + config.channelCreateLimit.seconds + 's\n' +
                    '**Límite eliminación canales:** ' + config.channelDeleteLimit.count + ' en ' + config.channelDeleteLimit.seconds + 's\n' +
                    '**Auto-ban:** ' + (config.autoBan ? 'Sí' : 'No') + '\n' +
                    '**Rol de configuración:** ' + (config.permsRole ? '<@&' + config.permsRole + '>' : 'Solo admins') + '\n' +
                    '**Whitelist usuarios:** ' + config.whitelist.users.length + '\n' +
                    '**Whitelist roles:** ' + config.whitelist.roles.length;
                return await interaction.reply(response);
            } catch (error) {
                console.error('[AntiRaidCommands] Error mostrando estado:', error);
                return await interaction.reply({ 
                    content: '❌ Error al mostrar el estado del sistema anti-raid.', 
                    ephemeral: true 
                });
            }
        }
        
        if (sub === 'ayuda') {
            try {
                const embed = {
                    title: '🛡️ Ayuda Anti-Raid',
                    description: 'Explicación de cada módulo y ejemplos de configuración.',
                    fields: [
                        { name: 'Sensibilidad', value: 'Ajusta la agresividad del sistema: /antiraid sensibilidad bajo/medio/alto', inline: false },
                        { name: 'Canales excluidos', value: 'Excluye canales del anti-raid: /antiraid excludechannel add/remove/list #canal', inline: false },
                        { name: 'Modo alerta', value: 'Solo alerta, sin ban/kick: /antiraid alertmode on/off', inline: false },
                        { name: 'Modo pánico', value: 'Bloquea todos los canales: /antiraid panicmode on/off', inline: false },
                        { name: 'Modo mantenimiento', value: 'Desactiva temporalmente el anti-raid: /antiraid mantenimiento on/off [minutos]', inline: false },
                        { name: 'Whitelist temporal', value: 'Permite acceso temporal: /antiraid whitelisttemp add @usuario 10', inline: false },
                        { name: 'Protecciones automáticas', value: 'Incluye detección de raids, spam, flood, cambios masivos, webhooks, invitaciones, global banlist y más.', inline: false },
                        { name: 'Exportar/Importar', value: 'Próximamente: /antiraid export y /antiraid import para respaldos.', inline: false },
                        { name: 'Ver estado', value: '/antiraid estado o /antiraid protecciones para ver la configuración actual.', inline: false }
                    ]
                };
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                console.error('[AntiRaidCommands] Error mostrando ayuda:', error);
                return await interaction.reply({ 
                    content: '❌ Error al mostrar la ayuda.', 
                    ephemeral: true 
                });
            }
        }
        
        return await interaction.reply({ 
            content: '❌ Comando o subcomando no reconocido. Usa /antiraid ayuda para ver las opciones.', 
            ephemeral: true 
        });
        
    } catch (error) {
        console.error('[AntiRaidCommands] Error general en handleAntiRaidCommand:', error);
        return await interaction.reply({ 
            content: '❌ Ocurrió un error inesperado. Revisa la consola para más detalles.', 
            ephemeral: true 
        });
    }
}

// --- Exportaciones principales para legacy y slash ---
module.exports = {
    antiRaidCommands, // Array de SlashCommandBuilder para registro
    handleAntiRaidCommand, // Handler principal para slash y legacy
    hasAntiRaidPerms // Utilidad de permisos
}; 