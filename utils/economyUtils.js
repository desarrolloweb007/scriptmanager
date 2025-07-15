const fs = require('fs/promises');
const path = require('path');

// Rutas de archivos JSON
const ECON_CONFIG_PATH = path.join(__dirname, '../data/econ_config.json');
const CATEGORIES_PATH = path.join(__dirname, '../data/categories.json');
const SHOP_PATH = path.join(__dirname, '../data/shop.json');
const ECONOMY_PATH = path.join(__dirname, '../data/economy.json');
const INVENTORY_PATH = path.join(__dirname, '../data/inventory.json');
const COOLDOWNS_PATH = path.join(__dirname, '../data/cooldowns.json');

// Funciones para manejo de archivos JSON
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe o está vacío, retornar objeto vacío
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

// Funciones específicas para economía
async function getCurrencyName(guildId) {
    const config = await readJsonFile(ECON_CONFIG_PATH);
    return config[guildId] || 'monedas';
}

async function setCurrencyName(guildId, currencyName) {
    const config = await readJsonFile(ECON_CONFIG_PATH);
    config[guildId] = currencyName;
    return await writeJsonFile(ECON_CONFIG_PATH, config);
}

async function getUserBalance(userId, guildId) {
    const economy = await readJsonFile(ECONOMY_PATH);
    const guildEconomy = economy[guildId] || {};
    return guildEconomy[userId] || 0;
}

async function setUserBalance(userId, guildId, amount) {
    const economy = await readJsonFile(ECONOMY_PATH);
    if (!economy[guildId]) economy[guildId] = {};
    economy[guildId][userId] = amount;
    return await writeJsonFile(ECONOMY_PATH, economy);
}

async function addUserBalance(userId, guildId, amount) {
    const currentBalance = await getUserBalance(userId, guildId);
    return await setUserBalance(userId, guildId, currentBalance + amount);
}

async function removeUserBalance(userId, guildId, amount) {
    const currentBalance = await getUserBalance(userId, guildId);
    const newBalance = Math.max(0, currentBalance - amount);
    return await setUserBalance(userId, guildId, newBalance);
}

// Funciones para categorías
async function getCategories(guildId) {
    const categories = await readJsonFile(CATEGORIES_PATH);
    return categories[guildId] || {};
}

async function addCategory(guildId, name, description) {
    const categories = await readJsonFile(CATEGORIES_PATH);
    if (!categories[guildId]) categories[guildId] = {};
    
    if (categories[guildId][name]) {
        return { success: false, message: '❌ Ya existe una categoría con ese nombre.' };
    }
    
    categories[guildId][name] = description;
    const success = await writeJsonFile(CATEGORIES_PATH, categories);
    return { success, message: success ? '✅ Categoría agregada correctamente.' : '❌ Error al guardar la categoría.' };
}

// Funciones para tienda
async function getShopItems(guildId) {
    const shop = await readJsonFile(SHOP_PATH);
    return shop[guildId] || {};
}

async function addShopItem(guildId, name, category, roleId, price, stock) {
    const shop = await readJsonFile(SHOP_PATH);
    if (!shop[guildId]) shop[guildId] = {};
    
    if (shop[guildId][name]) {
        return { success: false, message: '❌ Ya existe un objeto con ese nombre en la tienda.' };
    }
    
    shop[guildId][name] = {
        category,
        roleId: roleId === 'none' ? null : roleId,
        price: parseInt(price),
        stock: parseInt(stock)
    };
    
    const success = await writeJsonFile(SHOP_PATH, shop);
    return { success, message: success ? '✅ Objeto agregado a la tienda.' : '❌ Error al guardar el objeto.' };
}

async function updateShopItem(guildId, name, field, value) {
    const shop = await readJsonFile(SHOP_PATH);
    if (!shop[guildId] || !shop[guildId][name]) {
        return { success: false, message: '❌ No se encontró el objeto en la tienda.' };
    }
    
    const validFields = ['category', 'roleId', 'price', 'stock'];
    if (!validFields.includes(field)) {
        return { success: false, message: '❌ Campo inválido. Campos válidos: category, roleId, price, stock' };
    }
    
    if (field === 'price' || field === 'stock') {
        value = parseInt(value);
        if (isNaN(value) || value < 0) {
            return { success: false, message: '❌ El valor debe ser un número positivo.' };
        }
    }
    
    shop[guildId][name][field] = value;
    const success = await writeJsonFile(SHOP_PATH, shop);
    return { success, message: success ? '✅ Objeto actualizado correctamente.' : '❌ Error al actualizar el objeto.' };
}

async function removeShopItem(guildId, name) {
    const shop = await readJsonFile(SHOP_PATH);
    if (!shop[guildId] || !shop[guildId][name]) {
        return { success: false, message: '❌ No se encontró el objeto en la tienda.' };
    }
    
    delete shop[guildId][name];
    const success = await writeJsonFile(SHOP_PATH, shop);
    return { success, message: success ? '✅ Objeto eliminado de la tienda.' : '❌ Error al eliminar el objeto.' };
}

// Funciones para inventario
async function getUserInventory(userId, guildId) {
    const inventory = await readJsonFile(INVENTORY_PATH);
    const guildInventory = inventory[guildId] || {};
    return guildInventory[userId] || [];
}

async function addToInventory(userId, guildId, itemName) {
    const inventory = await readJsonFile(INVENTORY_PATH);
    if (!inventory[guildId]) inventory[guildId] = {};
    if (!inventory[guildId][userId]) inventory[guildId][userId] = [];
    
    if (inventory[guildId][userId].includes(itemName)) {
        return { success: false, message: '❌ Ya tienes este objeto en tu inventario.' };
    }
    
    inventory[guildId][userId].push(itemName);
    return await writeJsonFile(INVENTORY_PATH, inventory);
}

// Funciones para cooldowns
async function getCooldown(userId, command) {
    const cooldowns = await readJsonFile(COOLDOWNS_PATH);
    const userCooldowns = cooldowns[userId] || {};
    return userCooldowns[command] || 0;
}

async function setCooldown(userId, command, timestamp) {
    const cooldowns = await readJsonFile(COOLDOWNS_PATH);
    if (!cooldowns[userId]) cooldowns[userId] = {};
    cooldowns[userId][command] = timestamp;
    return await writeJsonFile(COOLDOWNS_PATH, cooldowns);
}

// Funciones de utilidad
function formatNumber(number) {
    return number.toLocaleString('es-ES');
}

function getRandomAmount(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    // Archivos
    readJsonFile,
    writeJsonFile,
    
    // Economía
    getCurrencyName,
    setCurrencyName,
    getUserBalance,
    setUserBalance,
    addUserBalance,
    removeUserBalance,
    
    // Categorías
    getCategories,
    addCategory,
    
    // Tienda
    getShopItems,
    addShopItem,
    updateShopItem,
    removeShopItem,
    
    // Inventario
    getUserInventory,
    addToInventory,
    
    // Cooldowns
    getCooldown,
    setCooldown,
    
    // Utilidades
    formatNumber,
    getRandomAmount
};
