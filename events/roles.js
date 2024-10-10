const db = require("../app").database;
const Client = require("../app").Client;
const isTrusted = require("../functions/isTrusted");
const isOwner = require("../functions/isOwner");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

Client.on("roleCreate", async (role) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const fetchedLogs = await role.guild.fetchAuditLogs({
        limit: 1,
    });

    const roleLog = fetchedLogs.entries.find((log) => log.action === 30); // 30 is the action for role creation

    if (roleLog) {
        const { executor } = roleLog;
        if (executor.bot) return;
        const guildMember = role.guild.members.cache.get(executor.id);

        if (!guildMember) {
            console.log("Executor is not a member of the guild.");
            return;
        }

        const limit = await isTrusted(db, executor.id, "rolecreate");

        if (limit === "Invalid action") {
            console.log("Invalid action specified.");
            return;
        }

        const rolesChannelId = await db.get(`roleschannel.${role.guild.id}`);
        const limitsChannelId = await db.get(`limitschannel.${role.guild.id}`);

        const rolesChannel = role.guild.channels.cache.get(rolesChannelId);
        const limitsChannel = role.guild.channels.cache.get(limitsChannelId);

        if (limit > 0) {
            if (rolesChannel) {
                rolesChannel.send(
                    `${role.name} was created by ${executor.tag}.`,
                );
            }

            if (limitsChannel) {
                limitsChannel.send(
                    `${executor.tag} created a role. They have ${limit - 1} actions left.`,
                );
            }

            await db.set(`limits.${executor.id}.actions.rolecreate`, limit - 1);

            const remaining = limit - 1;
            return executor.send(
                `You have ${remaining} more times to create a role.`,
            );
        } else {
            try {
                const removedRoles = guildMember.roles.cache
                    .map((role) => role.id)
                    .filter((roleId) => roleId !== guildMember.guild.id); // Filter out @everyone ID
                await guildMember.roles.set([]);

                if (rolesChannel) {
                    const button = new ButtonBuilder()
                        .setCustomId(`restore_roles_${executor.id}`)
                        .setLabel("Restore Roles")
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(button);

                    await limitsChannel.send({
                        content: `User:\n\`\`\`${executor.username} ( ${executor.id} )\`\`\`\nReason:\n\`\`\`Role Create\`\`\`\nPunishment:\n\`\`\`I removed its roles, and you can retrieve their roles from the button below if I made a mistake.\`\`\`\nRoles:\n\`\`\`${removedRoles.join("\n") || "none"}\`\`\``,
                        components: [row],
                    });
                }

                if (limitsChannel) {
                    limitsChannel.send(
                        `User ${executor.tag} (${executor.id}) exceeded their role creation limit. Roles were removed as punishment.`,
                    );
                }

                return executor.send(
                    `You can't create roles anymore; your roles have been removed: ${removedRoles.join(", ")}. If this was a mistake, you can restore your roles with the button below.`,
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

Client.on("roleDelete", async (role) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const fetchedLogs = await role.guild.fetchAuditLogs({
        limit: 1,
    });

    const roleLog = fetchedLogs.entries.find((log) => log.action === 31); // 31 is the action for role deletion

    if (roleLog) {
        const { executor } = roleLog;
        if (executor.bot) return;
        const guildMember = role.guild.members.cache.get(executor.id);

        if (!guildMember) {
            console.log("Executor is not a member of the guild.");
            return;
        }

        const limit = await isTrusted(db, executor.id, "roledelete");

        if (limit === "Invalid action") {
            console.log("Invalid action specified.");
            return;
        }

        const rolesChannelId = await db.get(`roleschannel.${role.guild.id}`);
        const limitsChannelId = await db.get(`limitschannel.${role.guild.id}`);

        const rolesChannel = role.guild.channels.cache.get(rolesChannelId);
        const limitsChannel = role.guild.channels.cache.get(limitsChannelId);

        if (limit > 0) {
            if (rolesChannel) {
                rolesChannel.send(
                    `${role.name} was deleted by ${executor.tag}.`,
                );
            }

            if (limitsChannel) {
                limitsChannel.send(
                    `${executor.tag} deleted a role. They have ${limit - 1} actions left.`,
                );
            }

            await db.set(`limits.${executor.id}.actions.roledelete`, limit - 1);

            const remaining = limit - 1;
            return executor.send(
                `You have ${remaining} more times to delete a role.`,
            );
        } else {
            try {
                const removedRoles = guildMember.roles.cache
                    .map((role) => role.id)
                    .filter((roleId) => roleId !== guildMember.guild.id);
                await guildMember.roles.set([]);

                if (rolesChannel) {
                    const button = new ButtonBuilder()
                        .setCustomId(`restore_roles_${executor.id}`)
                        .setLabel("Restore Roles")
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(button);

                    await limitsChannel.send({
                        content: `User:\n\`\`\`${executor.username} ( ${executor.id} )\`\`\`\nReason:\n\`\`\`Role Delete\`\`\`\nPunishment:\n\`\`\`I removed its roles, and you can retrieve their roles from the button below if I made a mistake.\`\`\`\nRoles:\n\`\`\`${removedRoles.join("\n") || "none"}\`\`\``,
                        components: [row],
                    });
                }

                if (limitsChannel) {
                    limitsChannel.send(
                        `User ${executor.tag} (${executor.id}) exceeded their role deletion limit. Roles were removed as punishment.`,
                    );
                }

                return executor.send(
                    `You can't delete roles anymore; your roles have been removed: ${removedRoles.join(", ")}. If this was a mistake, you can restore your roles with the button below.`,
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

// Handle button interactions for restoring roles
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

                    const limitsChannelId = await db.get(
                        `limitschannel.${interaction.guild.id}`,
                    );
                    const limitsChannel =
                        interaction.guild.channels.cache.get(limitsChannelId);

                    if (limitsChannel) {
                        await limitsChannel.send(
                            `Roles have been restored for user: ${guildMember.user.tag} (${guildMember.id}) by ${interaction.user.tag}.`,
                        );
                    }

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
