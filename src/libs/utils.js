  // utils.js

  const { imageNDarrayToDataURI, prepareImage, fetchModel } = require('./common');
  const { InferenceSession, env: ORTEnv } = require('onnxruntime-web');
  const pify = require('pify');
  const getPixels = pify(require('get-pixels'));
  const usr = require('ua-parser-js');

  /**
   * Given a URI, return an ndarray of the image pixel data.
   *  - Return shape is [1, 3, height, width]
   * @param {string} imageURI the URI
   * @returns The pixels in this image
   */
  async function imageToNdarray(imageURI, coalesce = true) {
    // console.log(`Processing image URI: ${imageURI}`);
    let pixels;

    // Validate that imageURI is a string
    if (typeof imageURI !== 'string') {
      console.error('Invalid input: imageURI must be a string');
      throw new Error('Invalid file type: imageURI is not a string');
    }

    // Check if the URI is a valid data URI
    if (imageURI.startsWith('data:')) {
      // No need to extract extension from the URI if it's a data URI
      console.log('Detected data URI, skipping extension check');
    } else {
      // Check if the URI points to a valid image file format
      const supportedFormats = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
      const extension = imageURI.slice(imageURI.lastIndexOf('.')).toLowerCase();
    
      if (!supportedFormats.includes(extension)) {
        console.error('Unsupported file format:', extension);
        throw new Error('Invalid file type: Unsupported format');
      }
    }

    try {
      pixels = await getPixels(imageURI);
    } catch (error) {
      console.error('Error getting pixels:', error);
      throw new Error('Invalid file type');
    }

    if (pixels.shape.length === 4 && coalesce) {
      const [N, W, H, C] = pixels.shape;
      const numPixelsInFrame = W * H;

      for (let i = 0; i < N; ++i) {
        const currIndex = pixels.index(i, 0, 0, 0);
        const prevIndex = pixels.index(i - 1, 0, 0, 0);
        for (let j = 0; j < numPixelsInFrame; ++j) {
          const curr = currIndex + j * C;
          if (pixels.data[curr + C - 1] === 0) {
            const prev = prevIndex + j * C;
            for (let k = 0; k < C; ++k) {
              pixels.data[curr + k] = pixels.data[prev + k];
            }
          }
        }
      }
    }

    return pixels;
  }


  /**
   * Sleep for the provided number of milliseconds
   * @param {Number} ms
   * @returns Promise that resolves after the sleep is complete
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function initializeONNX(setProgress) {
    ORTEnv.wasm.simd = true;
    ORTEnv.wasm.proxy = true;

    const ua = usr(navigator.userAgent);
    if (ua.engine.name == 'WebKit') {
      ORTEnv.wasm.numThreads = 1;
    } else {
      ORTEnv.wasm.numThreads = Math.min(navigator.hardwareConcurrency / 2, 16);
    }

    setProgress(0);
    await initializeTagger(setProgress);
    await initializeSuperRes(setProgress);
    setProgress(1);

    // Needed because WASM workers are created async, wait for them
    // to be ready
    await sleep(300);
  }

  async function upScaleFromURI(extension, setTags, uri, upscaleFactor) {
    let resultURI = null;
    if (extension === 'gif') {
      let currentURI = uri;
      for (let s = 0; s < upscaleFactor; s += 1) {
        currentURI = await doGif(currentURI, setTags);
      }
      resultURI = currentURI;
    } else {
      const imageArray = await imageToNdarray(uri);
      const tags = await runTagger(imageArray);
      setTags(tags);

      resultURI = await multiUpscale(imageArray, upscaleFactor);
    }
    return resultURI;
  }

  module.exports = {
    imageToNdarray,
    imageNDarrayToDataURI,
    sleep,
    prepareImage,
    fetchModel,
    initializeONNX,
    upScaleFromURI,
  };
