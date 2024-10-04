# Gunakan image Node.js versi 20.17.0 sebagai base image
FROM node:20.17.0

# Set working directory di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin seluruh kode sumber aplikasi
COPY . .


RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    build-essential \
    g++

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg
# Rebuild canvas untuk arsitektur yang sesuai
RUN npm rebuild canvas --update-binary
# Buat folder untuk menyimpan sesi WhatsApp
RUN mkdir -p sessions

# Expose port yang digunakan oleh aplikasi (sesuaikan dengan port yang digunakan di ecosystem.config.js)
EXPOSE 8080

# Jalankan aplikasi menggunakan PM2
CMD ["npm", "start"]