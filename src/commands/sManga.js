const { searchMangaMAL } = require('../libs/scrapper');

module.exports = {
  name: 'searchmanga',
  description: 'Mencari informasi manga di MyAnimeList',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan judul manga yang ingin dicari.",
      });
      return;
    }

    try {
      const results = await searchMangaMAL(query);
      if (results.length > 0) {
        const manga = results[0];
        let response = `*${manga.title}*\n\n`;
        response += `Skor: ${manga.score}\n`;
        response += `Volume: ${manga.volumes || 'Tidak diketahui'}\n`;
        response += `Chapter: ${manga.chapters || 'Tidak diketahui'}\n`;
        response += `Status: ${manga.status}\n`;
        response += `Genre: ${manga.genres.join(', ')}\n`;
        response += `Sinopsis: ${manga.synopsis}\n\n`;
        response += `Link: ${manga.url}`;

        await sock.sendMessage(from, {
          image: { url: manga.image },
          caption: response,
        });
      } else {
        await sock.sendMessage(from, {
          text: "Maaf, tidak ditemukan manga dengan judul tersebut.",
        });
      }
    } catch (error) {
      console.error("Error saat mencari manga:", error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat mencari manga. Silakan coba lagi nanti.",
      });
    }
  }
};