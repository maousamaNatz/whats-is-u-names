const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const ytdl = require("@distube/ytdl-core");
const Tiktok = require("@tobyg74/tiktok-api-dl");
const instagramDl = require("@sasmeee/igdl");
const { TwitterDL } = require("twitter-downloader");
const { downloadTrack2 } = require("@nechlophomeriaa/spotifydl");
const { mediaStoragePath } = require("../config/path");
const logger = require("../utils/logger");
/**
 * Memastikan direktori ada, jika tidak, membuatnya.
 * @param {string} filePath - Path file yang akan diperiksa direktorinya.
 */
const ensureDirectoryExists = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

/**
 * Mengunduh media dari URL yang diberikan.
 * @param {string} url - URL media yang akan diunduh.
 * @returns {Promise<string>} Path file media yang diunduh.
 * @throws {Error} Jika URL tidak valid atau terjadi kesalahan saat mengunduh.
 */
const downloadMedia = async (url) => {
  if (!url || !url.includes("http")) {
    logger.error("invalidInput", "URL tidak valid");
  }

  url = extractUrlFromString(url);
  await deleteTempMediaFiles();

  if (url.includes("spotify.com/track/")) {
    return downloadSpotifyMedia(url);
  } else if (url.includes("spotify.com/album/")) {
    return downloadSpotifyAlbum(url);
  } else if (url.includes("instagram.com/")) {
    return downloadInstagramMedia(url);
  } else if (url.includes("tiktok.com/")) {
    return downloadTikTokMedia(url);
  } else if (url.includes("youtu.be/") || url.includes("youtube.com/")) {
    return downloadYoutubeMedia(url);
  } else if (url.includes("twitter.com") || url.includes("x.com/")) {
    return downloadTwitterMedia(url);
  } else if (url.includes("spotify.com/")) {
    return downloadSpotifyMedia(url);
  } else if (url.includes("http")) {
    return downloadDirectMedia(url);
  } else {
    throw new Error(
      "Please specify a media URL from Instagram, YouTube, TikTok, Twitter, or Spotify..."
    );
  }
};

/**
 * Mengunduh media dari Instagram.
 * @param {string} url - URL Instagram.
 * @returns {Promise<string>} Path file media yang diunduh.
 * @throws {Error} Jika terjadi kesalahan saat mengunduh.
 */
const downloadInstagramMedia = async (url) => {
  try {
    const dataList = await instagramDl(url);
    if (!dataList || !dataList[0]) {
      throw new Error(logMessages.errors.paymentError);
    }
    const mediaURL = dataList[0].download_link;
    return await downloadDirectMedia(mediaURL, getFileName(mediaURL, "jpg"));
  } catch (error) {
    throw new Error("Error downloading Instagram media: " + error.message);
  }
};

/**
 * Mengunduh album Spotify.
 * @param {string} url - URL album Spotify.
 * @returns {Promise<string>} Path folder album yang diunduh.
 * @throws {Error} Jika terjadi kesalahan saat mengunduh.
 */
const downloadSpotifyAlbum = async (url) => {
  try {
    const albumTracks = await downloadAlbum(url);
    const albumFolder = path.join(
      mediaStoragePath,
      `album_${crypto.createHash("md5").update(url).digest("hex")}`
    );
    ensureDirectoryExists(albumFolder);

    for (const track of albumTracks) {
      if (track.audioBuffer) {
        const fileName = path.join(albumFolder, `${track.title}.mp3`);
        fs.writeFileSync(fileName, track.audioBuffer);
        console.log(`Track saved: ${fileName}`);
      } else {
        console.log(`Failed to download track: ${track.title}`);
      }
    }

    return albumFolder;
  } catch (error) {
    console.error("Error downloading Spotify album: " + error.message);
    throw new Error("Error downloading Spotify album: " + error.message);
  }
};

/**
 * Mengunduh media dari TikTok.
 * @param {string} url - URL TikTok.
 * @returns {Promise<string>} Path file media yang diunduh.
 * @throws {Error} Jika terjadi kesalahan saat mengunduh.
 */
const downloadTikTokMedia = async (url) => {
  try {
    const result = await Tiktok.Downloader(url, { version: "v2" });
    const mediaLink = result.result.video;
    return await downloadDirectMedia(mediaLink, getFileName(mediaLink, "mp4"));
  } catch (error) {
    throw new Error("Error downloading TikTok media: " + error.message);
  }
};

/**
 * Mengunduh media dari Twitter.
 * @param {string} url - URL Twitter.
 * @returns {Promise<string>} Path file media yang diunduh.
 * @throws {Error} Jika terjadi kesalahan saat mengunduh.
 */
const downloadTwitterMedia = async (url) => {
  try {
    const result = await TwitterDL(url);
    const mediaLink =
      result.result.media[0].videos[result.result.media[0].videos.length - 1]
        .url;
    return await downloadDirectMedia(mediaLink, getFileName(mediaLink, "mp4"));
  } catch (error) {
    throw new Error("Error downloading Twitter media: " + error.message);
  }
};

/**
 * Mengunduh media dari YouTube.
 * @param {string} url - URL YouTube.
 * @returns {Promise<string>} Path file media yang diunduh.
 * @throws {Error} Jika terjadi kesalahan saat mengunduh atau tidak ada format yang sesuai.
 */
const downloadYoutubeMedia = async (url) => {
  try {
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, "videoandaudio");

    let format;
    for (let i = 0; i < formats.length; i++) {
      const currentFormat = formats[i];
      let contentLength = currentFormat?.contentLength;
      if (!contentLength) {
        contentLength = await getContentLength(currentFormat.url);
        currentFormat.contentLength = contentLength;
      }
      if (contentLength && contentLength <= 25 * 1024 * 1024) {
        format = currentFormat;
        break;
      }
    }

    if (!format) {
      throw new Error("No suitable format found within 25 MB.");
    }

    const fileName = getFileName(format.url, "mp4");
    const mediaStream = ytdl.downloadFromInfo(info, {
      format: format,
      filter: "videoandaudio",
    });
    return await saveStreamToFile(mediaStream, fileName);
  } catch (error) {
    throw new Error("Error downloading YouTube media: " + error.message);
  }
};

/**
 * Mengunduh media dari Spotify.
 * @param {string} url - URL track Spotify.
 * @returns {Promise<string>} Path file media yang diunduh.
 * @throws {Error} Jika terjadi kesalahan saat mengunduh.
 */
const downloadSpotifyMedia = async (url) => {
  try {
    const downTrack = await downloadTrack2(url);
    if (downTrack && downTrack.audioBuffer) {
      const fileName = getFileName(url, "mp3");
      fs.writeFileSync(fileName, downTrack.audioBuffer);
      console.log(`File saved: ${fileName}`);
      return fileName;
    } else {
      throw new Error("Failed to download track.");
    }
  } catch (error) {
    console.error("Error downloading Spotify media: " + error.message);
    throw new Error("Error downloading Spotify media: " + error.message);
  }
};

/**
 * Mengunduh media langsung dari URL.
 * @param {string} url - URL media.
 * @param {string} fileName - Nama file untuk menyimpan media.
 * @returns {Promise<string>} Path file media yang diunduh.
 * @throws {Error} Jika terjadi kesalahan saat mengunduh.
 */
const downloadDirectMedia = async (url, fileName) => {
  try {
    const response = await axios({
      url: url,
      method: "GET",
      responseType: "stream",
    });
    return await saveStreamToFile(response.data, fileName);
  } catch (error) {
    console.error(`Error downloading media from URL ${url}: ${error.message}`);
    throw new Error("Error downloading media: " + error.message);
  }
};

/**
 * Menyimpan stream ke file.
 * @param {ReadableStream} stream - Stream yang akan disimpan.
 * @param {string} fileName - Nama file untuk menyimpan stream.
 * @returns {Promise<string>} Path file yang disimpan.
 */
const saveStreamToFile = (stream, fileName) => {
  ensureDirectoryExists(fileName);
  const mediaWriter = fs.createWriteStream(fileName);
  stream.pipe(mediaWriter);

  return new Promise((resolve, reject) => {
    mediaWriter.on("finish", () => {
      console.log(`File saved: ${fileName}`);
      resolve(fileName);
    });
    mediaWriter.on("error", (error) => {
      console.error(`Error saving file ${fileName}: ${error.message}`);
      reject(error);
    });
  });
};

/**
 * Menghasilkan nama file unik berdasarkan URL dan ekstensi.
 * @param {string} url - URL media.
 * @param {string} extension - Ekstensi file.
 * @returns {string} Nama file yang dihasilkan.
 */
const getFileName = (url, extension) => {
  const hash = crypto.createHash("md5").update(url).digest("hex");
  const datetime = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(mediaStoragePath, `${hash}_${datetime}.${extension}`);
};

/**
 * Mengekstrak URL dari string.
 * @param {string} string - String yang mungkin mengandung URL.
 * @returns {string|null} URL yang diekstrak atau null jika tidak ditemukan.
 */
const extractUrlFromString = (string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matchedUrls = string.match(urlRegex);
  return matchedUrls ? matchedUrls[0] : null;
};

/**
 * Mendapatkan panjang konten dari URL.
 * @param {string} url - URL untuk diperiksa panjang kontennya.
 * @returns {Promise<number|null>} Panjang konten atau null jika gagal.
 */
const getContentLength = async (url) => {
  try {
    const response = await axios.head(url);
    return response.headers["content-length"];
  } catch (error) {
    console.error("Error getting content length:", error.message);
    return null;
  }
};

/**
 * Menghapus file media sementara yang lebih tua dari batas waktu tertentu.
 */
const deleteTempMediaFiles = async () => {
  const mediaPath = mediaStoragePath;
  const now = Date.now();
  const ageLimit = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  fs.readdir(mediaPath, (err, files) => {
    if (err) {
      console.error(`Error reading media storage path: ${err.message}`);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(mediaPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(
            `Error getting stats for file ${filePath}: ${err.message}`
          );
          return;
        }

        const fileAge = now - stats.mtimeMs;
        if (fileAge > ageLimit) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file ${filePath}: ${err.message}`);
            } else {
              console.log(`Deleted old media file: ${filePath}`);
            }
          });
        }
      });
    });
  });
};

module.exports = { downloadMedia };
