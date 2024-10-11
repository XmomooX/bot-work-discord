const { EmbedBuilder } = require("discord.js");
const { inspect } = require("util");

module.exports = {
    name: "fullbackup",
    description: "owner's only",
    async execute(interaction, db) {
        const guildId = interaction.guild.id;
        const guild = interaction.guild;

        // Collecting channels and their permissions
        const channels = await Promise.all(
            guild.channels.cache.map(async (channel) => {
                return {
                    id: channel.id,
                    type: channel.type,
                    name: channel.name,
                    permissionOverwrites:
                        channel.permissionOverwrites.cache.map((perm) => ({
                            id: perm.id,
                            type: perm.type,
                            allow: perm.allow.toArray(),
                            deny: perm.deny.toArray(),
                        })),
                };
            }),
        );

        // Collecting roles
        const roles = guild.roles.cache.map((role) => ({
            id: role.id,
            name: role.name,
            color: role.color,
            permissions: role.permissions.toArray(),
        }));

        // Collecting emojis
        const emojis = guild.emojis.cache.map((emoji) => ({
            id: emoji.id,
            name: emoji.name,
            animated: emoji.animated,
        }));

        // Collecting stickers
        const stickers = guild.stickers.cache.map((sticker) => ({
            id: sticker.id,
            name: sticker.name,
            formatType: sticker.formatType,
        }));

        // Storing the backup in the database
        const backupId = `${guildId}-${Date.now()}`;
        await db.set(`backup_${backupId}`, {
            channels,
            roles,
            emojis,
            stickers,
        });

        await interaction.reply(`Backup created! Backup ID: \`${backupId}\``);
    },
};
