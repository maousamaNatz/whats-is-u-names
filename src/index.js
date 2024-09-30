const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const P = require("pino");
const { handleGroupUpdate } = require("./libs/canvas");
const fs = require("fs");
const { getSessionQR } = require("./utils/session");
const db = require("./database/database");
const { createTables } = require("./database/createtbl");
const { seedDatabase } = require("./database/seed");
const express = require("express");
const { saveBotToDatabase, startBot } = require("./database/svbot"); // Fungsi menyimpan bot ke database
const asciiLogo = fs.readFileSync("./media/bot/logo.txt", "utf8");
const app = express();

const sessions = global.sessions || {}; // Penyimpanan session user
let botInti; // Bot inti
const port = process.env.PORT || 3000;
// Middleware untuk mengatur userId di req
app.use((req, res, next) => {
  req.userId = req.query.userId || 1; // Default userId ke 1
  next();
});

// Fungsi untuk memulai bot inti
async function startBotInti() {
  const sessionPath = "./natzsixn"; // Session tetap untuk bot inti
  botInti = await initiateBot(sessionPath, "bot-inti"); // Memulai bot inti
  console.log("Bot inti berjalan dengan session tetap");
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
    } else {
      console.log("Terhubung ke database MySQL");
      createTables();
      seedDatabase();
    }
  });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // QR ditampilkan di terminal
    logger: P({ level: "silent" }),
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
    const { connection, lastDisconnect, qr } = update;

    if (qr && userId !== "bot-inti") {
      console.log(`QR Code untuk user ${userId}:`);
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error instanceof Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        "Koneksi terputus karena ",
        lastDisconnect?.error,
        ", Menghubungkan kembali ",
        shouldReconnect
      );
      if (shouldReconnect) {
        initiateBot(sessionPath, userId, lifetime);
      }
    } else if (connection === "open") {
      console.log(`Session ${userId} siap digunakan`);

      // Hanya menyimpan bot user ke database, bukan bot inti
      if (userId !== "bot-inti") {
        const phoneNumber = sock.user.id.split(":")[0]; // Mendapatkan nomor bot
        saveBotToDatabase(phoneNumber, sessionPath, lifetime); // Menyimpan nomor bot dan lifetime ke database
      }
    }
  });

  // Menyimpan kredensial
  sock.ev.on("creds.update", saveCreds);

  // Menangani pesan masuk
  sock.ev.on("messages.upsert", async (msg) => {
    const message = msg.messages[0];
    if (!message.message || message.key.fromMe) return;

    const text =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";
    const commandName = text.split(" ")[0].toLowerCase();

    if (sock.commands.has(commandName)) {
      const command = sock.commands.get(commandName);
      console.log(`[DEBUG] nomor client: ${message.key.remoteJid}`);
      console.log(`[DEBUG] Pesan dari klien: ${text}`);
      console.log(`[DEBUG] deskripsi fitur: ${command.description}`);
      try {
        await command.execute(sock, message);
      } catch (error) {
        console.error(`[ERROR] ${error}`);
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

module.exports = { initiateBot };
