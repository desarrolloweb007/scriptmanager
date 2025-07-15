require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Crear cliente con intents necesarios
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration
    ]
});

// Colección para almacenar comandos
client.commands = new Collection();

// Función para cargar comandos recursivamente
function loadCommands(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Cargar comandos de subcarpetas
            loadCommands(fullPath);
        } else if (item.endsWith('.js')) {
            // Cargar comando
            const command = require(fullPath);
            
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Comando slash cargado: ${command.data.name}`);
            } else if ('name' in command && 'legacy' in command) {
                // Comandos legacy (sin data)
                client.commands.set(command.name, command);
                console.log(`✅ Comando legacy cargado: ${command.name}`);
            } else {
                console.log(`[ADVERTENCIA] El comando en ${fullPath} no tiene las propiedades requeridas.`);
            }
        }
    }
}

// Cargar todos los comandos
loadCommands(path.join(__dirname, 'commands'));

// Evento cuando el bot está listo
client.once(Events.ClientReady, () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    console.log(`🛠️  Bot listo para gestionar roles en ${client.guilds.cache.size} servidores`);
});

// Manejo de comandos e interacciones
client.on(Events.InteractionCreate, async interaction => {
    // Manejo de comandos slash
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No se encontró el comando ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            
            const errorMessage = {
                content: '❌ Hubo un error al ejecutar este comando.',
                flags: 64
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }

    // Manejo de interacciones de botones
    if (interaction.isButton()) {
        const customId = interaction.customId;
        
        if (customId.startsWith('role_')) {
            const roleId = customId.replace('role_', '');
            const role = interaction.guild.roles.cache.get(roleId);
            const member = interaction.member;

            if (!role) {
                return await interaction.reply({
                    content: '❌ El rol ya no existe.',
                    flags: 64
                });
            }

            // Verificar permisos del bot
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return await interaction.reply({
                    content: '❌ No tengo permisos para gestionar roles en este servidor.',
                    flags: 64
                });
            }

            // Verificar que el bot pueda gestionar el rol
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({
                    content: '❌ No puedo gestionar este rol porque es igual o superior a mi rol más alto.',
                    flags: 64
                });
            }

            try {
                if (member.roles.cache.has(role.id)) {
                    // Remover rol
                    await member.roles.remove(role);
                    await interaction.reply({
                        content: `✅ Se ha removido el rol **${role.name}** de tu perfil.`,
                        flags: 64
                    });
                } else {
                    // Asignar rol
                    await member.roles.add(role);
                    await interaction.reply({
                        content: `✅ Se ha asignado el rol **${role.name}** a tu perfil.`,
                        flags: 64
                    });
                }
            } catch (error) {
                console.error('Error al gestionar rol:', error);
                await interaction.reply({
                    content: '❌ Hubo un error al gestionar el rol. Verifica que tengo los permisos necesarios.',
                    flags: 64
                });
            }
        }
    }
});

// Manejo de comandos legacy (con prefijo dinámico)
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    
    // Ejecutar filtro automático de palabras prohibidas
    try {
        const warnfilterCommand = client.commands.get('warnfilter');
        if (warnfilterCommand && warnfilterCommand.checkMessage) {
            await warnfilterCommand.checkMessage(message);
        }
    } catch (error) {
        console.error('Error en filtro automático:', error);
    }
    
    // Obtener el prefijo del servidor
    const prefixCommand = require('./commands/prefix.js');
    const currentPrefix = prefixCommand.getPrefix(message.guild.id);
    
    if (!message.content.startsWith(currentPrefix)) return;

    const args = message.content.slice(currentPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Buscar comandos legacy
    const command = client.commands.get(commandName);
    if (!command || !command.legacy) return;

    // Verificar si el comando está bloqueado
    try {
        const sgblockCommand = require('./commands/sgblock.js');
        const blockCheck = await sgblockCommand.checkCommandBlock(message, commandName);
        
        if (blockCheck.blocked) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🚫 Comando Bloqueado')
                .setDescription(`El comando \`${commandName}\` está bloqueado.`)
                .addFields({
                    name: '📋 Información',
                    value: blockCheck.reason,
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Error al verificar bloqueo de comando:', error);
        // En caso de error, continuar con la ejecución
    }

    try {
        await command.executeLegacy(message, args);
    } catch (error) {
        console.error(error);
        await message.reply('❌ Hubo un error al ejecutar este comando.');
    }
});

// Manejo de eventos de reacciones para verificación
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
        const reactionHandler = require('./events/reactionHandler.js');
        await reactionHandler.handleReactionAdd(reaction, user);
    } catch (error) {
        console.error('Error en handleReactionAdd:', error);
    }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
    try {
        const reactionHandler = require('./events/reactionHandler.js');
        await reactionHandler.handleReactionRemove(reaction, user);
    } catch (error) {
        console.error('Error en handleReactionRemove:', error);
    }
});

// Manejo de eventos de reacciones para tickets
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
        const ticketReactionHandler = require('./events/ticketReactionHandler.js');
        await ticketReactionHandler.execute(reaction, user);
    } catch (error) {
        console.error('Error en ticketReactionHandler:', error);
    }
});

// Manejo de errores
client.on('error', error => {
    console.error('Error del cliente Discord:', error);
});

process.on('unhandledRejection', error => {
    console.error('Error no manejado:', error);
});

// Conectar el bot
client.login(process.env.DISCORD_TOKEN); 