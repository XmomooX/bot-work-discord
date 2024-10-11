const { Client, GatewayIntentBits } = require("discord.js");
const Discord = require("discord.js-selfbot-v13");
const { config } = require("dotenv");
const fs = require("fs");
const { QuickDB } = require("quick.db");

const db = new QuickDB();
//.env config
config();

//creating the client
const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a) => {
        return GatewayIntentBits[a];
    }),
});
const selfbotclient = new Discord.Client();

module.exports.Client = client;
module.exports.sbClient = selfbotclient;
module.exports.database = db;
//events handler
fs.readdirSync("./events/").forEach((file) => {
    let files = fs
        .readdirSync("./events/")
        .filter((file) => file.endsWith(".js"));
    if (files.length <= 0) return;

    files.forEach((event) => {
        try {
            const getEvent = require(`./events/${event}`);
        } catch (error) {
            console.log(error);
        }
    });
});

//login to bot
client.login(process.env.TOKEN);
selfbotclient.login(process.env.SELFBOT_TOKEN);
