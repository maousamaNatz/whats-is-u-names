const { gemini15flash } = require("../libs/ai");
const { checkAuth } = require("../database/auth");

module.exports = {
  name: "gemini",
  // middleware: checkAuth(["admin", "owner"]),
  description: "Menggunakan AI Gemini untuk menjawab pertanyaan",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";
    const args = text.split(" ").slice(1);
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan pertanyaan Anda untuk Gemini.",
      });
      return;
    }

    try {
      const response = await gemini15flash(query);
      await sock.sendMessage(from, { text: response });
    } catch (error) {
      console.error("Error:", error);
      await sock.sendMessage(from, {
        text: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda dengan Gemini.",
      });
    }
  },
};