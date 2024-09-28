const axios = require("axios");

// Gunakan URL baru untuk endpoint chat completions
const apikey = process.env.API_KEY;
const url = process.env.URL_AI;

const ai_api = process.env.AI_API;

// Metode asli yang mengelola satu pertanyaan
async function gemini15flashs(question) {
  const modelId = "gemini-1.5-flash"; // Pastikan ID model ini benar
  const trimquestion = question.trim();
  try {
    const response = await axios.post(
      url,
      {
        model: modelId,
        messages: [{ role: "user", content: trimquestion }],
      },
      {
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      return response.data.choices[0].message.content; // Pastikan respons sesuai dengan struktur yang diharapkan
    } else {
      return "Tidak ada data yang diterima dari API.";
    }
  } catch (error) {
    return `Terjadi kesalahan saat mengakses API: ${error.message}`;
  }
}
async function gemini15flash(question) {
  const modelId = "gemini-1.5-flash-exp"; // Pastikan ID model ini benar
  const trimquestion = question.trim();
  try {
    const response = await axios.post(
      url,
      {
        model: modelId,
        messages: [{ role: "user", content: trimquestion }],
      },
      {
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      return response.data.choices[0].message.content; // Pastikan respons sesuai dengan struktur yang diharapkan
    } else {
      return "Tidak ada data yang diterima dari API.";
    }
  } catch (error) {
    return `Terjadi kesalahan saat mengakses API: ${error.message}`;
  }
}
async function claude35sonnet(question) {
  const modelId = "claude-3.5-sonnet"; // Pastikan ID model ini benar
  const trimquestion = question.trim();
  try {
    const response = await axios.post(
      url,
      {
        model: modelId,
        messages: [{ role: "user", content: trimquestion }],
      },
      {
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      return response.data.choices[0].message.content; // Pastikan respons sesuai dengan struktur yang diharapkan
    } else {
      return "Tidak ada data yang diterima dari API.";
    }
  } catch (error) {
    console.error("Error accessing API:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return `Terjadi kesalahan saat mengakses API: ${error.message}`;
  }
}
async function llama31(question) {
  const modelId = "llama-3.1-405b"; // Pastikan ID model ini benar
  const trimquestion = question.trim();
  try {
    const response = await axios.post(
      url,
      {
        model: modelId,
        messages: [{ role: "user", content: trimquestion }],
      },
      {
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      return response.data.choices[0].message.content; // Pastikan respons sesuai dengan struktur yang diharapkan
    } else {
      return "Tidak ada data yang diterima dari API.";
    }
  } catch (error) {
    return `Terjadi kesalahan saat mengakses API: ${error.message}`;
  }
}
async function gpt4(question) {
  const modelId = "gpt-4-turbo"; // Pastikan ID model ini benar
  const trimquestion = question.trim();
  try {
    const response = await axios.post(
      url,
      {
        model: modelId,
        messages: [{ role: "user", content: trimquestion }],
      },
      {
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      return response.data.choices[0].message.content; // Pastikan respons sesuai dengan struktur yang diharapkan
    } else {
      return "Tidak ada data yang diterima dari API.";
    }
  } catch (error) {
    return `Terjadi kesalahan saat mengakses API: ${error.message}`;
  }
}
async function gpt4o(question) {
  const modelId = "gpt-4o";
  const trimquestion = question.trim();
  try {
    const response = await axios.post(
      url,
      {
        model: modelId,
        messages: [{ role: "user", content: trimquestion }],
      },
      {
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      return response.data.choices[0].message.content; // Pastikan respons sesuai dengan struktur yang diharapkan
    } else {
      return "Tidak ada data yang diterima dari API.";
    }
  } catch (error) {
    return `Terjadi kesalahan saat mengakses API: ${error.message}`;
  }
}
async function gpt35Turbo(question) {
  const modelId = "gpt-3.5-turbo";
  const trimquestion = question.trim();
  try {
    const response = await axios.post(
      url,
      {
        model: modelId,
        messages: [{ role: "user", content: trimquestion }],
      },
      {
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      return response.data.choices[0].message.content; // Pastikan respons sesuai dengan struktur yang diharapkan
    } else {
      return "Tidak ada data yang diterima dari API.";
    }
  } catch (error) {
    return `Terjadi kesalahan saat mengakses API: ${error.message}`;
  }
}
async function gpt4omini(question) {
  const modelId = "gpt-4o-mini";
  const trimquestion = question.trim();
  try {
    const response = await axios.post(
      url,
      {
        model: modelId,
        messages: [{ role: "user", content: trimquestion }],
      },
      {
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      return response.data.choices[0].message.content; // Pastikan respons sesuai dengan struktur yang diharapkan
    } else {
      return "Tidak ada data yang diterima dari API.";
    }
  } catch (error) {
    return `Terjadi kesalahan saat mengakses API: ${error.message}`;
  }
}
async function dalle(prompt) {
  const url = `https://api.gurusensei.workers.dev/dream?prompt=${encodeURIComponent(
    prompt
  )}`;
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}
async function chatgptFallback(query) {
  const maxRetries = 3;
  const timeout = 15000;
  let response;

  for (let x = 1; x <= maxRetries; x++) {
    try {
      const result = await axios.get("https://chat.raganork.online/api/chat", {
        params: { content: query },
        timeout: timeout,
      });
      response = result.data.response;
      break;
    } catch (error) {
      if (x === maxRetries) {
        response = "_Request failed!_";
      }
    }
  }
  return response;
}
async function stableDiff(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `ai/sd?prompt=${encodedQuery}&apikey=giftedtechk`;
  const response = await axios.get(gifted_api + url, {
    responseType: "arraybuffer",
  });
  const buffer = Buffer.from(response.data);
  return buffer;
}
async function lamda(question) {
  const trimquestion = question.trim();
  const url = `ai/lamda?q=${encodeURIComponent(trimquestion)}`;
  const response = await axios.get(ai_api + url);
  const data = response.data;
  return data.data;
}
async function askAi(aiType, query) {
  const BASE_URL = "https://ironman.koyeb.app/";
  const API_KEY = "Ir0n-M4n_xhf04";
  const IMAGE_API_KEY = "img-1r0nm4nH4x!";

  const apiPaths = {
    aoyo: "ironman/ai/aoyo",
    thinkany: "ironman/ai/thinkany",
    prodia: "ironman/ai/prodia",
    lepton: "ironman/ai/llm",
    gpt: "ironman/ai/gpt",
    blackbox: "ironman/ai/blackbox",
    chatgpt: "ironman/ai/chatev",
    dalle: "ironman/ai/dalle",
    upscale: "ironman/ai/upscale",
  };

  try {
    const axiosInstance = axios.create({
      maxContentLength: 50 * 1024 * 1024, // 50 MB
      maxBodyLength: 50 * 1024 * 1024, // 50 MB
    });

    switch (aiType) {
      case "aoyo": {
        const { data: aoyoResponse } = await axiosInstance.get(
          `${BASE_URL}${apiPaths.aoyo}`,
          {
            headers: { ApiKey: API_KEY },
            params: { query: query },
          }
        );
        return aoyoResponse;
      }

      case "thinkany": {
        const { data: thinkanyResponse } = await axiosInstance.get(
          `${BASE_URL}${apiPaths.thinkany}?query=${query}`,
          {
            headers: { ApiKey: API_KEY },
          }
        );
        return thinkanyResponse;
      }

      case "prodia": {
        return `${BASE_URL}${apiPaths.prodia}?prompt=${query}&ApiKey=${IMAGE_API_KEY}`;
      }

      case "lepton": {
        const url = `${BASE_URL}${apiPaths.lepton}?query=${query}`;
        console.log("Request URL:", url);
        try {
          const { data: leptonResponse } = await axios.get(url, {
            headers: { ApiKey: API_KEY },
          });
          return leptonResponse;
        } catch (error) {
          console.error(`Error interacting with AI: ${error.message}`);
          console.error("Response data:", error.response?.data);
          throw error;
        }
      }

      case "gpt": {
        const { data: gptResponse } = await axiosInstance.get(
          `${BASE_URL}${apiPaths.gpt}?prompt=${query}`,
          {
            headers: { ApiKey: API_KEY },
          }
        );
        return gptResponse;
      }

      case "blackbox": {
        const { data: blackboxResponse } = await axiosInstance.get(
          `${BASE_URL}${apiPaths.blackbox}?query=${query}`,
          {
            headers: { ApiKey: API_KEY },
          }
        );
        return blackboxResponse;
      }

      case "chatgpt": {
        try {
          const { data: chatgptResponse } = await axiosInstance.get(
            `${BASE_URL}${apiPaths.chatgpt}?prompt=${query}`,
            {
              headers: { ApiKey: API_KEY },
            }
          );
          return chatgptResponse;
        } catch (error) {
          console.error(`Primary ChatGPT API failed: ${error.message}`);
          return await chatgptFallback(query);
        }
      }

      case "dalle": {
        return `${BASE_URL}${apiPaths.dalle}?text=${encodeURIComponent(
          query
        )}&ApiKey=${IMAGE_API_KEY}`;
      }

      case "upscale": {
        if (!Buffer.isBuffer(query)) {
          throw new Error("Expected a buffer for the image.");
        }

        const formData = new FormData();
        formData.append("image", query, { filename: "image.jpg" });
        const upscaleResponse = await axiosInstance.post(
          `${BASE_URL}${apiPaths.upscale}?ApiKey=${IMAGE_API_KEY}`,
          formData,
          {
            headers: formData.getHeaders(),
            responseType: "arraybuffer",
          }
        );
        return upscaleResponse.data;
      }

      default:
        throw new Error("Invalid AI type provided.");
    }
  } catch (error) {
    console.error(`Error interacting with AI: ${error.message}`);
    throw error;
  }
}
async function coderAi(code) {
  const trimcode = code.trim();
  const url = `ai/codemirror?q=${encodeURIComponent(trimcode)}`;
  const response = await axios.get(ai_api + url);
  const data = response.data;
  return data.data.prediction;
}
async function lyrics(songName) {
  const encodeSong = encodeURIComponent(songName.trim());
  const url = `search/lyrics?query=${encodeSong}&apikey=giftedtechk`;
  const response = await axios.get(gifted_api + url);
  const data = response.data.result;
  const songLyrics = `*Artist: ${data.Artist}*\n*Song: ${data.Title}*\nLyrics: ${data.Lyrics}`;
  return songLyrics;
}
async function bing(query) {
  const url = `https://gpt4.guruapi.tech/bing?username=astro&query=${encodeURIComponent(
    query
  )}`;
  const response = await axios.get(url);
  return response.data.result;
}
async function elevenlabs(text) {
  const url = `https://pure-badlands-26930-091903776676.herokuapp.com/ai/generate-audio?text=${encodeURIComponent(
    text
  )}`;
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const audioBuffer = Buffer.from(response.data);
  return audioBuffer;
}
module.exports = {
  gpt4,
  gpt4o,
  gpt35Turbo,
  gpt4omini,
  chatgptFallback,
  dalle,
  llama31,
  stableDiff,
  lamda,
  askAi,
  claude35sonnet,
  gemini15flash,
  gemini15flashs,
  coderAi,
  lyrics,
  bing,
  elevenlabs,
};
