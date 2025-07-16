// commands/antiraid.js
// Comando legacy para el sistema anti-raid (prefix personalizado)
const { hasAntiRaidPerms, handleAntiRaidCommand } = require('../antiRaid/antiRaidCommands');
const AntiRaidConfig = require('../antiRaid/antiRaidConfig');

module.exports = {
    name: 'antiraid',
    legacy: true,
    description: 'Configura y controla el sistema anti-raid (legacy)',
    async executeLegacy(message, args) {
        if (!message.guild) return;
        const member = message.member;
        if (!hasAntiRaidPerms(member, message.guild.id)) {
            return message.reply('❌ No tienes permisos para usar los comandos de configuración anti-raid.');
        }
        // Subcomandos básicos
        const sub = args[0]?.toLowerCase();
        if (!sub || sub === 'help') {
            return message.reply(
                '**Comandos Anti-Raid:**\n' +
                '`antiraid activar` | `antiraid desactivar` | `antiraid estado`\n' +
                '`antiraid config <opcion> <valor1> [valor2]`\n' +
                '`antiraid whitelist add/remove/list <@usuario/@rol>`\n' +
                '`antiraid help`'
            );
        }
        // Simular interacción para reutilizar la lógica modular
        const fakeInteraction = {
            isChatInputCommand: () => true,
            commandName: 'antiraid',
            guild: message.guild,
            member: message.member,
            user: message.author,
            channel: message.channel,
            reply: (data) => message.reply(typeof data === 'string' ? data : data.content),
            options: {
                getSubcommand: () => sub,
                getSubcommandGroup: () => args[1]?.toLowerCase() === 'whitelist' ? 'whitelist' : null,
                getString: (name) => {
                    if (name === 'opcion') return args[1];
                    if (name === 'valor1') return args[2];
                    if (name === 'valor2') return args[3];
                    return null;
                },
                getUser: () => message.mentions.users.first() || null,
                getRole: () => message.mentions.roles.first() || null
            },
            deferred: false,
            replied: false,
            followUp: (data) => message.reply(typeof data === 'string' ? data : data.content)
        };
        await handleAntiRaidCommand(fakeInteraction);
    }
}; 