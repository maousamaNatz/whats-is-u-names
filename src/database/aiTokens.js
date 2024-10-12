const { getUserByPhone } = require("./dbs");
const db = require("./connection");
const NodeCache = require('node-cache');
const aiTokensCache = new NodeCache({ stdTTL: 300 }); // Cache selama 5 menit

async function getUserAiTokens(userId, aiModel) {
  const cacheKey = `aiTokens_${userId}_${aiModel}`;
  let tokens = aiTokensCache.get(cacheKey);
  
  if (tokens === undefined) {
    tokens = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM ai_tokens WHERE user_id = ? AND ai_model = ?",
        [userId, aiModel],
        (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results[0]);
          }
        }
      );
    });
    
    if (tokens) {
      aiTokensCache.set(cacheKey, tokens);
    }
  }
  
  return tokens;
}

async function updateUserAiTokens(userId, aiModel, tokensLeft) {
  const cacheKey = `aiTokens_${userId}_${aiModel}`;
  
  return new Promise((resolve, reject) => {
    if (!userId) {
      reject(new Error("userId tidak boleh kosong"));
      return;
    }
    db.query(
      "INSERT INTO ai_tokens (user_id, ai_model, tokens_left, last_used) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE tokens_left = ?, last_used = NOW()",
      [userId, aiModel, tokensLeft, tokensLeft],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          aiTokensCache.set(cacheKey, { user_id: userId, ai_model: aiModel, tokens_left: tokensLeft, last_used: new Date() });
          resolve(results);
        }
      }
    );
  });
}

async function resetUserAiTokens(userId, aiModel) {
  return updateUserAiTokens(userId, aiModel, 1000);
}

async function getRemainingTokens(userId, aiModel) {
  const cacheKey = `aiTokens_${userId}_${aiModel}`;
  let tokens = aiTokensCache.get(cacheKey);
  
  if (tokens === undefined) {
    tokens = await new Promise((resolve, reject) => {
      db.query(
        "SELECT tokens_left, last_used FROM ai_tokens WHERE user_id = ? AND ai_model = ?",
        [userId, aiModel],
        (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results[0] || { tokens_left: 12, last_used: new Date() });
          }
        }
      );
    });
    
    if (tokens) {
      aiTokensCache.set(cacheKey, tokens);
    }
  }
  
  return tokens;
}

async function initializeUserAiTokens(userId, aiModel) {
  const cacheKey = `aiTokens_${userId}_${aiModel}`;
  
  return new Promise((resolve, reject) => {
    if (!userId) {
      reject(new Error("userId tidak boleh kosong"));
      return;
    }
    db.query(
      "INSERT INTO ai_tokens (user_id, ai_model, tokens_left, last_used) VALUES (?, ?, 12, NOW()) ON DUPLICATE KEY UPDATE tokens_left = tokens_left",
      [userId, aiModel],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          aiTokensCache.set(cacheKey, { user_id: userId, ai_model: aiModel, tokens_left: 12, last_used: new Date() });
          resolve(results);
        }
      }
    );
  });
}

async function getUserByPhoneRedis(phone) {
  return new Promise((resolve, reject) => {
    client.get(`user:${phone}`, async (err, result) => {
      if (err) {
        reject(err);
      } else if (result) {
        resolve(JSON.parse(result));
      } else {
        const user = await getUserByPhone(phone);
        if (user) {
          client.setex(`user:${phone}`, 3600, JSON.stringify(user)); // Simpan selama 1 jam
        }
        resolve(user);
      }
    });
  });
}

module.exports = {
  getUserAiTokens,
  updateUserAiTokens,
  resetUserAiTokens,
  getUserByPhone,
  getRemainingTokens,
  initializeUserAiTokens,
  getUserByPhoneRedis,
};
