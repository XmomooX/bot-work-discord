const isOwner = require("../functions/isOwner");
const lockdown = require("../functions/lockdown");

module.exports = {
    name: "lockdown",
    description: "Lock the server down",
    async execute(interaction, db) {
        // if (await isOwner(interaction.user.id, interaction.guild, db)) {
        //     return await interaction.reply("Invalid permissions");
        // }

        const logchannel = await db.get(`logchannel.${interaction.guild.id}`);
        const ch = interaction.guild.channels.cache.get(logchannel);
        if (ch) {
            ch.send(
                `${interaction.commandName} was used by ${interaction.user.username}`,
            );
        }

        await interaction.deferReply();

        try {
            const result = await lockdown(interaction.guild, db);
            await interaction.editReply(result);
        } catch (error) {
            await interaction.editReply(error.message);
        }
    },
};
