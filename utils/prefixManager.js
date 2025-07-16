const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const PREFIXES_PATH = path.join(DATA_DIR, 'prefixes.json');
if (!fs.existsSync(PREFIXES_PATH)) {
    fs.writeFileSync(PREFIXES_PATH, '{}');
}

let prefixes = {};
function loadPrefixes() {
    try {
        const data = fs.readFileSync(PREFIXES_PATH, 'utf8');
        prefixes = JSON.parse(data);
    } catch {
        prefixes = {};
    }
}
function savePrefixes() {
    try {
        fs.writeFileSync(PREFIXES_PATH, JSON.stringify(prefixes, null, 2));
    } catch {}
}
function getPrefix(guildId) {
    if (!prefixes || typeof prefixes !== 'object') loadPrefixes();
    return (prefixes[guildId] && typeof prefixes[guildId] === 'string') ? prefixes[guildId] : '!';
}
function setPrefix(guildId, prefix) {
    prefixes[guildId] = prefix;
    savePrefixes();
}
// Cargar al inicio
loadPrefixes();
module.exports = { getPrefix, setPrefix, loadPrefixes, savePrefixes }; 