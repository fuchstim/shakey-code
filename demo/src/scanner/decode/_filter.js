import Jimp from 'jimp';

const COLOUR_COMPONENTS = [ 'r', 'g', 'b' ];
function filterBaseColour(inputImage, baseColourComponent) {
  const result = inputImage.clone();

  result.scan(0, 0, result.bitmap.width, result.bitmap.height, (x, y) => {
    const pixelColour = Jimp.intToRGBA(result.getPixelColour(x, y));

    const baseColourComponentValue = pixelColour[baseColourComponent];
    const otherColourComponentValuess = COLOUR_COMPONENTS.filter(x => x !== baseColourComponent).map(x => pixelColour[x]);

    if (otherColourComponentValuess.every(c => baseColourComponentValue <= (c * 2))) {
      result.setPixelColour(0, x, y);
    } else {
      const cleanColour = { [baseColourComponent]: 255 };

      result.setPixelColour(Jimp.rgbaToInt(cleanColour.r || 0, cleanColour.g || 0, cleanColour.b || 0, 255), x, y);
    }
  });

  return result;
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

function clean(inputImage, fillColour) {
  const result = inputImage.clone();

  result.scan(0, 0, result.bitmap.width, result.bitmap.height, (x, y) => {
    if (result.getPixelColour(x, y) > 0) {
      const neighbourCount = [
        x > 0 && result.getPixelColour(x - 1, y),
        x < result.bitmap.width && result.getPixelColour(x + 1, y),
        y > 0 && result.getPixelColour(x, y - 1),
        y < result.bitmap.width && result.getPixelColour(x, y + 1),
      ].reduce((acc, n) => acc + (n > 0 ? 1 : 0), 0);

      if (neighbourCount < 2) {
        result.setPixelColour(0, x, y);
      }

      return;
    }

    const hasPixelAbove = y > 0 && result.getPixelColour(x, y - 1) > 0;
    const hasPixelLeft = x > 0 && result.getPixelColour(x - 1, y) > 0;

    if (!hasPixelAbove || !hasPixelLeft) { return; }

    const hasPixelRight = (() => {
      for (let i = x; i <= result.bitmap.width; i++) {
        if (result.getPixelColour(i, y) > 0) { return true; }
      }

      return false;
    })();

    const hasPixelBelow = (() => {
      for (let i = y; i <= result.bitmap.height; i++) {
        if (result.getPixelColour(x, i) > 0) { return true; }
      }

      return false;
    })();

    if (hasPixelAbove && hasPixelRight && hasPixelLeft && hasPixelBelow) {
      result.setPixelColour(fillColour, x, y);
    }
  });

  return result;
}

function applyMask(inputImage, maskImage) {
  const result = inputImage.clone();

  maskImage.scan(0, 0, maskImage.bitmap.width, maskImage.bitmap.height, (x, y) => {
    const { a: alpha } = Jimp.intToRGBA(maskImage.getPixelColour(x, y));

    if (alpha < 128) { result.setPixelColour(0, x, y); }
  });

  return result;
}

export default {
  filterBaseColour,
  filterBitColours,
  clean,
  applyMask,
};
