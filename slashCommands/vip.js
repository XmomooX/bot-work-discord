const isOwner = require("../functions/isOwner");
const {
  InteractionType,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const Client = require("../app").Client;

module.exports = {
  name: "vip",
  description: "VIP bot management commands",

  async execute(interaction, db) {
    const guildOwnerID = interaction.guild.ownerId;
    if (
      guildOwnerID !== interaction.user.id &&
      !(await isOwner(interaction.user.id, db))
    ) {
      return await interaction.reply({
        content: "Invalid permissions",
        ephemeral: true,
      });
    }

    const actionMenu = new StringSelectMenuBuilder()
      .setCustomId("vip_action_menu")
      .setPlaceholder("Select a command...")
      .addOptions([
        {
          label: "Set Prefix",
          value: "setprefix",
        },
        {
          label: "Set Name",
          value: "setname",
        },
        {
          label: "Set Status",
          value: "setstatus",
        },
        {
          label: "Set Avatar",
          value: "setavatar",
        },
        {
          label: "Restart Bot",
          value: "restart",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(actionMenu);

    await interaction.reply({
      content: "Select an action to perform:",
      components: [row],
      ephemeral: true,
    });

    const filter = (i) => {
      return (
        i.customId === "vip_action_menu" && i.user.id === interaction.user.id
      );
    };

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (i) => {
      // Don't defer or reply to the interaction here
      switch (i.values[0]) {
        case "setprefix":
          await showSetPrefixModal(i);
          break;
        case "setname":
          await showSetNameModal(i);
          break;
        case "setstatus":
          await showSetStatusModal(i);
          break;
        case "setavatar":
          await showSetAvatarModal(i);
          break;
        case "restart":
          await restartBot(i);
          break;
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.followUp({
          content: "No action selected, command timed out.",
          ephemeral: true,
        });
      }
    });
  },
};

async function showSetPrefixModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("setprefix_modal")
    .setTitle("Set Bot Prefix")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("prefix_input")
          .setLabel("New Prefix")
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );

  await interaction.showModal(modal); // Show modal directly
}

async function showSetNameModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("setname_modal")
    .setTitle("Set Bot Name")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("name_input")
          .setLabel("New Name")
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );

  await interaction.showModal(modal);
}

async function showSetStatusModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("setstatus_modal")
    .setTitle("Set Bot Status")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("status_input")
          .setLabel("Status Text")
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );

  await interaction.showModal(modal);
}

async function showSetAvatarModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("setavatar_modal")
    .setTitle("Set Bot Avatar")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("avatar_url_input")
          .setLabel("Avatar URL")
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );

  await interaction.showModal(modal);
}

async function restartBot(interaction) {
  await interaction.reply("Bot is restarting...");
  process.exit(0);
}
const db = require("../app").database;

Client.on("interactionCreate", async (modalInteraction) => {
  if (modalInteraction.type === InteractionType.ModalSubmit) {
    switch (modalInteraction.customId) {
      case "setprefix_modal":
        const newPrefix =
          modalInteraction.fields.getTextInputValue("prefix_input");
        await db.set(`prefix.${modalInteraction.guild.id}`, newPrefix);
        await modalInteraction.reply({
          content: `Prefix updated to \`${newPrefix}\``,
          ephemeral: true,
        });
        break;

      case "setname_modal":
        const newName = modalInteraction.fields.getTextInputValue("name_input");
        try {
          await Client.user.setUsername(newName);
          await modalInteraction.reply({
            content: `Bot name changed to **${newName}**`,
            ephemeral: true,
          });
        } catch (error) {
          await modalInteraction.reply({
            content:
              "Failed to change bot name. Make sure you have enough permissions.",
            ephemeral: true,
          });
        }
        break;

      case "setstatus_modal":
        const statusText =
          modalInteraction.fields.getTextInputValue("status_input");
        await Client.user.setActivity(statusText);
        await modalInteraction.reply({
          content: `Status updated to **${statusText}**`,
          ephemeral: true,
        });
        break;

      case "setavatar_modal":
        const newAvatarURL =
          modalInteraction.fields.getTextInputValue("avatar_url_input");
        try {
          await Client.user.setAvatar(newAvatarURL);
          await modalInteraction.reply({
            content: "Bot avatar updated successfully.",
            ephemeral: true,
          });
        } catch (error) {
          await modalInteraction.reply({
            content:
              "Failed to update bot avatar. Make sure the URL is valid and you have enough permissions.",
            ephemeral: true,
          });
        }
        break;
    }
  }
});