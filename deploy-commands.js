require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[ADVERTENCIA] El comando en ${filePath} no tiene la propiedad "data" requerida.`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🔄 Iniciando registro de ${commands.length} comandos de aplicación.`);

        // Para desarrollo: registrar comandos en un servidor específico
        if (process.env.GUILD_ID) {
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`✅ Registrados ${data.length} comandos en el servidor de desarrollo.`);
        } else {
            // Para producción: registrar comandos globalmente
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`✅ Registrados ${data.length} comandos globalmente.`);
        }
    } catch (error) {
        console.error('❌ Error al registrar comandos:', error);
    }
})(); 