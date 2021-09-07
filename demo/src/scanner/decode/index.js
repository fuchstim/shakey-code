import Jimp from 'jimp';

import baseImageSource from '../assets/base.png';
import utils from '../utils'

import filter from './_filter'

export default async function (inputBuffer, drawDebug) {
  utils.log.info('Loading image…');

  const deb = async (id, img) => drawDebug(id, { width: img.bitmap.width, height: img.bitmap.height, data: await img.getBase64Async('image/png') });

  const baseImage = await Jimp.read(Buffer.from(baseImageSource.split(',')[1], 'base64'));

  const baseShirtMask = filter.filterBaseColour(baseImage, 'r');
  utils.image.getReplaceablePixels(baseImage)
    .forEach(({ x, y }) => baseShirtMask.setPixelColour(utils.image.replaceableColour, x, y));
  const baseShirtMaskCropped = baseShirtMask.clone().autocrop();

  const inputImage = (await Jimp.read(Buffer.from(inputBuffer.split(',')[1], 'base64')))
    .resize(128, 128, Jimp.RESIZE_NEAREST_NEIGHBOR);

  const inputShirtMask = filter.clean(
    filter.filterBaseColour(inputImage, 'r'),
    Jimp.rgbaToInt(255, 0, 0, 255)
  );
  const inputShirtMaskCropped = inputShirtMask.clone().autocrop();

  const scaledInputShirtMask = inputShirtMaskCropped
    .clone()
    .resize(baseShirtMaskCropped.bitmap.width, baseShirtMaskCropped.bitmap.height, Jimp.RESIZE_NEAREST_NEIGHBOR)

  const replaceablePixels = utils.image.getReplaceablePixels(baseShirtMaskCropped);
  const matchingPixels = [];
  scaledInputShirtMask.scan(0, 0, scaledInputShirtMask.bitmap.width, scaledInputShirtMask.bitmap.height, (x, y) => {
    if (replaceablePixels.some((p => p.x === x && p.y === y))) { return matchingPixels.push(true); }

    matchingPixels.push(baseShirtMaskCropped.getPixelColour(x, y) === scaledInputShirtMask.getPixelColour(x, y));
  });

  await deb('baseImage', baseImage);
  await deb('baseShirtMask', baseShirtMask);
  await deb('baseShirtMaskCropped', baseShirtMaskCropped);

  await deb('inputImage', inputImage);
  await deb('inputShirtMask', inputShirtMask);
  await deb('inputShirtMaskCropped', inputShirtMaskCropped);
  await deb('scaledInputShirtMask', scaledInputShirtMask);

  const matchingPixelsRatio = matchingPixels.filter(m => m).length / matchingPixels.length;
  utils.log.info(`Matching pixels ratio: ${matchingPixelsRatio}`);
  if (matchingPixelsRatio < 0.8) {
    throw new Error('Cannot find code in source image.');
  }

  const colourEncoder = new utils.ColourEncoder();
  const inputShirt = filter.filterBitColours(
    filter.applyMask(inputImage, inputShirtMask).autocrop(),
    colourEncoder,
  );

  const scaledBaseShirtMask = baseShirtMaskCropped
    .clone()
    .resize(inputShirt.bitmap.width, inputShirt.bitmap.height, Jimp.RESIZE_NEAREST_NEIGHBOR);

  const testReplaceablePixels = utils.image.getReplaceablePixels(scaledBaseShirtMask);

  const bitMatrix = inputShirt.clone();

  bitMatrix.scan(0, 0, bitMatrix.bitmap.width, bitMatrix.bitmap.height, (x, y) => {
    if(!testReplaceablePixels.some(p => p.x === x && p.y === y)) {
      bitMatrix.setPixelColour(0, x, y)
    }
  });

  bitMatrix.autocrop();


  const scaledBitMatrix = bitMatrix
    .clone()
    .resize(5, 5, Jimp.RESIZE_NEAREST_NEIGHBOR)
    .resize(512, 512, Jimp.RESIZE_NEAREST_NEIGHBOR);

  await deb('scaledBitMatrix', scaledBitMatrix)
};
