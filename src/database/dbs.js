const NodeCache = require("node-cache");
const db = require("./connection");
const queryCache = new NodeCache({ stdTTL: 600 }); // Cache selama 10 menit
const userCache = new NodeCache({ stdTTL: 600 }); // Cache untuk user selama 10 menit

async function cachedQuery(query, params) {
  const cacheKey = `${query}_${JSON.stringify(params)}`;
  let result = queryCache.get(cacheKey);
  
  if (result === undefined) {
    const [rows] = await db.promise().query(query, params);
    result = rows;
    queryCache.set(cacheKey, result);
  }
  
  return result;
}

// const getUserStmt = db.prepare("SELECT * FROM users WHERE phone = ?");

function getUserByPhonePrepared(phone) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM users WHERE phone = ?", [phone], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
}

async function getUsers(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  return await cachedQuery("SELECT * FROM users LIMIT ? OFFSET ?", [limit, offset]);
}

async function getUserByPhone(phone) {
  const cacheKey = `user_${phone}`;
  let user = userCache.get(cacheKey);
  
  if (user === undefined) {
    const rows = await cachedQuery("SELECT * FROM users WHERE phone = ?", [phone]);
    user = rows[0];
    if (user) {
      userCache.set(cacheKey, user);
    }
  }
  
  return user;
}

module.exports = {
  userCache,
  queryCache,
  cachedQuery,
  getUserByPhonePrepared,
  getUsers,
  getUserByPhone
};

