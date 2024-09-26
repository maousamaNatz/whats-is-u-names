const { gpt4o} = require("../libs/ai");
const { checkAuth } = require("../database/auth");
module.exports = {
    name: "gpt4o",
    middleware: checkAuth(["admin", "owner"]),
    description: "Menggunakan AI gpt 4o untuk menjawab pertanyaan",
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
          text: "Silakan masukkan pertanyaan Anda.",
        });
        return;
      }
  
      try {
        let response = await gpt4o(query);
        await sock.sendMessage(from, { text: response });
      } catch (error) {
        console.error("Error:", error);
        await sock.sendMessage(from, {
          text: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.",
        });
      }
    },
  };