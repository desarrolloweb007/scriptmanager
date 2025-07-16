const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Utilidad para cargar comandos y agrupar por categoría
function getCommandsByCategory(client) {
    const categories = {};
    client.commands.forEach(cmd => {
        const cat = cmd.category || 'Otros';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd);
    });
    return categories;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Muestra todos los comandos disponibles del bot'),
    async execute(interaction) {
        const categories = getCommandsByCategory(interaction.client);
        const categoryNames = Object.keys(categories);
        // Primer categoría por defecto
        const defaultCat = categoryNames[0];
        const embed = buildHelpEmbed(categories, defaultCat);
        const select = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('Selecciona una categoría')
            .addOptions(categoryNames.map(cat => ({ label: cat, value: cat })));
        const row = new ActionRowBuilder().addComponents(select);
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
    async handleSelect(interaction) {
        const categories = getCommandsByCategory(interaction.client);
        const cat = interaction.values[0];
        const embed = buildHelpEmbed(categories, cat);
        await interaction.update({ embeds: [embed] });
    }
};

function buildHelpEmbed(categories, cat) {
    const embed = new EmbedBuilder()
        .setColor('#7289da')
        .setTitle(`📚 Ayuda: ${cat}`)
        .setDescription('Comandos disponibles:');
    for (const cmd of categories[cat]) {
        embed.addFields({
            name: `/${cmd.data ? cmd.data.name : cmd.name}`,
            value: `${cmd.data ? cmd.data.description : cmd.description || 'Sin descripción.'}`,
            inline: false
        });
    }
    return embed;
} 