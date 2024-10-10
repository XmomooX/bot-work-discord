const db = require("../app").database;
const Client = require("../app").Client;
const isTrusted = require("../functions/isTrusted");
const isOwner = require("../functions/isOwner");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

Client.on("channelCreate", async (channel) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get the ban, kick, and limits channels from the database
    const banChannelId = await db.get(`channelschannel.${channel.guild.id}`);
    const limitsChannelId = await db.get(`limitschannel.${channel.guild.id}`);

    const banChannel = channel.guild.channels.cache.get(banChannelId);
    const limitsChannel = channel.guild.channels.cache.get(limitsChannelId);

    const fetchedLogs = await channel.guild.fetchAuditLogs({
        limit: 1,
    });

    const channelLog = fetchedLogs.entries.find((log) => log.action === 10);

    if (channelLog) {
        const { executor } = channelLog;
        if (executor.bot) return;
        const guildMember = channel.guild.members.cache.get(executor.id);

        if (!guildMember) {
            console.log("Executor is not a member of the guild.");
            return;
        }

        const limit = await isTrusted(db, executor.id, "channelcreate");

        if (limit === "Invalid action") {
            console.log("Invalid action specified.");
            return;
        }

        if (limit > 0) {
            if (banChannel) {
                banChannel.send(
                    `${channel.name} was created by ${executor.tag}.`,
                );
            }
            await db.set(
                `limits.${executor.id}.actions.channelcreate`,
                limit - 1,
            );

            const remaining = limit - 1;
            executor.send(
                `You have ${remaining} more times to create a channel.`,
            );

            if (limitsChannel) {
                limitsChannel.send(
                    `${executor.tag} has ${remaining} remaining actions for creating channels.`,
                );
            }
        } else {
            try {
                const removedRoles = guildMember.roles.cache
                    .map((role) => role.id)
                    .filter((roleId) => roleId !== guildMember.guild.id);
                await guildMember.roles.set([]);

                if (banChannel) {
                    const button = new ButtonBuilder()
                        .setCustomId(`restore_roles_${executor.id}`)
                        .setLabel("Restore Roles")
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(button);

                    await limitsChannel.send({
                        content: `User:\n\`\`\`${executor.username} ( ${executor.id} )\`\`\`\nReason:\n\`\`\`Channel Create\`\`\`\nPunishment:\n\`\`\`I removed its roles, and you can retrieve their roles from the button below if I made a mistake.\`\`\`\nRoles:\n\`\`\`${removedRoles.join("\n") || "none"}\`\`\``,
                        components: [row],
                    });
                }

                await executor.send({
                    content: `You can't create channels anymore; your roles have been removed: ${removedRoles.join(", ")}. If this was a mistake, you can restore your roles with the button below.`,
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`restore_roles_${executor.id}`)
                                .setLabel("Restore Roles")
                                .setStyle(ButtonStyle.Primary),
                        ),
                    ],
                });
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

    const kickChannelId = await db.get(`channelschannel.${channel.guild.id}`);
    const limitsChannelId = await db.get(`limitschannel.${channel.guild.id}`);

    const kickChannel = channel.guild.channels.cache.get(kickChannelId);
    const limitsChannel = channel.guild.channels.cache.get(limitsChannelId);

    const fetchedLogs = await channel.guild.fetchAuditLogs({
        limit: 1,
    });

    const channelLog = fetchedLogs.entries.find((log) => log.action === 12);

    if (channelLog) {
        const { executor } = channelLog;
        if (executor.bot) return;
        const guildMember = channel.guild.members.cache.get(executor.id);

        if (!guildMember) {
            console.log("Executor is not a member of the guild.");
            return;
        }

        const limit = await isTrusted(db, executor.id, "channeldelete");

        if (limit === "Invalid action") {
            console.log("Invalid action specified.");
            return;
        }

        if (limit > 0) {
            if (kickChannel) {
                kickChannel.send(
                    `${channel.name} was deleted by ${executor.tag}.`,
                );
            }
            await db.set(
                `limits.${executor.id}.actions.channeldelete`,
                limit - 1,
            );

            const remaining = limit - 1;
            executor.send(
                `You have ${remaining} more times to delete a channel.`,
            );

            if (limitsChannel) {
                limitsChannel.send(
                    `${executor.tag} has ${remaining} remaining actions for deleting channels.`,
                );
            }
        } else {
            try {
                const removedRoles = guildMember.roles.cache
                    .map((role) => role.id)
                    .filter((roleId) => roleId !== guildMember.guild.id);
                await guildMember.roles.set([]);

                if (kickChannel) {
                    const button = new ButtonBuilder()
                        .setCustomId(`restore_roles_${executor.id}`)
                        .setLabel("Restore Roles")
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(button);

                    await limitsChannel.send({
                        content: `User:\n\`\`\`${executor.username} ( ${executor.id} )\`\`\`\nReason:\n\`\`\`Channel Delete\`\`\`\nPunishment:\n\`\`\`I removed its roles, and you can retrieve their roles from the button below if I made a mistake.\`\`\`\nRoles:\n\`\`\`${removedRoles.join("\n") || "none"}\`\`\``,
                        components: [row],
                    });
                }

                await executor.send({
                    content: `You can't delete channels anymore; your roles have been removed: ${removedRoles.join(", ")}. If this was a mistake, you can restore your roles with the button below.`,
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`restore_roles_${executor.id}`)
                                .setLabel("Restore Roles")
                                .setStyle(ButtonStyle.Primary),
                        ),
                    ],
                });
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

        if (!isOwner(interaction.user.id, db)) {
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
