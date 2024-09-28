const QRCode = require("qrcode");
const path = require("path");

// Utility untuk membuat QR Code
async function getSessionQR(sessionId) {
  const qrData = `whatsapp://send?text=Scan%20this%20to%20start%20the%20session%20${sessionId}`;
  const qrPath = path.join(__dirname, `../../media/downloads/${sessionId}.png`);

  await QRCode.toFile(qrPath, qrData);
  return qrPath; // Kembalikan path dari QR code yang telah dibuat
}

module.exports = { getSessionQR };
