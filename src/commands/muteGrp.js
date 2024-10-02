const { isGroupAdmin } = require("../utils/permission");

module.exports = {
  name: "mute",
  description: "Mematikan notifikasi grup untuk jangka waktu tertentu",
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

    if (args.length === 0) {
      await sock.sendMessage(from, { text: "Silakan masukkan durasi mute (dalam menit). Contoh: .mute 60" });
      return;
    }

    const duration = parseInt(args[0]);
    if (isNaN(duration) || duration <= 0) {
      await sock.sendMessage(from, { text: "Durasi harus berupa angka positif." });
      return;
    }

    try {
      await sock.groupSettingUpdate(from, 'announcement');
      
      setTimeout(async () => {
        await sock.groupSettingUpdate(from, 'not_announcement');
        await sock.sendMessage(from, { text: "Grup telah di-unmute secara otomatis." });
      }, duration * 60000);

      await sock.sendMessage(from, { text: `Grup telah di-mute selama ${duration} menit.` });
    } catch (error) {
      console.error("Error saat mute grup:", error);
      await sock.sendMessage(from, { text: "Terjadi kesalahan saat mute grup." });
    }
  },
};