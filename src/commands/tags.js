const { isGroupAdmin } = require("../utils/permission");

module.exports = {
  name: "tagall",
  description: "Menandai semua anggota grup",
  async execute(sock, message) {
    const from = message.key.remoteJid;

    // Cek apakah dari grup
    const isGroup = from.endsWith("@g.us");
    if (!isGroup) {
      await sock.sendMessage(from, { text: "Perintah ini hanya dapat digunakan dalam grup.", quoted: message });
      return;
    }

    const sender = message.key.participant;
    const isAdmin = await isGroupAdmin(sock, from, sender);

    if (!isAdmin) {
      await sock.sendMessage(from, { text: "Maaf, hanya admin grup yang dapat menggunakan perintah ini.", quoted: message });
      return;
    }

    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;

    let mentions = [];
    let text = "";
    let count = 0;

    for (let participant of participants) {
      const participantId = participant.id || participant.jid;
      mentions.push(participantId);
      text += `@${participantId.split("@")[0]}`;
      count++;
      if (count < participants.length) {
        text += " ";
      }
    }

    await sock.sendMessage(from, {mentions: mentions , text: text, quoted: message});
  },
};
