import path from 'path';
import Jimp from 'jimp';

import utils from '../utils'

module.exports = async (code) => {
  utils.log.info('Loading base image…');

  const baseImage = await Jimp.read(path.resolve(__dirname, '../assets/base.png'));

  const { width, height } = baseImage.bitmap;

  const replaceablePixels = utils.image.getReplaceablePixels(baseImage);

  utils.log.info(`Found ${replaceablePixels.length} replaceable pixels.`);

  const colourEncoder = utils.ColourEncoder.create();
  const encodedCode = colourEncoder.encode(code, { length: replaceablePixels.length, includeParityBit: true });

  encodedCode.forEach((colour, index) => {
    const { x, y } = replaceablePixels[index];

    baseImage.setPixelColour(colour, x, y);
  });

  const outputImage = new Jimp(width * 1.4, height * 1.4, Jimp.rgbaToInt(255, 255, 255, 255));

  outputImage.composite(baseImage, Math.floor(width / 5), Math.floor(height / 5));

  const result = await utils.image.scale(outputImage, 512, 512).getBufferAsync('image/png');

  return result;
};
