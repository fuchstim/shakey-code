import Jimp from 'jimp';

import baseImageSource from '../assets/base.png';
import utils from '../utils';

class ShakeyCodeEncoder {
  constructor() { }

  async encode(code) {
    // eslint-disable-next-line no-undef
    const baseImage = await Jimp.read(Buffer.from(baseImageSource.split(',')[1], 'base64'));

    const { width, height } = baseImage.bitmap;

    const replaceablePixels = utils.image.getReplaceablePixels(baseImage);

    const colourEncoder = new utils.ColourEncoder();
    const encodedCode = colourEncoder.encode(code, { length: replaceablePixels.length });

    encodedCode.forEach((colour, index) => {
      const { x, y } = replaceablePixels[index];

      baseImage.setPixelColour(colour, x, y);
    });

    const outputImage = new Jimp(width * 1.4, height * 1.4, Jimp.rgbaToInt(255, 255, 255, 0));

    outputImage.composite(baseImage, Math.floor(width / 5), Math.floor(height / 5));

    const result = await outputImage.resize(512, 512, Jimp.RESIZE_NEAREST_NEIGHBOR).getBase64Async('image/png');

    return result;
  }
}

export default ShakeyCodeEncoder;
