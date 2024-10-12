const db = require("../database/connection");
const { isGroupAdmin } = require("../utils/permission");
module.exports = {
  name: "antilink",
  description: "Mengaktifkan atau menonaktifkan fitur antilink",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const sender = message.key.participant || message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);

    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: "Perintah ini hanya dapat digunakan dalam grup." });
      return;
    }

    const isAdmin = await isGroupAdmin(sock, from, sender);
    if (!isAdmin) {
      await sock.sendMessage(from, { text: "Maaf, hanya admin grup yang dapat menggunakan perintah ini." });
      return;
    }

    if (args.length === 0 || (args[0] !== "on" && args[0] !== "off")) {
      await sock.sendMessage(from, { text: "Penggunaan: .antilink on/off" });
      return;
    }

    const status = args[0] === "on" ? "active" : "nonactive";

    try {
      const [rows] = await db.promise().query("SELECT * FROM Grps WHERE id_group = ?", [from]);
      
      if (rows.length === 0) {
        const groupInfo = await sock.groupMetadata(from);
        await db.promise().query("INSERT INTO Grps (name_group, id_group, status) VALUES (?, ?, ?)", [groupInfo.subject, from, status]);
      } else {
        await db.promise().query("UPDATE Grps SET status = ? WHERE id_group = ?", [status, from]);
      }

      await sock.sendMessage(from, { text: `Fitur antilink telah ${status === "active" ? "diaktifkan" : "dinonaktifkan"}.` });
    } catch (error) {
      console.error("Error saat mengubah status antilink:", error);
      await sock.sendMessage(from, { text: "Terjadi kesalahan saat mengubah status antilink." });
    }
  }
};