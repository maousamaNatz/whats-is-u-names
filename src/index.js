const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const path = require("path");
const P = require("pino");
const fs = require("fs");
const express = require("express");
const db = require("./database/database");
const { checkSpam } = require("./utils/spams");
const { handleGroupUpdate } = require("./libs/canvas");
const { getSessionQR } = require("./utils/session");
const { createTables } = require("./database/createtbl");
const { seedDatabase } = require("./database/seedDb");
const { saveBotToDatabase } = require("./database/svbot");
const { sendWhatsAppMessage } = require("./database/genewmember");
const asciiLogo = fs.readFileSync("./media/bot/logo.txt", "utf8");
const {
  isBotSleeping,
  handleOwnerMessage,
  clearAllChats,
  isGroupAdmin,
  loadSleepModeStatus,
  setSleepMode,
} = require("./utils/permission");
global.isSleepModeActive = loadSleepModeStatus();
const app = express();

const sessions = global.sessions || {};
let botInti;
const port = process.env.PORT || 3000;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

app.use((req, res, next) => {
  req.userId = req.query.userId || 1;
  next();
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendMessageSafely(sock, jid, message, retries = 3) {
  while (retries > 0) {
    try {
      if (sock?.ws?.readyState === 1) {
        await sock.sendMessage(jid, message);
        console.log("Pesan berhasil dikirim.");
        break;
      } else {
        throw new Error("Koneksi tidak terbuka, mencoba reconnect...");
      }
    } catch (error) {
      console.error(
        `Gagal mengirim pesan (percobaan ${4 - retries}/3):`,
        error.message
      );
      retries--;
      if (retries > 0) {
        console.log("Mencoba kembali dalam 5 detik...");
        await delay(5000);
      } else {
        console.error("Gagal mengirim pesan setelah 3 percobaan.");
      }
    }
  }
}

async function startBotInti() {
  console.log("Memulai bot inti...");
  await delay(5000);
  const sessionPath = "./sessions/whatsapp-session-bot-inti";
  botInti = await initiateBot(sessionPath, "bot-inti");
  console.log("Bot inti berjalan dengan session tetap");

  const ownerNumber = process.env.OWNER_PHONE;
  if (botInti && botInti.user && botInti.user.id) {
    await sendMessageSafely(botInti, ownerNumber + "@s.whatsapp.net", {
      text: "Bot inti siap digunakan! 🤖✅",
    });
  } else {
    console.log(
      "Tidak dapat mengirim pesan: botInti atau botInti.user tidak tersedia"
    );
  }
}

app.get("/create-session", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).send("Parameter userId diperlukan");
  }

  const sessionPath = `./sessions/whatsapp-session-user-${userId}`;
  if (sessions[userId]) {
    return res.status(400).send("Session sudah ada");
  }

  try {
    await sendWhatsAppMessage(botInti, userId, { text: "Memulai bot user..." });
    await delay(7000);
    const sock = await initiateBot(sessionPath, userId);
    const qrPath = await getSessionQR(userId);

    if (!sessions[userId]) {
      sessions[userId] = sock;
    }

    await sendMessageSafely(sock, userId, { image: { url: qrPath } });
    res.send("Session dan QR code berhasil dibuat dan dikirim");
  } catch (error) {
    console.error("Error saat membuat session dan QR code:", error);
    res.status(500).send(`Gagal membuat session dan QR code: ${error.message}`);
  }
});

app.get("/stop-session", (req, res) => {
  const userId = req.userId;

  if (!sessions[userId]) {
    return res.status(400).send("Session tidak ditemukan untuk user ini");
  }

  sessions[userId].end();
  delete sessions[userId];
  res.send("Session dihentikan");
});

async function initiateBot(sessionPath, userId = "bot-inti", lifetime = 30) {
  console.log(asciiLogo);

  db.query("SELECT 1", (err) => {
    if (err) {
      console.error("Error menghubungkan ke database:", err);
      process.exit(1);
    } else {
      console.log("Terhubung ke database MySQL");
      createTables();
      seedDatabase();
    }
  });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    browser: ["Bot Inti", "Chrome", "1.0"],
    connectTimeoutMs: 30000000,
    syncFullHistory: true,
  });

  // Load commands
  sock.commands = new Map();
  const commandFiles = fs
    .readdirSync("./src/commands")
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    sock.commands.set(process.env.PREFIX + command.name, command);
  }

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    const statusCode = lastDisconnect?.error?.output?.statusCode;

    if (connection === "close") {
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`Koneksi terputus dengan status code: ${statusCode}`);

      if (shouldReconnect) {
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          if (statusCode === 440) {
            console.log("Koneksi terputus. Mencoba reconnect dalam 15 detik...");
            await delay(15000);
          } else if (statusCode === 515) {
            console.log("Kesalahan stream terdeteksi. Mencoba memulai ulang...");
            await delay(10000);
          } else if (statusCode === 408) {
            console.error("Request Timed Out. Mencoba menghubungkan kembali...");
            await delay(5000);
          }
          await initiateBot(sessionPath, userId, lifetime);
        } else {
          console.error("Maksimum reconnect attempts tercapai. Bot akan berhenti.");
        }
      } else {
        console.log("Sesi telah logout. Menghapus sesi dan memulai ulang...");
        if (fs.existsSync(sessionPath)) {
          fs.rmdirSync(sessionPath, { recursive: true });
        }
        initiateBot(sessionPath, userId, lifetime);
      }
    } else if (connection === "open") {
      console.log(`Session ${userId} siap digunakan`);
      sessions[userId] = sock;
      reconnectAttempts = 0; // Reset reconnect attempts
      if (userId !== "bot-inti") {
        const phoneNumber = sock.user.id.split(":")[0];
        saveBotToDatabase(phoneNumber, sessionPath, lifetime);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (msg) => {
    const message = msg.messages[0];
    const from = message.key.remoteJid;
    const sender = message.key.participant || from;

    const isOwner = sender === process.env.OWNER_PHONE + "@s.whatsapp.net";
    if (isOwner) {
      await handleOwnerMessage(sock, message);
    }

    const isSleeping = isBotSleeping();
    if (isSleeping && !isOwner) {
      if (message.key && !message.key.fromMe && message.key.remoteJid !== "status@broadcast") {
        const senderId = message.key.remoteJid;

        if (!global.notifiedSenders) {
          global.notifiedSenders = new Set();
        }

        if (!global.notifiedSenders.has(senderId)) {
          const clientName = message.pushName || "Pengguna";
          const ownerNumber = process.env.OWNER_PHONE;
          const broadcastMessage = `*[ PEMBERITAHUAN PENTING ]*\n\nHalo ${clientName},\n\nMohon maaf atas ketidaknyamanannya. Saat ini, layanan bot sedang dalam mode istirahat atau tidak aktif untuk sementara waktu.\n\n*Status:* Tidak Aktif ❌\n*Estimasi Aktif Kembali:* Belum Ditentukan\n\nUntuk informasi lebih lanjut atau permintaan pengaktifan kembali, silakan hubungi admin kami:\n\n👤 *@${ownerNumber}*\n\nTerima kasih atas pengertian dan kesabaran Anda. Kami akan segera kembali untuk melayani Anda!`;

          try {
            await sock.sendMessage(senderId, {
              image: {
                url: path.join(__dirname, "../media/bot/sleepmode.jpeg"),
              },
              caption: broadcastMessage,
              mentions: [`${ownerNumber}@s.whatsapp.net`],
            });
            global.notifiedSenders.add(senderId);
          } catch (error) {
            console.error("Error saat mengirim pesan sleep mode:", error);
          }
        }
      }
    } else {
      if (!message.message || message.key.fromMe) return;

      const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
      const commandName = text.split(" ")[0].toLowerCase();

      if (checkSpam(sender, message)) {
        console.log(`Spam dari ${sender}`);
        await sock.sendMessage(from, {
          text: `⚠️ *Warning*: Anda memberikan pesan spam ke bot ini. Tunggu beberapa saat.`,
        });
        return;
      }

      if (sock?.commands?.has(commandName)) { // Fix undefined issue
        console.log(`Command ${commandName} ditemukan`);
        const command = sock.commands.get(commandName);
        try {
          await command.execute(sock, message);
        } catch (error) {
          console.error(`[ERROR] ${error}`);
        }
      }

      const prefix = process.env.PREFIX;
      if (commandName === `${prefix}clear`) {
        const isAdmin = await isGroupAdmin(sock, sender, from);
        if (isOwner || isAdmin) {
          console.log("Executing clear all messages command");
          await clearAllChats(sock);
          await sock.sendMessage(from, {
            text: "Semua pesan telah dibersihkan.",
          });
        } else {
          await sock.sendMessage(from, {
            text: "Anda tidak memiliki izin untuk menjalankan perintah ini.",
          });
        }
      }
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    await handleGroupUpdate(sock, update);
  });

  console.log(`Session ${userId} siap`);
  return sock;
}

function cleanUpSession(sessionPath) {
  if (fs.existsSync(sessionPath)) {
    fs.rmdirSync(sessionPath, { recursive: true });
    console.log(`Sesi dihapus: ${sessionPath}`);
  } else {
    console.log("Tidak ada sesi untuk dihapus.");
  }
}

async function retryOperation(retries, operation, delayTime) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries || (error.isBoom && error.output.statusCode === 408)) {
        console.error(`Operation failed after ${attempt} retries`);
        throw error;
      }
      console.log(
        `Retrying in ${delayTime / 1000} seconds... (${attempt}/${retries})`
      );
      await delay(delayTime);
    }
  }
}

async function main() {
  const sessionPath = "./sessions/whatsapp-session-bot-inti";
  const userId = "bot-inti";
  await retryOperation(3, () => initiateBot(sessionPath, userId), 5000);
}

main().catch((error) => console.error("Error in main function:", error));

module.exports = { initiateBot };
