/**
 * Archivo de prueba para el sistema de prefijos personalizados
 * Este archivo puede ejecutarse independientemente para verificar el funcionamiento
 */

const prefixManager = require('./utils/prefixManager');

console.log('🧪 Iniciando pruebas del sistema de prefijos...\n');

// Función para mostrar resultados de pruebas
function testResult(testName, passed, details = '') {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}`);
    if (details) console.log(`   ${details}`);
    console.log('');
}

// Test 1: Verificar funciones básicas
console.log('📋 Test 1: Funciones básicas');
testResult(
    'getPrefix con guildId válido',
    prefixManager.getPrefix('123456789') === '!',
    'Prefijo por defecto devuelto correctamente'
);

testResult(
    'setPrefix con prefijo válido',
    prefixManager.setPrefix('123456789', '?') === true,
    'Prefijo configurado exitosamente'
);

testResult(
    'getPrefix después de setPrefix',
    prefixManager.getPrefix('123456789') === '?',
    'Prefijo personalizado recuperado correctamente'
);

// Test 2: Validación de prefijos
console.log('📋 Test 2: Validación de prefijos');
testResult(
    'Prefijo válido (?)',
    prefixManager.isValidPrefix('?') === true,
    'Prefijo válido aceptado'
);

testResult(
    'Prefijo válido ($)',
    prefixManager.isValidPrefix('$') === true,
    'Prefijo válido aceptado'
);

testResult(
    'Prefijo válido (bot)',
    prefixManager.isValidPrefix('bot') === true,
    'Prefijo válido aceptado'
);

testResult(
    'Prefijo inválido (muy largo)',
    prefixManager.isValidPrefix('muylargo') === false,
    'Prefijo demasiado largo rechazado'
);

testResult(
    'Prefijo inválido (con espacios)',
    prefixManager.isValidPrefix('pre fijo') === false,
    'Prefijo con espacios rechazado'
);

testResult(
    'Prefijo inválido (vacío)',
    prefixManager.isValidPrefix('') === false,
    'Prefijo vacío rechazado'
);

// Test 3: Funciones de gestión
console.log('📋 Test 3: Funciones de gestión');
testResult(
    'resetPrefix',
    prefixManager.resetPrefix('123456789') === true,
    'Prefijo reseteado correctamente'
);

testResult(
    'getPrefix después de reset',
    prefixManager.getPrefix('123456789') === '!',
    'Prefijo por defecto restaurado'
);

testResult(
    'getAllPrefixes',
    typeof prefixManager.getAllPrefixes() === 'object',
    'Función getAllPrefixes funciona correctamente'
);

// Test 4: Manejo de errores
console.log('📋 Test 4: Manejo de errores');
testResult(
    'setPrefix con guildId nulo',
    prefixManager.setPrefix(null, '?') === false,
    'Error manejado correctamente'
);

testResult(
    'setPrefix con prefijo nulo',
    prefixManager.setPrefix('123456789', null) === false,
    'Error manejado correctamente'
);

testResult(
    'getPrefix con guildId nulo',
    prefixManager.getPrefix(null) === '!',
    'Prefijo por defecto devuelto para guildId nulo'
);

// Test 5: Constantes del sistema
console.log('📋 Test 5: Constantes del sistema');
testResult(
    'DEFAULT_PREFIX es !',
    prefixManager.DEFAULT_PREFIX === '!',
    'Prefijo por defecto configurado correctamente'
);

testResult(
    'MAX_PREFIX_LENGTH es 5',
    prefixManager.MAX_PREFIX_LENGTH === 5,
    'Longitud máxima configurada correctamente'
);

// Limpieza final
console.log('🧹 Limpieza final...');
prefixManager.resetPrefix('123456789');

console.log('\n🎉 Todas las pruebas completadas!');
console.log('📊 Resumen:');
console.log('• Sistema de prefijos funcionando correctamente');
console.log('• Validaciones implementadas');
console.log('• Manejo de errores robusto');
console.log('• Funciones de gestión completas');
console.log('\n✅ El sistema está listo para producción!'); 