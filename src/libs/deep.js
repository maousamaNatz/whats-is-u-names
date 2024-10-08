const FormData = require("form-data");
const axios = require("axios");
const puppeteer = require("puppeteer");
const { load } = require("cheerio");
const { randomBytes, randomUUID } = require("crypto");
const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

class DeepAI {
  /**
   * @returns Generate random GA1.2 value
   */
  genGA() {
    return `GA1.2.${Math.floor(Math.random() * 1000000000)}.${Math.floor(
      Math.random() * 10000000000
    )}`;
  }

  /**
   * @param {Number} n Length of the random string
   * @returns Generated random string
   */
  generateRandomString = (n) => {
    return randomBytes(21)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substr(0, n);
  };

  /**
   * @returns DeepAI ApiKey
   */
  async getKey() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: null,
      ignoreHTTPSErrors: true,
      dumpio: false, // This disables stdout and stderr for browser
    });

    const page = await browser.newPage();
    await page.goto("https://deepai.org/machine-learning-model/waifu2x");

    const content = await page.content(); // Get the fully rendered content
    const $ = load(content);

    // Attempt to extract the relevant script tag
    const scriptTag = $("script").get()[10]; // Adjust this index if necessary
    if (!scriptTag) {
      await browser.close();
      throw new Error("Expected script tag not found");
    }

    const data = scriptTag.children && scriptTag.children[0]?.data;
    if (!data) {
      await browser.close();
      throw new Error("Error: scriptTag children not found");
    }

    // Extract the portion where `f` is set in the script
    const apiKeyRegex = /deepai\.setApiKey\(([^)]+)\)/;
    const match = data.match(apiKeyRegex);

    if (match && match[1]) {
      const apiKey = match[1].replace(/['"]/g, ""); // Remove quotes around the API key
      console.log("Extracted API Key:", apiKey);
      await browser.close();
      return apiKey;
    } else {
      await browser.close();
      throw new Error("API Key not found in script");
    }
  }

  /**
   * @param {String} link Image URL
   * @returns {String} Upscaled image URL
   * @description Upscales an image (2x, optimized for anime-style images)
   */
  async waifu2x(link) {
    const form = new FormData();
    form.append("image", link);
    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6,zh;q=0.5",
      "api-key": await this.getKey(),
      "client-library": "deepai-js-client",
      Cookie: `_ga=${this.genGA()}; _gid=${this.genGA()}; cookie=${randomUUID()}; user_sees_ads=true;`,
      "content-type": `multipart/form-data; boundary=${form.getBoundary()}`,
      origin: "https://deepai.org",
      "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "User-Agent": ua,
    };

    let response = await axios.post("https://api.deepai.org/api/waifu2x", form, {
      headers: headers,
    });
    return response.data.output_url;
  }

  /**
   * @param {String} link Image URL
   * @returns {String} Upscaled image URL (4.5x)
   */
  async upscale(link) {
    const form = new FormData();
    form.append("image", link);
    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6,zh;q=0.5",
      "api-key": await this.getKey(),
      "client-library": "deepai-js-client",
      Cookie: `_ga=${this.genGA()}; _gid=${this.genGA()}; cookie=${randomUUID()}; user_sees_ads=true;`,
      "content-type": `multipart/form-data; boundary=${form.getBoundary()}`,
      origin: "https://deepai.org",
      "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "User-Agent": ua,
    };

    let response = await axios.post("https://api.deepai.org/api/torch-srgan", form, {
      headers: headers,
    });
    return response.data.output_url;
  }

  /**
   * @param {String} link Image URL
   * @returns {String} Colorized image URL
   * @description Colorizes an image
   */
  async colorizer(link) {
    const form = new FormData();
    form.append("image", link);
    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6,zh;q=0.5",
      "api-key": await this.getKey(),
      "client-library": "deepai-js-client",
      Cookie: `_ga=${this.genGA()}; _gid=${this.genGA()}; cookie=${randomUUID()}; user_sees_ads=true;`,
      "content-type": `multipart/form-data; boundary=${form.getBoundary()}`,
      origin: "https://deepai.org",
      "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "User-Agent": ua,
    };

    let response = await axios.post("https://api.deepai.org/api/colorizer", form, {
      headers: headers,
    });
    return response.data.output_url;
  }

  /**
   * @param {String} link Image URL
   * @returns {Number} NSFW percentage
   * @description Detects NSFW content in the image
   */
  async nsfw(link) {
    const form = new FormData();
    form.append("image", link);
    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6,zh;q=0.5",
      "api-key": await this.getKey(),
      "client-library": "deepai-js-client",
      Cookie: `_ga=${this.genGA()}; _gid=${this.genGA()}; cookie=${randomUUID()}; user_sees_ads=true;`,
      "content-type": `multipart/form-data; boundary=${form.getBoundary()}`,
      origin: "https://deepai.org",
      "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "User-Agent": ua,
    };

    let response = await axios.post("https://api.deepai.org/api/nsfw-detector", form, {
      headers: headers,
    });
    return response.data.output.nsfw_score * 100; // Return NSFW percentage
  }
}

module.exports = DeepAI;
