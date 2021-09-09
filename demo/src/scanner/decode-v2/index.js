import Jimp from 'jimp';

import filter from './_filter';
import Pattern from './_pattern';
import utils from '../utils';

class ShakeyCodeDecoder {
  constructor(inputImage, drawDebug) {
    this._inputImage = inputImage;
    this._drawDebug = drawDebug;
  }

  async decode() {
    const inputImage = (await Jimp.read(Buffer.from(this._inputImage.split(',')[1], 'base64')));

    const tailPatternCandidates = this._findTailPatternCandidates(inputImage);
    const tail = tailPatternCandidates[0];

    if(!tail) { return; }

    const tailPatternWidthRatio = 7 / 11;
    const tailPatternHeightRatio = 7 / 5;

    const patternLocation = {
      x: tail.x + tail.width,
      y: tail.y - (((tail.height * tailPatternHeightRatio) - tail.height) / 2),
      width: Math.ceil(tail.width * tailPatternWidthRatio),
      height: Math.ceil(tail.height * tailPatternHeightRatio)
    };

    const pattern = inputImage
    .clone()
    .crop(patternLocation.x, patternLocation.y, patternLocation.width, patternLocation.height);
    
    const patternSize = 7;
    const pixelHeight = Math.round(patternLocation.height / patternSize);
    const pixelWidth = Math.round(patternLocation.width / patternSize);
    
    const colourEncoder = new utils.ColourEncoder();
    
    const bits = [];
    for(let yIndex = 1; yIndex < patternSize - 1; yIndex++) {
      const y = yIndex * pixelWidth;

      for(let xIndex = 1; xIndex < patternSize - 1; xIndex++) {
        const x = xIndex * pixelWidth;

        const primaryBitColour = filter.filterPrimaryBitColour(
          pattern.clone().crop(x, y, pixelWidth, pixelHeight),
          colourEncoder
        );

        bits.push(primaryBitColour);
      }
    }

    return bits;
  }

  _findTailPatternCandidates(inputImage) {
    const tailPattern = [
      [{ length: 3, value: 1 }, { length: 2, value: 0 }, { length: 1, value: 1 }, { length: 2, value: 0 }, { length: 3, value: 1 }],
      [{ length: 1, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 2, value: 1 }],
      [{ length: 1, value: 0 }, { length: 1, value: 1 }, { length: 1, value: 0 }, { length: 3, value: 1 }, { length: 3, value: 0 }, { length: 2, value: 1 }],
      [{ length: 1, value: 0 }, { length: 3, value: 1 }, { length: 2, value: 0 }, { length: 5, value: 1 }],
      [{ length: 2, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 1, value: 1 }],
    ];

    const pattern = new Pattern({ pattern: tailPattern, drawDebug: s => this.drawDebug(s) });

    const results = pattern.findCandidates(inputImage);

    return results;
  }

  async drawDebug(sources) {
    await Object.entries(sources)
      .reduce(async (chain, [ id, source ]) => {
        await chain;

        this._drawDebug(id, { 
          width: source.bitmap.width, 
          height: source.bitmap.height, 
          data: await source.getBase64Async('image/png') 
        });
      }, Promise.resolve());
  }
}

export default async function(inputImage, drawDebug) {
  const decoder = new ShakeyCodeDecoder(inputImage, drawDebug);

  const result = await decoder.decode();

  return result;
}
