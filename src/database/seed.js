const { sendWhatsAppMessage, generateMessage } = require("./genewmember");
const db = require("./connection");
const { cachedQuery, getUserByPhonePrepared, userCache } = require('./dbs');
const roles = ["admin", "owner", "user"];
const users = [
  {
    phone: "628817637853",
    role: "admin",
    lifetime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  { phone: process.env.OWNER_PHONE, role: "owner", lifetime: null },
  {
    phone: "6287748952040",
    role: "user",
    lifetime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    phone: "6281215911578",
    role: "user",
    lifetime: null,
  },
];

// Fungsi untuk menambahkan role jika belum ada
const insertRoles = async () => {
  for (const role of roles) {
    try {
      // Cek apakah role sudah ada
      const [roleResults] = await db
        .promise()
        .query("SELECT id FROM roles WHERE name = ?", [role]);

      if (roleResults.length > 0) {
        console.log(`Role ${role} sudah ada, tidak akan ditambahkan.`);
      } else {
        // Tambahkan role jika belum ada
        await db.promise().query("INSERT INTO roles (name) VALUES (?)", [role]);
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
    const roleId = await cachedQuery("SELECT id FROM roles WHERE name = ?", [user.role]);
    if (!roleId || roleId.length === 0) {
      throw new Error(`Role ${user.role} tidak ditemukan.`);
    }

    const existingUser = await getUserByPhonePrepared(user.phone);

    if (existingUser) {
      if (existingUser.lifetime !== user.lifetime || existingUser.role_id !== roleId[0].id) {
        await db.promise().query("UPDATE users SET role_id = ?, lifetime = ? WHERE id = ?", [
          roleId[0].id,
          user.lifetime,
          existingUser.id,
        ]);
        console.log(`User ${user.phone} diperbarui.`);

        userCache.set(`user_${user.phone}`, { ...existingUser, role_id: roleId[0].id, lifetime: user.lifetime });

        if (sock && sock.user) {
          sendWhatsAppMessage(sock, user.phone, generateMessage(user));
        } else {
          console.log(`Koneksi WhatsApp belum siap. Pesan untuk ${user.phone} akan dikirim nanti.`);
        }
      } else {
        console.log(`User ${user.phone} sudah ada dengan data yang sama. Tidak ada perubahan yang dilakukan.`);
      }
    } else {
      const [result] = await db.promise().query(
        "INSERT INTO users (phone, role_id, lifetime) VALUES (?, ?, ?)",
        [user.phone, roleId[0].id, user.lifetime]
      );
      console.log(`User ${user.phone} berhasil ditambahkan.`);

      userCache.set(`user_${user.phone}`, { id: result.insertId, phone: user.phone, role_id: roleId[0].id, lifetime: user.lifetime });

      const welcomeMessage = generateMessage(user, true);
      if (sock && sock.user) {
        await sendWhatsAppMessage(sock, user.phone, welcomeMessage);
      } else {
        console.log(`Koneksi WhatsApp belum siap. Pesan selamat datang untuk ${user.phone} akan dikirim nanti.`);
      }
    }
  } catch (err) {
    console.error(`Error saat memproses user ${user.phone}:`, err);
  }
};

module.exports = { insertRoles, insertOrUpdateUser, users };
