const Client = require("../app").Client;
const CommandHandler = require("../handlers/slashCommand");

Client.once("ready", async () => {
    console.log(`Logged in as ${Client.user.tag}!`);
    await CommandHandler.init(Client, "./slashCommands");
});
