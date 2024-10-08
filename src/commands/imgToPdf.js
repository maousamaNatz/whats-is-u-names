const fs = require('fs').promises;
const path = require('path');
const imgToPDF = require('image-to-pdf');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const pdfPath = path.join(__dirname, '../../media/temp/pdf');
const outputPath = path.join(__dirname, '../../media/temp/converted.pdf');

module.exports = {
  name: 'pdf',
  description: 'Konversi gambar ke PDF',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);
    const command = args[0]?.toLowerCase();

    try {
      await fs.mkdir(pdfPath, { recursive: true });

      if (command === 'help') {
        await sock.sendMessage(from, {
          text: '_1. Kirim gambar dengan caption .pdf_\n_2. Dapatkan output PDF dengan .pdf get_\n_3. Hapus semua gambar yang telah diinput dengan .pdf delete_\n_4. Semua file akan otomatis dihapus setelah output dihasilkan_'
        });
      } else if (command === 'delete') {
        const files = await fs.readdir(pdfPath);
        for (const file of files) {
          await fs.unlink(path.join(pdfPath, file));
        }
        try { await fs.unlink(outputPath); } catch {}
        await sock.sendMessage(from, { text: '_Berhasil menghapus semua file!_' });
      } else if (command === 'get') {
        const pages = (await fs.readdir(pdfPath)).filter(e => e.includes('topdf')).map(e => path.join(pdfPath, e));
        if (!pages.length) {
          await sock.sendMessage(from, { text: '_Tidak ada file yang diinput_' });
          return;
        }
        await new Promise((resolve, reject) => {
          imgToPDF(pages, imgToPDF.sizes.A4)
            .pipe(fs.createWriteStream(outputPath))
            .on('finish', resolve)
            .on('error', reject);
        });
        await sock.sendMessage(from, {
          document: { url: outputPath },
          mimetype: 'application/pdf',
          fileName: 'converted.pdf'
        });
        for (const file of await fs.readdir(pdfPath)) {
          await fs.unlink(path.join(pdfPath, file));
        }
        await fs.unlink(outputPath);
      } else if (message.message.imageMessage || message.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
        const imageMessage = message.message.imageMessage || message.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        if (imageMessage) {
          const stream = await downloadContentFromMessage(imageMessage, 'image');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          const pages = (await fs.readdir(pdfPath)).filter(e => e.includes('topdf'));
          await fs.writeFile(path.join(pdfPath, `topdf_${pages.length}.jpg`), buffer);
          await sock.sendMessage(from, {
            text: `*_Berhasil menyimpan gambar_*\n_*Total gambar tersimpan: ${pages.length + 1}*_\n*_Setelah menyimpan semua gambar, gunakan '.pdf get' untuk mendapatkan hasilnya. Gambar akan dihapus setelah konversi!_*`
          });
        } else {
          await sock.sendMessage(from, { text: '_Balas ke gambar!_' });
        }
      } else {
        await sock.sendMessage(from, { text: '_Balas ke gambar, dapatkan bantuan dengan menggunakan perintah ".pdf help"_' });
      }
    } catch (error) {
      console.error('Error:', error);
      await sock.sendMessage(from, { text: 'Terjadi kesalahan saat memproses perintah.' });
    }
  }
};