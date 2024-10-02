const { isGroupAdmin } = require("../utils/permission");

module.exports = {
  name: "silent",
  description: "Mengatur grup agar hanya admin yang dapat mengirim pesan",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, {
        text: "Perintah ini hanya dapat digunakan dalam grup.",
      });
      return;
    }

    const sender = message.key.participant;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);

    const isAdmin = await isGroupAdmin(sock, from, sender);
    if (!isAdmin) {
      await sock.sendMessage(from, { text: "Maaf, hanya admin grup yang dapat menggunakan perintah ini." });
      return;
    }

    try {
      if (args[0] === "on") {
        await sock.groupSettingUpdate(from, 'announcement');
        await sock.sendMessage(from, { text: "Grup telah diatur agar hanya admin yang dapat mengirim pesan." });
      } else if (args[0] === "off") {
        await sock.groupSettingUpdate(from, 'not_announcement');
        await sock.sendMessage(from, { text: "Grup telah diatur agar semua anggota dapat mengirim pesan." });
      } else {
        await sock.sendMessage(from, { text: "Penggunaan: .silent on/off" });
      }
    } catch (error) {
      console.error("Error saat mengubah pengaturan grup:", error);
      await sock.sendMessage(from, { text: "Terjadi kesalahan saat mengubah pengaturan grup." });
    }
  },
};