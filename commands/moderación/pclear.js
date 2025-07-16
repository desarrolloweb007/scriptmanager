const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

const configPath = path.join(__dirname, '../../data/clearconfig.json');

module.exports = {
    name: 'pclear',
    legacy: true,
    data: new SlashCommandBuilder()
        .setName('pclear')
        .setDescription('Configura el rol autorizado para usar el comando clear')
        .addRoleOption(opt =>
            opt.setName('rol')
                .setDescription('Rol que podrá usar el comando clear')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Verificar permisos
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Solo administradores pueden configurar este comando.')],
                ephemeral: true
            });
        }

        const role = interaction.options.getRole('rol');

        // Guardar configuración
        try {
            let config = {};
            try {
                const data = await fs.readFile(configPath, 'utf8');
                config = JSON.parse(data);
            } catch {}
            
            config[interaction.guild.id] = role.id;
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('🔒 Rol autorizado para clear')
                .setDescription(`El rol ${role} ahora puede usar el comando \`/clear\` y \`[prefijo]clear\`.`)
                .addFields(
                    { name: '🎭 Rol configurado', value: `${role}`, inline: true },
                    { name: '👤 Configurado por', value: `${interaction.user}`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            console.log(`[PCLEAR] ${interaction.user.tag} configuró el rol ${role.name} para clear en ${interaction.guild.name}`);
            
        } catch (error) {
            console.error('Error al guardar configuración de clear:', error);
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No se pudo guardar la configuración.')],
                ephemeral: true
            });
        }
    },

    async executeLegacy(message, args) {
        // Verificar permisos
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Solo administradores pueden configurar este comando.')]
            });
        }

        // Verificar argumentos
        if (args.length < 1) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Uso correcto: `[prefijo]pclear <rol_id>`\nEjemplo: `!pclear 123456789012345678`')]
            });
        }

        const rolId = args[0];
        if (!rolId || !/^\d{17,20}$/.test(rolId)) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Debes indicar un ID de rol válido.')]
            });
        }

        // Verificar que el rol existe
        const role = message.guild.roles.cache.get(rolId);
        if (!role) {
            return await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ El rol especificado no existe en este servidor.')]
            });
        }

        // Guardar configuración
        try {
            let config = {};
            try {
                const data = await fs.readFile(configPath, 'utf8');
                config = JSON.parse(data);
            } catch {}
            
            config[message.guild.id] = rolId;
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('🔒 Rol autorizado para clear')
                .setDescription(`El rol ${role} ahora puede usar el comando \`[prefijo]clear\`.`)
                .addFields(
                    { name: '🎭 Rol configurado', value: `${role}`, inline: true },
                    { name: '👤 Configurado por', value: `${message.author}`, inline: true }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            
            console.log(`[PCLEAR] ${message.author.tag} configuró el rol ${role.name} para clear en ${message.guild.name}`);
            
        } catch (error) {
            console.error('Error al guardar configuración de clear:', error);
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ No se pudo guardar la configuración.')]
            });
        }
    }
}; 