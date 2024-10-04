const fs = require("fs");
const path = require("path");

let isProcessing = false;

const sendWhatsAppMessage = async (sock, jid, content, timeout = 120000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout: Gagal mengirim pesan setelah ' + timeout + 'ms'));
    }, timeout);

    sock.sendMessage(jid, content)
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

// Fungsi untuk menghasilkan pesan WhatsApp
const generateMessage = (user, isNewMember = false) => {
  const logoPath = path.join(__dirname, "../../media/bot/nokotan.jpeg");

  console.log("User object:", JSON.stringify(user, null, 2)); // Debugging: Cetak objek user

  let nama = "Pengguna";
  if (user.nama) {
    nama = user.nama;
  } else if (user.username) {
    nama = user.username;
  } else if (user.pushName) {
    nama = user.pushName;
  }
  console.log("Menggunakan nama:", nama);

  let caption;
  if (isNewMember) {
    caption = `Selamat datang, ${nama}!

Terima kasih telah bergabung dengan bot kami. Kami sangat senang Anda ada di sini. Bot ini siap membantu Anda dalam berbagai hal. Jika Anda memiliki pertanyaan atau membutuhkan bantuan, jangan ragu untuk bertanya.

Untuk melihat daftar fitur yang tersedia, silakan ketik '.help'.

Jika Anda menemui masalah atau bug, silakan hubungi owner atau developer: ${process.env.OWNER_NAME}.

Selamat menggunakan bot kami!`;
  } else {
    let masaAktif = "Selamanya";
    if (user.lifetime && user.lifetime !== null) {
      try {
        masaAktif = new Date(user.lifetime).toISOString().split("T")[0];
      } catch (error) {
        console.error("Error saat memformat tanggal lifetime:", error);
      }
    }

    caption = `Halo ${nama},

Terima kasih sudah berlangganan pada bot kami. Semoga bot dapat membantu Anda menyelesaikan masalah. Jika terdapat bug atau error, silakan hubungi owner atau developer: ${process.env.OWNER_NAME}.

Detail langganan Anda:
Nama: ${nama}
Masa aktif: ${masaAktif}
Tanggal langganan: ${new Date().toISOString().split("T")[0]}`;
  }

  return {
    image: { url: logoPath },
    caption: caption
  };
};

module.exports = { sendWhatsAppMessage, generateMessage };
