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
4.) *.search* : Pencarian cepat berbagai hal
5.) *.shortlink* : Membuat shortlink dari url yang anda inginkan
6.) *.ss* : Mengambil gambar tampilan website _*NGEBUG*_
7.) *.createGroup* : Membuat grup baru dengan anggota yang disebutkan
8.) *.sticker* : Membuat stiker dari gambar atau video yang dikirim
9.) *.dl* : Download berbagai konten dari internet
10.) *.removebg* : Menghapus background dari gambar

──────────────────
*Search:*
──────────────────

1.) *.wiki* : Mencari informasi dari Wikipedia
2.) *.animequote* : Mendapatkan kutipan anime secara acak
3.) *.ringtone* : Mencari ringtone berdasarkan kata kunci
4.) *.styletext* : Mengubah gaya teks
5.) *.searchanime* : Mencari informasi anime di MyAnimeList
6.) *.searchmanga* : Mencari informasi manga di MyAnimeList
7.) *.pinterest* : Mencari gambar di Pinterest
8.) *.wallpaper* : Mencari wallpaper berdasarkan kata kunci

──────────────────
*🔄 Conversion Tools:* _(ONGOING)_
──────────────────

1.) *.text-to-voice* : Konversi teks menjadi audio
2.) *.pdf-to-word* : Ubah file PDF menjadi dokumen Word
3.) *.pdf-to-image* : Ubah file PDF menjadi gambar
4.) *.image-to-pdf* : Ubah file gambar menjadi PDF
5.) *.video-to-gif* : Ubah file video menjadi gif
6.) *.gif-to-video* : Ubah file gif menjadi video
7.) *.video-to-audio* : Ubah file video menjadi audio
8.) *.audio-to-video* : Ubah file audio menjadi video

──────────────────
*🤖 AI Commands:*
──────────────────

1.) *.lepton* : Analisis dan natural language processing _*ONGOING*_
2.) *.gpt-4* : Model AI terbaru untuk segala kebutuhan
3.) *.claude* : Alternatif AI berbasis Claude 3.5 Sonet 
4.) *.gpt-35* : Versi GPT sebelumnya dengan kecerdasan tinggi
5.) *.gpt-35-turbo* : Optimalisasi GPT-3.5 dengan kinerja lebih cepat
6.) *.gpt-4o* : Versi lebih ringan dari GPT-4
7.) *.blackbox* : AI khusus untuk membantu kode otomatis
8.) *.dalle* : Buat gambar dari teks dengan AI kreatif
9.) *.gemini* : Model AI untuk pemrosesan cepat

──────────────────
*🎮 Game Commands:*
──────────────────

1.) *.cek-khodam* : coba kodam mu kawan
2.) *.tebak-kata* : bermain tebak kata
3.) *.tictactoe* : bermain tictactoe

──────────────────
*👥 Group Commands:*
──────────────────
1.) *.add* : Tambahkan member ke grup (Hanya admin)
2.) *.promote* : Mempromosikan member ke admin (Hanya admin)
3.) *.demote* : Menurunkan status anggota dari admin (Hanya admin)
4.) *.adduser* : Tambahkan pengguna baru dengan role dan lifetime
5.) *.mute* : Matikan notifikasi grup (Hanya admin)
6.) *.unmute* : Aktifkan kembali notifikasi grup (Hanya admin)
7.) *.clearall* : Hapus semua pesan di grup (Hanya admin) *ONGOING*
8.) *.kick* : Mengeluarkan member dari grup (Hanya admin)
9.) *.silent* : Membuat group agar hanya admin yang bisa mengirim pesan (hanya admin)

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
        quoted: message,  
      });
    } catch (error) {
      console.error("Error membaca file gambar:", error);
      await sock.sendMessage(from, { text: helpMessage });
    }
  },
};