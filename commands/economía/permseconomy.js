const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');
const { checkShopPermission, validateRole } = require('../../utils/permissionsUtils');

const PERMS_PATH = path.join(__dirname, '../../data/econ_perms.json');

module.exports = {
    name: 'permseconomy',
    description: 'Configura los permisos de economía por rol y comando',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('permseconomy')
        .setDescription('Comando permseconomy'),
    async execute(interaction) {
        await interaction.reply({ 
            content: 'Comando en desarrollo. Usa la versión legacy por ahora.', 
            ephemeral: true 
        },);
    },

    async executeLegacy(message, args) {
        try {
        // Verificar prefijo dinámico
        // Verificación de prefijo manejada por el middleware

        // Solo administradores pueden configurar
        if (!message.member.permissions.has('Administrator')) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('Solo los administradores pueden configurar permisos de economía.')
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'permseconomy');
        const roleId = commandArgs[0];
        const comandos = commandArgs.slice(1).join(' ').replace(/\s/g, '').split(',').filter(Boolean);
        const currentPrefix = await getCurrentPrefix(message.guild.id);

        // Validar rol
        const roleValidation = await validateRole(message.guild, roleId);
        if (!roleValidation.valid) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Rol Inválido')
                .setDescription(roleValidation.message)
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Validar comandos
        if (!comandos.length) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uso Incorrecto')
                .setDescription('Debes especificar al menos un comando.')
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}permseconomy rolID comando1,comando2,...\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}permseconomy 123456789012345678 additem,removeitem,edititem\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }

        // Guardar permisos
        let perms = {};
        try {
            const data = await fs.readFile(PERMS_PATH, 'utf8');
            perms = JSON.parse(data);
        } catch {}
        if (!perms[message.guild.id]) perms[message.guild.id] = {};
        perms[message.guild.id][roleId] = comandos;
        await fs.writeFile(PERMS_PATH, JSON.stringify(perms, null, 2));

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Permisos de Economía Configurados')
            .setDescription(`El rol ${roleValidation.role} ahora puede usar los comandos: **${comandos.join(', ')}**`)
            .setTimestamp();
        return message.reply({ embeds: [embed], flags: 64 });
    }
        } catch (error) {
            console.error(`Error en comando ${fileName}:`, error);
            const { EmbedBuilder } = require("discord.js");
            const embed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle("❌ Error")
                .setDescription("Hubo un error al ejecutar este comando.")
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: 64 });
        }
};