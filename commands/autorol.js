const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorol')
        .setDescription('Crea un panel de autoasignación de roles')
        .addStringOption(option =>
            option.setName('titulo')
                .setDescription('Título del panel de roles')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('descripcion')
                .setDescription('Descripción del panel')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol1')
                .setDescription('Primer rol para autoasignación')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol2')
                .setDescription('Segundo rol para autoasignación')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('rol3')
                .setDescription('Tercer rol para autoasignación')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('rol4')
                .setDescription('Cuarto rol para autoasignación')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('rol5')
                .setDescription('Quinto rol para autoasignación')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const title = interaction.options.getString('titulo');
        const description = interaction.options.getString('descripcion');
        const roles = [
            interaction.options.getRole('rol1'),
            interaction.options.getRole('rol2'),
            interaction.options.getRole('rol3'),
            interaction.options.getRole('rol4'),
            interaction.options.getRole('rol5')
        ].filter(role => role !== null);

        // Verificar permisos del bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({
                content: '❌ No tengo permisos para gestionar roles en este servidor.',
                ephemeral: true
            });
        }

        // Verificar que el bot pueda gestionar todos los roles
        for (const role of roles) {
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({
                    content: `❌ No puedo gestionar el rol ${role.name} porque es igual o superior a mi rol más alto.`,
                    ephemeral: true
                });
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle(title)
            .setDescription(description)
            .addFields({
                name: 'Roles Disponibles',
                value: roles.map(role => `• ${role}`).join('\n'),
                inline: false
            })
            .setTimestamp()
            .setFooter({ text: 'Haz clic en los botones para asignarte o removerte roles' });

        const buttons = [];
        const maxButtonsPerRow = 3;

        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];
            const row = Math.floor(i / maxButtonsPerRow);
            
            if (!buttons[row]) {
                buttons[row] = new ActionRowBuilder();
            }

            const button = new ButtonBuilder()
                .setCustomId(`role_${role.id}`)
                .setLabel(role.name)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎭');

            buttons[row].addComponents(button);
        }

        await interaction.reply({
            embeds: [embed],
            components: buttons
        });
    },

    // Comando legacy con prefijo dinámico
    legacy: true,
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixCommand = require('./prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'autorol')) {
            return;
        }

        // Verificar permisos del usuario
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await message.reply('❌ No tienes permisos para gestionar roles.');
        }

        // Verificar argumentos mínimos
        if (args.length < 3) {
            return await message.reply(`❌ Uso correcto: \`${currentPrefix}autorol "Título" "Descripción" @rol1 @rol2 @rol3...\``);
        }

        // Extraer título y descripción
        let title, description;
        let currentArg = 0;

        // Buscar título entre comillas
        if (args[currentArg].startsWith('"')) {
            let titleEnd = currentArg;
            while (titleEnd < args.length && !args[titleEnd].endsWith('"')) {
                titleEnd++;
            }
            if (titleEnd < args.length) {
                title = args.slice(currentArg, titleEnd + 1).join(' ').replace(/"/g, '');
                currentArg = titleEnd + 1;
            }
        }

        // Buscar descripción entre comillas
        if (currentArg < args.length && args[currentArg].startsWith('"')) {
            let descEnd = currentArg;
            while (descEnd < args.length && !args[descEnd].endsWith('"')) {
                descEnd++;
            }
            if (descEnd < args.length) {
                description = args.slice(currentArg, descEnd + 1).join(' ').replace(/"/g, '');
                currentArg = descEnd + 1;
            }
        }

        if (!title || !description) {
            return await message.reply(`❌ Debes proporcionar un título y descripción entre comillas.\n\nEjemplo: \`${currentPrefix}autorol "Roles de Juegos" "Selecciona tus juegos favoritos" @Gamer @Streamer\``);
        }

        // Obtener roles mencionados
        const roles = message.mentions.roles.array().slice(0, 5); // Máximo 5 roles

        if (roles.length === 0) {
            return await message.reply('❌ Debes mencionar al menos un rol.');
        }

        // Verificar permisos del bot
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await message.reply('❌ No tengo permisos para gestionar roles en este servidor.');
        }

        // Verificar que el bot pueda gestionar todos los roles
        for (const role of roles) {
            if (role.position >= message.guild.members.me.roles.highest.position) {
                return await message.reply(`❌ No puedo gestionar el rol ${role.name} porque es igual o superior a mi rol más alto.`);
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle(title)
            .setDescription(description)
            .addFields({
                name: 'Roles Disponibles',
                value: roles.map(role => `• ${role}`).join('\n'),
                inline: false
            })
            .setTimestamp()
            .setFooter({ text: 'Haz clic en los botones para asignarte o removerte roles' });

        const buttons = [];
        const maxButtonsPerRow = 3;

        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];
            const row = Math.floor(i / maxButtonsPerRow);
            
            if (!buttons[row]) {
                buttons[row] = new ActionRowBuilder();
            }

            const button = new ButtonBuilder()
                .setCustomId(`role_${role.id}`)
                .setLabel(role.name)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎭');

            buttons[row].addComponents(button);
        }

        await message.reply({
            embeds: [embed],
            components: buttons
        });
    }
}; 