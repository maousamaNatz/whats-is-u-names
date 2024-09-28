const { askAi } = require("../libs/ai");
const { checkAuth } = require("../database/auth");
module.exports = {
  name: "lepton",
  // middleware: checkAuth(["admin", "owner"]),
  description: "Menggunakan AI untuk menjawab pertanyaan",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const query = message.message.conversation;

    // if (!query) {
    //   await sock.sendMessage(from, {
    //     text: "Silakan masukkan pertanyaan Anda.",
    //   });
    //   return;
    // }

    try {
      let response = await askAi("lepton", query);
      await sock.sendMessage(from, {
        text: response,
      });
    } catch (error) {
      console.error(error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat menjawab pertanyaan.",
      });
    }
  },
};
