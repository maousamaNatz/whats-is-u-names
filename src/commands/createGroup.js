const { isGroupAdmin } = require("../utils/permission");

module.exports = {
  name: "createGroup",
  description: "Membuat grup baru dengan anggota yang disebutkan",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const sender = message.key.participant;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);

    if (args.length < 2) {
      await sock.sendMessage(from, {
        text: "Format: .createGroup <nama_grup> <nomor_telepon1> <nomor_telepon2> ...",
      });
      return;
    }

    const groupName = args[0];
    const numbers = args.slice(1).map(number => number.replace(/[^0-9]/g, '') + "@s.whatsapp.net");

    if (numbers.length === 0) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan setidaknya satu nomor telepon untuk ditambahkan ke grup.",
      });
      return;
    }

    try {
      const response = await sock.groupCreate(groupName, numbers);
      await sock.sendMessage(from, {
        text: `Grup "${groupName}" berhasil dibuat dengan anggota: ${numbers.map(jid => `@${jid.split('@')[0]}`).join(', ')}`,
        mentions: numbers
      });
    } catch (error) {
      console.error("Error saat membuat grup:", error);
      await sock.sendMessage(from, { text: "Terjadi kesalahan saat membuat grup." });
    }
  }
};