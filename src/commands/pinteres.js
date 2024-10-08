const { pinterest } = require('../libs/scrapper');

module.exports = {
  name: 'pinterest',
  description: 'Mencari gambar di Pinterest berdasarkan kata kunci',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan kata kunci pencarian Pinterest.",
      });
      return;
    }

    try {
      const results = await pinterest(query);
      if (results.length > 0) {
        const randomIndex = Math.floor(Math.random() * results.length);
        const selectedImage = results[randomIndex];
        await sock.sendMessage(from, {
          image: { url: selectedImage },
          caption: `Hasil pencarian Pinterest untuk: ${query}`,
        });
      } else {
        await sock.sendMessage(from, {
          text: "Maaf, tidak ditemukan gambar di Pinterest untuk pencarian tersebut.",
        });
      }
    } catch (error) {
      console.error("Error saat mencari di Pinterest:", error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat mencari di Pinterest. Silakan coba lagi nanti.",
      });
    }
  }
};