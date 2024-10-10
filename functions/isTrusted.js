module.exports = async function isTrusted(db, userid, action) {
  const validActions = [
    "ban",
    "kick",
    "timeout",
    "prune",
    "vanityURL",
    "roles",
    "rolecreate",
    "roledelete",
	"channelcreate",
    "channeldelete"
  ];

  if (!validActions.includes(action)) return "Invalid action";

  let user = await db.get(`limits.${userid}`);
  let limit = await db.get(`limits.${userid}.actions.${action}`);

  if (!user || limit == null) {
    user = {
      actions: {
        ban: 1,
        kick: 1,
        timeout: 10,
        roles: 20,
        vanityURL: 0,
        prune: 0,
        rolecreate: 0,
        roledelete: 0,
      },
    };

    await db.set(`limits.${userid}`, user);
    limit = user.actions[action];
  }

  return limit;
};
