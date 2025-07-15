const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'listwords',
    description: 'Muestra las palabras filtradas activas para el servidor',
    legacy: true,
    data: { name: 'listwords' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixCommand = require('../prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'listwords')) {
            return;
        }

        // Verificar permisos usando modperms
        const modpermsCommand = require('./modperms.js');
        const hasPermission = await modpermsCommand.checkPermission(message, 'listwords');
        
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para usar este comando.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Contacta a un administrador para configurar los permisos con `!modperms listwords <rol_id>`',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

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
                    .setTitle('📝 Lista de Palabras Filtradas')
                    .setDescription('Este servidor no tiene palabras configuradas en el filtro.')
                    .addFields({
                        name: 'ℹ️ Información',
                        value: [
                            '• Usa `!addword <palabra>` para agregar palabras',
                            '• Usa `!removeword <palabra>` para eliminar palabras',
                            '• Los mensajes con palabras filtradas se eliminan automáticamente'
                        ].join('\n'),
                        inline: false
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const words = warnwords[message.guild.id];
            const totalWords = words.length;

            // Crear lista de palabras
            const wordsList = words.map((word, index) => `${index + 1}. \`${word}\``).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('📝 Lista de Palabras Filtradas')
                .setDescription(`**Total de palabras:** ${totalWords}`)
                .addFields({
                    name: '🛡️ Palabras Prohibidas',
                    value: wordsList.length > 1024 ? wordsList.substring(0, 1021) + '...' : wordsList,
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: [
                        '• Los mensajes con estas palabras se eliminan automáticamente',
                        '• El filtro es insensible a mayúsculas/minúsculas',
                        '• Usa `!addword <palabra>` para agregar más palabras',
                        '• Usa `!removeword <palabra>` para eliminar palabras'
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();

            // Si hay demasiadas palabras, crear embeds adicionales
            if (wordsList.length > 1024) {
                const chunks = [];
                let currentChunk = '';
                
                for (const word of words) {
                    const wordLine = `${chunks.length * 20 + chunks[chunks.length - 1]?.split('\n').length || 1}. \`${word}\``;
                    
                    if (currentChunk.length + wordLine.length > 1024) {
                        chunks.push(currentChunk);
                        currentChunk = wordLine;
                    } else {
                        currentChunk += (currentChunk ? '\n' : '') + wordLine;
                    }
                }
                
                if (currentChunk) {
                    chunks.push(currentChunk);
                }

                // Enviar primer embed
                await message.reply({ embeds: [embed] });

                // Enviar embeds adicionales
                for (let i = 1; i < chunks.length; i++) {
                    const additionalEmbed = new EmbedBuilder()
                        .setColor('#7289da')
                        .setTitle(`📝 Lista de Palabras Filtradas (Página ${i + 1})`)
                        .setDescription(`**Total de palabras:** ${totalWords}`)
                        .addFields({
                            name: '🛡️ Palabras Prohibidas',
                            value: chunks[i],
                            inline: false
                        })
                        .setTimestamp();

                    await message.channel.send({ embeds: [additionalEmbed] });
                }
            } else {
                await message.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error al listar palabras:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al cargar la lista de palabras. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
}; 