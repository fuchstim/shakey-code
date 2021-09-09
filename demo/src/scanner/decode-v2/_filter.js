import Jimp from 'jimp';

function filterPrimaryBitColour(inputImage, colourEncoder) {
  const colourCounts = {};

  inputImage.scan(0, 0, inputImage.bitmap.width, inputImage.bitmap.height, (x, y) => {
    const pixelColour = inputImage.getPixelColour(x, y);
    const { colour: bitColour } = colourEncoder.findClosestBitColour(pixelColour);

    const colourDistance = colourEncoder.calculateColourDistance(pixelColour, bitColour);

    if(colourDistance < 20000) {
      colourCounts[bitColour] = (colourCounts[bitColour] || 0) + 1;
    }
  });

  const primaryColour = Object.entries(colourCounts)
    .sort(([, a], [, b]) => a - b)
    .pop();

  return Number(primaryColour[0]);
}

function filterBitColours(inputImage, colourEncoder) {
  const result = inputImage.clone();

  result.scan(0, 0, result.bitmap.width, result.bitmap.height, (x, y) => {
    const pixelColour = result.getPixelColour(x, y);
    const { colour: bitColour } = colourEncoder.findClosestBitColour(pixelColour);

    const colourDistance = colourEncoder.calculateColourDistance(pixelColour, bitColour);

    if(colourDistance > 20000) {
      result.setPixelColour(0, x, y);
    } else {
      result.setPixelColour(bitColour, x, y);
    }
  });

  return result;
}

export default {
  filterPrimaryBitColour,
  filterBitColours,
};
