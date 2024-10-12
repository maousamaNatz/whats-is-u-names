// const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
// const DeepAI = require('../libs/deep');
// const fs = require('fs').promises;
// const path = require('path');

// module.exports = {
//   name: 'waifu2x',
//   description: 'Meningkatkan resolusi gambar anime menggunakan Waifu2x',
//   async execute(sock, message) {
//     const from = message.key.remoteJid;
//     const media = message.message.imageMessage || 
//                   message.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

//     if (!media) {
//       await sock.sendMessage(from, { 
//         text: 'Silakan kirim atau balas gambar yang ingin di-upscale dengan Waifu2x.', 
//         quoted: message 
//       });
//       return;
//     }

//     try {
//       // Mengunduh gambar dari pesan
//       const stream = await downloadContentFromMessage(media, 'image');
//       let buffer = Buffer.from([]);
//       for await (const chunk of stream) {
//         buffer = Buffer.concat([buffer, chunk]);
//       }

//       // Menyimpan gambar sementara
//       const tempInputPath = path.join(__dirname, '../../media/downloads', `input_${Date.now()}.jpg`);
//       await fs.writeFile(tempInputPath, buffer);

//       // Inisialisasi DeepAI
//       const deepai = new DeepAI();

//       // Melakukan upscale menggunakan Waifu2x
//       const upscaledImageBuffer = await deepai.waifu2x(tempInputPath);

//       // Menghapus file input sementara
//       await fs.unlink(tempInputPath);

//       // Kirim gambar yang sudah di-upscale
//       await sock.sendMessage(from, {
//         image: upscaledImageBuffer,
//         caption: 'Gambar yang telah di-upscale',
//       });
//     } catch (error) {
//       console.error("Error saat meng-upscale gambar:", error);
//       await sock.sendMessage(from, {
//         text: "Maaf, terjadi kesalahan saat meng-upscale gambar. Silakan coba lagi nanti.",
//       });
//     }
//   }
// };
