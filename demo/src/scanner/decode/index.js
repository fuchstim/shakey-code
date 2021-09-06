import Jimp from 'jimp';
import sharp from 'sharp';

import baseImageSource from '../assets/base.png';
import utils from '../utils'

import filter from './_filter'

export default async function (inputBuffer) {
  utils.log.info('Loading image…');

  const baseImage = await Jimp.read(Buffer.from(baseImageSource.split(',')[1], 'base64'));

  const baseShirtMask = filter.filterBaseColour(baseImage, 'r');
  utils.image.getReplaceablePixels(baseImage)
    .forEach(({ x, y }) => baseShirtMask.setPixelColour(utils.image.replaceableColour, x, y));
  const baseShirtMaskCropped = baseShirtMask.clone().autocrop();

  const inputImage = utils.image.scale(
    await Jimp.read(Buffer.from(inputBuffer.split(',')[1], 'base64')),
    128,
    128
  );

  const inputShirtMask = filter.clean(
    filter.filterBaseColour(inputImage, 'r'),
    Jimp.rgbaToInt(255, 0, 0, 255)
  );
  const inputShirtMaskCropped = inputShirtMask.clone().autocrop();

  const scaledInputShirtMask = utils.image.scale(inputShirtMaskCropped, 
    baseShirtMaskCropped.bitmap.width, 
    baseShirtMaskCropped.bitmap.height
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

  const scaledInputShirt = utils.image.scale(
    inputShirt,
    scaledInputShirtMask.bitmap.width, 
    scaledInputShirtMask.bitmap.height
  );

  const codeColours = replaceablePixels.map(({ x, y }) => scaledInputShirt.getPixelColour(x, y));

  const colourEncoder = utils.ColourEncoder.create();
  const decoded = colourEncoder.decode(codeColours);

  return decoded;
};
