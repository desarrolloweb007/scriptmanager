const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');
const { checkShopPermission } = require('../../utils/permissionsUtils');
const { getCooldown, setCooldown, addUserBalance, getUserBalance, getCurrencyName, getRandomAmount } = require('../../utils/economyUtils');
const { hasPrefix, getArgs, getCurrentPrefix } = require('../../utils/prefixUtils');

const WORK_MIN = 100;
const WORK_MAX = 750;
const COOLDOWN_SECONDS = 120;
const JOBS_PATH = path.join(__dirname, '../../data/jobs.json');

module.exports = {
    name: 'work',
    description: 'Trabaja y gana monedas o agrega trabajos personalizados',
    legacy: true,
    data: { name: 'work' },

    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        if (!(await hasPrefix(message, 'work'))) {
            return;
        }

        // Si es subcomando add, delegar a lógica de agregar trabajo
        const commandArgs = await getArgs(message, 'work');
        if (commandArgs[0] === 'add') {
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
            const joinedArgs = commandArgs.slice(1).join(' ');
            const [nombre, descripcion] = joinedArgs.split('|').map(s => s.trim());
            const currentPrefix = await getCurrentPrefix(message.guild.id);
            if (!nombre || !descripcion) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Uso Incorrecto')
                    .setDescription('Debes usar el subcomando add y proporcionar nombre y descripción.')
                    .addFields({
                        name: 'Uso Correcto',
                        value: `\`${currentPrefix}work add nombre_trabajo | descripción\``,
                        inline: false
                    })
                    .addFields({
                        name: 'Ejemplo',
                        value: `\`${currentPrefix}work add Camionero | Lleva mercancía por la ciudad\``,
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

        const userId = message.author.id;
        const guildId = message.guild.id;
        const currentPrefix = await getCurrentPrefix(guildId);
        const currency = await getCurrencyName(guildId);

        // Cooldown
        const lastWork = await getCooldown(userId, 'work');
        const now = Date.now();
        if (lastWork && now - lastWork < COOLDOWN_SECONDS * 1000) {
            const remaining = COOLDOWN_SECONDS * 1000 - (now - lastWork);
            const minutes = Math.floor(remaining / (60 * 1000));
            const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle('⏳ Cooldown Activo')
                .setDescription(`Ya trabajaste recientemente.\nVuelve a intentarlo en **${minutes}m ${seconds}s**.`)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Ganancia aleatoria
        const amount = getRandomAmount(WORK_MIN, WORK_MAX);
        await addUserBalance(userId, guildId, amount);
        await setCooldown(userId, 'work', now);
        const saldo = await getUserBalance(userId, guildId);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('💼 Trabajo Realizado')
            .setDescription(`¡Has trabajado y ganado **${amount} ${currency}**!`)
            .addFields({ name: 'Tu Nuevo Saldo', value: `**${saldo} ${currency}**`, inline: true })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }
};
