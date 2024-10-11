const { PermissionsBitField } = require("discord.js");

async function lockdown(guild, db) {
    const roles = guild.roles.cache.filter(
        (role) =>
            !role.managed &&
            role.editable &&
            !role.permissions.has(PermissionsBitField.Flags.Administrator),
    );
    const channels = guild.channels.cache.filter((channel) =>
        channel.isTextBased(),
    );

    let permissionsBackup = {};

    try {
        channels.forEach((channel) => {
            permissionsBackup[channel.id] = {};

            roles.forEach((role) => {
                permissionsBackup[channel.id][role.id] = channel
                    .permissionsFor(role)
                    .toArray();

                channel.permissionOverwrites.edit(role, {
                    ViewChannel: false,
                    SendMessages: false,
                    Connect: false,
                });
            });
        });

        await db.set(`permissionsBackup.${guild.id}`, permissionsBackup);
        return "Lockdown has been applied. All roles and channels are now hidden.";
    } catch (error) {
        console.error("Error applying lockdown:", error);
        throw new Error("An error occurred while applying the lockdown.");
    }
}

module.exports = lockdown;
