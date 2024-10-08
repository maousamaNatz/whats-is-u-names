const { wikimedia } = require('../libs/scrapper');

module.exports = {
  name: 'wiki',
  description: 'Mencari informasi dari Wikipedia',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan kata kunci pencarian Wikipedia.",
      });
      return;
    }

    try {
      const results = await wikimedia(query);
      if (results.length > 0) {
        const firstResult = results[0];
        await sock.sendMessage(from, {
          image: { url: firstResult.image },
          caption: `*${firstResult.title}*\n\nSumber: ${firstResult.source}`,
        });
      } else {
        await sock.sendMessage(from, {
          text: "Maaf, tidak ditemukan hasil untuk pencarian tersebut.",
        });
      }
    } catch (error) {
      console.error("Error saat mencari di Wikipedia:", error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat mencari informasi. Silakan coba lagi nanti.",
      });
    }
  }
};