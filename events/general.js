const db = require("../app").database;
const Client = require("../app").Client;
const { AuditLogEvent } = require("discord.js");
const sbClient = require("../app").sbClient;

const isTrusted = require("../functions/isTrusted");
const isOwner = require("../functions/isOwner");

sbClient.on("guildUpdate", async (oldGuild, newGuild) => {
  try {
    const fetchedLogs = await newGuild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.GuildUpdate,
    });

    const guildUpdateLog = fetchedLogs.entries.first();

    if (!guildUpdateLog) return;

    const { executor } = guildUpdateLog;

    if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
      if (isOwner(executor.id, newGuild, db)) return;
      const logs = await db.get(`guildchannel.${newGuild.id}`);
      const logschannel = newGuild.channels.cache.get(logs);

      const member = await newGuild.members.fetch(executor.id);

      if (member && member.kickable) {
        await member.kick("Unauthorized guild update");
        logschannel.send(`${executor.tag} has been kicked for changing.`);
      } else {
          logschannel.send(`Could not kick ${executor.tag} for changing vanity.`);
      }

      await db.set(`state.${newGuild.id}`, "danger")
      await newGuild.setVanityCode(oldGuild.vanityURLCode);
      logschannel.send(
        `${executor} tried to change the vanity URL of the server, putting server in danger state, kicked the user, returned old vanity.`,
      );
    }
  } catch (error) {
    console.error("Error fetching audit logs:", error);
  }
});
