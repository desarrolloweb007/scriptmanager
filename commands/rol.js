const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rol')
        .setDescription('Asigna un rol a un usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario al que asignar el rol')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('El rol a asignar')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const role = interaction.options.getRole('rol');
        const member = interaction.guild.members.cache.get(user.id);

        // Verificar permisos del bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({
                content: '❌ No tengo permisos para gestionar roles en este servidor.',
                flags: 64
            });
        }

        // Verificar que el rol no sea más alto que el rol del bot
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return await interaction.reply({
                content: '❌ No puedo asignar un rol que es igual o superior a mi rol más alto.',
                flags: 64
            });
        }

        // Verificar que el usuario no tenga ya el rol
        if (member.roles.cache.has(role.id)) {
            return await interaction.reply({
                content: `❌ ${user} ya tiene el rol ${role.name}.`,
                flags: 64
            });
        }

        try {
            await member.roles.add(role);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Rol Asignado')
                .setDescription(`Se ha asignado el rol **${role.name}** a ${user}`)
                .addFields(
                    { name: 'Usuario', value: `${user} (${user.id})`, inline: true },
                    { name: 'Rol', value: `${role.name} (${role.id})`, inline: true },
                    { name: 'Asignado por', value: `${interaction.user}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Sistema de Gestión de Roles' });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al asignar rol:', error);
            await interaction.reply({
                content: '❌ Hubo un error al asignar el rol. Verifica que tengo los permisos necesarios.',
                flags: 64
            });
        }
    },

    // Comando legacy con prefijo !
    legacy: true,
    async executeLegacy(message, args) {
        // Verificar permisos del usuario
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await message.reply('❌ No tienes permisos para gestionar roles.');
        }

        // Verificar argumentos
        if (args.length < 2) {
            return await message.reply('❌ Uso correcto: `!rol @usuario RolEjemplo`');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return await message.reply('❌ Debes mencionar a un usuario válido.');
        }

        const roleName = args.slice(1).join(' ');
        const role = message.guild.roles.cache.find(r => 
            r.name.toLowerCase() === roleName.toLowerCase()
        );

        if (!role) {
            return await message.reply(`❌ No se encontró el rol "${roleName}".`);
        }

        const member = message.guild.members.cache.get(user.id);

        // Verificar permisos del bot
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await message.reply('❌ No tengo permisos para gestionar roles en este servidor.');
        }

        // Verificar que el rol no sea más alto que el rol del bot
        if (role.position >= message.guild.members.me.roles.highest.position) {
            return await message.reply('❌ No puedo asignar un rol que es igual o superior a mi rol más alto.');
        }

        // Verificar que el usuario no tenga ya el rol
        if (member.roles.cache.has(role.id)) {
            return await message.reply(`❌ ${user} ya tiene el rol ${role.name}.`);
        }

        try {
            await member.roles.add(role);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Rol Asignado')
                .setDescription(`Se ha asignado el rol **${role.name}** a ${user}`)
                .addFields(
                    { name: 'Usuario', value: `${user} (${user.id})`, inline: true },
                    { name: 'Rol', value: `${role.name} (${role.id})`, inline: true },
                    { name: 'Asignado por', value: `${message.author}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Sistema de Gestión de Roles' });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al asignar rol:', error);
            await message.reply('❌ Hubo un error al asignar el rol. Verifica que tengo los permisos necesarios.');
        }
    }
}; 