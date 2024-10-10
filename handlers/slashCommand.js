const fs = require("fs");
const path = require("path");
const database = require("../app").database;
const db = database;

const commands = new Map();

function loadCommands(commandsDir) {
  const absolutePath = path.resolve(__dirname + "/../", commandsDir);
  const commandFiles = fs
    .readdirSync(absolutePath)
    .filter((file) => file.endsWith(".js"));
  console.log("Loading commands from:", absolutePath);

  for (const file of commandFiles) {
    console.log(`Loading command: ${file}`);
    const command = require(path.join(absolutePath, file));
    commands.set(command.name, command);
  }
}

async function registerCommands(client) {
  const commandData = Array.from(commands.values()).map((command) => ({
    name: command.name,
    description: command.description,
    options: command.options || [],
  }));

  try {
    await client.application.commands.set([]);

    await Promise.all(
      commandData.map((command) => client.application.commands.create(command)),
    );

    console.log("Successfully registered application (/) commands globally.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}

function handleInteractions(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, db);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });
}

async function init(client, commandsDir) {
  loadCommands(commandsDir);
  await registerCommands(client);
  handleInteractions(client);
}

module.exports = { init };
