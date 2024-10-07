/**
 * Given an input image buffer, upscale it using HTML Canvas
 * @param {Buffer} imageBuffer - The image buffer to upscale
 * @param {number} sizeFactor - The scaling factor (2 means double the size)
 * @returns {Promise<string>} - Data URL of the upscaled image (JPEG with compression)
 */
async function upscaleImageWithCanvas(imageBuffer, sizeFactor = 2) {
  try {
    const fileType = await import("file-type");
    const type = await fileType.fileTypeFromBuffer(imageBuffer);

    if (!type || !["jpg", "jpeg", "png"].includes(type.ext)) {
      throw new Error(
        `Invalid file type: Unsupported format (${type ? type.ext : "unknown"})`
      );
    }

    // Convert image buffer to Data URI
    const imageURI = `data:${type.mime};base64,${imageBuffer.toString(
      "base64"
    )}`;

    // Load image into a new Image object
    const img = await loadImage(imageURI);

    // Create a Canvas and get its context
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set the canvas size for upscaling
    canvas.width = img.width * sizeFactor;
    canvas.height = img.height * sizeFactor;

    // Draw the image onto the canvas with the new scaled size
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get the data URL of the upscaled image, with JPEG compression
    let upscaledDataURL = canvas.toDataURL("image/jpeg", 0.8); // 80% quality JPEG

    // Check if the image size is still too large, compress or resize if needed
    const maxSize = 1024 * 1024 * 5; // 5MB limit for WhatsApp
    let blob = await dataURLToBlob(upscaledDataURL);

    // If the image is too large, compress further or resize down
    if (blob.size > maxSize) {
      console.warn(`Upscaled image is too large: ${blob.size} bytes.`);
      upscaledDataURL = await compressAndResizeImage(blob, canvas, maxSize);
    }

    return upscaledDataURL; // Return the final compressed image as a data URI
  } catch (error) {
    console.error(`Error while upscaling image: ${error.message}`);
    throw error;
  }
}

/**
 * Load an image from a data URI and return a promise that resolves when the image is loaded
 * @param {string} dataURI - The data URI of the image
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(dataURI) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataURI;
    img.crossOrigin = "Anonymous"; // Handle CORS
    img.onload = () => resolve(img);
    img.onerror = () => reject("Failed to load image");
  });
}

/**
 * Convert a data URL to a Blob object
 * @param {string} dataURL - The data URL of the image
 * @returns {Promise<Blob>} - A Blob representing the image
 */
function dataURLToBlob(dataURL) {
  return fetch(dataURL).then((res) => res.blob());
}

/**
 * Compress and resize an image blob if it exceeds the size limit
 * @param {Blob} blob - The image blob to compress or resize
 * @param {HTMLCanvasElement} canvas - The canvas used for drawing
 * @param {number} maxSize - The maximum allowed file size in bytes
 * @returns {Promise<string>} - A compressed/resized image as a Data URL
 */
async function compressAndResizeImage(blob, canvas, maxSize) {
  let quality = 0.7; // Start with 70% quality for compression
  let resizedBlob = blob;

  // Reduce the quality or resize until the image is under the size limit
  while (resizedBlob.size > maxSize && quality > 0.3) {
    console.log(`Compressing image at quality ${quality}`);
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Reduce the image quality
    const compressedDataURL = canvas.toDataURL("image/jpeg", quality);
    resizedBlob = await dataURLToBlob(compressedDataURL);

    // If still too large, reduce size by 80% of original
    if (resizedBlob.size > maxSize) {
      canvas.width = Math.floor(width * 0.8);
      canvas.height = Math.floor(height * 0.8);
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
      quality -= 0.1; // Lower the quality
    }
  }

  // Convert to final Data URL
  return canvas.toDataURL("image/jpeg", quality);
}

// Example usage:
// const imageBuffer = <your image buffer here>
// upscaleImageWithCanvas(imageBuffer, 2).then(dataURI => {
//   console.log('Upscaled Image Data URI:', dataURI);
// });


module.exports = {
  upscaleImageWithCanvas
};