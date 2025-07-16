/**
 * Script avanzado para arreglar automáticamente todos los problemas en comandos
 * Este script corrige múltiples problemas de forma automática
 */

const fs = require('fs');
const path = require('path');

// Patrones de problemas y sus soluciones
const FIXES = {
    // Eliminar verificación de prefijo duplicada
    DUPLICATE_PREFIX_CHECK: {
        patterns: [
            /const prefixManager = require\('\.\.\/\.\.\/utils\/prefixManager'\);\s*const currentPrefix = prefixManager\.getPrefix\(message\.guild\.id\);\s*if \(!message\.content\.startsWith\(currentPrefix \+ '[^']+'\)\) \{\s*return;\s*\}/g,
            /const prefix = await getPrefix\(message\.guild\.id\);\s*if \(!message\.content\.startsWith\(prefix \+ '[^']+'\)\) return;/g,
            /if \(!\(await hasPrefix\(message, '[^']+'\)\)\) \{\s*return;\s*\}/g
        ],
        replacement: '// Verificación de prefijo manejada por el middleware'
    },
    
    // Agregar versión slash básica
    MISSING_SLASH_COMMAND: {
        pattern: /data: \{ name: '([^']+)' \},/g,
        replacement: (match, commandName) => {
            return `data: new SlashCommandBuilder()
        .setName('${commandName}')
        .setDescription('Comando ${commandName}'),
    async execute(interaction) {
        await interaction.reply({ 
            content: 'Comando en desarrollo. Usa la versión legacy por ahora.', 
            ephemeral: true 
        });
    },`;
        }
    },
    
    // Agregar manejo de errores básico
    ADD_ERROR_HANDLING: {
        pattern: /async executeLegacy\(message, args\) \{/g,
        replacement: `async executeLegacy(message, args) {
        try {`
    },
    
    // Agregar catch al final de executeLegacy
    ADD_CATCH_BLOCK: {
        pattern: /(\s*)\}\s*$/g,
        replacement: (match, spaces) => {
            return `${spaces}        } catch (error) {
            console.error('Error en comando:', error);
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ Hubo un error al ejecutar este comando.')]
            });
        }
    }`;
        }
    },
    
    // Agregar imports necesarios
    ADD_IMPORTS: {
        pattern: /const \{ ([^}]+) \} = require\('discord\.js'\);/g,
        replacement: (match, imports) => {
            const newImports = imports.includes('SlashCommandBuilder') ? imports : imports + ', SlashCommandBuilder';
            return `const { ${newImports} } = require('discord.js');`;
        }
    }
};

function fixCommandFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let fixed = false;
        
        // Aplicar todas las correcciones
        Object.values(FIXES).forEach(fix => {
            if (fix.patterns) {
                // Múltiples patrones
                fix.patterns.forEach(pattern => {
                    if (content.match(pattern)) {
                        content = content.replace(pattern, fix.replacement);
                        fixed = true;
                    }
                });
            } else if (fix.pattern) {
                // Un solo patrón
                if (content.match(fix.pattern)) {
                    if (typeof fix.replacement === 'function') {
                        content = content.replace(fix.pattern, fix.replacement);
                    } else {
                        content = content.replace(fix.pattern, fix.replacement);
                    }
                    fixed = true;
                }
            }
        });
        
        // Agregar manejo de errores si no existe
        if (!content.includes('try') && content.includes('executeLegacy')) {
            content = content.replace(
                /async executeLegacy\(message, args\) \{/g,
                `async executeLegacy(message, args) {
        try {`
            );
            
            // Buscar el final de la función para agregar catch
            const lines = content.split('\n');
            let braceCount = 0;
            let endIndex = -1;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('async executeLegacy')) {
                    braceCount = 1;
                } else if (line.includes('{')) {
                    braceCount++;
                } else if (line.includes('}')) {
                    braceCount--;
                    if (braceCount === 0) {
                        endIndex = i;
                        break;
                    }
                }
            }
            
            if (endIndex !== -1) {
                const catchBlock = `        } catch (error) {
            console.error('Error en comando:', error);
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ Hubo un error al ejecutar este comando.')]
            });
        }`;
                
                lines.splice(endIndex, 0, catchBlock);
                content = lines.join('\n');
                fixed = true;
            }
        }
        
        if (fixed) {
            fs.writeFileSync(filePath, content);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error al arreglar ${filePath}:`, error.message);
        return false;
    }
}

function scanAndFixAllCommands() {
    const commandsDir = path.join(__dirname, 'commands');
    const results = {
        fixed: [],
        errors: [],
        total: 0,
        categories: {}
    };
    
    function scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Es una categoría
                const categoryName = item;
                results.categories[categoryName] = { fixed: [], errors: [] };
                scanDirectory(fullPath);
            } else if (item.endsWith('.js')) {
                results.total++;
                const category = path.dirname(fullPath).split(path.sep).pop();
                
                try {
                    if (fixCommandFile(fullPath)) {
                        results.fixed.push(path.basename(fullPath));
                        if (results.categories[category]) {
                            results.categories[category].fixed.push(path.basename(fullPath));
                        }
                    }
                } catch (error) {
                    results.errors.push({
                        file: path.basename(fullPath),
                        category: category,
                        error: error.message
                    });
                    if (results.categories[category]) {
                        results.categories[category].errors.push({
                            file: path.basename(fullPath),
                            error: error.message
                        });
                    }
                }
            }
        }
    }
    
    scanDirectory(commandsDir);
    return results;
}

// Ejecutar arreglos
console.log('🔧 Iniciando arreglos automáticos avanzados...\n');

const results = scanAndFixAllCommands();

console.log('📊 Resultados del arreglo automático avanzado:');
console.log(`• Comandos procesados: ${results.total}`);
console.log(`• Comandos arreglados: ${results.fixed.length}`);
console.log(`• Errores encontrados: ${results.errors.length}`);

if (results.fixed.length > 0) {
    console.log('\n✅ Comandos arreglados:');
    results.fixed.forEach(file => {
        console.log(`   • ${file}`);
    });
}

if (Object.keys(results.categories).length > 0) {
    console.log('\n📁 Resultados por categoría:');
    Object.entries(results.categories).forEach(([category, data]) => {
        if (data.fixed.length > 0 || data.errors.length > 0) {
            console.log(`\n   📂 ${category}:`);
            if (data.fixed.length > 0) {
                console.log(`      ✅ Arreglados: ${data.fixed.join(', ')}`);
            }
            if (data.errors.length > 0) {
                console.log(`      ❌ Errores: ${data.errors.length}`);
            }
        }
    });
}

if (results.errors.length > 0) {
    console.log('\n❌ Errores encontrados:');
    results.errors.forEach(error => {
        console.log(`   • ${error.file} (${error.category}): ${error.error}`);
    });
}

console.log('\n🎯 Próximos pasos recomendados:');
console.log('1. Probar los comandos arreglados');
console.log('2. Implementar versiones slash completas para comandos críticos');
console.log('3. Revisar comandos de economía y moderación avanzada');
console.log('4. Actualizar documentación y ejemplos de uso');
console.log('5. Crear tests para verificar funcionamiento');

console.log('\n💡 Comandos que requieren atención manual:');
console.log('• Comandos con lógica compleja (economía, tickets)');
console.log('• Comandos que dependen de otros sistemas');
console.log('• Comandos con validaciones específicas');

console.log(`\n📈 Progreso: ${Math.round((results.fixed.length / results.total) * 100)}% completado`); 