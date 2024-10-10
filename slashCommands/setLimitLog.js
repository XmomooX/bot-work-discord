const isOwner = require("../functions/isOwner");
const {ChannelType} = require("discord.js")

module.exports = {
  name: "setlimitlog",
  description: "set limit log channel",
  options: [
    {
      name: "channel",
      type: 7,
      description: "channel to log to",
      required: true,
	  channel_types: [ChannelType.GuildText]
    },
  ],
  async execute(interaction, db) {
	      const guildOwnerID = interaction.guild.ownerId;

	  // if (guildOwnerID !== interaction.user.id || await isOwner(interaction.user.id, db);)
    //   return await interaction.reply("Invalid permissions");
	  const logchannel = await db.get(`logchannel.${interaction.guild.id}`)
	  const ch = interaction.guild.channels.cache.get(logchannel);
      if (ch) {
	  	ch.send(`${interaction.commandName} was used by ${interaction.user.username}`)
	  }
    const channel = interaction.options.getChannel("channel");
    if (!channel)
      return await interaction.reply("channel doesnt exist or rare error occured");

    await db.set(`logchannel.${interaction.guild.id}`, channel.id).then(async () => {
      await interaction.reply(
        `Successfully set ${channel.name} as logs channel`,
      );
    });
  },
};
