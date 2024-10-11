const isOwner = require("../functions/isOwner");

module.exports = {
  name: "addownership",
  description: "Add bot ownership",
  options: [
    {
      name: "user",
      type: 6, //user
      description: "User to give ownership to",
      required: true,
    },
  ],
  async execute(interaction, db) {
    // if (await isOwner(interaction.user.id, interaction.guild, db);)
    //   return await interaction.reply("Invalid permissions");
    const logchannel = await db.get(`logchannel.${interaction.guild.id}`);
    const ch = interaction.guild.channels.cache.get(logchannel);
    if (ch) {
      ch.send(
        `${interaction.commandName} was used by ${interaction.user.username}`,
      );
    }
    const user = interaction.options.getUser("user");
    if (user.bot)
      return await interaction.reply("You cant add bots to ownerships");
    if (await isOwner(user.id, interaction.guild, db)) {
      return await interaction.reply("User is already an owner");
    }

    await db.set(`owners.${user.id}`, true).then(async () => {
      await interaction.reply(
        `Successfully added ${user.username} to the owners`,
      );
    });
  },
};
