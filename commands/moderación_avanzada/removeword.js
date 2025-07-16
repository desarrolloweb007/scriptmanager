const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'removeword',
    description: 'Elimina una palabra del filtro de palabras prohibidas',
    legacy: true,
    data: { name: 'removeword' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixManager = require('../../utils/prefixManager');
        const currentPrefix = prefixManager.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'removeword')) {
            return;
        }

        // Verificar permisos usando modperms
        const modpermsCommand = require('./modperms.js');
        const hasPermission = await modpermsCommand.checkPermission(message, 'removeword');
        
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para usar este comando.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Contacta a un administrador para configurar los permisos con `!modperms removeword <rol_id>`',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Verificar argumentos
        if (args.length < 1) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('📋 Uso del Comando')
                .setDescription(`**Sintaxis:** \`${currentPrefix}removeword <palabra>\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}removeword spam\``,
                        `\`${currentPrefix}removeword insulto\``,
                        `\`${currentPrefix}removeword palabra_prohibida\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Usa `!listwords` para ver todas las palabras filtradas',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const word = args[0].toLowerCase().trim();

        try {
            // Cargar configuración actual
            const warnwordsPath = path.join(__dirname, '../../data/warnwords.json');
            let warnwords = {};
            
            try {
                const warnwordsData = await fs.readFile(warnwordsPath, 'utf8');
                warnwords = JSON.parse(warnwordsData);
            } catch (error) {
                // Archivo no existe, usar objeto vacío
            }

            // Verificar si el servidor tiene palabras configuradas
            if (!warnwords[message.guild.id] || warnwords[message.guild.id].length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('⚠️ No Hay Palabras Configuradas')
                    .setDescription('Este servidor no tiene palabras en el filtro.')
                    .addFields({
                        name: 'ℹ️ Información',
                        value: 'Usa `!addword <palabra>` para agregar palabras al filtro.',
                        inline: false
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            // Verificar si la palabra existe
            if (!warnwords[message.guild.id].includes(word)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('⚠️ Palabra No Encontrada')
                    .setDescription(`La palabra \`${word}\` no está en el filtro.`)
                    .addFields({
                        name: 'ℹ️ Información',
                        value: 'Usa `!listwords` para ver todas las palabras filtradas.',
                        inline: false
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            // Eliminar palabra
            warnwords[message.guild.id] = warnwords[message.guild.id].filter(w => w !== word);

            // Guardar en archivo
            await fs.writeFile(warnwordsPath, JSON.stringify(warnwords, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Palabra Eliminada')
                .setDescription(`La palabra \`${word}\` ha sido eliminada del filtro.`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Palabra:** \`${word}\``,
                        `**Servidor:** ${message.guild.name}`,
                        `**Palabras restantes:** ${warnwords[message.guild.id].length}`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Los mensajes que contengan esta palabra ya no serán eliminados automáticamente.',
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al eliminar palabra:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al eliminar la palabra. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
}; 