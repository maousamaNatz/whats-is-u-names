const { dalle } = require("../libs/ai");
const { checkAuth } = require("../database/auth");
module.exports = {
  name: "dalle",
  middleware: checkAuth(["admin", "owner"]),
  description: "Menggunakan AI dalle untuk menjawab pertanyaan",
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

    const args = text.split(" ").slice(1); // Hilangkan .dalle dari input
    const resolutionIndex = args.findIndex(arg => arg.includes("x"));
    let resolution = "1024x1024"; // default resolution
    let query = args.join(" ");

    // Cek apakah ada input resolusi yang valid (misalnya 1024x1024)
    if (resolutionIndex !== -1) {
      resolution = args[resolutionIndex];
      // Hapus resolusi dari query
      args.splice(resolutionIndex, 1);
      query = args.join(" ");
    }

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan pertanyaan Anda.",
      });
      return;
    }

    try {
      // Panggil API DALL-E untuk menghasilkan gambar dengan resolusi yang diberikan
      const imageBuffer = await dalle({
        prompt: query,
        size: resolution,
      });

      // Kirim gambar sebagai buffer
      await sock.sendMessage(from, {
        image: imageBuffer,
        caption: `Berikut adalah gambar yang dihasilkan untuk: ${query} dengan resolusi ${resolution}`,
      });
    } catch (error) {
      console.error("Error:", error);
      await sock.sendMessage(from, {
        text: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.",
      });
    }
  },
};
