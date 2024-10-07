// common.js
const fs = require('fs').promises;
const path = require('path');
const { createCanvas } = require('canvas'); // Ganti penggunaan save-pixels dengan canvas
const ndarray = require("ndarray");
const ops = require("ndarray-ops");
const { Tensor } = require("onnxruntime-web");

// Converts ndarray to a Data URI
function imageNDarrayToDataURI(data, outputType) {
  const width = data.shape[0];
  const height = data.shape[1];
  
  // Create canvas and context
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Create ImageData from ndarray
  const imageData = ctx.createImageData(width, height);
  for (let i = 0; i < data.data.length; i++) {
    imageData.data[i] = data.data[i];
  }

  // Put ImageData into canvas context
  ctx.putImageData(imageData, 0, 0);

  if (outputType === 'canvas') return canvas;
  return canvas.toDataURL(outputType);
}

// Prepare image function
function prepareImage(imageArray, model) {
  const width = imageArray.shape[0];
  const height = imageArray.shape[1];

  if (model === "superRes") {
    const tensor = new Tensor("uint8", imageArray.data.slice(), [
      width,
      height,
      4,
    ]);
    return { input: tensor };
  } else if (model === "tagger") {
    const newND = ndarray(new Uint8Array(width * height * 3), [
      1,
      3,
      height,
      width,
    ]);
    ops.assign(
      newND.pick(0, null, null),
      imageArray.lo(0, 0, 0).hi(width, height, 3).transpose(2, 1, 0)
    );
    const tensor = new Tensor("uint8", newND.data.slice(), [
      1,
      3,
      height,
      width,
    ]);
    return { input: tensor };
  } else {
    throw new Error("Invalid model type");
  }
}

// Fetches the model and updates progress
async function fetchModel(filepathOrUri, setProgress, startProgress, endProgress) {
  if (filepathOrUri.startsWith('http') || filepathOrUri.startsWith('https')) {
    const response = await fetch(filepathOrUri);
    const reader = response.body.getReader();
    const length = parseInt(response.headers.get('content-length'), 10);
    const data = new Uint8Array(length);
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      data.set(value, received);
      received += value.length;
      setProgress(startProgress + (received / length) * (endProgress - startProgress));
    }
    return data.buffer;
  } else {
    const fullPath = path.resolve(filepathOrUri);
    console.log(`Loading local model from ${fullPath}`);

    const fileBuffer = await fs.readFile(fullPath);
    setProgress(endProgress);
    return fileBuffer;
  }
}

// Function to convert buffer to Data URI
function bufferToDataURI(buffer, mimeType = "image/png") {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

// Helper to extract extension from data URI or normal URI
function getExtensionFromURI(uri) {
  if (uri.startsWith("data:")) {
    const match = uri.match(/^data:(image\/[a-z]+);base64,/);
    if (match) {
      const mimeType = match[1];
      return mimeType.split("/")[1];
    }
  } else {
    return uri.slice(uri.lastIndexOf(".")).toLowerCase();
  }
  return "";
}

module.exports = {
  imageNDarrayToDataURI,
  prepareImage,
  fetchModel,
  bufferToDataURI,
  getExtensionFromURI,
};
