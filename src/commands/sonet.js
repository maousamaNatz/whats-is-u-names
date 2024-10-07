const { claude35sonnet} = require("../libs/ai");
const { checkAuth } = require("../database/auth");
module.exports = {
    name: "claude",
    middleware: checkAuth(["admin", "owner"]),
    description: "Menggunakan AI sonet untuk menjawab pertanyaan",
    async execute(sock, message) {
        const from = message.key.remoteJid;
        const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
        const args = text.split(" ").slice(1);
        const query = args.join(" ");

        if (!query) {
            await sock.sendMessage(from, {
                text: "Silakan masukkan pertanyaan Anda.",
                quoted: message
            });
            return;
        }

        try {
            let response = await claude35sonnet(query);
            await sock.sendMessage(from, { text: response, quoted: message });
        } catch (error) {
            console.error("Error:", error);
            await sock.sendMessage(from, {
                text: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.",
                quoted: message
            });
        }
    },
};
