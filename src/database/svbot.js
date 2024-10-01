// Fungsi untuk mencatat nomor bot baru ke database dengan lifetime
function saveBotToDatabase(phoneNumber, sessionPath, lifetime = 30) {
    const query = 'INSERT INTO bots (phone_number, session_path, lifetime) VALUES (?, ?, ?)';
    db.query(query, [phoneNumber, sessionPath, lifetime], (err, results) => {
        if (err) {
            console.error('Error menyimpan bot ke database:', err);
        }
    });
}


module.exports = {
    saveBotToDatabase
};