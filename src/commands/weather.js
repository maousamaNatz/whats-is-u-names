const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

module.exports = {
  name: 'cuaca',
  description: 'Menampilkan informasi cuaca untuk lokasi tertentu',
  async execute(sock, message) {
    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
    const args = text.split(" ").slice(1);
    
    if (args.length === 0) {
      await sock.sendMessage(from, { text: 'Silakan masukkan nama lokasi.' });
      return;
    }

    const location = args.join(" ");
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      console.error('API key tidak ditemukan');
      await sock.sendMessage(from, { text: 'Maaf, terjadi kesalahan konfigurasi. Silakan hubungi admin.' });
      return;
    }

    const url = `http://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}&lang=id`;

    try {
      const response = await axios.get(url);
      const data = response.data;

      const sunrise = moment.unix(data.sys.sunrise + data.timezone).utc().format("HH:mm");
      const sunset = moment.unix(data.sys.sunset + data.timezone).utc().format("HH:mm");

      let weather = `*Informasi Cuaca*\n\n`;
      weather += `Lokasi: ${data.name}, ${data.sys.country}\n`;
      weather += `Suhu: ${data.main.temp}°C\n`;
      weather += `Terasa seperti: ${data.main.feels_like}°C\n`;
      weather += `Deskripsi: ${data.weather[0].description}\n`;
      weather += `Kelembaban: ${data.main.humidity}%\n`;
      weather += `Kecepatan angin: ${data.wind.speed} m/s\n`;
      weather += `Awan: ${data.clouds.all}%\n`;
      weather += `Jarak pandang: ${data.visibility} meter\n`;
      weather += `Matahari terbit: ${sunrise}\n`;
      weather += `Matahari terbenam: ${sunset}`;

      await sock.sendMessage(from, { text: weather });
    } catch (error) {
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      let errorMessage = 'Maaf, terjadi kesalahan saat mengambil data cuaca.';
      if (error.response && error.response.status === 401) {
        errorMessage += ' Sepertinya ada masalah dengan konfigurasi API. Silakan hubungi admin.';
      } else if (error.response && error.response.status === 404) {
        errorMessage = 'Lokasi tidak ditemukan. Pastikan Anda memasukkan nama lokasi yang benar.';
      }
      await sock.sendMessage(from, { text: errorMessage });
    }
  }
};