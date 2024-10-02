const { isGroupAdmin } = require("../utils/permission");

module.exports = {
  name: "kick",
  description: "Mengeluarkan anggota dari grup",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    
    // Periksa apakah pesan berasal dari grup
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, {
        text: "Perintah ini hanya dapat digunakan dalam grup.",
      });
      return;
    }

    const sender = message.key.participant;
    const mentioned = message.message.extendedTextMessage?.contextInfo?.mentionedJid;
    
    const isAdmin = await isGroupAdmin(sock, from, sender);
    if (!isAdmin) {
      await sock.sendMessage(from, { text: "Maaf, hanya admin grup yang dapat menggunakan perintah ini." });
      return;
    }

    if (!mentioned || mentioned.length === 0) {
      await sock.sendMessage(from, { text: "Silakan mention anggota yang ingin dikeluarkan." });
      return;
    }

    try {
      // Periksa apakah bot adalah admin
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const groupMetadata = await sock.groupMetadata(from);
      const isAdmin = groupMetadata.participants.some(p => p.id === botNumber && (p.admin === 'admin' || p.admin === 'superadmin'));

      if (!isAdmin) {
        await sock.sendMessage(from, { text: "Bot harus menjadi admin grup untuk mengeluarkan anggota." });
        return;
      }

      for (const user of mentioned) {
        if (user === sender) {
          await sock.sendMessage(from, { text: "Anda tidak dapat mengeluarkan diri sendiri." });
          continue;
        }
        
        await sock.groupParticipantsUpdate(from, [user], "remove");
        await sock.sendMessage(from, { text: `@${user.split('@')[0]} telah dikeluarkan dari grup.`, mentions: [user] });
      }
    } catch (error) {
      console.error("Error saat mengeluarkan anggota:", error);
      let errorMessage = "Terjadi kesalahan saat mengeluarkan anggota.";
      if (error.data === 401) {
        errorMessage = "Bot tidak memiliki izin untuk mengeluarkan anggota. Pastikan bot adalah admin grup.";
      }
      await sock.sendMessage(from, { text: errorMessage });
    }
  },
};