const { sendWhatsAppMessage, generateMessage } = require("./genewmember");
const db = require("./database");
// Database seeding dan pengiriman pesan
async function seedDatabase(sock) {
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

  // Masukkan roles ke dalam tabel
  const insertRoles = async () => {
    for (const role of roles) {
      try {
        await new Promise((resolve, reject) => {
          db.query(
            "INSERT IGNORE INTO roles (name) VALUES (?)",
            [role],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
        console.log(`Role ${role} dimasukkan atau sudah ada.`);
      } catch (err) {
        console.error(`Error saat memasukkan role ${role}:`, err);
      }
    }
  };

  // Panggil fungsi insertRoles sebelum memproses pengguna
  await insertRoles();

  // Proses pengguna setelah memastikan roles sudah ada
  users.forEach((user) => {
    // Cari role_id berdasarkan nama role
    db.query(
      "SELECT id FROM roles WHERE name = ?",
      [user.role],
      (err, results) => {
        if (err) {
          console.error(`Error finding role for ${user.role}:`, err);
        } else if (results.length === 0) {
          console.error(`Role ${user.role} not found.`);
        } else {
          const roleId = results[0].id;

          // Cek apakah user sudah ada berdasarkan nomor telepon
          db.query(
            "SELECT id, lifetime FROM users WHERE phone = ?",
            [user.phone],
            (err, results) => {
              if (err) {
                console.error(`Error finding user ${user.phone}:`, err);
              } else if (results.length > 0) {
                const existingUser = results[0];

                // Jika user sudah ada, update hanya jika ada perubahan pada role_id atau lifetime
                db.query(
                  "UPDATE users SET role_id = ?, lifetime = ? WHERE id = ?",
                  [roleId, user.lifetime, existingUser.id],
                  (err) => {
                    if (err) {
                      console.error(
                        `Error updating user ${user.phone}:`,
                        err
                      );
                    } else {
                      console.log(`User ${user.phone} updated.`);

                      // Jika lifetime berubah, kirim pesan
                      if (existingUser.lifetime !== user.lifetime) {
                        sendWhatsAppMessage(
                          sock,
                          user.phone,
                          generateMessage(user)
                        );
                      }
                    }
                  }
                );
              } else {
                // Jika user belum ada, insert user baru
                db.query(
                  "INSERT INTO users (phone, role_id, lifetime) VALUES (?, ?, ?)",
                  [user.phone, roleId, user.lifetime],
                  (err) => {
                    if (err) {
                      console.error(
                        `Error inserting user ${user.phone}:`,
                        err
                      );
                    } else {
                      console.log(`User ${user.phone} inserted.`);
                      sendWhatsAppMessage(
                        sock,
                        user.phone,
                        generateMessage(user)
                      );
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  });
}

module.exports = { seedDatabase };
