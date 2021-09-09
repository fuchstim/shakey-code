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

export default {
  replaceableColour: REPLACEABLE_COLOUR,
  getReplaceablePixels,
};
