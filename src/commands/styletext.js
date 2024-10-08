const { styletext } = require('../libs/scrapper');

module.exports = {
  name: 'styletext',
  description: 'Mengubah gaya teks',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan teks yang ingin diubah gayanya.",
      });
      return;
    }

    try {
      const results = await styletext(query);
      if (results.length > 0) {
        let response = "*Hasil Perubahan Gaya Teks*\n\n";
        results.forEach((style, index) => {
          if (index < 10) { // Batasi hanya 10 gaya untuk menghindari pesan terlalu panjang
            response += `${style.name}: ${style.result}\n\n`;
          }
        });
        await sock.sendMessage(from, { text: response });
      } else {
        await sock.sendMessage(from, {
          text: "Maaf, tidak dapat mengubah gaya teks saat ini.",
        });
      }
    } catch (error) {
      console.error("Error saat mengubah gaya teks:", error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat mengubah gaya teks. Silakan coba lagi nanti.",
      });
    }
  }
};