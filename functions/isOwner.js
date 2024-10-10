module.exports = async function isOwner(userid, db) {
  const isOwner = await db.get(`owners.${userid}`);
  return !!isOwner;
};
