const fs = require("fs");
const path = require("path");

let isProcessing = false;

async function sendWhatsAppMessage(sock, recipient, message, retries = 3) {
  if (isProcessing) {
    console.log(`Pesan untuk ${recipient} sedang diproses, tidak akan memulai proses baru.`);
    return;
  }

  isProcessing = true;
  try {
    if (!sock || !sock.user) {
      throw new Error("Koneksi WhatsApp belum siap");
    }
    await sock.sendMessage(recipient + "@s.whatsapp.net", message);
    console.log(`Pesan berhasil dikirim ke ${recipient}`);
  } catch (error) {
    console.error(`Gagal mengirim pesan ke ${recipient}:`, error.message);
    if (
      retries > 0 &&
      (error.message === "Connection Closed" ||
        error.message.includes("Timed Out"))
    ) {
      console.log(
        `Mencoba mengirim ulang pesan ke ${recipient}. Sisa percobaan: ${
          retries - 1
        }`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Tunggu 5 detik sebelum mencoba lagi
      await sendWhatsAppMessage(sock, recipient, message, retries - 1);
    } else {
      console.log(
        `Pesan gagal dikirim ke ${recipient} setelah ${3 - retries} percobaan.`
      );
      // Implementasikan logika untuk menyimpan pesan yang gagal dikirim atau retry otomatis di masa depan
    }
  }
  finally {
    isProcessing = false;
  }
}

// Fungsi untuk menghasilkan pesan WhatsApp
const generateMessage = (user) => {
  const logoPath = path.join(__dirname, "../../media/bot/nokotan.jpeg");

  console.log("User object:", JSON.stringify(user, null, 2)); // Debugging: Cetak objek user

  console.log("Received user object:", JSON.stringify(user, null, 2));

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
  
  Terima kasih sudah berlangganan pada bot kami. Semoga bot dapat membantu Anda menyelesaikan masalah. Jika terdapat bug atau error, silakan hubungi owner atau developer: ${
    process.env.OWNER_NAME
  }.
  
  Detail langganan Anda:
  Nama: ${nama}
  Masa aktif: ${
    user.lifetime ? user.lifetime.toISOString().split("T")[0] : "Selamanya"
  }
  Tanggal langganan: ${new Date().toISOString().split("T")[0]}`,
  };
};

// ... kode selanjutnya tetap sama ...

module.exports = { sendWhatsAppMessage, generateMessage };
