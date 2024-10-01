const { insertRoles, insertOrUpdateUser, users } = require("./seed");

async function seedDatabase(sock) {
  try {
    // Masukkan roles
    await insertRoles();

    // Masukkan atau update pengguna
    for (const user of users) {
      await insertOrUpdateUser(sock, user);
    }
  } catch (err) {
    console.error(`Error seeding database:`, err);
  }
}

module.exports = { seedDatabase };
