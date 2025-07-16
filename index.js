require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 1. Crear instancia del cliente de Discord con los intents necesarios
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration
    ]
});

// 2. Importar AntiRaidManager después de definir client
const AntiRaidManager = require('./scriptmanager/antiRaid/antiRaidManager');
const { antiRaidCommands, handleAntiRaidCommand } = require('./scriptmanager/antiRaid/antiRaidCommands');

// 3. Instanciar AntiRaidManager pasando el client
const antiRaidManager = new AntiRaidManager(client);
// Si prefieres inicializar listeners aparte, puedes usar: antiRaidManager.init();

// 4. Registrar eventos y lógica del bot
client.commands = new Collection();

// Función para cargar comandos recursivamente
function loadCommands(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            loadCommands(fullPath);
        } else if (item.endsWith('.js')) {
            const command = require(fullPath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Comando slash cargado: ${command.data.name}`);
            } else if ('name' in command && 'legacy' in command) {
                client.commands.set(command.name, command);
                console.log(`✅ Comando legacy cargado: ${command.name}`);
            } else {
                console.log(`[ADVERTENCIA] El comando en ${fullPath} no tiene las propiedades requeridas.`);
            }
        }
    }
}

loadCommands(path.join(__dirname, 'commands'));

client.once(Events.ClientReady, () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    console.log(`🛠️  Bot listo para gestionar roles en ${client.guilds.cache.size} servidores`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'antiraid') {
        await handleAntiRaidCommand(interaction);
        return;
    }
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
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return await interaction.reply({
                    content: '❌ No tengo permisos para gestionar roles en este servidor.',
                    flags: 64
                });
            }
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({
                    content: '❌ No puedo gestionar este rol porque es igual o superior a mi rol más alto.',
                    flags: 64
                });
            }
            try {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    await interaction.reply({
                        content: `✅ Se ha removido el rol **${role.name}** de tu perfil.`,
                        flags: 64
                    });
                } else {
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

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    try {
        const warnfilterCommand = client.commands.get('warnfilter');
        if (warnfilterCommand && warnfilterCommand.checkMessage) {
            await warnfilterCommand.checkMessage(message);
        }
    } catch (error) {
        console.error('Error en filtro automático:', error);
    }
    const prefixCommand = require('./commands/prefix.js');
    const currentPrefix = prefixCommand.getPrefix(message.guild.id);
    if (!message.content.startsWith(currentPrefix)) return;
    const args = message.content.slice(currentPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (!command || !command.legacy) return;
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
            return message.reply({ embeds: [embed], flags: 64 });
        }
    } catch (error) {
        console.error('Error al verificar bloqueo de comando:', error);
    }
    try {
        await command.executeLegacy(message, args);
    } catch (error) {
        console.error(error);
        await message.reply({ content: '❌ Hubo un error al ejecutar este comando.', flags: 64 });
    }
});

// 5. Iniciar sesión del bot
client.login(process.env.TOKEN); 