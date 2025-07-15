const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');
const { checkShopPermission } = require('../../utils/permissionsUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

const JOBS_PATH = path.join(__dirname, '../../data/jobs.json');

module.exports = {
    name: 'configword',
    description: 'Agrega trabajos personalizados para el comando work',
    legacy: true,
    data: { name: 'configword' },

    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        if (!(await hasPrefix(message, 'configword'))) {
            return;
        }

        // Verificar permisos de administración de tienda
        const hasPermission = await checkShopPermission(message.member);
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para configurar trabajos.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Obtener argumentos
        const commandArgs = await getArgs(message, 'configword');
        const subcmd = commandArgs[0];
        const joinedArgs = commandArgs.slice(1).join(' ');
        const [nombre, descripcion] = joinedArgs.split('|').map(s => s.trim());
        const currentPrefix = await getCurrentPrefix(message.guild.id);

        if (subcmd !== 'add' || !nombre || !descripcion) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uso Incorrecto')
                .setDescription('Debes usar el subcomando add y proporcionar nombre y descripción.')
                .addFields({
                    name: 'Uso Correcto',
                    value: `\`${currentPrefix}configword add nombre_trabajo | descripción\``,
                    inline: false
                })
                .addFields({
                    name: 'Ejemplo',
                    value: `\`${currentPrefix}configword add Camionero | Lleva mercancía por la ciudad\``,
                    inline: false
                })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Guardar trabajo
        let jobs = {};
        try {
            const data = await fs.readFile(JOBS_PATH, 'utf8');
            jobs = JSON.parse(data);
        } catch {}
        if (!jobs[message.guild.id]) jobs[message.guild.id] = {};
        if (jobs[message.guild.id][nombre]) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Trabajo Duplicado')
                .setDescription('Ya existe un trabajo con ese nombre.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
        jobs[message.guild.id][nombre] = descripcion;
        await fs.writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2));

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Trabajo Agregado')
            .setDescription(`Trabajo **${nombre}** agregado correctamente.`)
            .addFields({ name: 'Descripción', value: descripcion, inline: false })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }
}; 