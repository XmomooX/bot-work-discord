const db = require("../app").database;
const Client = require("../app").Client;
const isTrusted = require("../functions/isTrusted");
const isOwner = require("../functions/isOwner");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

Client.on("guildMemberRemove", async (member) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const limitslog = await db.get(`limitschannel.${member.guild.id}`);
    const limitschannel = member.guild.channels.cache.get(limitslog);

    const kicklog = await db.get(`kickchannel.${member.guild.id}`);
    const kickchannel = member.guild.channels.cache.get(kicklog);

    const banlog = await db.get(`banchannel.${member.guild.id}`);
    const banchannel = member.guild.channels.cache.get(banlog);

    const fetchedLogs = await member.guild.fetchAuditLogs({
        limit: 1,
    });

    const banLog = fetchedLogs.entries.find(
        (log) => log.action === 22 && log.target.id === member.id,
    );

    const kickLog = fetchedLogs.entries.find(
        (log) => log.action === 20 && log.target.id === member.id,
    );

    if (kickLog) {
        const { executor } = kickLog;
        if (executor.bot) return;
        const guildMember = member.guild.members.cache.get(executor.id);

        if (!guildMember) {
            console.log("Executor is not a member of the guild.");
            return;
        }

        const kickLimit = await isTrusted(db, executor.id, "kick");

        if (kickLimit === "Invalid action") {
            console.log("Invalid action specified.");
            return;
        }

        if (kickLimit > 0) {
            console.log(`${member.user.tag} was kicked by ${executor.tag}.`);
            await db.set(`limits.${executor.id}.actions.kick`, kickLimit - 1);

            const remaining = kickLimit - 1;
            executor.send(`You have ${remaining} more times to kick.`);

            // Also send the message to the limits channel if it exists
            if (limitschannel) {
                await limitschannel.send(
                    `${executor.tag} just kicked ${member.user.tag} and has ${remaining} more times to kick.`,
                );
            }
            return;
        } else {
            try {
                const removedRoles = guildMember.roles.cache
                    .map((role) => role.id)
                    .filter((roleId) => roleId !== guildMember.guild.id);
                await guildMember.roles.set([]);

                if (kickchannel) {
                    const button = new ButtonBuilder()
                        .setCustomId(`restore_roles_${executor.id}`)
                        .setLabel("Restore Roles")
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(button);

                    await limitsChannel.send({
                        content: `User:\n\`\`\`${executor.username} ( ${executor.id} )\`\`\`\nReason:\n\`\`\`Kick\`\`\`\nPunishment:\n\`\`\`I removed its roles, and you can retrieve their roles from the button below if I made a mistake.\`\`\`\nRoles:\n\`\`\`${removedRoles.join("\n") || "none"}\`\`\``,
                        components: [row],
                    });
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
    } else if (banLog) {
        const { executor } = banLog;
        if (executor.bot) return;
        const guildMember = member.guild.members.cache.get(executor.id);

        if (!guildMember) {
            console.log("Executor is not a member of the guild.");
            return;
        }

        const banLimit = await isTrusted(db, executor.id, "ban");

        if (banLimit === "Invalid action") {
            console.log("Invalid action specified.");
            return;
        }

        if (banLimit > 0) {
            console.log(`${member.user.tag} was banned by ${executor.tag}.`);
            await db.set(`limits.${executor.id}.actions.ban`, banLimit - 1);

            const remaining = banLimit - 1;
            executor.send(`You have ${remaining} more times to ban.`);

            // Also send the message to the limits channel if it exists
            if (limitschannel) {
                await limitschannel.send(
                    `${executor.tag} just banned ${member.user.tag} and has ${remaining} more times to ban.`,
                );
            }
            return;
        } else {
            try {
                const removedRoles = guildMember.roles.cache
                    .map((role) => role.id)
                    .filter((roleId) => roleId !== guildMember.guild.id);
                await guildMember.roles.set([]);

                if (banchannel) {
                    const button = new ButtonBuilder()
                        .setCustomId(`restore_roles_${executor.id}`)
                        .setLabel("Restore Roles")
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(button);

                    await limitsChannel.send({
                        content: `User:\n\`\`\`${executor.username} ( ${executor.id} )\`\`\`\nReason:\n\`\`\`Ban\`\`\`\nPunishment:\n\`\`\`I removed its roles, and you can retrieve their roles from the button below if I made a mistake.\`\`\`\nRoles:\n\`\`\`${removedRoles.join("\n") || "none"}\`\`\``,
                        components: [row],
                    });
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
    } else {
        console.log(
            `${member.user.tag} left or was removed from the server, but the reason is unknown.`,
        );
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
