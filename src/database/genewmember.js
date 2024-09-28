const fs = require("fs");
const path = require("path");

async function sendWhatsAppMessage(sock, phone, message) {
  try {
    if (!sock || !sock.user || !sock.user.id) {
      console.error("Koneksi WhatsApp belum siap. Tidak dapat mengirim pesan.");
      return;
    }

    // Pastikan nomor telepon dalam format yang benar
    const formattedPhone = phone.startsWith("62")
      ? `${phone}@s.whatsapp.net`
      : `62${phone.slice(1)}@s.whatsapp.net`;

    // Tambahkan pengecekan koneksi sebelum mengirim pesan
    if (!sock.user || !sock.user.id) {
      throw new Error("Koneksi WhatsApp belum siap");
    }

    // Periksa apakah pesan adalah objek atau string
    const messageContent =
      typeof message === "string" ? { text: message } : message;

    await sock.sendMessage(formattedPhone, messageContent);
    console.log(`Pesan berhasil dikirim ke ${formattedPhone}`);
  } catch (error) {
    console.error(`Gagal mengirim pesan ke ${phone}:`, error.message);
  }
}

// Fungsi untuk menghasilkan pesan WhatsApp
const generateMessage = (user) => {
    const logoPath = path.join(__dirname, "../../media/bot/nokotan.jpeg");
    
    console.log("User object:", JSON.stringify(user, null, 2)); // Debugging: Cetak objek user
    
    let nama = "Pengguna";
    if (user.nama) {
        nama = user.nama;
        console.log("Menggunakan user.nama:", nama);
    } else if (user.username) {
        nama = user.username;
        console.log("Menggunakan user.username:", nama);
    } else if (user.pushName) {
        nama = user.pushName;
        console.log("Menggunakan user.pushName:", nama);
    } else {
        console.log("Tidak ada nama yang ditemukan, menggunakan default:", nama);
    }

    return {
      image: { url: logoPath },
      caption: `Halo ${nama},
  
  Terima kasih sudah berlangganan pada bot kami. Semoga bot dapat membantu Anda menyelesaikan masalah. Jika terdapat bug atau error, silakan hubungi owner atau developer: ${process.env.OWNER_NAME}.
  
  Detail langganan Anda:
  Nama: ${nama}
  Masa aktif: ${user.lifetime ? user.lifetime.toISOString().split("T")[0] : "Selamanya"}
  Tanggal langganan: ${new Date().toISOString().split("T")[0]}`,
    };
  };
  
  // ... kode selanjutnya tetap sama ...


module.exports = { sendWhatsAppMessage, generateMessage };
