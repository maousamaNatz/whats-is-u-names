const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
  name: 'removebg',
  description: 'Menghapus background dari gambar',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const imageMessage = message.message.imageMessage;

    if (!imageMessage) {
      await sock.sendMessage(from, {
        text: "Silakan kirim gambar yang ingin dihapus backgroundnya.",
      });
      return;
    }

    try {
      const imageBuffer = await downloadContentFromMessage(imageMessage, 'image');
      const tempFilePath = path.join(__dirname, '../../media/downloads', 'temp_image.jpg');
      await fs.writeFile(tempFilePath, imageBuffer);

      const formData = new FormData();
      formData.append('image_file', await fs.readFile(tempFilePath), 'image.jpg');

      const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': 'QxZVNZsoEeMZDYHhxaQJHeSr',
        },
        responseType: 'arraybuffer',
      });

      const outputFilePath = path.join(__dirname, '../../media/downloads', 'no_bg_image.png');
      await fs.writeFile(outputFilePath, response.data);

      await sock.sendMessage(from, {
        image: { url: outputFilePath },
        caption: 'Gambar tanpa background',
      });

      // Hapus file temporary
      await fs.unlink(tempFilePath);
    } catch (error) {
      console.error('Error:', error);
      await sock.sendMessage(from, {
        text: "Maaf, terjadi kesalahan saat menghapus background gambar.",
      });
    }
  },
};