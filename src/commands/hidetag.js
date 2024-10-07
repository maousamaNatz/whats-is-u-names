const { isGroupAdmin } = require("../utils/permission");

module.exports = {
  name: "hidetag",
  description: "Mengirim pesan dengan menandai semua anggota grup secara tersembunyi",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";
    const args = text.split(" ").slice(1);

    const isGroup = from.endsWith("@g.us");
    if (!isGroup) {
      await sock.sendMessage(from, { text: "Perintah ini hanya dapat digunakan dalam grup." });
      return;
    }

    const sender = message.key.participant;
    const isAdmin = await isGroupAdmin(sock, from, sender);

    if (!isAdmin) {
      await sock.sendMessage(from, { text: "Maaf, hanya admin grup yang dapat menggunakan perintah ini." });
      return;
    }

    if (args.length === 0) {
      await sock.sendMessage(from, { text: "Silakan masukkan pesan yang ingin dikirim." });
      return;
    }

    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;

    let mentions = participants.map((p) => p.id || p.jid);
    let hideTagMessage = `${args.join(" ")}`;

    await sock.sendMessage(from, { text: hideTagMessage, mentions: mentions });
  },
};