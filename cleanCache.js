const fs = require('fs');
const path = require('path');

// Folder yang akan dibersihkan
const downloadFolder = path.join(__dirname, 'media/downloads');
// Fungsi untuk membersihkan folder
function cleanFolder(folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(`Error membaca folder ${folderPath}:`, err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      if (filePath) { // Tambahkan pengecekan ini
        fs.unlink(filePath, err => {
          if (err) {
            console.error(`Error menghapus file ${filePath}:`, err);
          } else {
            console.log(`File ${filePath} berhasil dihapus`);
          }
        });
      } else {
        console.error(`File path tidak valid untuk file: ${file}`);
      }
    });
  });
}

// Jalankan pembersihan
cleanFolder(downloadFolder);
