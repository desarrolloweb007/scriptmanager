// commands/antiraid.js
// Comando legacy para el sistema anti-raid (prefix personalizado)

module.exports = {
    name: 'antiraid',
    legacy: true,
    description: 'Configura y controla el sistema anti-raid (legacy)',
    async executeLegacy(message, args) {
        return message.reply('🛡️ Los comandos de antiraid solo están disponibles como **slash commands** (`/antiraid`). Usa `/antiraid ayuda` para ver las opciones.');
    }
}; 