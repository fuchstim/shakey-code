
const path = require('path');
const Jimp = require('jimp');
const sharp = require('sharp');

const utils = require('../utils');

const filter = require('./_filter');

module.exports = async ({ inputPath }) => {
  utils.log.info('Loading image…');

  const baseImage = await Jimp.read(path.resolve(__dirname, '../assets/base.png'));

  const baseShirtMask = filter.filterBaseColour(baseImage, 'r');
  utils.image.getReplaceablePixels(baseImage)
    .forEach(({ x, y }) => baseShirtMask.setPixelColour(utils.image.replaceableColour, x, y));
  const baseShirtMaskCropped = baseShirtMask.clone().autocrop();

  const inputImage = await Jimp.read(
    await sharp(path.resolve(inputPath))
      .resize(128, 128, { kernel: 'nearest' })
      .toBuffer()
  );
  const inputShirtMask = filter.clean(
    filter.filterBaseColour(inputImage, 'r'),
    Jimp.rgbaToInt(255, 0, 0, 255)
  );
  const inputShirtMaskCropped = inputShirtMask.clone().autocrop();

  const scaledInputShirtMask = await Jimp.read(
    await sharp(await inputShirtMaskCropped.getBufferAsync('image/png'))
      .resize(baseShirtMaskCropped.bitmap.width, baseShirtMaskCropped.bitmap.height, { kernel: 'nearest' })
      .toBuffer()
  );

  const replaceablePixels = utils.image.getReplaceablePixels(baseShirtMaskCropped);
  const matchingPixels = [];
  scaledInputShirtMask.scan(0, 0, scaledInputShirtMask.bitmap.width, scaledInputShirtMask.bitmap.height, (x, y) => {
    if (replaceablePixels.some((p => p.x === x && p.y === y))) { return matchingPixels.push(true); }

    matchingPixels.push(baseShirtMaskCropped.getPixelColour(x, y) === scaledInputShirtMask.getPixelColour(x, y));
  });

  const matchingPixelsRatio = matchingPixels.filter(m => m).length / matchingPixels.length;
  utils.log.info(`Matching pixels ratio: ${matchingPixelsRatio}`);
  if (matchingPixelsRatio < 0.8) {
    throw new Error('Cannot find code in source image.');
  }

  const inputShirt = filter.applyMask(inputImage, inputShirtMask).autocrop();

  const scaledInputShirt = await Jimp.read(
    await sharp(await inputShirt.getBufferAsync('image/png'))
      .resize(scaledInputShirtMask.bitmap.width, scaledInputShirtMask.bitmap.height, { kernel: 'nearest' })
      .toBuffer()
  );

  const codeColours = replaceablePixels.map(({ x, y }) => scaledInputShirt.getPixelColour(x, y));

  const colourEncoder = utils.ColourEncoder.create();
  const decoded = colourEncoder.decode(codeColours);

  return decoded;
};
