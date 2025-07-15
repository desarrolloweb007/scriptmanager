const { EmbedBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'addword',
    description: 'Agrega una palabra al filtro de palabras prohibidas',
    legacy: true,
    data: { name: 'addword' },
    
    async executeLegacy(message, args) {
        // Verificar prefijo dinámico
        const prefixCommand = require('../prefix.js');
        const currentPrefix = prefixCommand.getPrefix(message.guild.id);
        
        if (!message.content.startsWith(currentPrefix + 'addword')) {
            return;
        }

        // Verificar permisos usando modperms
        const modpermsCommand = require('./modperms.js');
        const hasPermission = await modpermsCommand.checkPermission(message, 'addword');
        
        if (!hasPermission) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error de Permisos')
                .setDescription('No tienes permisos para usar este comando.')
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Contacta a un administrador para configurar los permisos con `!modperms addword <rol_id>`',
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
                .setDescription(`**Sintaxis:** \`${currentPrefix}addword <palabra>\``)
                .addFields({
                    name: '📝 Ejemplos',
                    value: [
                        `\`${currentPrefix}addword spam\``,
                        `\`${currentPrefix}addword insulto\``,
                        `\`${currentPrefix}addword palabra_prohibida\``
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: '⚠️ Nota',
                    value: 'Las palabras se filtran de forma insensible a mayúsculas/minúsculas',
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const word = args[0].toLowerCase().trim();

        // Validar palabra
        if (word.length < 2) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Palabra Inválida')
                .setDescription('La palabra debe tener al menos 2 caracteres.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        if (word.length > 50) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Palabra Demasiado Larga')
                .setDescription('La palabra no puede tener más de 50 caracteres.')
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

            // Inicializar configuración del servidor si no existe
            if (!warnwords[message.guild.id]) {
                warnwords[message.guild.id] = [];
            }

            // Verificar si la palabra ya existe
            if (warnwords[message.guild.id].includes(word)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('⚠️ Palabra Ya Existe')
                    .setDescription(`La palabra \`${word}\` ya está en el filtro.`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            // Agregar palabra
            warnwords[message.guild.id].push(word);

            // Guardar en archivo
            await fs.writeFile(warnwordsPath, JSON.stringify(warnwords, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Palabra Agregada')
                .setDescription(`La palabra \`${word}\` ha sido agregada al filtro.`)
                .addFields({
                    name: '📋 Detalles',
                    value: [
                        `**Palabra:** \`${word}\``,
                        `**Servidor:** ${message.guild.name}`,
                        `**Total palabras:** ${warnwords[message.guild.id].length}`
                    ].join('\n'),
                    inline: false
                })
                .addFields({
                    name: 'ℹ️ Información',
                    value: 'Los mensajes que contengan esta palabra serán eliminados automáticamente.',
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al agregar palabra:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error al agregar la palabra. Inténtalo de nuevo.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
}; 