module.exports = async function isOwner(userid, guildId, db) {
  const isOwner = await db.get(`owners.${userid}`);
  const isGuildOwner = await db.get(`guilds.${guildId}.owner`);
  return !!isOwner || isGuildOwner == userid;
};
