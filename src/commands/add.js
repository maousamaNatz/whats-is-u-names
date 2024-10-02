const { isGroupAdmin } = require("../utils/permission");

module.exports = {
  name: "add" ,
  description: "Menambahkan anggota ke dalam grup",
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
      await sock.sendMessage(from, { text: "Silakan masukkan nomor telepon yang ingin ditambahkan." });
      return;
    }

    const numbers = args.map(arg => arg.replace(/[^0-9]/g, '') + "@s.whatsapp.net");

    try {
      const response = await sock.groupParticipantsUpdate(from, numbers, "add");
      for (const res of response) {
        if (res.status === "200") {
          await sock.sendMessage(from, { text: `@${res.jid.split('@')[0]} berhasil ditambahkan ke grup.`, mentions: [res.jid] });
        } else if (res.status === "403") {
          await sock.sendMessage(from, { text: `Gagal menambahkan @${res.jid.split('@')[0]}. Nomor tersebut mungkin telah keluar dari WhatsApp atau memiliki pengaturan privasi yang membatasi.`, mentions: [res.jid] });
        } else {
          await sock.sendMessage(from, { text: `Gagal menambahkan @${res.jid.split('@')[0]}. Status: ${res.status}`, mentions: [res.jid] });
        }
      }
    } catch (error) {
      console.error("Error saat menambahkan anggota:", error);
      await sock.sendMessage(from, { text: "Terjadi kesalahan saat menambahkan anggota." });
    }
  },
};