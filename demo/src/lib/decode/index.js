import Jimp from 'jimp';

import filter from './_filter';
import Pattern from './_pattern';
import utils from '../utils';

class ShakeyCodeDecoder {
  constructor({ drawDebug, onSampleRecorded, onResult, sampleCount }) {
    this._drawDebug = drawDebug;
    this.onSampleRecorded = onSampleRecorded || (() => {});
    this.onResult = onResult || (() => {});
    this.sampleCount = sampleCount || 3;

    this.tailPattern = new Pattern({ 
      drawDebug: s => this.drawDebug(s),
      pattern: [
        [{ length: 3, value: 1 }, { length: 2, value: 0 }, { length: 1, value: 1 }, { length: 2, value: 0 }, { length: 3, value: 1 }],
        [{ length: 1, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 2, value: 1 }],
        [{ length: 1, value: 0 }, { length: 1, value: 1 }, { length: 1, value: 0 }, { length: 3, value: 1 }, { length: 3, value: 0 }, { length: 2, value: 1 }],
        [{ length: 1, value: 0 }, { length: 3, value: 1 }, { length: 2, value: 0 }, { length: 5, value: 1 }],
        [{ length: 2, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 1, value: 1 }],
      ], 
    });

    this.colourEncoder = new utils.ColourEncoder();

    this.samples = [];
  }

  async decode(base64InputImage) {
    const inputImage = (await Jimp.read(Buffer.from(base64InputImage.split(',')[1], 'base64')));

    const tail = this._findTailPattern(inputImage);

    if(!tail) { return; }

    const code = this._cropCode(inputImage, tail);

    const bits = this._parseCode(code);

    this._recordSample(bits);

    if(this.samples.length >= this.sampleCount) {
      try {
        const result = this.colourEncoder.decode(this.samples[0])

        this.onResult.apply(this.onResult, [ result ])
      } catch(error) {
        this.samples = [];

        console.error(error);
      }
    }
  }

  _findTailPattern(inputImage) {
    const results = this.tailPattern.findCandidates(inputImage);

    return results[0];
  }

  _cropCode(inputImage, tail) {
    const tailCodeWidthRatio = 7 / 11;
    const tailCodeHeightRatio = 7 / 5;

    const codeLocation = {
      x: tail.x + tail.width,
      y: tail.y - (((tail.height * tailCodeHeightRatio) - tail.height) / 2),
      width: Math.ceil(tail.width * tailCodeWidthRatio),
      height: Math.ceil(tail.height * tailCodeHeightRatio)
    };

    const code = inputImage
      .clone()
      .crop(codeLocation.x, codeLocation.y, codeLocation.width, codeLocation.height);

    return code;
  }

  _parseCode(code) {
    const codeSize = 7;
    const pixelHeight = Math.round(code.bitmap.height / codeSize);
    const pixelWidth = Math.round(code.bitmap.width / codeSize);

    const bits = [];
    for(let yIndex = 1; yIndex < codeSize - 1; yIndex++) {
      const y = yIndex * pixelWidth;

      for(let xIndex = 1; xIndex < codeSize - 1; xIndex++) {
        const x = xIndex * pixelWidth;

        const primaryBitColour = filter.filterPrimaryBitColour(
          code.clone().crop(x, y, pixelWidth, pixelHeight),
          this.colourEncoder
        );

        bits.push(primaryBitColour);
      }
    }

    return bits;
  }

  _recordSample(bits) {
    if(!this._compareSample(this.samples[0], bits)) {
      this.samples = [ bits ];
    } else {
      this.samples.push(bits);
    }


    this.onSampleRecorded.apply(this.onSampleRecorded, [ { 
      bits,
      samples: this.samples,
      sampleProgress: Math.min(Math.round((this.samples.length * 100) / this.sampleCount), 100)
    } ]);
  }

  _compareSample(sample1, sample2) {
    if(!sample1 || !sample2) {
      return false;
    }

    return sample1.every((s, index) => s === sample2[index]);
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

export default ShakeyCodeDecoder;
