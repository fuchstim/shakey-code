const Jimp = require('jimp');

const CHARACTER_CODES = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  I: 9,
  J: 10,
  K: 11,
  L: 12,
  M: 13,
  N: 14,
  O: 15,
  P: 16,
  Q: 17,
  R: 18,
  S: 19,
  T: 20,
  U: 21,
  V: 22,
  W: 23,
  X: 24,
  Y: 25,
  Z: 26,
  0: 27,
  1: 28,
  2: 29,
  3: 30,
  4: 31,
  5: 32,
  6: 33,
  7: 34,
  8: 35,
  9: 36,
};

const BIT_COLOURS = {
  0: Jimp.rgbaToInt(255, 75, 85, 255), // #ff4b55
  1: Jimp.rgbaToInt(255, 255, 255, 255), // #ffffff
  2: Jimp.rgbaToInt(0, 159, 255, 255), // #009fff
};

class ColourEncoder {
  constructor(options) {
    this.characterCodes = options?.characterCodes ?? CHARACTER_CODES;
    this.bitColours = options?.bitColours ?? BIT_COLOURS;
  }

  get charLength() {
    return Math.max(
      ...Object.values(this.characterCodes).map(v => v.toString(3).length)
    );
  }

  encode(input, options = {}) {
    const { length } = options;

    const characters = input.split('');

    const characterCodes = characters.map(c => {
      const characterCode = this.characterCodes[c];

      if (!characterCode) {
        throw new Error(`Cannot resolve unknown character: ${c}`);
      }

      return this._padCharacterCode(characterCode.toString(3));
    });

    const bits = characterCodes
      .join('')
      .split('');

    const parityBit = bits.reduce((acc, b) => acc + Number(b), 0);
    bits.push(String(parityBit % 3));

    if (length > 0 && bits.length > length) {
      throw new Error(`Encoded value has length ${bits.length} which exceeds max length of ${length}`);
    }

    const paddingLength = length > 0 && length - bits.length;
    if (paddingLength) {
      const padding = Array(paddingLength).fill('0');

      bits.push(...padding);
    }

    return bits.map(b => this.bitColours[b]);
  }

  decode(colours) {
    const bits = colours.map(c => this._findClosestBit(c));

    const parityBit = bits.pop();
    const parityBitCheck = bits.reduce((acc, b) => acc + Number(b), 0) % 3;
    if (Number(parityBit) !== parityBitCheck) {
      throw new Error('Failed to decode invalid data');
    }

    const characterBits = [];
    for (let i = 0; i < bits.length; i += this.charLength) {
      characterBits.push(bits.slice(i, i + this.charLength));
    }

    const characterCodes = characterBits.map(c => parseInt(c.join(''), 3));

    const decoded = characterCodes.map(c => {
      const [ character ] = Object.entries(this.characterCodes)
        .find(([ , code ]) => code === c);

      if (!character) {
        throw new Error(`Failed to resolve character with code ${c}`);
      }

      return character;
    }).join('');

    return decoded;
  }

  _padCharacterCode(characterCode) {
    const r = [
      ...Array(this.charLength - characterCode.length).fill('0'),
      characterCode,
    ].join('');

    return r;
  }

  _findClosestBitColour(c) {
    const [{ bit, colour }] = Object.entries(this.bitColours)
      .map(([ bit, colour ]) => {
        const a = Jimp.intToRGBA(c);
        const b = Jimp.intToRGBA(colour);

        return {
          bit,
          colour,
          distance: Math.pow(b.r - a.r, 2) + Math.pow(b.g - a.g, 2) + Math.pow(b.b - a.b, 2),
        };
      })
      .sort(({ distance: a }, { distance: b }) => a - b);

    return { bit, colour };
  }

  _findClosestBit(c) {
    const { bit } = this._findClosestBitColour(c);

    return bit;
  }
}

module.exports = ColourEncoder;
module.exports.create = options => new ColourEncoder(options);
