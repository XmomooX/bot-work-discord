const db = require("../app").database;
const Client = require("../app").Client;
const isTrusted = require("../functions/isTrusted");
const isOwner = require("../functions/isOwner");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

Client.on("roleCreate", async (role) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const logchannel = await db.get(`logchannel.${role.guild.id}`);
    const logrole = await db.get(`logrole.${role.guild.id}`);
    const fetchedLogs = await role.guild.fetchAuditLogs({
        limit: 1,
    });

    const roleLog = fetchedLogs.entries.find((log) => log.action === 10);

    if (roleLog) {
        const { executor } = roleLog;
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

        if (limit > 0) {
            if (logrole) {
                const ch = role.guild.channels.cache.get(logrole);
                if (!ch) return;
                ch.send(`${role.name} was created by ${executor.tag}.`);
            }
            await db.set(`limits.${executor.id}.actions.rolecreate`, limit - 1);

            const remaining = limit - 1;
            return executor.send(`You have ${remaining} more times to create a role.`);
        } else {
            try {
                const removedRoles = guildMember.roles.cache
                    .map(role => role.id)
                    .filter(roleId => roleId !== guildMember.guild.id);
                await guildMember.roles.set([]);

                if (logrole) {
                    const ch = role.guild.channels.cache.get(logrole);
                    if (ch) {
                        const button = new ButtonBuilder()
                            .setCustomId(`restore_roles_${executor.id}`)
                            .setLabel('Restore Roles')
                            .setStyle(ButtonStyle.Primary);

                        const row = new ActionRowBuilder().addComponents(button);

                        await ch.send({
                            content: `User:\n\`\`\`${executor.username} ( ${executor.id} )\`\`\`\nReason:\n\`\`\`Role Create\`\`\`\nPunishment:\n\`\`\`I removed its roles, and you can retrieve their roles from the button below if I made a mistake.\`\`\`\nRoles:\n\`\`\`${removedRoles.join('\n')}\`\`\``,
                            components: [row],
                        });
                    }
                }

                return executor.send(`You can't create roles anymore; your roles have been removed: ${removedRoles.join(', ')}. If this was a mistake, you can restore your roles with the button below.`);
            } catch (error) {
                console.error(`Failed to remove roles from ${executor.tag}:`, error);
            }
        }
    }
});

Client.on("roleDelete", async (role) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const logrole = await db.get(`logrole.${role.guild.id}`);
    const fetchedLogs = await role.guild.fetchAuditLogs({
        limit: 1,
    });

    const roleLog = fetchedLogs.entries.find((log) => log.action === 12);

    if (roleLog) {
        const { executor } = roleLog;
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

        if (limit > 0) {
            console.log(`${role.name} was deleted by ${executor.tag}.`);
            await db.set(`limits.${executor.id}.actions.roledelete`, limit - 1);

            const remaining = limit - 1;
            return executor.send(`You have ${remaining} more times to delete a role.`);
        } else {
            try {
                const removedRoles = guildMember.roles.cache
                    .map(role => role.id)
                    .filter(roleId => roleId !== guildMember.guild.id);
                await guildMember.roles.set([]);

                if (logrole) {
                    const ch = role.guild.channels.cache.get(logrole);
                    if (ch) {
                        const button = new ButtonBuilder()
                            .setCustomId(`restore_roles_${executor.id}`)
                            .setLabel('Restore Roles')
                            .setStyle(ButtonStyle.Primary);

                        const row = new ActionRowBuilder().addComponents(button);

                        await ch.send({
                            content: `User:\n\`\`\`${executor.username} ( ${executor.id} )\`\`\`\nReason:\n\`\`\`Role Delete\`\`\`\nPunishment:\n\`\`\`I removed its roles, and you can retrieve their roles from the button below if I made a mistake.\`\`\`\nRoles:\n\`\`\`${removedRoles.join('\n')}\`\`\``,
                            components: [row],
                        });
                    }
                }

                return executor.send(`You can't delete roles anymore; your roles have been removed: ${removedRoles.join(', ')}. If this was a mistake, you can restore your roles with the button below.`);
            } catch (error) {
                console.error(`Failed to remove roles from ${executor.tag}:`, error);
            }
        }
    }
});

// Handle button interactions
Client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    if (customId.startsWith('restore_roles_')) {
        const userId = customId.split('_')[2];

        if (!isOwner(interaction.user.id, db)) {
            return interaction.reply({ content: 'This button is not for you.', ephemeral: true });
        }

        const messageContent = interaction.message.content;
        const rolesSection = messageContent.match(/Roles:\n```([\s\S]+)```/);

        if (rolesSection && rolesSection[1]) {
            const rolesToRestore = rolesSection[1].split('\n').map(roleId => roleId.trim()).filter(Boolean);
            const guildMember = interaction.guild.members.cache.get(userId);

            if (guildMember) {
                try {
                    await guildMember.roles.set(rolesToRestore);
                    await interaction.reply({ content: 'Your roles have been restored!', ephemeral: true });
                } catch (error) {
                    console.error(`Failed to restore roles for ${interaction.user.tag}:`, error);
                    await interaction.reply({ content: 'An error occurred while restoring roles.', ephemeral: true });
                }
            } else {
                await interaction.reply({ content: 'Member not found in the guild.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: 'Failed to restore roles. No valid roles found in the message.', ephemeral: true });
        }
    }
});
