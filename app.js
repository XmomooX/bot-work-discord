const { Client, Events, GatewayIntentBits } = require("discord.js");
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

module.exports.Client = client;
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
