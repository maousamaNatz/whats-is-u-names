const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

let isSleepModeActive = loadSleepModeStatus();

async function isGroupAdmin(sock, groupId, userId) {
  try {
    console.log(groupId);
    const groupMetadata = await sock.groupMetadata(groupId);
    const admins = groupMetadata.participants
      .filter((p) => p.admin !== null)
      .map((p) => p.id);
    return admins.includes(userId);
  } catch (error) {
    console.error("Error checking group admin status:", error);
    return false;
  }
}

/**
 * Cek apakah bot sedang dalam mode tidur berdasarkan status sleep mode dan waktu
 */
function isBotSleeping() {
  const now = moment().tz("Asia/Jakarta");
  const hour = now.hour();

  // Bot akan tidur jika sleep mode aktif ATAU jam antara 22:00 - 24:00
  return isSleepModeActive || (hour >= 22 && hour < 3);
}
function saveSleepModeStatus(isActive) {
  const dir = path.join(__dirname, "../json");
  const filePath = path.join(dir, "activedbt.json");
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify({ isActive }, null, 2));
    console.log(`Sleep mode status berhasil disimpan: ${isActive}`);
  } catch (error) {
    console.error("Error saving sleep mode status:", error);
  }
}

async function clearAllChats(sock) {
  try {
    // Periksa apakah store ada dan tersedia
    if (!sock.store || !sock.store.chats) {
      console.error("Store atau chat tidak tersedia.");
      return;
    }

    const chats = sock.store.chats.all(); // Mengambil semua chat yang tersedia
    for (const chat of chats) {
      // Cek apakah ID chat valid sebelum mencoba menghapus
      if (chat.id) {
        console.log(`Menghapus pesan di chat dengan ID: ${chat.id}`);
        // Menghapus semua pesan di chat ini
        await sock.chatModify(
          { clear: { messages: [{ id: chat.id }] } },
          chat.id
        );
      }
    }
    console.log("Semua pesan berhasil dihapus.");
  } catch (error) {
    console.error("Error saat menghapus pesan:", error);
  }
}

function loadSleepModeStatus() {
  const filePath = path.join(__dirname, "../json/activedbt.json");
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      const status = JSON.parse(data);
      return status.isActive;
    }
  } catch (error) {
    console.error("Error loading sleep mode status:", error);
  }
  return false; // Default jika file tidak ada atau terjadi error
}


async function handleOwnerMessage(sock, message) {
  const from = message.key.remoteJid;
  const text =
    message?.message?.conversation ||
    message?.message?.extendedTextMessage?.text ||
    "";

  if (text.toLowerCase() === ".wakeup") {
    setSleepMode(false);
    await sock.sendMessage(from, {
      text: "Bot telah dibangunkan dan sleep mode dinonaktifkan.",
    });
  } else if (text.toLowerCase() === ".sleep") {
    setSleepMode(true);
    await sock.sendMessage(from, {
      text: "Bot telah dimasukkan ke mode tidur dan sleep mode diaktifkan.",
    });
  }
}

module.exports = {
  isGroupAdmin,
  isBotSleeping,
  clearAllChats,
  saveSleepModeStatus,
  loadSleepModeStatus,
  handleOwnerMessage,
};
