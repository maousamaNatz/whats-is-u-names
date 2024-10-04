const { gpt4o } = require("../libs/ai");
const { checkAuth } = require("../database/auth");
const {
  getUserAiTokens,
  updateUserAiTokens,
  resetUserAiTokens,
  getRemainingTokens,
  getUserByPhone,
  initializeUserAiTokens,
} = require("../database/aiTokens");
// const { getUserByPhone } = require("../database/users");
module.exports = {
  name: "gpt4o",
  middleware: checkAuth(["admin", "owner"]),
  description: "Menggunakan AI gpt 4o untuk menjawab pertanyaan",
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const sender = message.key.participant || message.key.remoteJid;
    const senderPhone = sender.split('@')[0];
    const text =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";
    const args = text.split(" ").slice(1);
    const query = args.join(" ");

    const user = await getUserByPhone(senderPhone);
    if (!user) {
      await sock.sendMessage(from, {
        text: "Maaf, Anda tidak memiliki akses untuk menggunakan fitur ini.",
      });
      return;
    }

    const userId = user.id;
    const aiModel = "gpt4o";

    if (query.toLowerCase() === "cek token") {
      try {
        const { tokens_left, last_used } = await getRemainingTokens(userId, aiModel);
        const lastUsedDate = new Date(last_used);
        const currentTime = new Date();
        const timeDiff = currentTime - lastUsedDate;
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));

        let response = `Sisa token Anda untuk GPT-4O: ${tokens_left}\n`;
        response += `Terakhir digunakan: ${hoursDiff} jam yang lalu\n`;

        if (tokens_left === 0 && hoursDiff >= 6) {
          response +=
            "Token Anda telah direset. Anda dapat menggunakan GPT-4O lagi.";
        } else if (tokens_left === 0) {
          const remainingTime = 6 - hoursDiff;
          response += `Token akan direset dalam ${remainingTime} jam.`;
        }

        await sock.sendMessage(from, { text: response });
        return;
      } catch (error) {
        console.error("Error saat memeriksa token:", error);
        await sock.sendMessage(from, {
          text: "Terjadi kesalahan saat memeriksa token.",
        });
        return;
      }
    }

    if (!query) {
      await sock.sendMessage(from, {
        text: "Silakan masukkan pertanyaan Anda atau ketik 'cek token' untuk memeriksa sisa token.",
      });
      return;
    }

    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await initializeUserAiTokens(userId, aiModel);
        const userTokens = await getUserAiTokens(userId, aiModel);
        const currentTime = new Date().getTime();
        const sixHoursInMs = 6 * 60 * 60 * 1000;

        if (
          !userTokens ||
          (userTokens.tokens_left <= 0 &&
            currentTime - new Date(userTokens.last_used).getTime() >=
              sixHoursInMs)
        ) {
          await resetUserAiTokens(userId, aiModel);
        } else if (userTokens.tokens_left <= 0) {
          const remainingTime = Math.ceil(
            (sixHoursInMs -
              (currentTime - new Date(userTokens.last_used).getTime())) /
              (60 * 1000)
          );
          await sock.sendMessage(from, {
            text: `Maaf, Anda telah menggunakan semua token. Silakan tunggu ${remainingTime} menit lagi.`,
          });
          return;
        }

        let response = await gpt4o(query);
        await sock.sendMessage(from, { text: response });

        // Kurangi token pengguna
        const newTokensLeft = (userTokens?.tokens_left || 12) - 1;
        await updateUserAiTokens(userId, aiModel, newTokensLeft);
        break; // Keluar dari loop jika berhasil
      } catch (error) {
        console.error(`Error (attempt ${retries + 1}):`, error);
        retries++;
        if (retries === maxRetries) {
          await sock.sendMessage(from, {
            text: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi nanti.",
          });
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Tunggu 1 detik sebelum mencoba lagi
        }
      }
    }
  },
};
