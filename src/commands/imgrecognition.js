const { askAi } = require("../libs/ai");
const { checkAuth } = require("../database/auth");

module.exports = {
  name: "imagerecognition",
  middleware: checkAuth(["admin", "owner"]),
  description: "Mengenali objek dalam gambar menggunakan Google Vision API",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const imageMessage = message.message.imageMessage;

    if (!imageMessage) {
      await sock.sendMessage(from, {
        text: "Silakan kirim gambar yang ingin dianalisis.",
      });
      return;
    }

    try {
      const imageBuffer = await sock.downloadMediaMessage(message);
      const result = await askAi("googlevision", imageBuffer);

      let response = "Hasil analisis gambar:\n\n";
      result.forEach((item, index) => {
        response += `${index + 1}. ${item.description} (${(item.score * 100).toFixed(2)}%)\n`;
      });

      await sock.sendMessage(from, { text: response });
    } catch (error) {
      console.error("Error:", error);
      await sock.sendMessage(from, {
        text: "Maaf, terjadi kesalahan saat menganalisis gambar.",
      });
    }
  },
};