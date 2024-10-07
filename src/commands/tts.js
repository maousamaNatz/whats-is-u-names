const { askAi } = require("../libs/ai");
const { checkAuth } = require("../database/auth");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "tts",
  middleware: checkAuth(["admin", "owner"]),
  description: "Mengubah teks menjadi suara menggunakan ElevenLabs",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const content = text.split(" ").slice(1).join(" ");

    if (!content) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan teks yang ingin diubah menjadi suara.",
        quoted: message
      });
      return;
    }

    try {
      const audioBuffer = await askAi("elevenlabs", content);
      const tempFilePath = path.join(__dirname, "../../temp", `tts_${Date.now()}.mp3`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      await sock.sendMessage(from, {
        audio: { url: tempFilePath },
        mimetype: "audio/mp3",
        ptt: true,
        quoted: message
      });

      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error("Error:", error);
      await sock.sendMessage(from, {
        text: "Maaf, terjadi kesalahan saat mengubah teks menjadi suara.",
      });
    }
  },
};