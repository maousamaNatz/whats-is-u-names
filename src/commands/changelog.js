const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'changelog',
  description: 'Menampilkan changelog bot',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    
    try {
      const changelogPath = path.join(__dirname, '../../media/bot/changelog.txt');
      const changelog = fs.readFileSync(changelogPath, 'utf8');
      
      const formattedChangelog = changelog
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .join('\n');
      
      await sock.sendMessage(from, { text: formattedChangelog });
    } catch (error) {
      console.error('Error membaca changelog:', error);
      await sock.sendMessage(from, { text: 'Maaf, terjadi kesalahan saat membaca changelog.' });
    }
  }
};