const { searchAnimeMAL } = require('../libs/scrapper');

module.exports = {
  name: 'searchanime',
  description: 'Mencari informasi anime di MyAnimeList',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan judul anime yang ingin dicari.",
      });
      return;
    }

    try {
      const results = await searchAnimeMAL(query);
      if (results.length > 0) {
        const anime = results[0];
        let response = `*${anime.title}*\n\n`;
        response += `Skor: ${anime.score}\n`;
        response += `Episode: ${anime.episodes}\n`;
        response += `Status: ${anime.status}\n`;
        response += `Sinopsis: ${anime.synopsis}\n\n`;
        response += `Link: ${anime.url}`;

        await sock.sendMessage(from, {
          image: { url: anime.image },
          caption: response,
        });
      } else {
        await sock.sendMessage(from, {
          text: "Maaf, tidak ditemukan anime dengan judul tersebut.",
        });
      }
    } catch (error) {
      console.error("Error saat mencari anime:", error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat mencari anime. Silakan coba lagi nanti.",
      });
    }
  }
};