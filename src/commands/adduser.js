const db = require("../database/database");
const { checkAuth } = require("../database/auth");
const { insertOrUpdateUser } = require("../database/seed");
const {
  generateMessage,
  sendWhatsAppMessage,
} = require("../database/genewmember");

module.exports = {
  name: "adduser",
  middleware: checkAuth(["owner"]),
  description: "Menambahkan pengguna baru ke database",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";
    const args = text.split(" ").slice(1);

    if (args.length < 3) {
      await sock.sendMessage(from, {
        text: "Format: .adduser <nomor_telepon> <role> <lifetime_dalam_hari>",
      });
      return;
    }

    const [phone, role, lifetime] = args;
    let lifetimeDate = null;
    if (lifetime !== "unlimited") {
      lifetimeDate = new Date();
      lifetimeDate.setDate(lifetimeDate.getDate() + parseInt(lifetime));
    }

    try {
      // Cek apakah user sudah ada di database
      const [existingUser] = await db
        .promise()
        .query("SELECT * FROM users WHERE phone = ?", [phone]);

      if (existingUser.length > 0) {
        await sock.sendMessage(from, {
          text: `Pengguna dengan nomor ${phone} sudah ada dalam database.`,
        });
        return;
      }

      // Cek apakah role valid
      const [roleResult] = await db
        .promise()
        .query("SELECT id FROM roles WHERE name = ?", [role]);

      if (roleResult.length === 0) {
        await sock.sendMessage(from, {
          text: `Role '${role}' tidak valid.`,
        });
        return;
      }

      const roleId = roleResult[0].id;

      // Buat objek user baru
      const newUser = {
        phone,
        role,
        lifetime: lifetimeDate,
      };

      // Gunakan insertOrUpdateUser untuk menambahkan user baru
      await insertOrUpdateUser(sock, newUser);

      const welcomeMessage = generateMessage(newUser, true);
      await sendWhatsAppMessage(
        sock,
        phone + "@s.whatsapp.net",
        welcomeMessage
      );

      await sock.sendMessage(from, {
        text: `Pengguna dengan nomor ${phone} berhasil ditambahkan sebagai ${role} dengan masa aktif ${
          lifetime === "unlimited" ? "selamanya" : lifetime + " hari"
        }.`,
      });
    } catch (error) {
      console.error("Error saat menambahkan pengguna:", error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat menambahkan pengguna.",
      });
    }
  },
};
