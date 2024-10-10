module.exports = {
  name: "trust",
  description: "trust someone with action",
  options: [
    {
      name: "user",
      type: 6,
      description: "user to trust",
      required: true,
    },
    {
      name: "action",
      type: 3,
      description: "action to trust",
      required: true,
      choices: [
        {
          name: "ban",
          value: "ban",
        },
        {
          name: "kick",
          value: "kick",
        },
        {
          name: "prune",
          value: "prune",
        },
        {
          name: "vanityURL",
          value: "vanityURL",
        },
        {
          name: "timeout",
          value: "timeout",
        },
        {
          name: "create channel",
          value: "create channel",
        },
        {
          name: "delete channel",
          value: "delete channel",
        },
        {
          name: "create role",
          value: "create role",
        },
		{
          name: "delete role",
          value: "delete role",
        },
      ],
    },
    {
      name: "limits",
      description: "Limit to replit",
      type: 4,
      required: false,
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
	  const user = interaction.options.getUser("user");
    let action = interaction.options.getString("action");
    let limit = interaction.options.getInteger("limits");

    if (user.bot) return await interaction.reply("User can't be a bot");

    if (limit == null || limit == undefined) {
      switch (action) {
        case "ban":
          limit = 1;
          break;
        case "kick":
          limit = 1;
          break;
        case "timeout":
          limit = 10;
          break;
        case "roles":
          limit = 20;
          break;
        default:
          limit = 0;
          break;
      }
    }
	switch(action) {
		case "create channel":
			action = "channelcreate"
			break;
		case "delete role":
			action = "channeldelete"
			break;
		case "create role":
			action = "rolecreate"
			break;
		case "delete role":
			action = "roledelete"
			break;
	}
	  console.log(action)
    await db.set(`limits.${user.id}.actions.${action}`, limit);
    return await interaction.reply(
      `Successfully set ${user.username}'s ${action} count to ${limit}.`,
    );
  },
};
