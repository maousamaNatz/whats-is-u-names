const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const P = require("pino");
const { handleGroupUpdate } = require('./libs/canvas');
const fs = require("fs");
// const db = require("./database/database");
const { createTables } = require("./database/createtbl");
const asciiLogo = fs.readFileSync("./media/bot/logo.txt", "utf8");
// const qrcode = require('qrcode-terminal');
const db  = require('./database/database');
const {seedDatabase } = require('./database/seed');
const express = require('express');
const { checkAuth } = require('./database/auth');

const app = express();

// Middleware untuk mengatur userId di req (contoh sederhana)
app.use((req, res, next) => {
    req.userId = 1; // Asumsikan userId 1 untuk contoh ini
    next();
});

// Contoh endpoint yang dibatasi untuk role 'admin'
app.get('/admin', checkAuth(['admin']), (req, res) => {
    res.send('Welcome Admin');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
// Fungsi untuk memulai bot
async function startBot() {
  // Menampilkan logo ASCII
  console.log(asciiLogo);

  db.query("SELECT 1", (err) => {
    if (err) {
      console.error("Error menghubungkan ke database:", err);
    } else {
      console.log("Terhubung ke database MySQL");
      createTables();
      seedDatabase();
    }
  });
  const { state, saveCreds } = await useMultiFileAuthState(
    process.env.SESSION_PATH || "whatsapp-session"
  );

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: "silent" }), // Ubah level logger menjadi "info"
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

    if (qr) {
      console.log("QR Code:");
    }

    // const { connection, lastDisconnect } = update;
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
        startBot();
      }
    } else if (connection === "open") {
      console.log("Bot WhatsApp siap digunakan");
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
      console.log(`nomor client: ${message.key.remoteJid}`);
      console.log(`Pesan dari klien: ${text}`);
      console.log(`deskripsi fitur: ${command.description}`);
      try {
        await command.execute(sock, message);
      } catch (error) {
        console.error(error);
      }
    }
  });
  sock.ev.on('group-participants.update', async (update) => {
    await handleGroupUpdate(sock, update);
  });

  console.log("WhatsApp bot is ready");
}

// Memulai bot
startBot();
