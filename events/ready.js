const Client = require("../app").Client;
const sbClient = require("../app").sbClient;

const CommandHandler = require("../handlers/slashCommand");

Client.once("ready", async () => {
    console.log(`Logged in as ${Client.user.tag}!`);
    await CommandHandler.init(Client, "./slashCommands");
});

sbClient.once("ready", () => {
    console.log(`Self bot logged in as ${sbClient.user.tag}!`);
});
