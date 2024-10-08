const { quotesAnime } = require('../libs/scrapper');

module.exports = {
  name: 'animequote',
  description: 'Mencari kutipan anime secara acak',
  async execute(sock, message) {
    const from = message.key.remoteJid;

    try {
      const quotes = await quotesAnime();
      if (quotes.length > 0) {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        const response = `*Kutipan Anime*\n\n"${randomQuote.quotes}"\n\n- ${randomQuote.karakter} (${randomQuote.anime})\nEpisode: ${randomQuote.episode}`;
        
        await sock.sendMessage(from, {
          image: { url: randomQuote.gambar },
          caption: response,
        });
      } else {
        await sock.sendMessage(from, {
          text: "Maaf, tidak ditemukan kutipan anime saat ini.",
        });
      }
    } catch (error) {
      console.error("Error saat mencari kutipan anime:", error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat mencari kutipan anime. Silakan coba lagi nanti.",
      });
    }
  }
};