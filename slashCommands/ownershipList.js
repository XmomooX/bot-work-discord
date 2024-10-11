module.exports = {
  name: "ownershiplist",
  description: "List all bot owners",
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
    try {
      const ownersData = await db.all();
      const owners = [];
      ownersData.map((e) => {
        if (e.id == "owners") {
          for (let owner in e.value) {
            if (!owners[owner]) owners.push(owner);
          }
        }
      });

      if (owners.length === 0) {
        return await interaction.reply("There are no owners currently.");
      }

      const ownerUsernames = await Promise.all(
        owners.map(async (ownerId) => {
          const user = await interaction.guild.members
            .fetch(ownerId)
            .catch(() => null);
          return user ? user.user.username : `User ${ownerId} not found`;
        }),
      );

      await interaction.reply(`Current owners: ${ownerUsernames.join(", ")}`);
    } catch (error) {
      console.error("Error fetching owners:", error);
      await interaction.reply("An error occurred while fetching owners.");
    }
  },
};
