# Sistema de Prefijos Personalizados - ScriptManager Bot

## 📋 Descripción General

El sistema de prefijos personalizados permite a cada servidor configurar su propio prefijo para los comandos legacy (texto). Esto proporciona flexibilidad y personalización para diferentes comunidades.

## 🏗️ Arquitectura del Sistema

### Archivos Principales

1. **`utils/prefixManager.js`** - Núcleo del sistema
2. **`commands/setprefix.js`** - Comando para cambiar prefijos
3. **`commands/prefix.js`** - Comando para ver el prefijo actual
4. **`commands/help.js`** - Comando de ayuda adaptado al prefijo
5. **`data/prefixes.json`** - Almacenamiento de prefijos por servidor

### Funciones Principales

#### `prefixManager.js`
- `getPrefix(guildId)` - Obtiene el prefijo configurado para un servidor
- `setPrefix(guildId, prefix)` - Establece un nuevo prefijo
- `resetPrefix(guildId)` - Restaura el prefijo por defecto
- `isValidPrefix(prefix)` - Valida si un prefijo es válido
- `getAllPrefixes()` - Obtiene todos los prefijos configurados

## 🔧 Configuración

### Prefijo por Defecto
- **Valor**: `!`
- **Uso**: Cuando un servidor no tiene prefijo configurado

### Límites de Validación
- **Longitud máxima**: 5 caracteres
- **Caracteres prohibidos**: Espacios, saltos de línea, tabulaciones
- **Permisos requeridos**: `ADMINISTRATOR`

## 📝 Comandos Disponibles

### `!setprefix <nuevo_prefijo>`
**Descripción**: Cambia el prefijo del servidor
**Permisos**: Solo administradores
**Ejemplos**:
```
!setprefix ?
!setprefix $
!setprefix bot
```

### `!prefix`
**Descripción**: Muestra el prefijo actual del servidor
**Permisos**: Todos los usuarios
**Información mostrada**:
- Prefijo actual
- Estado (por defecto/personalizado)
- Instrucciones de uso

### `!help`
**Descripción**: Muestra todos los comandos disponibles
**Características**:
- Lista organizada por categorías
- Usa el prefijo dinámico del servidor
- Información del sistema

## 🔄 Flujo de Funcionamiento

### 1. Detección de Comandos
```javascript
// En index.js - Evento MessageCreate
const currentPrefix = prefixManager.getPrefix(message.guild.id);
if (!message.content.startsWith(currentPrefix)) return;
```

### 2. Validación de Prefijos
```javascript
// Validaciones implementadas
- Longitud máxima: 5 caracteres
- No espacios ni caracteres especiales
- Solo administradores pueden cambiar
```

### 3. Almacenamiento
```json
// data/prefixes.json
{
  "guildId1": "?",
  "guildId2": "$",
  "guildId3": "bot"
}
```

## 🛡️ Características de Seguridad

### Validación Robusta
- Verificación de permisos de administrador
- Validación de formato de prefijos
- Manejo de errores de archivo JSON corrupto
- Recarga automática de configuración

### Manejo de Errores
- Archivo JSON corrupto → Reinicio automático
- Prefijos inválidos → Rechazo con explicación
- Permisos insuficientes → Mensaje informativo
- Errores de escritura → Logs detallados

## 📊 Ventajas del Sistema

### Para Administradores
- **Flexibilidad**: Cada servidor puede tener su propio prefijo
- **Personalización**: Adaptación a la cultura del servidor
- **Control**: Solo administradores pueden cambiar prefijos

### Para Usuarios
- **Claridad**: Saben exactamente qué prefijo usar
- **Consistencia**: Mismo prefijo en todo el servidor
- **Facilidad**: Comandos intuitivos con el prefijo configurado

### Para Desarrolladores
- **Escalabilidad**: Sistema fácil de mantener y extender
- **Robustez**: Manejo completo de errores
- **Documentación**: Código bien documentado y estructurado

## 🔧 Mantenimiento

### Archivos de Configuración
- `data/prefixes.json` - Almacena prefijos por servidor
- Se crea automáticamente si no existe
- Formato JSON válido con respaldo automático

### Logs del Sistema
```
✅ Prefijo actualizado para guildId: ?
✅ Prefijo reseteado para guildId al valor por defecto
❌ Error al cargar prefijos: [error]
```

## 🚀 Uso en Producción

### Configuración Inicial
1. El bot se inicia con prefijo por defecto `!`
2. Los administradores pueden cambiar el prefijo con `!setprefix <nuevo>`
3. Los cambios son inmediatos y no requieren reinicio

### Monitoreo
- Verificar logs de cambios de prefijos
- Monitorear archivo `prefixes.json` para integridad
- Revisar errores de permisos o validación

## 📈 Estadísticas

### Métricas del Sistema
- **Servidores con prefijo personalizado**: Contador en logs
- **Cambios de prefijo**: Registro de modificaciones
- **Errores de validación**: Logs de intentos fallidos

### Optimizaciones
- Carga lazy de prefijos (solo cuando se necesitan)
- Validación en tiempo real
- Respuesta inmediata a cambios

## 🔮 Futuras Mejoras

### Funcionalidades Planificadas
- [ ] Backup automático de prefijos
- [ ] Estadísticas de uso por prefijo
- [ ] Migración de prefijos entre servidores
- [ ] Sistema de alias de comandos

### Integraciones
- [ ] Dashboard web para gestión
- [ ] API REST para administración
- [ ] Notificaciones de cambios de prefijo

---

**Desarrollado para ScriptManager Bot**  
**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024 