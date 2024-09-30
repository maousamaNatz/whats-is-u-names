module.exports = {
  apps: [
    {
      name: "shikanoko", // Nama aplikasi
      script: "./src/index.js", // File utama untuk menjalankan aplikasi
      watch: true, // Aktifkan watch untuk memonitor perubahan file
      ignore_watch: ["node_modules", "sessions", "logs"], // Abaikan perubahan di folder ini
      max_memory_restart: "300M", // Restart aplikasi jika penggunaan memori melebihi 300MB
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      // Hooks untuk membersihkan cache
      post_start: "npm run clean-cache",
    },
  ],
};
