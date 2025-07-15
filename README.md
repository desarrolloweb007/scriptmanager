# 🤖 Bot de Gestión de Roles para Discord

Un bot de Discord completo para la gestión de roles con funcionalidades avanzadas de autoasignación y comandos interactivos.

## ✨ Características

- **Asignación de roles**: Comando `[prefijo]rol @usuario RolEjemplo`
- **Remoción de roles**: Comando `[prefijo]removerol @usuario RolEjemplo`
- **Lista de roles**: Comando `[prefijo]roles` para ver todos los roles disponibles
- **Autoasignación**: Sistema de botones para autoasignación de roles
- **Prefijo personalizable**: Comando `[prefijo]prefix` para cambiar el prefijo por servidor
- **Sistema de ayuda**: Comando `[prefijo]help` con información detallada de comandos
- **Información del bot**: Comando `[prefijo]info` con estadísticas y detalles del bot
- **Comandos slash**: Soporte completo para comandos slash de Discord
- **Verificación de permisos**: Seguridad completa con verificación de permisos
- **Embeds profesionales**: Respuestas visuales atractivas
- **Manejo de errores**: Sistema robusto de manejo de errores

## 🚀 Instalación

### Prerrequisitos

- Node.js 16.0.0 o superior
- Una aplicación de Discord con bot configurado
- Permisos de "Gestionar Roles" en el servidor

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd discord-role-bot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Token del bot de Discord
DISCORD_TOKEN=tu_token_aqui

# ID del cliente del bot (necesario para registrar comandos)
CLIENT_ID=tu_client_id_aqui

# ID del servidor (opcional, para desarrollo)
GUILD_ID=tu_guild_id_aqui
```

### 4. Registrar comandos slash

```bash
node deploy-commands.js
```

### 5. Ejecutar el bot

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📋 Comandos Disponibles

### Comandos Legacy (con prefijo dinámico)

| Comando | Descripción | Uso |
|---------|-------------|-----|
| `[prefijo]rol` | Asigna un rol a un usuario | `[prefijo]rol @usuario RolEjemplo` |
| `[prefijo]removerol` | Remueve un rol de un usuario | `[prefijo]removerol @usuario RolEjemplo` |
| `[prefijo]roles` | Lista todos los roles disponibles | `[prefijo]roles` |
| `[prefijo]autorol` | Crea panel de autoasignación | `[prefijo]autorol "Título" "Descripción" @rol1 @rol2` |
| `[prefijo]prefix` | Configura el prefijo del bot | `[prefijo]prefix [nuevo_prefijo]` |
| `[prefijo]help` | Muestra todos los comandos | `[prefijo]help [comando]` |
| `[prefijo]info` | Información del bot ScriptManager | `[prefijo]info` |

### Comandos Slash

| Comando | Descripción | Permisos Requeridos |
|---------|-------------|-------------------|
| `/rol` | Asigna un rol a un usuario | Gestionar Roles |
| `/removerol` | Remueve un rol de un usuario | Gestionar Roles |
| `/roles` | Lista todos los roles disponibles | Todos |
| `/autorol` | Crea panel de autoasignación | Gestionar Roles |
| `/prefix` | Configura el prefijo del bot | Gestionar Servidor |
| `/help` | Muestra todos los comandos | Todos |
| `/info` | Información del bot ScriptManager | Todos |

## 🔧 Configuración del Bot en Discord

### 1. Crear una aplicación en Discord

1. Ve a [Discord Developer Portal](https://discord.com/developers/applications)
2. Haz clic en "New Application"
3. Dale un nombre a tu aplicación

### 2. Crear el bot

1. Ve a la sección "Bot" en el menú lateral
2. Haz clic en "Add Bot"
3. Copia el token del bot (lo necesitarás para el `.env`)

### 3. Configurar permisos

1. En la sección "Bot", habilita los siguientes permisos:
   - `Manage Roles`
   - `Send Messages`
   - `Use Slash Commands`
   - `Embed Links`

2. En "Privileged Gateway Intents", habilita:
   - `Server Members Intent`
   - `Message Content Intent`

### 4. Invitar el bot al servidor

1. Ve a la sección "OAuth2" > "URL Generator"
2. Selecciona los scopes: `bot` y `applications.commands`
3. Selecciona los permisos necesarios
4. Copia la URL generada y úsala para invitar el bot

## 🚀 Despliegue en Render

### 1. Preparar el proyecto

El proyecto está configurado para Render con variables de entorno optimizadas.

### 2. Conectar con Render

1. Ve a [Render](https://render.com)
2. Crea una nueva cuenta o inicia sesión
3. Haz clic en "New +" y selecciona "Web Service"
4. Conecta tu repositorio de GitHub

### 3. Configurar el servicio

- **Name**: `scriptmanager-bot` (o el nombre que prefieras)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 4. Configurar variables de entorno

En la sección "Environment Variables", agrega:

- `DISCORD_TOKEN`: Token de tu bot de Discord
- `CLIENT_ID`: ID de tu aplicación de Discord
- `GUILD_ID`: (Opcional) ID del servidor para desarrollo

### 5. Desplegar

Render desplegará automáticamente tu bot y lo mantendrá actualizado con cada push.

## 🚀 Despliegue en Railway (Alternativa)

### 1. Preparar el proyecto

El proyecto ya está configurado para Railway con el archivo `railway.json`.

### 2. Conectar con Railway

1. Ve a [Railway](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Railway detectará automáticamente la configuración

### 3. Configurar variables de entorno

En Railway, configura las siguientes variables:

- `DISCORD_TOKEN`: Token de tu bot
- `CLIENT_ID`: ID de tu aplicación de Discord
- `GUILD_ID`: (Opcional) ID del servidor para desarrollo

### 4. Desplegar

Railway desplegará automáticamente tu bot cuando hagas push a la rama principal.

## 🛡️ Seguridad

### Verificaciones implementadas:

- ✅ Verificación de permisos del usuario que ejecuta comandos
- ✅ Verificación de permisos del bot
- ✅ Verificación de jerarquía de roles
- ✅ Prevención de asignación de roles superiores al bot
- ✅ Manejo de errores robusto
- ✅ Respuestas ephemeral para comandos sensibles

### Permisos requeridos:

- **Bot**: `Manage Roles`, `Send Messages`, `Use Slash Commands`
- **Usuarios**: `Manage Roles` (para comandos de gestión)

## 📁 Estructura del Proyecto

```
discord-role-bot/
├── commands/           # Comandos del bot
│   ├── rol.js         # Asignación de roles
│   ├── removerol.js   # Remoción de roles
│   ├── roles.js       # Lista de roles
│   ├── autorol.js     # Autoasignación
│   ├── prefix.js      # Configuración de prefijo
│   ├── help.js        # Sistema de ayuda
│   └── info.js        # Información del bot
├── index.js           # Archivo principal
├── deploy-commands.js # Script para registrar comandos
├── package.json       # Dependencias
├── railway.json       # Configuración de Railway
├── env.example        # Variables de entorno de ejemplo
└── README.md         # Este archivo
```

## 🔍 Troubleshooting

### El bot no responde a comandos

1. Verifica que el token sea correcto
2. Asegúrate de que el bot esté en línea
3. Verifica los permisos del bot en el servidor

### Los comandos slash no aparecen

1. Ejecuta `node deploy-commands.js`
2. Verifica que el `CLIENT_ID` sea correcto
3. Espera hasta 1 hora para que los comandos aparezcan globalmente

### Error de permisos

1. Verifica que el bot tenga el rol "Gestionar Roles"
2. Asegúrate de que el rol del bot esté por encima de los roles que quiere gestionar
3. Verifica que el usuario tenga permisos de gestión de roles

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de troubleshooting
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el bot tenga los permisos necesarios
4. Revisa los logs del bot para errores específicos

---

**¡Disfruta gestionando roles de forma fácil y segura! 🎉** 