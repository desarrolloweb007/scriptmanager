const fs = require('fs');
const path = require('path');

console.log('🔧 Arreglando comandos de economía...');

const economyDir = path.join(__dirname, 'commands/economía');
const files = fs.readdirSync(economyDir);

// Lista de archivos que necesitan corrección
const filesToFix = [
    'permseconomy.js', 'econconfig.js', 'pay.js', 'buy.js', 'workpay.js',
    'setdaily.js', 'worktime.js', 'work.js', 'edititem.js', 'additem.js',
    'removeitem.js', 'shop.js', 'ptienda.js', 'addcategory.js', 'configword.js',
    'leaderboard.js'
];

filesToFix.forEach(fileName => {
    const filePath = path.join(economyDir, fileName);
    if (fs.existsSync(filePath)) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Arreglar problemas comunes
            
            // 1. Arreglar el problema de doble try
            content = content.replace(/try {\s*try {/g, 'try {');
            
            // 2. Arreglar comas faltantes después de execute
            content = content.replace(/async execute\(interaction\) \{\s*await interaction\.reply.*?\s*\}/s, (match) => {
                return match + ',';
            });
            
            // 3. Asegurar que hay una coma después del cierre de execute
            content = content.replace(/\}\s*async executeLegacy/g, '},\n\n    async executeLegacy');
            
            // 4. Arreglar bloques try-catch incompletos
            if (content.includes('async executeLegacy(message, args) {')) {
                // Verificar si ya tiene el patrón correcto
                if (!content.includes('} catch (error) {') || !content.match(/\}\s*catch\s*\(error\)\s*\{[\s\S]*?\}\s*\}\s*;?\s*$/)) {
                    // Agregar el cierre correcto del try-catch y del método
                    const lines = content.split('\n');
                    let newLines = [];
                    let inExecuteLegacy = false;
                    let braceCount = 0;
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        newLines.push(line);
                        
                        if (line.includes('async executeLegacy(message, args) {')) {
                            inExecuteLegacy = true;
                            braceCount = 1;
                        } else if (inExecuteLegacy) {
                            // Contar llaves
                            for (const char of line) {
                                if (char === '{') braceCount++;
                                if (char === '}') braceCount--;
                            }
                            
                            // Si llegamos al final del método
                            if (braceCount === 1 && (line.trim() === '}' || line.includes('return message.reply'))) {
                                // Agregar el catch si no existe
                                if (!content.includes('} catch (error) {')) {
                                    newLines.push('        } catch (error) {');
                                    newLines.push('            console.error(`Error en comando ${fileName}:`, error);');
                                    newLines.push('            const { EmbedBuilder } = require("discord.js");');
                                    newLines.push('            const embed = new EmbedBuilder()');
                                    newLines.push('                .setColor("#ff0000")');
                                    newLines.push('                .setTitle("❌ Error")');
                                    newLines.push('                .setDescription("Hubo un error al ejecutar este comando.")');
                                    newLines.push('                .setTimestamp();');
                                    newLines.push('            return message.reply({ embeds: [embed], flags: 64 });');
                                    newLines.push('        }');
                                }
                                inExecuteLegacy = false;
                                break;
                            }
                        }
                    }
                    
                    content = newLines.join('\n');
                }
            }
            
            // 5. Asegurar que el archivo termina correctamente
            if (!content.trim().endsWith('};')) {
                content = content.trim() + '\n};';
            }
            
            // Escribir el archivo corregido
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${fileName} corregido`);
            
        } catch (error) {
            console.error(`❌ Error corrigiendo ${fileName}:`, error.message);
        }
    }
});

console.log('✅ Comandos de economía arreglados'); 