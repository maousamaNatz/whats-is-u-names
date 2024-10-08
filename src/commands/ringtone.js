const { ringtone } = require('../libs/scrapper');

module.exports = {
  name: 'ringtone',
  description: 'Mencari ringtone berdasarkan kata kunci',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan kata kunci pencarian ringtone.",
      });
      return;
    }

    try {
      const results = await ringtone(query);
      if (results.length > 0) {
        const firstResult = results[0];
        await sock.sendMessage(from, {
          audio: { url: firstResult.audio },
          mimetype: 'audio/mp3',
          fileName: `${firstResult.title}.mp3`,
          caption: `*${firstResult.title}*\n\nSumber: ${firstResult.source}`,
        });
      } else {
        await sock.sendMessage(from, {
          text: "Maaf, tidak ditemukan ringtone untuk pencarian tersebut.",
        });
      }
    } catch (error) {
      console.error("Error saat mencari ringtone:", error);
      await sock.sendMessage(from, {
        text: "Terjadi kesalahan saat mencari ringtone. Silakan coba lagi nanti.",
      });
    }
  }
};