const { WebpToMp4, webpTojpg } = require('../libs/scrapper');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
  name: 'convertsticker',
  description: 'Mengkonversi stiker ke MP4 atau JPG',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const quotedMessage = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMessage || !quotedMessage.stickerMessage) {
      await sock.sendMessage(from, { text: 'Silakan balas sebuah stiker dengan perintah ini.' });
      return;
    }

    const stickerMessage = quotedMessage.stickerMessage;
    const mediaType = stickerMessage.isAnimated ? 'mp4' : 'jpg';

    try {
      const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const tempFile = path.join(__dirname, `../../media/downloads/temp_sticker_${Date.now()}.webp`);
      await fs.writeFile(tempFile, buffer);

      let convertedFile;
      if (mediaType === 'mp4') {
        const result = await WebpToMp4(tempFile);
        convertedFile = result.result;
      } else {
        const result = await webpTojpg(tempFile);
        convertedFile = result.result;
      }

      await fs.unlink(tempFile);

      if (mediaType === 'mp4') {
        await sock.sendMessage(from, { video: { url: convertedFile }, caption: 'Stiker berhasil dikonversi ke MP4' });
      } else {
        await sock.sendMessage(from, { image: { url: convertedFile }, caption: 'Stiker berhasil dikonversi ke JPG' });
      }
    } catch (error) {
      console.error('Error saat mengkonversi stiker:', error);
      await sock.sendMessage(from, { text: 'Terjadi kesalahan saat mengkonversi stiker.' });
    }
  }
};