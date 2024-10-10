const { EmbedBuilder } = require("discord.js");
const { inspect } = require("util");

module.exports = {
    name: "eval",
    description: "owner's only",
    options: [
        {
            name: "code",
            description: "type a code to execute",
            type: 3,
            required: true,
        },
    ],
    async execute(interaction, db) {
        let toEval = interaction.options.getString("code");

        // Defer the reply to give more time for execution
        await interaction.deferReply();

        try {
            if (!toEval) {
                const embed = new EmbedBuilder()
                    .setTitle("EVAL")
                    .setColor(0x3498db) // Replace with a valid hex color
                    .setDescription("❌ Error: `Cannot evaluate nothing`")
                    .setThumbnail(interaction.member.user.displayAvatarURL())
                    .setFooter({ text: interaction.member.user.tag });

                return interaction.editReply({ embeds: [embed] });
            }

            let evaluated = inspect(eval(toEval, { depth: 0 }));

            if (evaluated.length > 1950) {
                const embed1 = new EmbedBuilder()
                    .setTitle("EVAL")
                    .setColor(0xe74c3c) // Replace with a valid hex color
                    .setDescription("❌ Error: `Request is too long.`")
                    .setThumbnail(interaction.member.user.displayAvatarURL())
                    .setFooter({ text: interaction.member.user.tag });

                return interaction.editReply({ embeds: [embed1] });
            }

            let hrDiff = process.hrtime(process.hrtime());
            const embed2 = new EmbedBuilder()
                .setTitle("EVAL")
                .setColor(0x2ecc71) // Replace with a valid hex color
                .setDescription(
                    `Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s` : ""}${hrDiff[1] / 1000000}ms.\n\`\`\`javascript\n${evaluated}\n\`\`\``,
                )
                .setThumbnail(interaction.member.user.displayAvatarURL())
                .setFooter({ text: interaction.member.user.tag });

            interaction.editReply({ embeds: [embed2] });
        } catch (e) {
            interaction.editReply({
                content: `An error occurred: \`${e.message}\``,
            });
        }
    },
};
