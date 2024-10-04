const db = require("./database");

async function getUserAiTokens(userId, aiModel) {
  return new Promise((resolve, reject) => {
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
}

async function updateUserAiTokens(userId, aiModel, tokensLeft) {
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
  return new Promise((resolve, reject) => {
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
}

async function initializeUserAiTokens(userId, aiModel) {
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
          resolve(results);
        }
      }
    );
  });
}

async function getUserByPhone(phone) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM users WHERE phone = ?",
      [phone],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      }
    );
  });
}

module.exports = {
  getUserAiTokens,
  updateUserAiTokens,
  resetUserAiTokens,
  getUserByPhone,
  getRemainingTokens,
  initializeUserAiTokens
};