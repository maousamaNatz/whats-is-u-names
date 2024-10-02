const { writeExifImg, writeExifVid } = require('../libs/exif');
const fs = require('fs');
const fileType = require('file-type');

module.exports = {
  name: 's' || 'sticker',
  description: 'Membuat stiker dari gambar atau video yang dikirim',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const mediaMessage = message.message.imageMessage || message.message.videoMessage;

    console.log('Media message:', mediaMessage);

    if (!mediaMessage) {
      await sock.sendMessage(from, { text: 'Silakan kirim gambar atau video untuk dijadikan stiker.' });
      return;
    }

    try {
      console.log('Downloading media...');
      const mediaBuffer = await sock.downloadMediaMessage(mediaMessage);
      console.log('Media buffer downloaded:', mediaBuffer);

      const mimeType = await fileType.fromBuffer(mediaBuffer);
      console.log('MIME type:', mimeType);

      if (
        mimeType.mime !== "image/gif" &&
        mimeType.mime !== "image/jpeg" &&
        mimeType.mime !== "image/png" &&
        mimeType.mime !== "video/mp4"
      ) {
        console.log("Format media bukan GIF, JPEG, PNG, atau MP4, pembuatan stiker dibatalkan.");
        await sock.sendMessage(from, { text: "Gagal membuat stiker: format media bukan GIF, JPEG, PNG, atau MP4." });
        return;
      }

      let stickerBuffer;
      try {
        if (mimeType.mime.startsWith("image/")) {
          console.log('Membuat stiker dari gambar');
          stickerBuffer = await writeExifImg(mediaBuffer, {
            packname: process.env.STICKER_PACK_NAME || 'My Sticker Pack',
            author: process.env.STICKER_AUTHOR || 'Bot Author',
            categories: process.env.STICKER_CATEGORIES ? process.env.STICKER_CATEGORIES.split(",") : []
          });
        } else if (mimeType.mime === "video/mp4") {
          console.log('Membuat stiker dari video');
          stickerBuffer = await writeExifVid(mediaBuffer, {
            packname: process.env.STICKER_PACK_NAME || 'My Sticker Pack',
            author: process.env.STICKER_AUTHOR || 'Bot Author',
            categories: process.env.STICKER_CATEGORIES ? process.env.STICKER_CATEGORIES.split(",") : []
          });
        }

        console.log('Sticker buffer created:', stickerBuffer);

        if (!Buffer.isBuffer(stickerBuffer)) {
          throw new TypeError('Sticker buffer harus berupa buffer');
        }

        await sock.sendMessage(from, { sticker: stickerBuffer });
        console.log("Stiker berhasil dikirim.");
      } catch (error) {
        console.error("Gagal membuat stiker:", error);
        await sock.sendMessage(from, { text: "Gagal membuat stiker." });
      }
    } catch (error) {
      console.error("Error saat memproses media:", error);
      await sock.sendMessage(from, { text: "Terjadi kesalahan saat memproses media." });
    }
  }
};