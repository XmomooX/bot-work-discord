module.exports = {
  name: "trust",
  description: "Trust someone with an action.",
  options: [
    {
      name: "user",
      type: 6,
      description: "User to trust",
      required: true,
    },
    {
      name: "action",
      type: 3,
      description: "Action to trust",
      required: true,
      choices: [
        { name: "ban", value: "ban" },
        { name: "kick", value: "kick" },
        { name: "prune", value: "prune" },
        { name: "vanityURL", value: "vanityURL" },
        { name: "timeout", value: "timeout" },
        { name: "create channel", value: "create channel" },
        { name: "delete channel", value: "delete channel" },
        { name: "create role", value: "create role" },
        { name: "delete role", value: "delete role" },
      ],
    },
    {
      name: "limits",
      description: "Limit for action",
      type: 4,
      required: false,
    },
  ],
  async execute(interaction, db) {
    const logchannel = await db.get(`logchannel.${interaction.guild.id}`);
    const ch = interaction.guild.channels.cache.get(logchannel);
    if (ch) {
      ch.send(
        `${interaction.commandName} was used by ${interaction.user.username}`,
      );
    }

    const user = interaction.options.getUser("user");
    let action = interaction.options.getString("action");
    let limit = interaction.options.getInteger("limits");

    if (user.bot) return await interaction.reply("User can't be a bot");

    // Fetch the default limit from the database
    const defaultLimits = (await db.get(`defaultLimits`)) || {
      ban: 1,
      kick: 1,
      prune: 0,
      vanityURL: 0,
      timeout: 10,
      "create channel": 5,
      "delete channel": 5,
      "create role": 5,
      "delete role": 5,
    };

    const defaultLimit = defaultLimits[action];

    // If limit is not provided, use the default limit
    if (limit == null || limit == undefined) {
      limit = defaultLimit;
    }

    // Convert action names for database storage
    switch (action) {
      case "create channel":
        action = "channelcreate";
        break;
      case "delete channel":
        action = "channeldelete";
        break;
      case "create role":
        action = "rolecreate";
        break;
      case "delete role":
        action = "roledelete";
        break;
      default:
        break;
    }

    // Set the limit for the user in the database
    await db.set(`limits.${user.id}.actions.${action}`, limit);
    return await interaction.reply(
      `Successfully set ${user.username}'s ${action} limit to ${limit}.`,
    );
  },
};
