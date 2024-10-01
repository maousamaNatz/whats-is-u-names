const { getSessionQR } = require("../utils/session");
const { initiateBot } = require("../index");
const { sendWhatsAppMessage } = require("../database/genewmember");

module.exports = {
  name: "create-session",
  description: "Membuat session baru dan mengirimkan QR code.",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const userId = message.key.participant || from.split("@")[0];

    const sessionPath = `./sessions/whatsapp-session-user-${userId}`;
    try {
        const newSock = await initiateBot(sessionPath, userId);
        const qrPath = await getSessionQR(userId);

        await sendWhatsAppMessage(newSock, userId, { image: { url: qrPath } }, 3);

        global.sessions[userId] = newSock;
        await sock.sendMessage(from, {
            text: "Session dan QR code berhasil dibuat dan dikirim.",
        });
    } catch (error) {
        console.error("Error saat membuat session dan QR code:", error);
        await sock.sendMessage(from, {
            text: `Gagal membuat session dan QR code: ${error.message}`,
        });
    }
},
};
