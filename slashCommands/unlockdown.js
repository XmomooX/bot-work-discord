const isOwner = require("../functions/isOwner");
const { ChannelType, PermissionsBitField } = require("discord.js")

module.exports = {
  name: "unlockdown",
  description: "remove lockdown from the server",
  async execute(interaction, db) {
	const guildOwnerID = interaction.guild.ownerId;
	
	// if (guildOwnerID !== interaction.user.id || await isOwner(interaction.user.id, db);)
    //   return await interaction.reply("Invalid permissions");
	const logchannel = await db.get(`logchannel.${interaction.guild.id}`)
	const ch = interaction.guild.channels.cache.get(logchannel);
    if (ch) {
		ch.send(`${interaction.commandName} was used by ${interaction.user.username}`)
	}
		await interaction.deferReply();

        const permissionsBackup = await db.get(`permissionsBackup.${interaction.guild.id}`);

        if (!permissionsBackup) {
            return interaction.editReply('No lockdown data found. Make sure to run the `/lockdown` command before using `/unlockdown`.');
        }

        try {
            const roles = interaction.guild.roles.cache.filter(role => !role.managed && role.editable && !role.permissions.has(PermissionsBitField.Flags.Administrator));
            const channels = interaction.guild.channels.cache.filter(channel => channel.isTextBased());

            channels.forEach(channel => {
                const channelBackup = permissionsBackup[channel.id];

                if (channelBackup) {
                    roles.forEach(role => {
                        const permissions = channelBackup[role.id];

                        if (permissions) {
                            channel.permissionOverwrites.edit(role, {
                                ViewChannel: permissions.includes('ViewChannel'),
                                SendMessages: permissions.includes('SendMessages'),
                                Connect: permissions.includes('Connect')
                            });
                        }
                    });
                }
            });
            await db.delete(`permissionsBackup.${interaction.guild.id}`);

            await interaction.editReply('Lockdown has been lifted. All permissions have been restored.');
        } catch (error) {
            console.error('Error lifting lockdown:', error);
            await interaction.editReply('An error occurred while lifting the lockdown.');
        }
  }
}