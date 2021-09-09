import Jimp from 'jimp';

import Pattern from './_pattern';

class ShakeyCodeDecoder {
  constructor(inputImage, drawDebug) {
    this._inputImage = inputImage;
    this._drawDebug = drawDebug;
  }

  async decode() {
    const inputImage = (await Jimp.read(Buffer.from(this._inputImage.split(',')[1], 'base64')));

    await this.drawDebug({ inputImage });

    // const facePatternCandidates = this._findFacePatternCandidates(inputImage);
    // const face = facePatternCandidates[0];
    
    // if(face) {
    //   this.drawDebug({
    //     face: inputImage.clone().crop(face.x, face.y, face.width, face.height)
    //   })
    // }

    const tailPatternCandidates = this._findTailPatternCandidates(inputImage);
    const tail = tailPatternCandidates[0];

    if(tail) {
      this.drawDebug({
        tail: inputImage.clone().crop(tail.x, tail.y, tail.width, tail.height)
      })
    }
  }

  _findFacePatternCandidates(inputImage) {
    const facePattern = [
      [{ length: 2, value: 1 }, { length: 1, value: 0 }, {length: 1, value: 1}],
      [{ length: 4, value: 0 }],
      [{ length: 2, value: 0 }, { length: 1, value: 1 }, { length: 1, value: 0 }],
      [{ length: 2, value: 1 }, { length: 2, value: 0 }],
    ];

    const pattern = new Pattern({ pattern: facePattern, drawDebug: s => this.drawDebug(s) });

    const results = pattern.findCandidates(inputImage);

    return results;
  }

  _findTailPatternCandidates(inputImage) {
    const facePattern = [
      [{ length: 3, value: 1 }, { length: 2, value: 0 }, { length: 1, value: 1 }, { length: 2, value: 0 }, { length: 3, value: 1 }],
      [{ length: 1, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 2, value: 1 }],
      [{ length: 1, value: 0 }, { length: 1, value: 1 }, { length: 1, value: 0 }, { length: 3, value: 1 }, { length: 3, value: 0 }, { length: 2, value: 1 }],
      [{ length: 1, value: 0 }, { length: 3, value: 1 }, { length: 2, value: 0 }, { length: 5, value: 1 }],
      [{ length: 2, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 1, value: 1 }, { length: 3, value: 0 }, { length: 1, value: 1 }],
    ];

    const pattern = new Pattern({ pattern: facePattern, drawDebug: s => this.drawDebug(s) });

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
