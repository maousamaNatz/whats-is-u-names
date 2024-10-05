const { isGroupAdmin } = require("../utils/permission");

module.exports = {
  name: "promote",
  description: "Mempromosikan anggota menjadi admin grup",
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
      await sock.sendMessage(from, { text: "Silakan mention anggota yang ingin dipromosikan." });
      return;
    }

    try {
      // Periksa apakah bot adalah admin
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const groupMetadata = await sock.groupMetadata(from);
      const botIsAdmin = groupMetadata.participants.some(p => p.id === botNumber && (p.admin === 'admin' || p.admin === 'superadmin'));

      if (!botIsAdmin) {
        await sock.sendMessage(from, { text: "Bot harus menjadi admin grup untuk mempromosikan anggota." });
        return;
      }

      for (const user of mentioned) {
        await sock.groupParticipantsUpdate(from, [user], "promote");
        await sock.sendMessage(from, { text: `@${user.split('@')[0]} telah dipromosikan menjadi admin grup.`, mentions: [user] });
      }
    } catch (error) {
      console.error("Error saat mempromosikan anggota:", error);
      await sock.sendMessage(from, { text: "Terjadi kesalahan saat mempromosikan anggota." });
    }
  }
};