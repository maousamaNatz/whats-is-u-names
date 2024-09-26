// src/commands/ping.js
module.exports = {
    name: 'ping',
    description: 'Ping command',
    async execute(sock, message) {
        const from = message.key.remoteJid;
        await sock.sendMessage(from, { text: 'Pong!' });
    }
};
