const { EmbedBuilder } = require("discord.js");
const { inspect } = require("util");

module.exports = {
    name: "restore",
    description: "Restores the server from a backup.",
    options: [
        {
            type: 3,
            name: "backup_id",
            description: "The ID of the backup to restore.",
            required: true,
        },
    ],
    async execute(interaction, db) {
        const guildId = interaction.guild.id;
        const backupId = interaction.options.getString("backup_id");

        const backupData = await db.get(`backup_${backupId}`);
        if (!backupData) {
            return interaction.reply("Backup not found.");
        }

        // Deleting all roles (except the @everyone role)
        const roles = interaction.guild.roles.cache.filter(
            (role) => role.id !== interaction.guild.id,
        );
        await Promise.all(roles.map((role) => role.delete()));

        // Deleting all channels
        const channels = interaction.guild.channels.cache;
        await Promise.all(channels.map((channel) => channel.delete()));

        // Deleting all emojis
        const emojis = interaction.guild.emojis.cache;
        await Promise.all(emojis.map((emoji) => emoji.delete()));

        // Deleting all stickers
        const stickers = interaction.guild.stickers.cache;
        await Promise.all(stickers.map((sticker) => sticker.delete()));

        // Restoring roles
        const rolePromises = backupData.roles.map((roleData) => {
            return interaction.guild.roles.create({
                name: roleData.name,
                color: roleData.color,
                permissions: roleData.permissions,
            });
        });
        await Promise.all(rolePromises);

        // Restoring channels
        const channelPromises = backupData.channels.map((channelData) => {
            return interaction.guild.channels.create(channelData.name, {
                type: channelData.type,
                permissionOverwrites: channelData.permissionOverwrites,
            });
        });
        await Promise.all(channelPromises);

        // Restoring emojis
        const emojiPromises = backupData.emojis.map((emojiData) => {
            return interaction.guild.emojis.create({
                attachment: `https://cdn.discordapp.com/emojis/${emojiData.id}.${emojiData.animated ? "gif" : "png"}`,
                name: emojiData.name,
            });
        });
        await Promise.all(emojiPromises);

        // Restoring stickers
        const stickerPromises = backupData.stickers.map((stickerData) => {
            return interaction.guild.stickers.create({
                name: stickerData.name,
                formatType: stickerData.formatType,
                attachment: `https://cdn.discordapp.com/stickers/${stickerData.id}.png`,
            });
        });
        await Promise.all(stickerPromises);

        await interaction.reply("Server restored successfully!");
    },
};
