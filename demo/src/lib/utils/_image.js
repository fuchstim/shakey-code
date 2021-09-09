import Jimp from 'jimp';

const REPLACEABLE_COLOUR = Jimp.rgbaToInt(38, 255, 0, 255);
function getReplaceablePixels(inputImage) {
  const replaceablePixels = [];
  inputImage.scan(0, 0, inputImage.bitmap.width, inputImage.bitmap.height, (x, y) => {
    if (inputImage.getPixelColour(x, y) === REPLACEABLE_COLOUR) {
      replaceablePixels.push({ x, y });
    }
  });

  return replaceablePixels;
}

function scaleDown(inputImage, outputWidth, outputHeight) {
  throw new Error('Cannot scale down yet.');
}

function scaleUp(inputImage, outputWidth, outputHeight) {
  const { width: inputWidth, height: inputHeight } = inputImage.bitmap;

  const outputImage = new Jimp(outputWidth, outputHeight, 0);

  const widthRatio = Math.round(outputWidth / inputWidth);
  const heightRatio = Math.round(outputHeight / inputHeight);

  outputImage.scan(0, 0, outputWidth, outputHeight, (x, y) => {
    const inputX = (x - (x % widthRatio)) / widthRatio;
    const inputY = (y - (y % heightRatio)) / heightRatio;

    const outputColour = inputImage.getPixelColour(inputX, inputY);

    outputImage.setPixelColour(outputColour, x, y);
  });

  return outputImage;
}

function scale(inputImage, outputWidth, outputHeight) {
  const { width: inputWidth, height: inputHeight } = inputImage.bitmap;

  if (inputWidth + inputHeight > outputWidth + outputHeight) {
    return scaleDown(inputImage, outputWidth, outputHeight);
  } else if (inputWidth + inputHeight < outputWidth + outputHeight) {
    return scaleUp(inputImage, outputWidth, outputHeight);
  } else {
    return inputImage.clone();
  }
}

export default {
  replaceableColour: REPLACEABLE_COLOUR,
  getReplaceablePixels,
  scale,
};
