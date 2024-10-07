const request = require('request');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'ss',
  description: 'Mengambil screenshot dari sebuah website',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);
    
    if (args.length === 0) {
      await sock.sendMessage(from, { text: 'Silakan masukkan URL website yang ingin di-screenshot.', quoted: message });
      return;
    }

    const url = args[0];
    const screenshotPath = path.join(__dirname, '../../media/downloads/screenshot.jpeg');

    try {
      await takeScreenshot(url, screenshotPath);
      await sock.sendMessage(from, { 
        image: { url: screenshotPath },
        caption: `Screenshot dari ${url}`,
        quoted: message
      });
    } catch (error) {
      console.error('Error saat mengambil screenshot:', error);
      await sock.sendMessage(from, { text: 'Terjadi kesalahan saat mengambil screenshot. Pastikan URL valid dan dapat diakses.', quoted: message });
    }
  }
};

function takeScreenshot(url, outputPath) {
  return new Promise((resolve, reject) => {
    request({
      url: "https://api.apiflash.com/v1/urltoimage",
      encoding: "binary",
      qs: {
        access_key: "2fc9726e595d40eebdf6792f0dd07380",
        url: url
      }
    }, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        fs.writeFile(outputPath, body, "binary", (writeError) => {
          if (writeError) {
            reject(writeError);
          } else {
            resolve();
          }
        });
      }
    });
  });
}