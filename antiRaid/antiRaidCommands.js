// antiRaidCommands.js
// Sistema completo de comandos para el sistema anti-raid
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AntiRaidConfig = require('./antiRaidConfig');

// --- Definición de comandos slash ---
const antiRaidCommands = [
    new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('Comandos de configuración y control del sistema anti-raid')
        .addSubcommand(sub =>
            sub.setName('activar')
            .setDescription('Activa el sistema anti-raid'))
        .addSubcommand(sub =>
            sub.setName('desactivar')
            .setDescription('Desactiva el sistema anti-raid'))
        .addSubcommand(sub =>
            sub.setName('estado')
            .setDescription('Muestra la configuración actual'))
        .addSubcommand(sub =>
            sub.setName('config')
            .setDescription('Configura parámetros del sistema')
            .addStringOption(opt =>
                opt.setName('opcion')
                .setDescription('Parámetro a configurar')
                .setRequired(true)
                .addChoices(
                    { name: 'Canal de Logs', value: 'logchannel' },
                    { name: 'Canal de Alertas Admin', value: 'adminchannel' },
                    { name: 'Umbral de Raid', value: 'raid-threshold' },
                    { name: 'Límite Crear Canales', value: 'canalcreate-limit' },
                    { name: 'Límite Eliminar Canales', value: 'delete-limit' },
                    { name: 'Auto-Ban', value: 'auto-ban' },
                    { name: 'Rol de Permisos', value: 'perms' },
                    { name: 'Sensibilidad', value: 'sensibilidad' }
                ))
            .addStringOption(opt =>
                opt.setName('valor1')
                .setDescription('Primer valor')
                .setRequired(true))
            .addStringOption(opt =>
                opt.setName('valor2')
                .setDescription('Segundo valor (opcional)')
                .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('whitelist')
            .setDescription('Gestiona la whitelist')
            .addStringOption(opt =>
                opt.setName('accion')
                .setDescription('Acción a realizar')
                .setRequired(true)
                .addChoices(
                    { name: 'Agregar', value: 'add' },
                    { name: 'Remover', value: 'remove' },
                    { name: 'Listar', value: 'list' }
                ))
            .addUserOption(opt =>
                opt.setName('usuario')
                .setDescription('Usuario a gestionar')
                .setRequired(false))
            .addRoleOption(opt =>
                opt.setName('rol')
                .setDescription('Rol a gestionar')
                .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('blacklist')
            .setDescription('Gestiona la blacklist')
            .addStringOption(opt =>
                opt.setName('accion')
                .setDescription('Acción a realizar')
                .setRequired(true)
                .addChoices(
                    { name: 'Agregar', value: 'add' },
                    { name: 'Remover', value: 'remove' },
                    { name: 'Listar', value: 'list' }
                ))
            .addUserOption(opt =>
                opt.setName('usuario')
                .setDescription('Usuario a gestionar')
                .setRequired(false))
            .addRoleOption(opt =>
                opt.setName('rol')
                .setDescription('Rol a gestionar')
                .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('excludechannel')
            .setDescription('Excluye canales del anti-raid')
            .addStringOption(opt =>
                opt.setName('accion')
                .setDescription('Acción a realizar')
                .setRequired(true)
                .addChoices(
                    { name: 'Agregar', value: 'add' },
                    { name: 'Remover', value: 'remove' },
                    { name: 'Listar', value: 'list' }
                ))
            .addChannelOption(opt =>
                opt.setName('canal')
                .setDescription('Canal a gestionar')
                .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('alertmode')
            .setDescription('Modo solo alertas (sin ban/kick)')
            .addStringOption(opt =>
                opt.setName('estado')
                .setDescription('Estado del modo alerta')
                .setRequired(true)
                .addChoices(
                    { name: 'Activar', value: 'on' },
                    { name: 'Desactivar', value: 'off' }
                )))
        .addSubcommand(sub =>
            sub.setName('reset')
            .setDescription('Restaura la configuración por defecto'))
        .addSubcommand(sub =>
            sub.setName('ayuda')
            .setDescription('Explica cada módulo y cómo configurarlo'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

// --- Utilidad para comprobar permisos de configuración ---
function hasAntiRaidPerms(member, guildId) {
    try {
        const config = AntiRaidConfig.getGuildConfig(guildId);
        if (!config.permsRole) return member.permissions.has(PermissionFlagsBits.Administrator);
        return member.roles.cache.has(config.permsRole) || member.permissions.has(PermissionFlagsBits.Administrator);
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error verificando permisos:', error);
        return member.permissions.has(PermissionFlagsBits.Administrator);
    }
}

// --- Handler principal para slash y legacy ---
async function handleAntiRaidCommand(interaction) {
    try {
        const guildId = interaction.guild.id;
        const member = interaction.member;
        
        // Verificar permisos
        if (!hasAntiRaidPerms(member, guildId)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para usar los comandos de configuración anti-raid.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Solo administradores o usuarios con el rol configurado pueden usar estos comandos.',
                    inline: false
                })
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Obtener subcomando
        const sub = interaction.options.getSubcommand();
        
        switch (sub) {
            case 'activar':
                await handleActivar(interaction, guildId);
                break;
            case 'desactivar':
                await handleDesactivar(interaction, guildId);
                break;
            case 'estado':
                await handleEstado(interaction, guildId);
                break;
            case 'config':
                await handleConfig(interaction, guildId);
                break;
            case 'whitelist':
                await handleWhitelist(interaction, guildId);
                break;
            case 'blacklist':
                await handleBlacklist(interaction, guildId);
                break;
            case 'excludechannel':
                await handleExcludeChannel(interaction, guildId);
                break;
            case 'alertmode':
                await handleAlertMode(interaction, guildId);
                break;
            case 'reset':
                await handleReset(interaction, guildId);
                break;
            case 'ayuda':
                await handleAyuda(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Subcomando no reconocido.', ephemeral: true });
        }
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error en handleAntiRaidCommand:', error);
        await interaction.reply({ 
            content: '❌ Ocurrió un error al procesar el comando. Revisa la consola para más detalles.', 
            ephemeral: true 
        });
    }
}

async function handleActivar(interaction, guildId) {
    try {
        AntiRaidConfig.updateGuildConfig(guildId, { enabled: true });
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Sistema Anti-Raid Activado')
            .setDescription('El sistema anti-raid ha sido activado correctamente.')
            .addFields({
                name: '🛡️ Protecciones Activas',
                value: [
                    '• Detección de raids masivos',
                    '• Protección contra spam de canales',
                    '• Filtro de mensajes masivos',
                    '• Sistema de whitelist/blacklist'
                ].join('\n'),
                inline: false
            })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error activando anti-raid:', error);
        await interaction.reply({ content: '❌ Error al activar el sistema anti-raid.', ephemeral: true });
    }
}

async function handleDesactivar(interaction, guildId) {
    try {
        AntiRaidConfig.updateGuildConfig(guildId, { enabled: false });
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('⛔ Sistema Anti-Raid Desactivado')
            .setDescription('El sistema anti-raid ha sido desactivado.')
            .addFields({
                name: '⚠️ Advertencia',
                value: 'El servidor ya no está protegido contra raids automáticos.',
                inline: false
            })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error desactivando anti-raid:', error);
        await interaction.reply({ content: '❌ Error al desactivar el sistema anti-raid.', ephemeral: true });
    }
}

async function handleEstado(interaction, guildId) {
    try {
        const config = AntiRaidConfig.getGuildConfig(guildId);
        const embed = new EmbedBuilder()
            .setColor(config.enabled ? '#00ff00' : '#ff0000')
            .setTitle('🛡️ Estado del Sistema Anti-Raid')
            .addFields(
                { name: 'Estado', value: config.enabled ? '🟢 Activado' : '🔴 Desactivado', inline: true },
                { name: 'Sensibilidad', value: config.sensitivity || 'medio', inline: true },
                { name: 'Auto-Ban', value: config.autoBan ? '✅ Activado' : '❌ Desactivado', inline: true },
                { name: 'Modo Solo Alertas', value: config.alertOnly ? '✅ Activado' : '❌ Desactivado', inline: true },
                { name: 'Umbral de Raid', value: `${config.raidThreshold.users} usuarios en ${config.raidThreshold.seconds}s`, inline: true },
                { name: 'Cooldown', value: `${config.cooldown}s`, inline: true }
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error mostrando estado:', error);
        await interaction.reply({ content: '❌ Error al obtener el estado del sistema.', ephemeral: true });
    }
}

async function handleConfig(interaction, guildId) {
    try {
        const opcion = interaction.options.getString('opcion');
        const valor1 = interaction.options.getString('valor1');
        const valor2 = interaction.options.getString('valor2');
        
        const config = AntiRaidConfig.getGuildConfig(guildId);
        let update = {};
        
        switch (opcion) {
            case 'logchannel':
                update.logChannel = valor1;
                break;
            case 'adminchannel':
                update.adminAlertChannel = valor1;
                break;
            case 'raid-threshold':
                const users = parseInt(valor1);
                const seconds = parseInt(valor2) || 60;
                update.raidThreshold = { users, seconds };
                break;
            case 'canalcreate-limit':
                const count = parseInt(valor1);
                const createSeconds = parseInt(valor2) || 60;
                update.channelCreateLimit = { count, seconds: createSeconds };
                break;
            case 'delete-limit':
                const deleteCount = parseInt(valor1);
                const deleteSeconds = parseInt(valor2) || 60;
                update.channelDeleteLimit = { count: deleteCount, seconds: deleteSeconds };
                break;
            case 'auto-ban':
                update.autoBan = valor1 === 'true';
                break;
            case 'perms':
                update.permsRole = valor1;
                break;
            case 'sensibilidad':
                update.sensitivity = valor1;
                break;
        }
        
        AntiRaidConfig.updateGuildConfig(guildId, update);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Configuración Actualizada')
            .setDescription(`Parámetro **${opcion}** actualizado correctamente.`)
            .addFields({
                name: 'Nuevo Valor',
                value: valor2 ? `${valor1} ${valor2}` : valor1,
                inline: true
            })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error configurando:', error);
        await interaction.reply({ content: '❌ Error al actualizar la configuración.', ephemeral: true });
    }
}

async function handleWhitelist(interaction, guildId) {
    try {
        const accion = interaction.options.getString('accion');
        const usuario = interaction.options.getUser('usuario');
        const rol = interaction.options.getRole('rol');
        
        const config = AntiRaidConfig.getGuildConfig(guildId);
        let whitelist = config.whitelist || { users: [], roles: [] };
        
        switch (accion) {
            case 'add':
                if (usuario) whitelist.users.push(usuario.id);
                if (rol) whitelist.roles.push(rol.id);
                break;
            case 'remove':
                if (usuario) whitelist.users = whitelist.users.filter(id => id !== usuario.id);
                if (rol) whitelist.roles = whitelist.roles.filter(id => id !== rol.id);
                break;
            case 'list':
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('📋 Whitelist Actual')
                    .addFields(
                        { name: 'Usuarios', value: whitelist.users.length > 0 ? whitelist.users.map(id => `<@${id}>`).join('\n') : 'Ninguno', inline: true },
                        { name: 'Roles', value: whitelist.roles.length > 0 ? whitelist.roles.map(id => `<@&${id}>`).join('\n') : 'Ninguno', inline: true }
                    )
                    .setTimestamp();
                return await interaction.reply({ embeds: [embed] });
        }
        
        AntiRaidConfig.updateGuildConfig(guildId, { whitelist });
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Whitelist Actualizada')
            .setDescription(`Whitelist ${accion === 'add' ? 'actualizada' : 'limpiada'} correctamente.`)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error gestionando whitelist:', error);
        await interaction.reply({ content: '❌ Error al gestionar la whitelist.', ephemeral: true });
    }
}

async function handleBlacklist(interaction, guildId) {
    try {
        const accion = interaction.options.getString('accion');
        const usuario = interaction.options.getUser('usuario');
        const rol = interaction.options.getRole('rol');
        
        const config = AntiRaidConfig.getGuildConfig(guildId);
        let blacklist = config.blacklist || { users: [], roles: [] };
        
        switch (accion) {
            case 'add':
                if (usuario) blacklist.users.push(usuario.id);
                if (rol) blacklist.roles.push(rol.id);
                break;
            case 'remove':
                if (usuario) blacklist.users = blacklist.users.filter(id => id !== usuario.id);
                if (rol) blacklist.roles = blacklist.roles.filter(id => id !== rol.id);
                break;
            case 'list':
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('📋 Blacklist Actual')
                    .addFields(
                        { name: 'Usuarios', value: blacklist.users.length > 0 ? blacklist.users.map(id => `<@${id}>`).join('\n') : 'Ninguno', inline: true },
                        { name: 'Roles', value: blacklist.roles.length > 0 ? blacklist.roles.map(id => `<@&${id}>`).join('\n') : 'Ninguno', inline: true }
                    )
                    .setTimestamp();
                return await interaction.reply({ embeds: [embed] });
        }
        
        AntiRaidConfig.updateGuildConfig(guildId, { blacklist });
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('✅ Blacklist Actualizada')
            .setDescription(`Blacklist ${accion === 'add' ? 'actualizada' : 'limpiada'} correctamente.`)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error gestionando blacklist:', error);
        await interaction.reply({ content: '❌ Error al gestionar la blacklist.', ephemeral: true });
    }
}

async function handleExcludeChannel(interaction, guildId) {
    try {
        const accion = interaction.options.getString('accion');
        const canal = interaction.options.getChannel('canal');
        
        const config = AntiRaidConfig.getGuildConfig(guildId);
        let excludedChannels = config.excludedChannels || [];
        
        switch (accion) {
            case 'add':
                if (canal) excludedChannels.push(canal.id);
                break;
            case 'remove':
                if (canal) excludedChannels = excludedChannels.filter(id => id !== canal.id);
                break;
            case 'list':
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('📋 Canales Excluidos')
                    .setDescription(excludedChannels.length > 0 ? 
                        excludedChannels.map(id => `<#${id}>`).join('\n') : 'Ningún canal excluido')
                    .setTimestamp();
                return await interaction.reply({ embeds: [embed] });
        }
        
        AntiRaidConfig.updateGuildConfig(guildId, { excludedChannels });
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Canales Excluidos Actualizados')
            .setDescription(`Lista de canales excluidos ${accion === 'add' ? 'actualizada' : 'limpiada'} correctamente.`)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error gestionando canales excluidos:', error);
        await interaction.reply({ content: '❌ Error al gestionar los canales excluidos.', ephemeral: true });
    }
}

async function handleAlertMode(interaction, guildId) {
    try {
        const estado = interaction.options.getString('estado');
        const alertOnly = estado === 'on';
        
        AntiRaidConfig.updateGuildConfig(guildId, { alertOnly });
        
        const embed = new EmbedBuilder()
            .setColor(alertOnly ? '#ff9900' : '#00ff00')
            .setTitle(`✅ Modo Solo Alertas ${alertOnly ? 'Activado' : 'Desactivado'}`)
            .setDescription(alertOnly ? 
                'El sistema solo enviará alertas sin tomar acciones automáticas.' :
                'El sistema tomará acciones automáticas según la configuración.')
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error configurando modo alerta:', error);
        await interaction.reply({ content: '❌ Error al configurar el modo de alerta.', ephemeral: true });
    }
}

async function handleReset(interaction, guildId) {
    try {
        const defaultConfig = AntiRaidConfig.defaultConfig();
        AntiRaidConfig.updateGuildConfig(guildId, defaultConfig);
        
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🔄 Configuración Restaurada')
            .setDescription('La configuración del sistema anti-raid ha sido restaurada a los valores por defecto.')
            .addFields({
                name: '⚠️ Nota',
                value: 'El sistema está desactivado por defecto. Usa `/antiraid activar` para activarlo.',
                inline: false
            })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('[AntiRaidCommands] ❌ Error reseteando configuración:', error);
        await interaction.reply({ content: '❌ Error al restaurar la configuración.', ephemeral: true });
    }
}

async function handleAyuda(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#7289da')
        .setTitle('🛡️ Sistema Anti-Raid - Ayuda')
        .setDescription('Explicación de cada módulo y cómo configurarlo:')
        .addFields(
            {
                name: '🚨 Detección de Raids',
                value: 'Monitorea joins masivos y detecta raids automáticamente. Configurable con umbral de usuarios y tiempo.',
                inline: false
            },
            {
                name: '📝 Protección de Canales',
                value: 'Previene creación/eliminación masiva de canales. Configura límites por tiempo.',
                inline: false
            },
            {
                name: '💬 Filtro de Mensajes',
                value: 'Detecta spam de mensajes y toma acción automática. Excluye canales específicos.',
                inline: false
            },
            {
                name: '⚪ Whitelist/Blacklist',
                value: 'Usuarios y roles que siempre se permiten o bloquean automáticamente.',
                inline: false
            },
            {
                name: '🔧 Configuración',
                value: 'Usa `/antiraid config` para ajustar parámetros específicos del sistema.',
                inline: false
            }
        )
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
}

// --- Exportaciones principales ---
module.exports = {
    antiRaidCommands,
    handleAntiRaidCommand,
    hasAntiRaidPerms
}; 