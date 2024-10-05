const { writeExifImg, writeExifVid } = require('../libs/exif');
const fileType = require('file-type');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 's' || 'sticker',
  description: 'Membuat stiker dari gambar atau video yang dikirim',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    // Cek apakah ada pesan media yang diterima (gambar atau video)
    const mediaMessage =
      message.message?.imageMessage || // Pesan gambar tanpa caption
      message.message?.videoMessage || // Pesan video tanpa caption
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || // Gambar dengan caption
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;   // Video dengan caption

    // Jika tidak ada media, kirim pesan error
    if (!mediaMessage) {
      await sock.sendMessage(from, { text: 'Silakan kirim gambar atau video untuk dijadikan stiker.' });
      return;
    }

    try {
      console.log('Media message detected, downloading media...');

      // Download media menggunakan `downloadContentFromMessage`
      const stream = await downloadContentFromMessage(mediaMessage, mediaMessage.mimetype.includes('video') ? 'video' : 'image');
      let mediaBuffer = Buffer.from([]);

      // Menggabungkan buffer dari stream
      for await (const chunk of stream) {
        mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
      }

      // Cek tipe file
      const mimeType = await fileType.fromBuffer(mediaBuffer);
      console.log('MIME type:', mimeType);

      // Periksa apakah media adalah gambar atau video dengan format yang valid
      if (
        mimeType.mime !== "image/gif" &&
        mimeType.mime !== "image/jpeg" &&
        mimeType.mime !== "image/png" &&
        mimeType.mime !== "video/mp4"
      ) {
        await sock.sendMessage(from, { text: "Format media tidak didukung. Silakan kirim GIF, JPEG, PNG, atau MP4." });
        return;
      }

      let stickerBuffer;
      if (mimeType.mime.startsWith("image/")) {
        // Buat stiker dari gambar
        stickerBuffer = await writeExifImg(mediaBuffer, {
          packname: process.env.STICKER_PACK_NAME || 'My Sticker Pack',
          author: process.env.STICKER_AUTHOR || 'Bot Author',
          categories: process.env.STICKER_CATEGORIES ? process.env.STICKER_CATEGORIES.split(",") : []
        });
      } else if (mimeType.mime === "video/mp4") {
        // Buat stiker dari video
        stickerBuffer = await writeExifVid(mediaBuffer, {
          packname: process.env.STICKER_PACK_NAME || 'My Sticker Pack',
          author: process.env.STICKER_AUTHOR || 'Bot Author',
          categories: process.env.STICKER_CATEGORIES ? process.env.STICKER_CATEGORIES.split(",") : []
        });
      }

      // Kirim stiker jika buffer valid
      if (stickerBuffer && Buffer.isBuffer(stickerBuffer)) {
        await sock.sendMessage(from, { sticker: stickerBuffer });
      } else {
        throw new Error('Gagal membuat stiker, buffer tidak valid');
      }
    } catch (error) {
      console.error("Gagal membuat stiker:", error);
      await sock.sendMessage(from, { text: "Terjadi kesalahan saat membuat stiker." });
    }
  }
};
