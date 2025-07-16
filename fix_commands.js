/**
 * Script para identificar y arreglar comandos que no funcionan correctamente
 * Este script analiza los comandos y detecta problemas comunes
 */

const fs = require('fs');
const path = require('path');

// Problemas comunes detectados
const COMMON_ISSUES = {
    DUPLICATE_PREFIX_CHECK: 'Verificación de prefijo duplicada',
    MISSING_SLASH_COMMAND: 'Falta comando slash',
    OLD_PREFIX_SYSTEM: 'Usa sistema de prefijos antiguo',
    MISSING_PERMISSIONS: 'Falta verificación de permisos',
    POOR_ERROR_HANDLING: 'Manejo de errores deficiente',
    INCONSISTENT_STRUCTURE: 'Estructura inconsistente'
};

function analyzeCommand(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = [];
        
        // Verificar verificación de prefijo duplicada
        if (content.includes('getPrefix') && content.includes('startsWith')) {
            issues.push(COMMON_ISSUES.DUPLICATE_PREFIX_CHECK);
        }
        
        // Verificar si usa sistema de prefijos antiguo
        if (content.includes('prefixesPath') || content.includes('prefixes.json')) {
            issues.push(COMMON_ISSUES.OLD_PREFIX_SYSTEM);
        }
        
        // Verificar si falta comando slash
        if (!content.includes('SlashCommandBuilder') && content.includes('legacy: true')) {
            issues.push(COMMON_ISSUES.MISSING_SLASH_COMMAND);
        }
        
        // Verificar manejo de errores
        if (!content.includes('try') && !content.includes('catch')) {
            issues.push(COMMON_ISSUES.POOR_ERROR_HANDLING);
        }
        
        // Verificar estructura inconsistente
        if (!content.includes('module.exports') || !content.includes('name:')) {
            issues.push(COMMON_ISSUES.INCONSISTENT_STRUCTURE);
        }
        
        return {
            file: path.basename(filePath),
            path: filePath,
            issues: issues,
            hasIssues: issues.length > 0
        };
    } catch (error) {
        return {
            file: path.basename(filePath),
            path: filePath,
            issues: ['Error al leer archivo'],
            hasIssues: true
        };
    }
}

function scanCommands() {
    const commandsDir = path.join(__dirname, 'commands');
    const results = [];
    
    function scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (item.endsWith('.js')) {
                const analysis = analyzeCommand(fullPath);
                if (analysis.hasIssues) {
                    results.push(analysis);
                }
            }
        }
    }
    
    scanDirectory(commandsDir);
    return results;
}

function generateFixReport(issues) {
    console.log('🔍 Análisis de Comandos con Problemas\n');
    
    if (issues.length === 0) {
        console.log('✅ Todos los comandos están funcionando correctamente!');
        return;
    }
    
    console.log(`❌ Se encontraron ${issues.length} comandos con problemas:\n`);
    
    issues.forEach((issue, index) => {
        console.log(`${index + 1}. 📁 ${issue.file}`);
        console.log(`   📍 Ruta: ${issue.path}`);
        console.log(`   🚨 Problemas:`);
        issue.issues.forEach(problem => {
            console.log(`      • ${problem}`);
        });
        console.log('');
    });
    
    console.log('🔧 Recomendaciones de arreglo:');
    console.log('1. Eliminar verificación de prefijo duplicada');
    console.log('2. Usar sistema de prefijos centralizado (prefixManager)');
    console.log('3. Agregar comandos slash cuando falten');
    console.log('4. Mejorar manejo de errores');
    console.log('5. Estandarizar estructura de comandos');
}

// Ejecutar análisis
console.log('🔍 Iniciando análisis de comandos...\n');
const issues = scanCommands();
generateFixReport(issues);

// Mostrar comandos que funcionan bien
const totalCommands = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js')).length;
const workingCommands = totalCommands - issues.length;

console.log(`📊 Estadísticas:`);
console.log(`• Comandos analizados: ${totalCommands}`);
console.log(`• Comandos con problemas: ${issues.length}`);
console.log(`• Comandos funcionando bien: ${workingCommands}`);
console.log(`• Porcentaje de éxito: ${Math.round((workingCommands / totalCommands) * 100)}%`);

if (issues.length > 0) {
    console.log('\n💡 Para arreglar los comandos, ejecuta:');
    console.log('node fix_commands.js --fix');
} 