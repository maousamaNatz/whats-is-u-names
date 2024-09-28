const { isGroupAdmin } = require("../utils/permission");

module.exports = {
  name: "tagall",
  description: "Menandai semua anggota grup",
  async execute(sock, message) {
    const from = message.key.remoteJid;

    if (!message.isGroup) {
      await sock.sendMessage(from, {
        text: "Perintah ini hanya dapat digunakan dalam grup.",
      });
      return;
    }

    const sender = message.key.participant;
    const isAdmin = await isGroupAdmin(sock, from, sender);

    if (!isAdmin) {
      await sock.sendMessage(from, {
        text: "Maaf, hanya admin grup yang dapat menggunakan perintah ini.",
      });
      return;
    }

    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;

    let mentions = [];
    let text = "Menandai semua anggota grup:\n\n";

    for (let participant of participants) {
      mentions.push(participant.id);
      text += `@${participant.id.split("@")[0]}\n`;
    }

    await sock.sendMessage(from, { text: text, mentions: mentions });
  },
};
