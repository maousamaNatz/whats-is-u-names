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
const { saveBotToDatabase } = require("./database/svbot"); // Fungsi menyimpan bot ke database
const { sendWhatsAppMessage } = require("./database/genewmember"); // Fungsi untuk mengirim pesan WhatsApp
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

const sessions = global.sessions || {}; // Penyimpanan session user
let botInti; // Bot inti
const port = process.env.PORT || 3000;

// Middleware untuk mengatur userId di req
app.use((req, res, next) => {
  req.userId = req.query.userId || 1; // Default userId ke 1
  next();
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fungsi untuk memulai bot inti
async function startBotInti() {
  console.log("Memulai bot inti...");
  await delay(5000);
  const sessionPath = "./sessions/whatsapp-session-bot-inti";
  botInti = await initiateBot(sessionPath, "bot-inti");
  console.log("Bot inti berjalan dengan session tetap");

  const ownerNumber = process.env.OWNER_PHONE;
  if (botInti && botInti.user && botInti.user.id) {
    let retries = 3;
    while (retries > 0) {
      try {
        await sendWhatsAppMessage(
          botInti,
          ownerNumber + "@s.whatsapp.net",
          {
            text: "Bot inti siap digunakan! 🤖✅",
          },
          30000
        );
        console.log("Pesan berhasil dikirim ke owner");
        break;
      } catch (error) {
        console.error(
          `Gagal mengirim pesan ke owner (percobaan ${4 - retries}/3):`,
          error.message
        );
        retries--;
        if (retries > 0) {
          console.log(`Mencoba kembali dalam 5 detik...`);
          await delay(5000);
        }
      }
    }
    if (retries === 0) {
      console.error("Gagal mengirim pesan ke owner setelah 3 percobaan");
    }
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

    // Pastikan sesi dapat disimpan dalam objek sessions
    if (!sessions[userId]) {
      sessions[userId] = sock;
    }

    await sendWhatsAppMessage(sock, userId, { image: { url: qrPath } });
    res.send("Session dan QR code berhasil dibuat dan dikirim");
  } catch (error) {
    console.error("Error saat membuat session dan QR code:", error);
    res.status(500).send(`Gagal membuat session dan QR code: ${error.message}`);
  }
});

// Fungsi untuk menghentikan session user
app.get("/stop-session", (req, res) => {
  const userId = req.userId;

  if (!sessions[userId]) {
    return res.status(400).send("Session tidak ditemukan untuk user ini");
  }

  // Hentikan session user
  sessions[userId].end(); // Hentikan session
  delete sessions[userId];
  res.send("Session dihentikan");
});

// Memulai server express
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
  startBotInti(); // Mulai bot inti saat server dimulai
});

// Fungsi untuk memulai bot (baik bot inti maupun bot user)
async function initiateBot(sessionPath, userId = "bot-inti", lifetime = 30) {
  console.log(asciiLogo); // Tampilkan logo ASCII

  // Inisiasi database
  db.query("SELECT 1", (err) => {
    if (err) {
      console.error("Error menghubungkan ke database:", err);
      process.exit(1); // Keluar dari proses jika terjadi error fatal
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
    connectTimeoutMs: 18000000,
    syncFullHistory: true,
    // Hapus baris berikut:
    // store: store,
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

  // Menangani koneksi
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`Koneksi terputus dengan status code: ${statusCode}`);

      if (shouldReconnect) {
        if (statusCode === 515) {
          console.log("Kesalahan stream terdeteksi. Mencoba memulai ulang...");
          await delay(10000); // Tunggu 10 detik sebelum mencoba lagi
          initiateBot(sessionPath, userId, lifetime);
        } else {
          console.log("Mencoba menghubungkan kembali...");
          await delay(5000);
          initiateBot(sessionPath, userId, lifetime);
        }
      } else {
        console.log("Sesi telah logout. Menghapus sesi dan memulai ulang...");
        if (fs.existsSync(sessionPath)) {
          fs.rmdirSync(sessionPath, { recursive: true });
        }
        initiateBotq(sessionPath, userId, lifetime);
      }

      if (statusCode === 408) {
        console.error("Request Timed Out. Mencoba menghubungkan kembali...");
        await delay(5000); // Tunggu 5 detik sebelum mencoba lagi
        initiateBot(sessionPath, userId, lifetime);
      }
    } else if (connection === "open") {
      console.log(`Session ${userId} siap digunakan`);
      sessions[userId] = sock;
      // Hanya menyimpan bot user ke database, bukan bot inti
      if (userId !== "bot-inti") {
        const phoneNumber = sock.user.id.split(":")[0]; // Mendapatkan nomor bot
        saveBotToDatabase(phoneNumber, sessionPath, lifetime); // Menyimpan nomor bot dan lifetime ke database
      }
    }
  });

  // Menyimpan kredensial
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (msg) => {
    const message = msg.messages[0];
    const from = message.key.remoteJid;
    const sender = message.key.participant || from;

    // Cek apakah pengirim adalah owner
    const isOwner = sender === process.env.OWNER_PHONE + "@s.whatsapp.net";

    if (isOwner) {
      await handleOwnerMessage(sock, message);
    }

    const isSleeping = isBotSleeping();

    if (isSleeping && !isOwner) {
      if (
        message.key &&
        !message.key.fromMe &&
        message.key.remoteJid !== "status@broadcast"
      ) {
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
      // Pengecekan null untuk message.message
      if (!message.message || message.key.fromMe) return;

      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        "";

      const commandName = text.split(" ")[0].toLowerCase();

      // Pengecekan spam
      if (checkSpam(sender, message)) {
        console.log(`Spam dari ${sender}`);
        await sock.sendMessage(from, {
          text: `⚠️ *Warning*: Anda memberikan pesan spam ke bot ini. Tunggu beberapa saat.`,
        });
        return;
      }

      // Eksekusi command jika ditemukan
      if (sock.commands.has(commandName)) {
        console.log(`Command ${commandName} ditemukan`);
        const command = sock.commands.get(commandName);
        try {
          await command.execute(sock, message);
        } catch (error) {
          console.error(`[ERROR] ${error}`);
        }
      }

      const prefix = process.env.PREFIX;
      // Execute the !clearmessage command
      if (commandName === `${prefix}clear`) {
        const isAdmin = await isGroupAdmin(sock, sender, from); // Check if user is admin
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

  // Event group participants update
  sock.ev.on("group-participants.update", async (update) => {
    await handleGroupUpdate(sock, update);
  });

  console.log(`Session ${userId} siap`);
  return sock;
}

async function retryOperation(retries, operation, delayTime) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (
        attempt === retries ||
        (error.isBoom && error.output.statusCode === 408)
      ) {
        console.error(`Operation failed after ${attempt} retries`);
        throw error; // Lempar error jika gagal setelah beberapa kali mencoba
      }
      console.log(
        `Retrying in ${delayTime / 1000} seconds... (${attempt}/${retries})`
      );
      await delay(delayTime);
    }
  }
}

// Fungsi main untuk menjalankan retryOperation
async function main() {
  const sessionPath = "./sessions/whatsapp-session-bot-inti";
  const userId = "bot-inti";
  await retryOperation(3, () => initiateBot(sessionPath, userId), 5000);
}

// Jalankan fungsi main
main().catch((error) => console.error("Error in main function:", error));

module.exports = { initiateBot };
