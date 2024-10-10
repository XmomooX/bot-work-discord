const isOwner = require("../functions/isOwner");
const { ChannelType, PermissionsBitField } = require("discord.js")

module.exports = {
  name: "lockdown",
  description: "lock the server down",
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

        const roles = interaction.guild.roles.cache.filter(role => !role.managed && role.editable && !role.permissions.has(PermissionsBitField.Flags.Administrator));
        const channels = interaction.guild.channels.cache.filter(channel => channel.isTextBased());

        let permissionsBackup = {};

        try {
            channels.forEach(channel => {
                permissionsBackup[channel.id] = {};

                roles.forEach(role => {
                    permissionsBackup[channel.id][role.id] = channel.permissionsFor(role).toArray();

                    channel.permissionOverwrites.edit(role, {
                        ViewChannel: false,
                        SendMessages: false,
                        Connect: false
                    });
                });
            });

            await db.set(`permissionsBackup.${interaction.guild.id}`, permissionsBackup);

            await interaction.editReply('Lockdown has been applied. All roles and channels are now hidden.');
        } catch (error) {
            console.error('Error applying lockdown:', error);
            await interaction.editReply('An error occurred while applying the lockdown.');
        }

  }
}