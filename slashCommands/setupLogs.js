const isOwner = require("../functions/isOwner");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const Client = require("../app").Client;

module.exports = {
  name: "setuplogs",
  description: "Set up logs category",
  async execute(interaction, db, client) {
    const guildId = interaction.guild.id;
    const categoryId = await db.get(`logcat.${guildId}`);
    const category = interaction.guild.channels.cache.get(categoryId);

    if (category) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("changeCategory")
          .setLabel("Change Category")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("cancel")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger),
      );

      await interaction.reply({
        content: `A logs category already exists: **${category.name}**. Do you want to change it to a new one?`,
        components: [row],
        ephemeral: true,
      });
    } else {
      await createLogCategory(interaction, db);
    }

    Client.on("interactionCreate", async (buttonInteraction) => {
      if (!buttonInteraction.isButton()) return;
      if (buttonInteraction.guild.id !== guildId) return;

      if (buttonInteraction.customId === "changeCategory") {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("deleteOldCategory")
            .setLabel("Delete Old Category")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("keepOldCategory")
            .setLabel("Keep Old Category")
            .setStyle(ButtonStyle.Secondary),
        );

        await buttonInteraction.update({
          content: `Do you want to delete the old category: **${category.name}**?`,
          components: [row],
        });
      } else if (buttonInteraction.customId === "deleteOldCategory") {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("confirmDelete")
            .setLabel(`Last confirmation, delete ${category.name}`)
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("cancelDelete")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary),
        );

        await buttonInteraction.update({
          content: `Last confirmation, delete category: **${category.name}**?`,
          components: [row],
        });
      } else if (buttonInteraction.customId === "confirmDelete") {
        try {
          await category.delete();
          await buttonInteraction.update({
            content: `Category **${category.name}** deleted. Setting up a new logs category...`,
            components: [],
          });

          await db.delete(`logcat.${guildId}`);
          await createLogCategory(buttonInteraction, db);
        } catch (e) {
          console.error(e);
          await buttonInteraction.update({
            content: "An error occurred while deleting the category.",
            components: [],
          });
        }
      } else if (
        buttonInteraction.customId === "keepOldCategory" ||
        buttonInteraction.customId === "cancel" ||
        buttonInteraction.customId === "cancelDelete"
      ) {
        await buttonInteraction.update({
          content: "Action cancelled.",
          components: [],
        });
      }
    });
  },
};

async function createLogCategory(interaction, db) {
  try {
    const category = await interaction.guild.channels.create({
      name: "logs",
      type: ChannelType.GuildCategory,
    });
    await db.set(`logcat.${interaction.guild.id}`, category.id);

    const channels = [
      { name: "kick-logs", key: "kickchannel" },
      { name: "ban-logs", key: "banchannel" },
      { name: "timeout-logs", key: "timechannel" },
      { name: "roles-logs", key: "roleschannel" },
      { name: "channels-logs", key: "channelschannel" },
      { name: "general-logs", key: "guildchannel" },
      { name: "limits-logs", key: "limitschannel" },
    ];

    for (const { name, key } of channels) {
      const logChannel = await interaction.guild.channels.create({
        name: name,
        type: ChannelType.GuildText,
        parent: category.id,
      });
      await db.set(`${key}.${interaction.guild.id}`, logChannel.id);
    }

    await interaction.followUp(
      `Successfully set ${category.name} as logs category and created the logs channels.`,
    );
  } catch (e) {
    console.error(e);
    await interaction.followUp(
      "An error occurred while creating the logs category.",
    );
  }
}
