const { stableDiff } = require("../libs/ai");
const { checkAuth } = require("../database/auth");

module.exports = {
  name: "stablediffusion",
  middleware: checkAuth(["admin", "owner"]),
  description: "Menggunakan Stable Diffusion untuk menghasilkan gambar",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const prompt = text.split(" ").slice(1).join(" ");

    if (!prompt) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan prompt untuk menghasilkan gambar.",
      });
      return;
    }

    try {
      const imageBuffer = await stableDiff(prompt);
      await sock.sendMessage(from, {
        image: imageBuffer,
        caption: `Hasil gambar untuk prompt: "${prompt}"`,
      });
    } catch (error) {
      console.error("Error:", error);
      await sock.sendMessage(from, {
        text: "Maaf, terjadi kesalahan saat menghasilkan gambar. Silakan coba lagi nanti.",
      });
    }
  },
};