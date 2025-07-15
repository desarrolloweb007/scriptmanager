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
        GatewayIntentBits.MessageContent
    ]
});

// Colección para almacenar comandos
client.commands = new Collection();

// Cargar comandos desde la carpeta commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[ADVERTENCIA] El comando en ${filePath} no tiene las propiedades "data" o "execute" requeridas.`);
    }
}

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
                ephemeral: true
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
                    ephemeral: true
                });
            }

            // Verificar permisos del bot
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return await interaction.reply({
                    content: '❌ No tengo permisos para gestionar roles en este servidor.',
                    ephemeral: true
                });
            }

            // Verificar que el bot pueda gestionar el rol
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({
                    content: '❌ No puedo gestionar este rol porque es igual o superior a mi rol más alto.',
                    ephemeral: true
                });
            }

            try {
                if (member.roles.cache.has(role.id)) {
                    // Remover rol
                    await member.roles.remove(role);
                    await interaction.reply({
                        content: `✅ Se ha removido el rol **${role.name}** de tu perfil.`,
                        ephemeral: true
                    });
                } else {
                    // Asignar rol
                    await member.roles.add(role);
                    await interaction.reply({
                        content: `✅ Se ha asignado el rol **${role.name}** a tu perfil.`,
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error al gestionar rol:', error);
                await interaction.reply({
                    content: '❌ Hubo un error al gestionar el rol. Verifica que tengo los permisos necesarios.',
                    ephemeral: true
                });
            }
        }
    }
});

// Manejo de comandos legacy (con prefijo dinámico)
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    
    // Obtener el prefijo del servidor
    const prefixCommand = require('./commands/prefix.js');
    const currentPrefix = prefixCommand.getPrefix(message.guild.id);
    
    if (!message.content.startsWith(currentPrefix)) return;

    const args = message.content.slice(currentPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Buscar comandos legacy
    const command = client.commands.get(commandName);
    if (!command || !command.legacy) return;

    try {
        await command.executeLegacy(message, args);
    } catch (error) {
        console.error(error);
        await message.reply('❌ Hubo un error al ejecutar este comando.');
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