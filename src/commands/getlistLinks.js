const { isGroupAdmin } = require("../utils/permission");
const db = require("../database/connection");

module.exports = {
  name: "linklist",
  description: "Menampilkan daftar tautan yang telah dihapus",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const sender = message.key.participant || message.key.remoteJid;

    if (!from.endsWith("@g.us")) {
      await sock.sendMessage(from, {
        text: "Perintah ini hanya dapat digunakan dalam grup.",
      });
      return;
    }

    const isAdmin = await isGroupAdmin(sock, from, sender);
    if (!isAdmin) {
      await sock.sendMessage(from, {
        text: "Maaf, hanya admin grup yang dapat menggunakan perintah ini.",
      });
      return;
    }

    try {
      const [groupRow] = await db
        .promise()
        .query("SELECT id FROM Grps WHERE id_group = ?", [from]);
      if (groupRow.length === 0) {
        await sock.sendMessage(from, {
          text: "Grup ini belum terdaftar dalam database antilink.",
        });
        return;
      }

      const [links] = await db
        .promise()
        .query(
          "SELECT link, timestamp FROM links WHERE id_grps = ? ORDER BY timestamp DESC LIMIT 10",
          [groupRow[0].id]
        );

      if (links.length === 0) {
        await sock.sendMessage(from, {
          text: "Belum ada tautan yang dihapus dalam grup ini.",
        });
        return;
      }

      let message = "Daftar 10 tautan terakhir yang dihapus:\n\n";
      links.forEach((link, index) => {
        message += `${index + 1}. ${link.link}\n   Dihapus pada: ${link.timestamp}\n\n`;
      });

      await sock.sendMessage(from, { text: message });
    } catch (error) {
      console.error("Error saat mengambil daftar tautan:", error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat mengambil daftar tautan.",
      });
    }
  },
};
