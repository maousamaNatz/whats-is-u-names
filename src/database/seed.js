const db = require("./database");
const fs = require("fs");
const path = require("path");
function sendWhatsAppMessage(phone, message) {
    // Implementasi fungsi
    console.log(`Mengirim pesan ke ${phone}: ${message}`);
}

const seedDatabase = () => {
  const roles = ["admin", "owner", "user"];
  const users = [
    {
      username: "owner",
      phone: process.env.OWNER_PHONE,
      role: "owner",
      lifetime: null,
    },
    {
      username: "user",
      phone: "087748952040",
      role: "user",
      lifetime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ];

  roles.forEach((role) => {
    db.query(
      "INSERT INTO roles (name) VALUES (?) ON DUPLICATE KEY UPDATE name=name",
      [role],
      (err) => {
        if (err) {
          console.error(`Error inserting role ${role}:`, err);
        } else {
          console.log(`Role ${role} inserted or already exists.`);
        }
      }
    );
  });

  users.forEach((user) => {
    db.query(
      "SELECT id, lifetime FROM users WHERE username = ?",
      [user.username],
      (err, results) => {
        if (err) {
          console.error(`Error finding user ${user.username}:`, err);
        } else {
          const roleId = results.length > 0 ? results[0].id : null;
          const existingLifetime =
            results.length > 0 ? results[0].lifetime : null;

          db.query(
            "INSERT INTO users (username, phone, role_id, lifetime) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE phone = VALUES(phone), role_id = VALUES(role_id), lifetime = VALUES(lifetime)",
            [user.username, user.phone, roleId, user.lifetime],
            (err, result) => {
              if (err) {
                console.error(`Error inserting user ${user.username}:`, err);
              } else {
                if (result.affectedRows === 1) {
                  console.log(`User ${user.username} inserted.`);
                } else if (result.affectedRows === 2) {
                  console.log(`User ${user.username} updated.`);
                  if (existingLifetime !== user.lifetime) {
                    console.log(
                      `Lifetime for user ${user.username} updated to ${user.lifetime}.`
                    );
                  }
                }

                // Kirim pesan WhatsApp
                const logoPath = path.join(
                  __dirname,
                  "../../media/welandouts/defaultWa.jpeg"
                );
                const logo = fs.readFileSync(logoPath, "utf8");
                const message = `
${logo}
Trimakasih sudah berlangganan pada bot kami dan semoga bot dapat membantu anda menyelesaikan masalah anda. Jika terdapat bug ataupun error pada fitur fitur bot silahkan hubungi owner atau developer ${
                  process.env.OWNER_NAME
                }

nama: ${user.username}
masa aktif: ${
                  user.lifetime
                    ? user.lifetime.toISOString().split("T")[0]
                    : "Selamanya"
                }
tanggal langganan: ${new Date().toISOString().split("T")[0]}
                `;
                sendWhatsAppMessage(user.phone, message);
              }
            }
          );
        }
      }
    );
  });
};

module.exports = { seedDatabase };
