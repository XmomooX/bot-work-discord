module.exports = {
    name: "backuplist",
    description: "backup list",
    async execute(interaction, db) {
        const backups = await db.all();
        const backupList = backups
            .filter((b) => b.id.startsWith(`backup_`))
            .map((b) => b.id.replace("backup_", ""))
            .join("\n");

        if (!backupList) {
            return interaction.reply("No backups found.");
        }

        await interaction.reply(`Available backups:\n${backupList}`);
    },
};
