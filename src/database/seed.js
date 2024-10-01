const { sendWhatsAppMessage, generateMessage } = require("./genewmember");
const db = require("./database");

const roles = ["admin", "owner", "user"];
const users = [
  { phone: '628817637853', role: "admin", lifetime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { phone: process.env.OWNER_PHONE, role: "owner", lifetime: null },
  {
    phone: "6287748952040",
    role: "user",
    lifetime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
];

// Fungsi untuk menambahkan role jika belum ada
const insertRoles = async () => {
  for (const role of roles) {
    try {
      // Cek apakah role sudah ada
      const [roleResults] = await db.promise().query(
        "SELECT id FROM roles WHERE name = ?",
        [role]
      );

      if (roleResults.length > 0) {
        console.log(`Role ${role} sudah ada, tidak akan ditambahkan.`);
      } else {
        // Tambahkan role jika belum ada
        await db.promise().query(
          "INSERT INTO roles (name) VALUES (?)",
          [role]
        );
        console.log(`Role ${role} berhasil ditambahkan.`);
      }
    } catch (err) {
      console.error(`Error saat memasukkan role ${role}:`, err);
    }
  }
};

// Fungsi untuk menambahkan atau memperbarui pengguna
const insertOrUpdateUser = async (sock, user) => {
  try {
    const [roleResults] = await db.promise().query(
      "SELECT id FROM roles WHERE name = ?",
      [user.role]
    );

    if (roleResults.length === 0) {
      throw new Error(`Role ${user.role} tidak ditemukan.`);
    }

    const roleId = roleResults[0].id;

    const [userResults] = await db.promise().query(
      "SELECT id, phone, lifetime FROM users WHERE phone = ?",
      [user.phone]
    );

    if (userResults.length > 0) {
      const existingUser = userResults[0];

      // Jika user sudah ada, update jika ada perubahan pada role_id atau lifetime
      if (existingUser.lifetime !== user.lifetime || existingUser.role_id !== roleId) {
        await db.promise().query(
          "UPDATE users SET role_id = ?, lifetime = ? WHERE id = ?",
          [roleId, user.lifetime, existingUser.id]
        );
        console.log(`User ${user.phone} diperbarui.`);

        if (sock && sock.user) {
          sendWhatsAppMessage(sock, user.phone, generateMessage(user));
        } else {
          console.log(`Koneksi WhatsApp belum siap. Pesan untuk ${user.phone} akan dikirim nanti.`);
        }
      } else {
        console.log(`User ${user.phone} sudah ada dengan data yang sama. Tidak ada perubahan yang dilakukan.`);
      }
    } else {
      // Jika user belum ada, insert user baru
      await db.promise().query(
        "INSERT INTO users (phone, role_id, lifetime) VALUES (?, ?, ?)",
        [user.phone, roleId, user.lifetime]
      );
      console.log(`User ${user.phone} berhasil ditambahkan.`);
      sendWhatsAppMessage(sock, user.phone, generateMessage(user));
    }
  } catch (err) {
    console.error(`Error saat memproses user ${user.phone}:`, err);
  }
};

module.exports = { insertRoles, insertOrUpdateUser, users };
