const { checkAuth } = require("../database/auth");

module.exports = {
  name: "broadcast",
  middleware: checkAuth(["admin", "owner"]),
  description: "Mengirim pesan broadcast ke semua grup dengan mention pengirim",
  async execute(sock, message) {
    const from = message.key.remoteJid;  // ID chat pengirim
    const sender = message.key.participant || from;  // Nomor pengirim
    const senderNumber = sender.split('@')[0];  // Mendapatkan nomor pengirim tanpa domain
    const senderName = message.pushName || "Admin";  // Nama pengirim
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);  // Ambil pesan broadcast setelah perintah
    const broadcastMessage = args.join(" ");

    if (!broadcastMessage) {
      await sock.sendMessage(from, { text: "Silakan masukkan pesan yang ingin di-broadcast." });
      return;
    }

    try {
      const groups = await sock.groupFetchAllParticipating();
      let successCount = 0;
      let failCount = 0;

      for (const groupId of Object.keys(groups)) {
        try {
          const mentionJid = `${senderNumber}@s.whatsapp.net`;  // Membuat JID pengirim

          // Mengirim pesan broadcast dengan mention pengirim
          await sock.sendMessage(groupId, {
            // image: ,
            text: `*BROADCAST DARI @${senderNumber}*
${broadcastMessage}`,
            mentions: [mentionJid]  // Mention pengirim
          });

          successCount++;
        } catch (error) {
          console.error(`Gagal mengirim pesan ke grup ${groupId}:`, error);
          failCount++;
        }
      }

      // Memberi tahu pengirim tentang hasil broadcast
      await sock.sendMessage(from, { 
        text: `Broadcast selesai.\nBerhasil: ${successCount} grup\nGagal: ${failCount} grup` 
      });
    } catch (error) {
      console.error("Error saat melakukan broadcast:", error);
      await sock.sendMessage(from, { text: "Terjadi kesalahan saat melakukan broadcast." });
    }
  }
};
