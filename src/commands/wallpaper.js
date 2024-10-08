const { wallpaper } = require('../libs/scrapper');

module.exports = {
  name: 'wallpaper',
  description: 'Mencari wallpaper berdasarkan kata kunci',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan kata kunci pencarian wallpaper.",
      });
      return;
    }

    try {
      const results = await wallpaper(query);
      if (results.length > 0) {
        const randomIndex = Math.floor(Math.random() * results.length);
        const selectedWallpaper = results[randomIndex];
        await sock.sendMessage(from, {
          image: { url: selectedWallpaper.image },
          caption: `Wallpaper untuk: ${query}\nSumber: ${selectedWallpaper.source}`,
        });
      } else {
        await sock.sendMessage(from, {
          text: "Maaf, tidak ditemukan wallpaper untuk pencarian tersebut.",
        });
      }
    } catch (error) {
      console.error("Error saat mencari wallpaper:", error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat mencari wallpaper. Silakan coba lagi nanti.",
      });
    }
  }
};