const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const Client = require("../app").Client; // Import the client instance

module.exports = {
  name: "setup",
  description: "View and set default limits",
  async execute(interaction, db) {
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

    const embed = new EmbedBuilder()
      .setTitle("Default Limits")
      .setDescription("Current default limits for actions:")
      .setColor(0x00ff00);

    for (const action of actions) {
      const limit =
        (await db.get(`defaultLimits.${action}`)) ??
        {
          ban: 1,
          kick: 1,
          prune: 0,
          vanityURL: 0,
          timeout: 10,
          "create channel": 5,
          "delete channel": 5,
          "create role": 5,
          "delete role": 5,
        }[action];

      embed.addFields({
        name: action,
        value: limit === -1 ? "Unlimited" : `${limit}`,
        inline: true,
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("edit_default_limits")
        .setLabel("Edit Default Limits")
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.reply({ embeds: [embed], components: [row] });

    // Create a collector to handle the button and menu interactions
    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "edit_default_limits") {
        // Acknowledge the button press
        await i.deferUpdate();
        await i.followUp({
          content: "Select the action you want to set the default limit for:",
          ephemeral: true,
          components: [getActionSelectMenu()],
        });
      } else if (i.isStringSelectMenu() && i.customId === "action_select") {
        const selectedAction = i.values[0];
        const modal = new ModalBuilder()
          .setCustomId("set_limit_modal")
          .setTitle(`Set Limit for ${selectedAction}`);

        const limitInput = new TextInputBuilder()
          .setCustomId("limit_input")
          .setLabel("Enter the new limit (-1 for unlimited)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("e.g., 5 or -1")
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(limitInput);
        modal.addComponents(row);

        // Save the selected action as metadata for the user (you can also use a temporary storage)
        Client.selectedAction = selectedAction;

        await i.showModal(modal);
      }
    });

    // Listen for modal submissions
    Client.on("interactionCreate", async (i) => {
      if (i.isModalSubmit() && i.customId === "set_limit_modal") {
        const selectedAction = Client.selectedAction;
        const limitValue = parseInt(i.fields.getTextInputValue("limit_input"));

        if (isNaN(limitValue)) {
          return i.reply({
            content: "Invalid limit. Please enter a number.",
            ephemeral: true,
          });
        }

        await db.set(`defaultLimits.${selectedAction}`, limitValue);
        await i.reply({
          content: `Default limit for ${selectedAction} set to ${limitValue === -1 ? "Unlimited" : limitValue}.`,
          ephemeral: true,
        });
      }
    });
  },
};

// Function to generate the select menu for actions
function getActionSelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("action_select")
      .setPlaceholder("Choose an action")
      .addOptions(
        { label: "Ban", value: "ban" },
        { label: "Kick", value: "kick" },
        { label: "Prune", value: "prune" },
        { label: "Vanity URL", value: "vanityURL" },
        { label: "Timeout", value: "timeout" },
        { label: "Create Channel", value: "create channel" },
        { label: "Delete Channel", value: "delete channel" },
        { label: "Create Role", value: "create role" },
        { label: "Delete Role", value: "delete role" },
      ),
  );
}
