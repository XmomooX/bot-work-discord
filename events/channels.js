// channel.js
const db = require("../app").database;
const Client = require("../app").Client;
const isTrusted = require("../functions/isTrusted");
const isOwner = require("../functions/isOwner");
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require("discord.js");
const lockdown = require("../functions/lockdown");

Client.on("channelCreate", async (channel) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if ((await db.get(`state.${channel.guild.id}`)) == "danger")
        return lockdown(channel.guild, db);
    await db.set(`state.${channel.id}`, "stable");

    const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1 });
    const channelLog = fetchedLogs.entries.find((log) => log.action === 10);

    if (channelLog) {
        const { executor } = channelLog;
        if (executor.bot) return;
        const guildMember = channel.guild.members.cache.get(executor.id);

        if (!guildMember) {
            console.log("Executor is not a member of the guild.");
            return;
        }

        // Fetch the default limit for channel creation
        const channelCreateLimit =
            (await db.get(`defaultLimits.channelcreate`)) || 0;

        if (channelCreateLimit > 0) {
            // Log the action
            await db.set(
                `limits.${executor.id}.actions.channelcreate`,
                channelCreateLimit - 1,
            );

            const remaining = channelCreateLimit - 1;
            executor.send(
                `You have ${remaining} more times to create a channel.`,
            );

            // Also send a log message if limits channel exists
            const limitsChannelId = await db.get(
                `limitschannel.${channel.guild.id}`,
            );
            const limitsChannel =
                channel.guild.channels.cache.get(limitsChannelId);
            if (limitsChannel) {
                limitsChannel.send(
                    `${executor.tag} has ${remaining} remaining actions for creating channels.`,
                );
            }
        } else {
            // Exceeded limit: remove roles
            try {
                const removedRoles = guildMember.roles.cache
                    .map((role) => role.id)
                    .filter((roleId) => roleId !== guildMember.guild.id);
                await guildMember.roles.set([]);

                const kickChannelId = await db.get(
                    `channelschannel.${channel.guild.id}`,
                );
                const kickChannel =
                    channel.guild.channels.cache.get(kickChannelId);

                if (kickChannel) {
                    const button = new ButtonBuilder()
                        .setCustomId(`restore_roles_${executor.id}`)
                        .setLabel("Restore Roles")
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(button);
                    await kickChannel.send({
                        content: `User:\n\`\`\`${executor.username} ( ${executor.id} )\`\`\`\nReason:\n\`\`\`Channel Create\`\`\`\nPunishment:\n\`\`\`I removed its roles. You can retrieve them with the button below if I made a mistake.\`\`\`\nRoles:\n\`\`\`${removedRoles.join("\n") || "none"}\`\`\``,
                        components: [row],
                    });
                }

                await executor.send(
                    `You can't create channels anymore; your roles have been removed: ${removedRoles.join(", ")}.`,
                );
            } catch (error) {
                console.error(
                    `Failed to remove roles from ${executor.tag}:`,
                    error,
                );
            }
        }
    }
});

Client.on("channelDelete", async (channel) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if ((await db.get(`state.${channel.guild.id}`)) == "danger")
        return lockdown(channel.guild, db);
    await db.set(`state.${channel.id}`, "stable");

    const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1 });
    const channelLog = fetchedLogs.entries.find((log) => log.action === 12);

    if (channelLog) {
        const { executor } = channelLog;
        if (executor.bot) return;
        const guildMember = channel.guild.members.cache.get(executor.id);

        if (!guildMember) {
            console.log("Executor is not a member of the guild.");
            return;
        }

        // Fetch the default limit for channel deletion
        const channelDeleteLimit =
            (await db.get(`defaultLimits.channeldelete`)) || 0;

        if (channelDeleteLimit > 0) {
            // Log the action
            await db.set(
                `limits.${executor.id}.actions.channeldelete`,
                channelDeleteLimit - 1,
            );

            const remaining = channelDeleteLimit - 1;
            executor.send(
                `You have ${remaining} more times to delete a channel.`,
            );

            // Also send a log message if limits channel exists
            const limitsChannelId = await db.get(
                `limitschannel.${channel.guild.id}`,
            );
            const limitsChannel =
                channel.guild.channels.cache.get(limitsChannelId);
            if (limitsChannel) {
                limitsChannel.send(
                    `${executor.tag} has ${remaining} remaining actions for deleting channels.`,
                );
            }
        } else {
            // Exceeded limit: remove roles
            try {
                const removedRoles = guildMember.roles.cache
                    .map((role) => role.id)
                    .filter((roleId) => roleId !== guildMember.guild.id);
                await guildMember.roles.set([]);

                const kickChannelId = await db.get(
                    `channelschannel.${channel.guild.id}`,
                );
                const kickChannel =
                    channel.guild.channels.cache.get(kickChannelId);

                if (kickChannel) {
                    const button = new ButtonBuilder()
                        .setCustomId(`restore_roles_${executor.id}`)
                        .setLabel("Restore Roles")
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(button);
                    await kickChannel.send({
                        content: `User:\n\`\`\`${executor.username} ( ${executor.id} )\`\`\`\nReason:\n\`\`\`Channel Delete\`\`\`\nPunishment:\n\`\`\`I removed its roles. You can retrieve them with the button below if I made a mistake.\`\`\`\nRoles:\n\`\`\`${removedRoles.join("\n") || "none"}\`\`\``,
                        components: [row],
                    });
                }

                await executor.send(
                    `You can't delete channels anymore; your roles have been removed: ${removedRoles.join(", ")}.`,
                );
            } catch (error) {
                console.error(
                    `Failed to remove roles from ${executor.tag}:`,
                    error,
                );
            }
        }
    }
});

// Handle button interactions
Client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    if (customId.startsWith("restore_roles_")) {
        const userId = customId.split("_")[2];

        if (!isOwner(interaction.user.id, interaction.guild, db)) {
            return interaction.reply({
                content: "This button is not for you.",
                ephemeral: true,
            });
        }

        const messageContent = interaction.message.content;
        const rolesSection = messageContent.match(/Roles:\n```([\s\S]+)```/);

        if (rolesSection && rolesSection[1]) {
            const rolesToRestore = rolesSection[1]
                .split("\n")
                .map((roleId) => roleId.trim())
                .filter(Boolean);
            const guildMember = interaction.guild.members.cache.get(userId);

            if (guildMember) {
                try {
                    await guildMember.roles.set(rolesToRestore);
                    await interaction.reply({
                        content: "Your roles have been restored!",
                        ephemeral: true,
                    });
                } catch (error) {
                    console.error(
                        `Failed to restore roles for ${interaction.user.tag}:`,
                        error,
                    );
                    await interaction.reply({
                        content: "An error occurred while restoring roles.",
                        ephemeral: true,
                    });
                }
            } else {
                await interaction.reply({
                    content: "Member not found in the guild.",
                    ephemeral: true,
                });
            }
        } else {
            await interaction.reply({
                content:
                    "Failed to restore roles. No valid roles found in the message.",
                ephemeral: true,
            });
        }
    }
});
