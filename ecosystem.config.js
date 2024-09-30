module.exports = {
  apps: [
    {
      name: "shikanoko", // Nama aplikasi
      script: "./src/index.js", // File utama untuk menjalankan aplikasi
      watch: ["src"], // Aktifkan watch untuk memonitor perubahan file
      ignore_watch: ["node_modules", "sessions", "logs", "media"], // Abaikan perubahan di folder ini
      max_memory_restart: "500M", // Restart aplikasi jika penggunaan memori melebihi 500MB
      env: {
        NODE_ENV: "development",
        PORT: 3000,
        PREFIX: ".",
        OWNER_NAME: "natzsixn",
        OWNER_PHONE: "6287748952040",
        STICKER_PACK_NAME: "My Sticker Pack",
        STICKER_AUTHOR: "Bot Author",
        STICKER_CATEGORIES: "fun,whatsapp"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
        PREFIX: ".",
        OWNER_NAME: "natzsixn",
        OWNER_PHONE: "6287748952040",
        STICKER_PACK_NAME: "My Sticker Pack",
        STICKER_AUTHOR: "Bot Author",
        STICKER_CATEGORIES: "fun,whatsapp"
      },
      // Hooks untuk membersihkan cache
      post_start: "npm run clean-cache",
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
      exec_mode: "cluster",
      instances: "max",
    },
  ],
};
