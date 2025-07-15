const fs = require('fs/promises');
const path = require('path');

const PERMISSIONS_PATH = path.join(__dirname, '../data/permissions.json');

// Funciones para manejo de archivos JSON
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error escribiendo archivo ${filePath}:`, error);
        return false;
    }
}

// Funciones para permisos de tienda
async function getShopAdminRole(guildId) {
    const permissions = await readJsonFile(PERMISSIONS_PATH);
    return permissions[guildId] || null;
}

async function setShopAdminRole(guildId, roleId) {
    const permissions = await readJsonFile(PERMISSIONS_PATH);
    permissions[guildId] = roleId;
    return await writeJsonFile(PERMISSIONS_PATH, permissions);
}

async function checkShopPermission(member) {
    const adminRoleId = await getShopAdminRole(member.guild.id);
    
    // Si no hay rol configurado, solo administradores pueden usar
    if (!adminRoleId) {
        return member.permissions.has('Administrator');
    }
    
    // Verificar si el usuario tiene el rol administrador
    return member.roles.cache.has(adminRoleId) || member.permissions.has('Administrator');
}

// Funciones para validación de roles
function isValidRoleId(roleId) {
    return /^\d{17,19}$/.test(roleId);
}

async function validateRole(guild, roleId) {
    if (!isValidRoleId(roleId)) {
        return { valid: false, message: '❌ ID de rol inválido.' };
    }
    
    const role = guild.roles.cache.get(roleId);
    if (!role) {
        return { valid: false, message: '❌ No se encontró el rol especificado.' };
    }
    
    // Verificar que el bot pueda gestionar el rol
    if (role.position >= guild.members.me.roles.highest.position) {
        return { valid: false, message: '❌ No puedo gestionar este rol porque es igual o superior a mi rol más alto.' };
    }
    
    return { valid: true, role };
}

// Funciones para validación de permisos del bot
function checkBotPermissions(guild) {
    const missingPermissions = [];
    
    if (!guild.members.me.permissions.has('ManageRoles')) {
        missingPermissions.push('Gestionar Roles');
    }
    
    if (!guild.members.me.permissions.has('SendMessages')) {
        missingPermissions.push('Enviar Mensajes');
    }
    
    if (!guild.members.me.permissions.has('EmbedLinks')) {
        missingPermissions.push('Incrustar Enlaces');
    }
    
    return {
        hasAllPermissions: missingPermissions.length === 0,
        missingPermissions
    };
}

// Funciones para validación de usuarios
function validateUser(user) {
    if (!user) {
        return { valid: false, message: '❌ Usuario no encontrado.' };
    }
    
    if (user.bot) {
        return { valid: false, message: '❌ No puedes interactuar con bots.' };
    }
    
    return { valid: true, user };
}

// Funciones para validación de cantidades
function validateAmount(amount) {
    const numAmount = parseInt(amount);
    
    if (isNaN(numAmount)) {
        return { valid: false, message: '❌ La cantidad debe ser un número válido.' };
    }
    
    if (numAmount <= 0) {
        return { valid: false, message: '❌ La cantidad debe ser mayor a 0.' };
    }
    
    if (numAmount > 999999999) {
        return { valid: false, message: '❌ La cantidad es demasiado alta.' };
    }
    
    return { valid: true, amount: numAmount };
}

// Funciones para validación de precios
function validatePrice(price) {
    const numPrice = parseInt(price);
    
    if (isNaN(numPrice)) {
        return { valid: false, message: '❌ El precio debe ser un número válido.' };
    }
    
    if (numPrice < 0) {
        return { valid: false, message: '❌ El precio no puede ser negativo.' };
    }
    
    if (numPrice > 999999999) {
        return { valid: false, message: '❌ El precio es demasiado alto.' };
    }
    
    return { valid: true, price: numPrice };
}

// Funciones para validación de stock
function validateStock(stock) {
    const numStock = parseInt(stock);
    
    if (isNaN(numStock)) {
        return { valid: false, message: '❌ El stock debe ser un número válido.' };
    }
    
    if (numStock < 0) {
        return { valid: false, message: '❌ El stock no puede ser negativo.' };
    }
    
    if (numStock > 999999) {
        return { valid: false, message: '❌ El stock es demasiado alto.' };
    }
    
    return { valid: true, stock: numStock };
}

module.exports = {
    // Permisos de tienda
    getShopAdminRole,
    setShopAdminRole,
    checkShopPermission,
    
    // Validación de roles
    isValidRoleId,
    validateRole,
    
    // Validación de permisos del bot
    checkBotPermissions,
    
    // Validación de usuarios
    validateUser,
    
    // Validación de cantidades
    validateAmount,
    validatePrice,
    validateStock
};
