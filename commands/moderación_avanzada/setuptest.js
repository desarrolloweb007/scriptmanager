const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'setuptest',
    description: 'Configura una palabra de prueba para el filtro',
    legacy: true,
    data: { name: 'setuptest' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixCommand = require('../prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'setuptest')) {
            return;
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

            // Inicializar configuración del servidor si no existe
            if (!warnwords[message.guild.id]) {
                warnwords[message.guild.id] = [];
            }

            // Agregar palabra de prueba
            const testWord = 'test';
            if (!warnwords[message.guild.id].includes(testWord)) {
                warnwords[message.guild.id].push(testWord);
            }

            // Guardar en archivo
            await fs.writeFile(warnwordsPath, JSON.stringify(warnwords, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Configuración de Prueba Completada')
                .setDescription('Se ha configurado la palabra de prueba "test" en el filtro.')
                .addFields({
                    name: '🧪 Prueba',
                    value: 'Escribe la palabra "test" en cualquier mensaje para probar el filtro automático.',
                    inline: false
                })
                .addFields({
                    name: '📋 Comandos Útiles',
                    value: [
                        `\`${currentPrefix}listwords\` - Ver palabras filtradas`,
                        `\`${currentPrefix}removeword test\` - Eliminar palabra de prueba`,
                        `\`${currentPrefix}addword <palabra>\` - Agregar más palabras`
                    ].join('\n'),
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al configurar prueba:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al configurar la prueba. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
}; 