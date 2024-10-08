const { downloadMedia } = require('../libs/download');

module.exports = {
  name: 'dl' || 'download' || 'unduh' || 'downloads',
  description: 'Mengunduh media dari berbagai platform',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);

    if (args.length === 0) {
      await sock.sendMessage(from, { 
        text: 'Silakan masukkan URL media yang ingin diunduh.', 
        quoted: message 
      });
      return;
    }

    const url = args[0];

    try {
      await sock.sendMessage(from, { text: 'Sedang mengunduh media, mohon tunggu...' });
      
      const mediaPath = await downloadMedia(url);
      
      if (mediaPath.endsWith('.mp4')) {
        await sock.sendMessage(from, { 
          video: { url: mediaPath },
          quoted: message
        });
      } else if (mediaPath.endsWith('.mp3')) {
        await sock.sendMessage(from, { 
          audio: { url: mediaPath },
          mimetype: 'audio/mp4',
          quoted: message
        });
      } else {
        await sock.sendMessage(from, { 
          image: { url: mediaPath },
          caption: `Media berhasil diunduh dari ${url}`,
          quoted: message
        });
      }
    } catch (error) {
      console.error('Error saat mengunduh media:', error);
      await sock.sendMessage(from, { 
        text: `Terjadi kesalahan saat mengunduh media: ${error.message}`, 
        quoted: message 
      });
    }
  }
};