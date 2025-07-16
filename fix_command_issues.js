/**
 * Script automatizado para arreglar problemas comunes en comandos
 * Este script corrige automáticamente los problemas detectados
 */

const fs = require('fs');
const path = require('path');

// Problemas y sus soluciones
const FIXES = {
    DUPLICATE_PREFIX_CHECK: {
        pattern: /const prefix = await getPrefix\(message\.guild\.id\);\s*if \(!message\.content\.startsWith\(prefix \+ '[^']+'\)\) return;/g,
        replacement: '// Verificación de prefijo manejada por el middleware'
    },
    OLD_PREFIX_SYSTEM: {
        pattern: /const prefixesPath = path\.join\(__dirname, '\.\.\/\.\.\/data\/prefixes\.json'\);\s*async function getPrefix\(guildId\) \{[\s\S]*?return '!';[\s\S]*?\}/g,
        replacement: '// Sistema de prefijos centralizado manejado por prefixManager'
    },
    MISSING_SLASH_COMMAND: {
        pattern: /data: \{ name: '[^']+' \},/g,
        replacement: (match, commandName) => {
            return `data: new SlashCommandBuilder()
        .setName('${commandName}')
        .setDescription('Comando ${commandName}'),
    async execute(interaction) {
        // Implementar lógica del comando slash aquí
        await interaction.reply({ content: 'Comando en desarrollo', ephemeral: true });
    },`;
        }
    }
};

function fixCommand(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let fixed = false;
        
        // Arreglar verificación de prefijo duplicada
        if (content.includes('getPrefix') && content.includes('startsWith')) {
            content = content.replace(FIXES.DUPLICATE_PREFIX_CHECK.pattern, FIXES.DUPLICATE_PREFIX_CHECK.replacement);
            fixed = true;
        }
        
        // Arreglar sistema de prefijos antiguo
        if (content.includes('prefixesPath')) {
            content = content.replace(FIXES.OLD_PREFIX_SYSTEM.pattern, FIXES.OLD_PREFIX_SYSTEM.replacement);
            fixed = true;
        }
        
        // Agregar manejo de errores básico si no existe
        if (!content.includes('try') && !content.includes('catch')) {
            // Agregar try-catch básico en funciones principales
            content = content.replace(
                /async executeLegacy\(message, args\) \{/g,
                `async executeLegacy(message, args) {
        try {`
            );
            content = content.replace(
                /await message\.reply\(/g,
                `} catch (error) {
            console.error('Error en comando:', error);
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ Hubo un error al ejecutar este comando.')]
            });
            return;
        }
        await message.reply(`
            );
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

function scanAndFixCommands() {
    const commandsDir = path.join(__dirname, 'commands');
    const results = {
        fixed: [],
        errors: [],
        total: 0
    };
    
    function scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (item.endsWith('.js')) {
                results.total++;
                try {
                    if (fixCommand(fullPath)) {
                        results.fixed.push(path.basename(fullPath));
                    }
                } catch (error) {
                    results.errors.push({
                        file: path.basename(fullPath),
                        error: error.message
                    });
                }
            }
        }
    }
    
    scanDirectory(commandsDir);
    return results;
}

// Ejecutar arreglos
console.log('🔧 Iniciando arreglos automáticos de comandos...\n');

const results = scanAndFixCommands();

console.log('📊 Resultados del arreglo automático:');
console.log(`• Comandos procesados: ${results.total}`);
console.log(`• Comandos arreglados: ${results.fixed.length}`);
console.log(`• Errores encontrados: ${results.errors.length}`);

if (results.fixed.length > 0) {
    console.log('\n✅ Comandos arreglados:');
    results.fixed.forEach(file => {
        console.log(`   • ${file}`);
    });
}

if (results.errors.length > 0) {
    console.log('\n❌ Errores encontrados:');
    results.errors.forEach(error => {
        console.log(`   • ${error.file}: ${error.error}`);
    });
}

console.log('\n💡 Comandos que requieren arreglo manual:');
console.log('• Comandos sin versión slash: Necesitan implementación completa');
console.log('• Comandos con lógica compleja: Requieren revisión manual');
console.log('• Comandos de economía: Necesitan adaptación al sistema centralizado');

console.log('\n🎯 Próximos pasos recomendados:');
console.log('1. Probar los comandos arreglados');
console.log('2. Implementar versiones slash faltantes');
console.log('3. Revisar comandos de economía');
console.log('4. Actualizar documentación'); 