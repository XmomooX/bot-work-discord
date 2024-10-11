const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  name: "setup",
  description: "View and set default limits",
  async execute(interaction, db) {
    const actions = [
      "ban", "kick", "prune", "vanityURL", "timeout",
      "create channel", "delete channel", "create role", "delete role"
    ];

    const embed = new EmbedBuilder()
      .setTitle("Default Limits")
      .setDescription("Current default limits for actions:")
      .setColor(0x00FF00);

    for (const action of actions) {
      const limit = await db.get(`defaultLimits.${action}`) ?? {
        ban: 1,
        kick: 1,
        prune: 0,
        vanityURL: 0,
        timeout: 10,
        "create channel": 5,
        "delete channel": 5,
        "create role": 5,
        "delete role": 5
      }[action];

      embed.addFields({ name: action, value: limit === -1 ? "Unlimited" : `${limit}`, inline: true });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('edit_default_limits')
          .setLabel('Edit Default Limits')
          .setStyle(ButtonStyle.Primary)
      );

    await interaction.reply({ embeds: [embed], components: [row] });

    const filter = i => i.customId === 'edit_default_limits' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      // Acknowledge the button press
      await i.deferUpdate();
      await i.followUp({ content: "Select the action you want to set the default limit for:", ephemeral: true, components: [getActionSelectMenu()] });
    });
  },
};

// Function to generate the select menu for actions
function getActionSelectMenu() {
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('action_select')
        .setPlaceholder('Choose an action')
        .addOptions(
          { label: "Ban", value: "ban" },
          { label: "Kick", value: "kick" },
          { label: "Prune", value: "prune" },
          { label: "Vanity URL", value: "vanityURL" },
          { label: "Timeout", value: "timeout" },
          { label: "Create Channel", value: "create channel" },
          { label: "Delete Channel", value: "delete channel" },
          { label: "Create Role", value: "create role" },
          { label: "Delete Role", value: "delete role" }
        )
    );
}
