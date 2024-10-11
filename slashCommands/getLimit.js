const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const Client = require("../app").Client;

module.exports = {
  name: "getlimit",
  description: "Get a specific user's limit for an action.",
  options: [
    {
      name: "user",
      type: 6,
      description: "User to check the limit for",
      required: true,
    },
    {
      name: "action",
      type: 3,
      description: "Action to check the limit for",
      required: false,
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
  ],
  async execute(interaction, db) {
    const user = interaction.options.getUser("user");
    const action = interaction.options.getString("action");

    if (action) {
      let dbAction;
      switch (action) {
        case "create channel":
          dbAction = "channelcreate";
          break;
        case "delete channel":
          dbAction = "channeldelete";
          break;
        case "create role":
          dbAction = "rolecreate";
          break;
        case "delete role":
          dbAction = "roledelete";
          break;
        default:
          dbAction = action;
          break;
      }

      const limit = await db.get(`limits.${user.id}.actions.${dbAction}`);

      if (limit != null) {
        return await interaction.reply(
          `${user.username}'s limit for ${action} is set to ${limit}.`,
        );
      } else {
        return await interaction.reply({
          content: `${user.username} does not have a limit set for ${action}.`,
          components: [row],
        });
      }
    } else {
      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Limits`)
        .setColor("#0099ff")
        .setTimestamp();

      const actions = [
        "ban",
        "kick",
        "prune",
        "vanityURL",
        "timeout",
        "create channel",
        "delete channel",
        "create role",
        "delete role",
      ];

      for (const action of actions) {
        const limit = await db.get(`limits.${user.id}.actions.${action}`);
        embed.addFields({
          name: action,
          value: limit != null ? limit.toString() : "Not set",
        });
      }

      return await interaction.reply({
        embeds: [embed],
      });
    }
  },
};
