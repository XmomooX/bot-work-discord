const isOwner = require("../functions/isOwner");

module.exports = {
  name: "removeownership",
  description: "remove user from ownership",
  options: [
    {
      name: "user",
      type: 6,
      description: "user to remove",
      required: true,
    },
  ],
  async execute(interaction, db) {
    // if (await isOwner(interaction.user.id, interaction.guild,  db);)
    //   return await interaction.reply("Invalid permissions");
    const logchannel = await db.get(`logchannel.${interaction.guild.id}`);
    const ch = interaction.guild.channels.cache.get(logchannel);
    if (ch) {
      ch.send(
        `${interaction.commandName} was used by ${interaction.user.username}`,
      );
    }
    const user = interaction.options.getUser("user");
    if (!(await isOwner(user.id, interaction.guild, db)))
      return await interaction.reply("user is not an owner");
    await db
      .delete(`owners.${user.id}`)
      .then(async () => {
        await interaction.reply(
          `Successfully removed ${user.username} from the owners`,
        );
      })
      .catch(async (error) => {
        console.error(error);
        await interaction.reply(
          "An error occurred while trying to remove ownership",
        );
      });
  },
};
