const fs = require("fs");
const path = require("path");

module.exports = {
  name: "help",
  description: "Menampilkan daftar fitur yang tersedia pada bot",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const clientName = message.pushName || "Pengguna";
    const owner = process.env.OWNER_NAME;
    const helpMessage = `*👋 Selamat Datang ${clientName} di Bot Kami!*

Halo! Saya adalah bot yang siap membantu Anda dalam berbagai kebutuhan sehari-hari. Berikut adalah daftar perintah yang bisa Anda gunakan. Jika Anda membutuhkan bantuan lebih lanjut, jangan ragu untuk menghubungi *${owner}*. Yuk, mulai eksplorasi! 🚀
      
*📋 HELP - Daftar Perintah Bot:*
      
──────────────────
*⚙️ General Commands:*
──────────────────
1.) *.cuaca* : Cek informasi cuaca terkini
2.) *.calculator* : Gunakan kalkulator sederhana
3.) *.brandly* : Perpendek URL dengan mudah
4.) *.stt* : Ubah suara menjadi teks (Speech to Text)
5.) *.tts* : Ubah teks menjadi suara (Text to Speech)
6.) *.download* : Download berbagai konten dari internet
7.) *.search* : Pencarian cepat berbagai hal
──────────────────
*🔄 Conversion Tools:*
──────────────────
1.) *Text to Voice* : Konversi teks menjadi audio
2.) *PDF to Word* : Ubah file PDF menjadi dokumen Word

──────────────────
*🤖 AI Commands:*
──────────────────
1.) *Lepton* : Analisis dan natural language processing
2.) *GPT-4* : Model AI terbaru untuk segala kebutuhan
3.) *Claude 3.5 Sonet* : Alternatif AI berbasis Claude
4.) *GPT-3.5* : Versi GPT sebelumnya dengan kecerdasan tinggi
5.) *GPT-3.5 Turbo* : Optimalisasi GPT-3.5 dengan kinerja lebih cepat
6.) *GPT-4O* : Versi lebih ringan dari GPT-4
7.) *Blackbox* : AI khusus untuk membantu kode otomatis
8.) *DALL·E* : Buat gambar dari teks dengan AI kreatif

──────────────────
*🎮 Game Commands:*
──────────────────
⚠️ *Coming Soon!* Stay tuned for awesome games!

──────────────────
*👥 Group Commands:*
──────────────────
2.) *.mute* : Matikan notifikasi grup (Hanya admin)
3.) *.unmute* : Aktifkan kembali notifikasi grup (Hanya admin) *ONGOING*
4.) *.clearall* : Hapus semua pesan di grup (Hanya admin) *ONGOING*
5.) *.kick* : mengeluarkan member dari grup (Hanya admin)
6.) *.add* : Tambahkan member ke grup (Hanya admin)
7.) *.silent* : membuat group agar hanya admin yang bisa mengirim pesan
8.) *.promote* : mempromosikan member ke admin (Hanya admin) *ONGOING*

⚠️ *Coming Soon!* Fitur menarik untuk pengelolaan grup.

__________________

OWNER COMMAND 
__________________

1.) *.broadcast* : Kirim pesan ke semua grup (Hanya owner)
2.) *.sleep* : Aktifkan mode tidur bot (Hanya owner)
3.) *.wakeup* : Nonaktifkan mode tidur bot (Hanya owner)

──────────────────
❓ *FAQ:*
──────────────────
- *Bagaimana cara menggunakan bot ini?*
  Cukup ketik perintah sesuai kategori di atas dan kirim pesan. Bot akan merespon secara otomatis!
- *Apakah ada batasan penggunaan fitur?*
  Beberapa fitur mungkin memiliki batasan penggunaan harian, tergantung pada layanan yang digunakan.

──────────────────
*📞 Bantuan & Dukungan:*
──────────────────
Jika Anda mengalami masalah atau menemukan error, jangan ragu untuk menghubungi *${owner}*. Kami siap membantu!

──────────────────
*🔔 Tetap Terhubung:*
──────────────────
Jangan lupa cek pembaruan fitur baru setiap minggunya! Kami terus berkembang untuk memberikan pengalaman terbaik bagi Anda.
Bot aktif setiap hari dari pukul 03:00 WIB hingga 22:00 WIB.

*Terima kasih telah menggunakan bot kami! 🤖✨*
`;

    // Path ke gambar yang ingin dikirim
    const imagePath = path.join(__dirname, "../../media/bot/nokotan.jpeg");

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      await sock.sendMessage(from, {
        image: imageBuffer,
        caption: helpMessage,
      });
    } catch (error) {
      console.error("Error membaca file gambar:", error);
      await sock.sendMessage(from, { text: helpMessage });
    }
  },
};
