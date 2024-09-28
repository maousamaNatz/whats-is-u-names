const { askAi } = require("../libs/ai");
const { checkAuth } = require("../database/auth");

module.exports = {
  name: "blackbox",
  // middleware: checkAuth(["admin", "owner"]),
  description: "Menggunakan AI untuk menjawab pertanyaan",
  async execute(sock, message) {
    const from = message.key.remoteJid;

    // Logging untuk memastikan apa yang diterima
    console.log("Received message:", message);

    // Ambil teks dari extendedTextMessage jika ada
    const text = (
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      ""
    ).toString();

    const args = text.split(" ").slice(1); // Hilangkan .blackbox dari input
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan pertanyaan Anda.",
      });
      return;
    }

    try {
      // Panggil API untuk menghasilkan kode Python
      const response = await askAi("blackbox", query);

      // Pastikan response adalah string
      const responseText = response.result;

      // Kirim hasil sebagai teks
      await sock.sendMessage(from, {
        text: `Berikut adalah kode yang dihasilkan untuk: ${query}\n\n${responseText}`,
      });
    } catch (error) {
      console.error("Error:", error);
      await sock.sendMessage(from, {
        text: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.",
      });
    }
  },

};
