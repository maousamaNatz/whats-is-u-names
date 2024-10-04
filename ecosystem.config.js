module.exports = {
  apps: [
    {
      name: 'shikanoko',
      script: './src/index.js',
      log_type: 'json',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      watch: ["src"], // Aktifkan watch untuk memonitor perubahan file
      ignore_watch: ["node_modules", "sessions", "logs", "media"], // Abaikan perubahan di folder ini
      max_memory_restart: "400M", // Restart aplikasi jika penggunaan memori melebihi 500MB
      instances: 1,
      exec_mode: 'fork', // Atau 'cluster' jika Anda memerlukan cluste
      env_production: {
        NODE_ENV: "development",
        PORT: process.env.PORT || 8080,
        PREFIX: "." || "/" || "./" || "!",
        OWNER_NAME: "natzsixn",
        OWNER_PHONE: "6287748952040",
        STICKER_PACK_NAME: "My Sticker Pack",
        STICKER_AUTHOR: "Bot Author",
        STICKER_CATEGORIES: "fun,whatsapp"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 8080,
        PREFIX: "." || "/" || "./" || "!",
        OWNER_NAME: "natzsixn",
        OWNER_PHONE: "6287748952040",
        STICKER_PACK_NAME: "My Sticker Pack",
        STICKER_AUTHOR: "Bot Author",
        STICKER_CATEGORIES: "fun,whatsapp"
      },
      // Hooks untuk membersihkan cache
      post_start: "npm run clean-cache",
      restart_delay: 3000,
      max_restarts: 1,
      autorestart: true,
      exec_mode: "cluster",
    },
  ],
};
