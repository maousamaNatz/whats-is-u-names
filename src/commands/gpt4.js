const { gpt4, chatgptFallback } = require("../libs/ai");
const { checkAuth } = require("../database/auth");

module.exports = {
    name: "gpt4",
    // middleware: checkAuth(["admin", "owner"]),
    description: "Menggunakan AI gpt 4 untuk menjawab pertanyaan",
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
        let response;
        // Contoh: menggunakan GPT-4 untuk pertanyaan pendek
        response = await gpt4(query).catch(() => {
          response = chatgptFallback(query);
        });
  
        await sock.sendMessage(from, { text: response });
      } catch (error) {
        console.error("Error:", error);
        await sock.sendMessage(from, {
          text: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.",
        });
      }
    },
  };