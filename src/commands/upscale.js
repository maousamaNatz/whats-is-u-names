const { upscaleImage } = require("../libs/ai"); // Import the ONNX-based upscaling function
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'upscale',
  description: 'Meningkatkan resolusi gambar yang diberikan',

  async execute(sock, message) {
    const from = message.key.remoteJid;
    const media = message.message.imageMessage || 
                  message.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    // Jika tidak ada gambar yang ditemukan dalam pesan atau pesan yang dibalas
    if (!media) {
      await sock.sendMessage(from, { 
        text: 'Silakan kirim atau balas gambar yang ingin di-upscale.', 
        quoted: message 
      }).catch(err => console.error('Error saat mengirim pesan:', err));
      return;
    }

    const maxRetries = 3;
    const timeout = 120000; // 2 menit

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Mengunduh gambar dari pesan
        const stream = await downloadContentFromMessage(media, media.mimetype.includes('video') ? 'video' : 'image');
        let imageBuffer = Buffer.from([]);

        // Mengumpulkan stream ke dalam buffer
        for await (const chunk of stream) {
          imageBuffer = Buffer.concat([imageBuffer, chunk]);
        }

        console.log("Original image buffer length:", imageBuffer.length);

        // Cek apakah buffer kosong
        if (!imageBuffer || imageBuffer.length === 0) {
          throw new Error("Gambar tidak ditemukan atau buffer kosong.");
        }

        // Memanggil fungsi upscaleImage untuk meningkatkan resolusi gambar menggunakan ONNX model
        const upscaledImageBuffer = await upscaleImage(imageBuffer, 2); // Set sizeFactor=2 for 2x upscaling

        console.log("Upscaled image buffer length:", upscaledImageBuffer.length);

        // Cek apakah upscaled buffer kosong atau tidak valid
        if (!upscaledImageBuffer || upscaledImageBuffer.length === 0) {
          throw new Error("Upscaled image buffer is invalid or empty");
        }

        // Mengirim gambar yang sudah di-upscale
        await sock.sendMessage(from, {
          image: upscaledImageBuffer,
          caption: 'Gambar telah di-upscale.',
          quoted: message,
        });

        break; // Keluar dari loop jika berhasil
      } catch (error) {
        console.error(`Error saat meng-upscale gambar (percobaan ${attempt + 1}):`, error);
        if (attempt === maxRetries - 1) {
          throw error; // Lempar error jika sudah mencapai batas percobaan
        }
        await new Promise(resolve => setTimeout(resolve, 5000)); // Tunggu 5 detik sebelum mencoba lagi
      }
    }
  }
};
