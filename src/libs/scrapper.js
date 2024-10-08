const axios = require("axios");
const cheerio = require("cheerio");
// const wikipedia = require("wikipedia");

/**
 * Fungsi untuk mencari Wikipedia.
 * @param {string} query - Kata kunci pencarian.
 * @param {string} [lang="en"] - Bahasa pencarian (default: "en").
 * @returns {Promise<Object>} Objek yang berisi judul, konten, dan URL halaman Wikipedia.
 * @throws Akan menimbulkan kesalahan jika pencarian Wikipedia gagal.
 */
// async function searchWikipedia(query, lang = "en") {
//   try {
//     wikipedia.setLang(lang);
//     const page = await wikipedia.page(query);
//     const summary = await page.summary();
//     return {
//       title: summary.title,
//       content: summary.extract,
//       url: page.fullurl,
//     };
//   } catch (error) {
//     throw new Error(logMessages.errors.wikiError);
//   }
// }

/**
 * Fungsi untuk mencari di Pinterest.
 * @param {string} query - Kata kunci pencarian.
 * @returns {Promise<Array<string>>} Array URL gambar hasil pencarian.
 * @throws Akan menimbulkan kesalahan jika pencarian Pinterest gagal.
 */
function pinterest(query) {
  return new Promise(async (resolve, reject) => {
    axios
      .get("https://id.pinterest.com/search/pins/?autologin=true&q=" + query, {
        headers: {
          cookie:
            '_auth=1; _b="AVna7S1p7l1C5I9u0+nR3YzijpvXOPc6d09SyCzO+DcwpersQH36SmGiYfymBKhZcGg="; _pinterest_sess=...',
        },
      })
      .then(({ data }) => {
        const $ = cheerio.load(data);
        const result = [];
        const hasil = [];
        $("div > a")
          .get()
          .map((b) => {
            const link = $(b).find("img").attr("src");
            result.push(link);
          });
        result.forEach((v) => {
          if (v == undefined) return;
          hasil.push(v.replace(/236/g, "736"));
        });
        hasil.shift();
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk mencari wallpaper.
 * @param {string} title - Kata kunci pencarian.
 * @param {string} [page="1"] - Halaman pencarian (default: "1").
 * @returns {Promise<Array<Object>>} Array objek yang berisi informasi wallpaper.
 * @throws Akan menimbulkan kesalahan jika pencarian wallpaper gagal.
 */
function wallpaper(title, page = "1") {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://www.besthdwallpaper.com/search?CurrentPage=${page}&q=${title}`
      )
      .then(({ data }) => {
        let $ = cheerio.load(data);
        let hasil = [];
        $("div.grid-item").each(function (a, b) {
          hasil.push({
            title: $(b).find("div.info > a > h3").text(),
            type: $(b).find("div.info > a:nth-child(2)").text(),
            source:
              "https://www.besthdwallpaper.com/" +
              $(b).find("div > a:nth-child(3)").attr("href"),
            image: [
              $(b).find("picture > img").attr("data-src") ||
                $(b).find("picture > img").attr("src"),
              $(b).find("picture > source:nth-child(1)").attr("srcset"),
              $(b).find("picture > source:nth-child(2)").attr("srcset"),
            ],
          });
        });
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk mencari gambar di Wikimedia.
 * @param {string} title - Kata kunci pencarian.
 * @returns {Promise<Array<Object>>} Array objek yang berisi informasi gambar di Wikimedia.
 * @throws Akan menimbulkan kesalahan jika pencarian Wikimedia gagal.
 */
function wikimedia(title) {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://commons.wikimedia.org/w/index.php?search=${title}&title=Special:MediaSearch&go=Go&type=image`
      )
      .then((res) => {
        let $ = cheerio.load(res.data);
        let hasil = [];
        $(".sdms-search-results__list-wrapper > div > a").each(function (a, b) {
          hasil.push({
            title: $(b).find("img").attr("alt"),
            source: $(b).attr("href"),
            image:
              $(b).find("img").attr("data-src") || $(b).find("img").attr("src"),
          });
        });
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk mencari kutipan anime.
 * @returns {Promise<Array<Object>>} Array objek yang berisi informasi kutipan anime.
 * @throws Akan menimbulkan kesalahan jika pencarian kutipan anime gagal.
 */
function quotesAnime() {
  return new Promise((resolve, reject) => {
    const page = Math.floor(Math.random() * 184);
    axios
      .get("https://otakotaku.com/quote/feed/" + page)
      .then(({ data }) => {
        const $ = cheerio.load(data);
        const hasil = [];
        $("div.kotodama-list").each(function (l, h) {
          hasil.push({
            link: $(h).find("a").attr("href"),
            gambar: $(h).find("img").attr("data-src"),
            karakter: $(h).find("div.char-name").text().trim(),
            anime: $(h).find("div.anime-title").text().trim(),
            episode: $(h).find("div.meta").text(),
            up_at: $(h).find("small.meta").text(),
            quotes: $(h).find("div.quote").text().trim(),
          });
        });
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk mencari ringtone.
 * @param {string} title - Kata kunci pencarian.
 * @returns {Promise<Array<Object>>} Array objek yang berisi informasi ringtone.
 * @throws Akan menimbulkan kesalahan jika pencarian ringtone gagal.
 */
function ringtone(title) {
  return new Promise((resolve, reject) => {
    axios
      .get("https://meloboom.com/en/search/" + title)
      .then((get) => {
        let $ = cheerio.load(get.data);
        let hasil = [];
        $(
          "#__next > main > section > div.jsx-2244708474.container > div > div > div > div:nth-child(4) > div > div > div > ul > li"
        ).each(function (a, b) {
          hasil.push({
            title: $(b).find("h4").text(),
            source: "https://meloboom.com/" + $(b).find("a").attr("href"),
            audio: $(b).find("audio").attr("src"),
          });
        });
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk style teks.
 * @param {string} teks - Teks yang akan diubah gayanya.
 * @returns {Promise<Array<Object>>} Array objek yang berisi nama gaya dan hasil teks.
 * @throws Akan menimbulkan kesalahan jika gaya teks gagal.
 */
function styletext(teks) {
  return new Promise((resolve, reject) => {
    axios
      .get("http://qaz.wtf/u/convert.cgi?text=" + teks)
      .then(({ data }) => {
        let $ = cheerio.load(data);
        let hasil = [];
        $("table > tbody > tr").each(function (a, b) {
          hasil.push({
            name: $(b).find("td:nth-child(1) > span").text(),
            result: $(b).find("td:nth-child(2)").text().trim(),
          });
        });
        resolve(hasil);
      })
      .catch(reject);
  });
}
/**
 * Fungsi untuk mencari informasi anime di MyAnimeList menggunakan Jikan API.
 * @param {string} title - Judul anime yang dicari.
 * @returns {Promise<Object>} Objek yang berisi informasi anime.
 * @throws Akan menimbulkan kesalahan jika pencarian MyAnimeList gagal.
 */
async function searchAnimeMAL(title) {
  try {
    const response = await axios.get(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=5`
    );
    const hasil = response.data.data.map((anime) => ({
      mal_id: anime.mal_id,
      title: anime.title,
      url: anime.url,
      image: anime.images.jpg.image_url,
      synopsis: anime.synopsis,
      type: anime.type,
      episodes: anime.episodes,
      score: anime.score,
      status: anime.status,
      airing: anime.airing,
      start_date: anime.aired.from,
      end_date: anime.aired.to,
      genres: anime.genres.map((genre) => genre.name),
    }));
    return hasil;
  } catch (error) {
    throw new Error(`Error during anime search: ${error.message}`);
  }
}

/**
 * Fungsi untuk mencari informasi manga di MyAnimeList menggunakan Jikan API.
 * @param {string} title - Judul manga yang dicari.
 * @returns {Promise<Object>} Objek yang berisi informasi manga.
 * @throws Akan menimbulkan kesalahan jika pencarian MyAnimeList gagal.
 */
async function searchMangaMAL(title) {
  try {
    const response = await axios.get(
      `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=5`
    );
    const hasil = response.data.data.map((manga) => ({
      mal_id: manga.mal_id,
      title: manga.title,
      url: manga.url,
      image: manga.images.jpg.image_url,
      synopsis: manga.synopsis,
      type: manga.type,
      volumes: manga.volumes,
      chapters: manga.chapters,
      score: manga.score,
      status: manga.status,
      publishing: manga.publishing,
      start_date: manga.published.from,
      end_date: manga.published.to,
      genres: manga.genres.map((genre) => genre.name),
    }));
    return hasil;
  } catch (error) {
    throw new Error(`Error during manga search: ${error.message}`);
  }
}

async function ytmp3(query) {
   const trimmedQuery = query.trim();
   const url = `download/ytmp3?url=${encodeURIComponent(trimmedQuery)}`;
   const response = await axios.get(API + url, { responseType: "json" });
   const media = response.data.audio;
   const videoResponse = await axios.get(media, { responseType: "arraybuffer" });
   return Buffer.from(videoResponse.data);
}

function WebpToMp4(filePath) {
   return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("new-image-url", "");
      form.append("new-image", fs.createReadStream(filePath));

      axios({
         method: "POST",
         url: "https://s6.ezgif.com/webp-to-mp4",
         data: form,
         headers: {
            "Content-Type": "multipart/form-data; boundary=" + form._boundary,
         },
      })
         .then(({ data: initialResponse }) => {
            const form2 = new FormData();
            const $ = cheerio.load(initialResponse);
            const fileValue = $("input[name='file']").attr("value");

            form2.append("file", fileValue);
            form2.append("convert", "Convert WebP to MP4!");

            axios({
               method: "POST",
               url: "https://ezgif.com/webp-to-mp4/" + fileValue,
               data: form2,
               headers: {
                  "Content-Type": "multipart/form-data; boundary=" + form2._boundary,
               },
            })
               .then(({ data: conversionResponse }) => {
                  const $ = cheerio.load(conversionResponse);
                  const mp4Url = "https:" + $("div#output > p.outfile > video > source").attr("src");

                  resolve({
                     status: true,
                     message: "Created By MRHRTZ",
                     result: mp4Url,
                  });
               })
               .catch(reject);
         })
         .catch(reject);
   });
}

function webpTojpg(filePath) {
   return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("new-image-url", "");
      form.append("new-image", fs.createReadStream(filePath));

      axios({
         method: "POST",
         url: "https://ezgif.com/webp-to-jpg",
         data: form,
         headers: {
            "Content-Type": "multipart/form-data; boundary=" + form._boundary,
         },
      })
         .then(({ data: initialResponse }) => {
            const form2 = new FormData();
            const $ = cheerio.load(initialResponse);
            const fileValue = $("input[name='file']").attr("value");

            form2.append("file", fileValue);
            form2.append("convert", "Convert WebP to JPG!");

            axios({
               method: "POST",
               url: "https://ezgif.com/webp-to-jpg/" + fileValue,
               data: form2,
               headers: {
                  "Content-Type": "multipart/form-data; boundary=" + form2._boundary,
               },
            })
               .then(({ data: conversionResponse }) => {
                  const $ = cheerio.load(conversionResponse);
                  const mp4Url = "https:" + $("div#output > p.outfile > video > source").attr("src");

                  resolve({
                     status: true,
                     message: "Created By MRHRTZ",
                     result: mp4Url,
                  });
               })
               .catch(reject);
         })
         .catch(reject);
   });
}

module.exports = {
   searchAnimeMAL,
   searchMangaMAL,
   pinterest,
   wallpaper,
   wikimedia,
   quotesAnime,
   ringtone,
   styletext,
   ytmp3,
   WebpToMp4,
   webpTojpg,
};