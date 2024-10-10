const { ActivityType } = require("discord.js");
const isOwner = require("../functions/isOwner.js");
const db = require("quick.db");

module.exports = {
    name: "setactivity",
    description: "Set the bot's activity",
    options: [
        {
            name: "type",
            description:
                "Type of activity (listening, streaming, watching, playing)",
            required: true,
            type: 3,
            choices: [
                { name: "Listening", value: "listening" },
                { name: "Streaming", value: "streaming" },
                { name: "Watching", value: "watching" },
                { name: "Playing", value: "playing" },
            ],
        },
        {
            name: "description",
            description: "The description for the activity",
            required: true,
            type: 3,
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
		const activityType = interaction.options.getString("type");
        const activityDescription =
            interaction.options.getString("description");

        const isOwnerResult = await isOwner(interaction.user.id, db);
        if (!isOwnerResult) {
            return interaction.reply({
                content: "❌ You cannot use this command.",
                ephemeral: true,
            });
        }

        try {
            switch (activityType) {
                case "listening":
                    await interaction.client.user.setActivity(
                        activityDescription,
                        { type: ActivityType.Listening },
                    );
                    break;
                case "streaming":
                    const invalidTwitchLink =
                        "https://twitch.tv/invalid_stream";
                    await interaction.client.user.setActivity(
                        activityDescription,
                        {
                            type: ActivityType.Streaming,
                            url: invalidTwitchLink,
                        },
                    );
                    break;
                case "watching":
                    await interaction.client.user.setActivity(
                        activityDescription,
                        { type: ActivityType.Watching },
                    );
                    break;
                case "playing":
                    await interaction.client.user.setActivity(
                        activityDescription,
                        { type: ActivityType.Playing },
                    );
                    break;
                default:
                    return interaction.reply({
                        content: "❌ Invalid activity type.",
                        ephemeral: true,
                    });
            }

            db.set("lastActivity", {
                type: activityType,
                description: activityDescription,
            });

            return interaction.reply({
                content: `✅ Successfully set activity to ${activityType} ${activityDescription}!`,
                ephemeral: true,
            });
        } catch (error) {
            console.error("Error setting activity:", error);
            return interaction.reply({
                content:
                    "❌ There was an error setting the activity. Please try again later.",
                ephemeral: true,
            });
        }
    },
};
