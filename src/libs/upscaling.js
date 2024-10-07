const { fetchModel, imageNDarrayToDataURI, prepareImage } = require('./common');
const { InferenceSession } = require('onnxruntime-web');
const ndarray = require('ndarray');
const ops = require('ndarray-ops');
const path = require('path');
const Jimp = require('jimp'); // Jimp for image processing

let superSession = null;

// Initialize super resolution
async function initializeSuperRes(setProgress) {
  if (superSession !== null) {
    console.log("Super resolution model already initialized.");
    return;
  }

  try {
    console.log("Initializing super resolution model...");
    const modelPath = path.resolve(__dirname, './models/superRes.onnx');
    const progressCallback = typeof setProgress === 'function' ? setProgress : () => {};

    const superBuf = await fetchModel(modelPath, progressCallback, 0.5, 0.9);
    superSession = await InferenceSession.create(superBuf, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    console.log('Super resolution model successfully initialized.');
  } catch (e) {
    console.error('Failed to initialize super resolution model:', e);
    throw new Error('Super resolution model initialization failed.');
  }
}

// Run super resolution model
async function runSuperRes(imageArray) {
  if (!superSession) {
    console.error('Super resolution model is not initialized.');
    throw new Error('Super resolution model session is not initialized.');
  }

  const feeds = prepareImage(imageArray, 'superRes');
  try {
    const output = await superSession.run(feeds);
    if (!output || !output.output) {
      console.error('Invalid model output: output is empty or undefined');
      throw new Error('Invalid model output: output is empty or undefined');
    }

    console.log("Model output shape:", output.output.dims);
    console.log("Model output data length:", output.output.data.length);

    return output.output;
  } catch (e) {
    console.error('Failed to run super resolution', e);
    throw e;
  }
}

// Upscale image using the super resolution model
async function multiUpscale(imageArray, sizeFactor) {
  console.log("Starting multiUpscale with size factor:", sizeFactor);
  let outArr = imageArray;
  console.time('Upscaling');
  for (let s = 0; s < sizeFactor; s += 1) {
    outArr = await upscaleFrame(outArr);
  }
  console.timeEnd('Upscaling');
  console.log("Finished multiUpscale, returning array:", outArr.shape, outArr.data.length);
  return outArr;
}

// Handle frame by chunk
async function upscaleFrame(imageArray) {
  const CHUNK_SIZE = 1024;
  const PAD_SIZE = 32;

  const inImgW = imageArray.shape[0];
  const inImgH = imageArray.shape[1];
  const outImgW = inImgW * 2;
  const outImgH = inImgH * 2;
  const nChunksW = Math.ceil(inImgW / CHUNK_SIZE);
  const nChunksH = Math.ceil(inImgH / CHUNK_SIZE);
  const chunkW = Math.floor(inImgW / nChunksW);
  const chunkH = Math.floor(inImgH / nChunksH);

  const outArr = ndarray(new Uint8Array(outImgW * outImgH * 4), [outImgW, outImgH, 4]);
  for (let i = 0; i < nChunksH; i += 1) {
    for (let j = 0; j < nChunksW; j += 1) {
      const x = j * chunkW;
      const y = i * chunkH;

      const yStart = Math.max(0, y - PAD_SIZE);
      const inH = yStart + chunkH + PAD_SIZE * 2 > inImgH ? inImgH - yStart : chunkH + PAD_SIZE * 2;
      const outH = 2 * (Math.min(inImgH, y + chunkH) - y);
      const xStart = Math.max(0, x - PAD_SIZE);
      const inW = xStart + chunkW + PAD_SIZE * 2 > inImgW ? inImgW - xStart : chunkW + PAD_SIZE * 2;
      const outW = 2 * (Math.min(inImgW, x + chunkW) - x);

      const inSlice = imageArray.lo(xStart, yStart, 0).hi(inW, inH, 4);
      const subArr = ndarray(new Uint8Array(inW * inH * 4), inSlice.shape);
      ops.assign(subArr, inSlice);

      const chunkData = await runSuperRes(subArr);

      if (!chunkData || !chunkData.data) {
        console.error('Invalid chunk data returned by super resolution model.');
        throw new Error('Invalid chunk data: Data is missing or undefined.');
      }

      const chunkArr = ndarray(chunkData.data, chunkData.dims);
      const chunkSlice = chunkArr.lo((x - xStart) * 2, (y - yStart) * 2, 0).hi(outW, outH, 4);
      const outSlice = outArr.lo(x * 2, y * 2, 0).hi(outW, outH, 4);
      ops.assign(outSlice, chunkSlice);
    }
  }

  return outArr;
}

// Main function to upscale image using Jimp
async function upscaleImage(imageBuffer, sizeFactor = 2) {
  try {
    const fileType = await import('file-type');
    const type = await fileType.fileTypeFromBuffer(imageBuffer);

    if (!type || !["jpg", "jpeg", "png"].includes(type.ext)) {
      throw new Error(`Invalid file type: Unsupported format (${type ? type.ext : "unknown"})`);
    }

    const imageURI = `data:${type.mime};base64,${imageBuffer.toString("base64")}`;
    await initializeSuperRes();

    // Convert the image to ndarray
    let imageArray = await imageToNdarray(imageURI);
    console.log("Image array shape:", imageArray.shape);

    // Perform the upscaling process
    let upscaledImageArray = await multiUpscale(imageArray, sizeFactor);
    console.log("Upscaled image array shape:", upscaledImageArray.shape);

    // Strip alpha channel if present
    if (upscaledImageArray.shape[2] === 4) {
      console.log("Stripping alpha channel from upscaled image.");
      const rgbArray = ndarray(
        new Uint8Array(upscaledImageArray.shape[0] * upscaledImageArray.shape[1] * 3),
        [upscaledImageArray.shape[0], upscaledImageArray.shape[1], 3]
      );

      ops.assign(
        rgbArray,
        upscaledImageArray.hi(upscaledImageArray.shape[0], upscaledImageArray.shape[1], 3)
      );
      upscaledImageArray = rgbArray;
    }

    // Convert ndarray to Jimp image
    const upscaledImageBuffer = Buffer.from(upscaledImageArray.data);
    let jimpImage = await new Jimp({
      data: upscaledImageBuffer,
      width: upscaledImageArray.shape[1],
      height: upscaledImageArray.shape[0],
    });

    // Check image size and compress or resize if needed
    const maxSize = 1024 * 1024 * 5; // 5MB limit for WhatsApp
    let finalImageBuffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);

    // If image is too large, compress or resize
    if (finalImageBuffer.length > maxSize) {
      console.warn(`Upscaled image is too large: ${finalImageBuffer.length} bytes.`);

      // Attempt to compress (use JPEG instead of PNG for smaller size)
      finalImageBuffer = await jimpImage.quality(80).getBufferAsync(Jimp.MIME_JPEG); // Compress to JPEG

      // If still too large, resize down
      if (finalImageBuffer.length > maxSize) {
        console.log("Resizing image to fit size limit.");
        jimpImage = jimpImage.resize(Jimp.AUTO, Math.floor(jimpImage.getHeight() * 0.8)); // Reduce size by 20%
        finalImageBuffer = await jimpImage.quality(80).getBufferAsync(Jimp.MIME_JPEG);
      }

      // If still too large after compression and resizing, throw error
      if (finalImageBuffer.length > maxSize) {
        throw new Error("Upscaled image is too large to send via WhatsApp.");
      }
    }

    return finalImageBuffer;
  } catch (error) {
    console.error(`Error while upscaling image: ${error.message}`);
    throw error;
  }
}

module.exports = {
  upscaleImage,
  initializeSuperRes,
  multiUpscale,
  runSuperRes,
  upscaleFrame,
};
