// Fungsi untuk mencatat nomor bot baru ke database dengan lifetime
function saveBotToDatabase(phoneNumber, sessionPath, lifetime = 30) {
    const query = 'INSERT INTO bots (phone_number, session_path, lifetime) VALUES (?, ?, ?)';
    db.query(query, [phoneNumber, sessionPath, lifetime], (err, results) => {
        if (err) {
            console.error('Error menyimpan bot ke database:', err);
        } else {
            console.log('Nomor bot baru berhasil disimpan:', phoneNumber);
        }
    });
}

// Fungsi untuk memulai session baru (misalnya saat QR code di-scan)
async function startBot(sessionPath, userId = 'bot-inti', lifetime = 30) {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // QR akan tampil di terminal
        logger: P({ level: "silent" }),
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === "open") {
            console.log(`Session ${userId} siap digunakan`);

            // Setelah bot berhasil terhubung, ambil nomor bot dan simpan ke database
            const phoneNumber = sock.user.id.split(':')[0]; // Mendapatkan nomor bot
            saveBotToDatabase(phoneNumber, sessionPath, lifetime); // Menyimpan nomor dan lifetime ke database
        }

        if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect?.error instanceof Boom)?.output?.statusCode !==
                DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot(sessionPath, userId, lifetime);
            }
        }
    });

    sock.ev.on("creds.update", saveCreds); // Simpan kredensial

    return sock;
}

module.exports = {
    saveBotToDatabase,
    startBot
};