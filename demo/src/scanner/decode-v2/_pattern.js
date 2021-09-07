import Jimp from 'jimp';

const BLACK = Jimp.rgbaToInt(0, 0, 0, 255);
const WHITE = Jimp.rgbaToInt(255, 255, 255, 255);
class Pattern {
  constructor(options) {
    this.pattern = options.pattern;
    this.lightDarkCutoff = options.lightDarkCutoff || Jimp.rgbaToInt(25, 25, 25, 255);
    this.drawDebug = options.drawDebug;
    this.accuracy = options.accuracy || 0.5;
    this.patternMatchThreshold = options.patternMatchThreshold || this.accuracy;
  }

  findCandidates(inputImage) {
    const outlines = this._findOutlines(inputImage);
    
    const lineSequences = this._getLineSequences(outlines);
    
    const candidates = this._findCandidatesWithLineSequences(lineSequences);

    const candidatesWithMatchScore = candidates.map(c => ({ 
      ...c,
       matchScore: this._calculateCandidateMatchScore(outlines, c),
    }));

    const bestCandidates = candidatesWithMatchScore
      .filter(({ matchScore }) => matchScore >= this.patternMatchThreshold)
      .sort((a, b) => b - a);
    
    this.drawDebug({ outlines, })

    return bestCandidates;
  }

  _findOutlines(input) {
    const outlines = input.clone();
    outlines.scan(0, 0, outlines.bitmap.width, outlines.bitmap.height, (x, y) => {
      if(outlines.getPixelColour(x, y) >= this.lightDarkCutoff) {
        outlines.setPixelColour(WHITE, x, y);
      } else {
        outlines.setPixelColour(BLACK, x, y)
      }
    });

    return outlines;
  }

  _getLineSequences(outlines) {
    const lineSequences = [];

    for(let y = 1; y <= outlines.bitmap.height; y++) {
      lineSequences[y] = [];

      let currentLineSegment = { 
        value: outlines.getPixelColour(1, y) === BLACK ? 1 : 0, 
        length: 0 
      };

      for(let x = 1; x <= outlines.bitmap.width; x++) {
        const pixelValue = outlines.getPixelColour(x, y) === BLACK ? 1 : 0;

        if(currentLineSegment.value === pixelValue) {
          currentLineSegment.length++;
        } else {
          lineSequences[y].push(currentLineSegment);

          currentLineSegment = { value: pixelValue, length: 1 }
        }
      }

      lineSequences[y].push(currentLineSegment)
    }

    return lineSequences;
  }

  _findCandidatesWithLineSequences(lineSequences) {
    const candidates = [];

    lineSequences.forEach((row, rowIndex) => {
      row.forEach((segment, segmentIndex) => {
        const absoluteY = rowIndex + 1;
        const absoluteX = row.slice(0, segmentIndex).reduce((acc, { length }) => acc + length, 0);

        const overlappingCandidate = candidates.some(({ x, y, width, height }) => {
          const overlapX = absoluteX >= x && absoluteX <= (x + width);
          const overlapY = absoluteY >= y && absoluteY <= (y + height);

          return overlapX && overlapY;
        });
        if(overlappingCandidate) {
          return;
        }

        const patternStart = this.pattern[0];
        const checkSequence = row.slice(segmentIndex, segmentIndex + patternStart.length);

        const sequencesMatch = this._compareSequences(patternStart, checkSequence);
        if(!sequencesMatch) {
          return;
        }

        // Approximate pattern size

        const patternWidth = patternStart.reduce((acc, { length }) => acc + length, 0);
        const checkSequenceWidth = checkSequence.reduce((acc, { length }) => acc + length, 0);

        const scale = Math.round(checkSequenceWidth / patternWidth);

        const checkSequenceHeight = this.pattern.length * scale;

        candidates.push({ 
          x: absoluteX,
          y: absoluteY,
          scale,
          width: checkSequenceWidth,
          height: checkSequenceHeight,
        })
      });
    });

    return candidates;
  }

  _calculateRelativeSegmentLengths(sequence) {
    const baseLength = sequence
      .map(({ length }) => Number(length))
      .sort((a, b) => a - b)[0];

    const result = sequence.map(segment => ({ 
      ...segment, 
      relativeLength: segment.length / baseLength,
    }));

    return result;
  }

  _compareSequences(seq1, seq2) {
    const seq1Values = seq1.map(({ value }) => value);
    const seq2Values = seq2.map(({ value }) => value);

    // Check sequences have same number of segments
    if(seq1Values.length !== seq2Values.length) {
      return false;
    }

    // Check segments have same values
    for(let i = 0; i < seq1Values.length; i++) {
      if(seq1Values[i] !== seq2Values[i]) {
        return false;
      }
    }

    // Check relative segment lengths are (very) similar
    const seq1RelativeSegmentLengths = this._calculateRelativeSegmentLengths(seq1)
      .map(({ relativeLength }) => relativeLength);
    const seq2RelativeSegmentLengths = this._calculateRelativeSegmentLengths(seq2)
      .map(({ relativeLength }) => relativeLength);

    for(let i = 0; i < seq1RelativeSegmentLengths.length; i++) {
      const l1 = seq1RelativeSegmentLengths[i];
      const l2 = seq2RelativeSegmentLengths[i];

      if(l1 < l2 * this.accuracy || l1 > l2 * (2 - this.accuracy)) {
        return false;
      }
    }

    return true;
  }

  _calculateCandidateMatchScore(outlines, candidate) {
    const candidateArea = outlines.clone().crop(candidate.x, candidate.y, candidate.width, candidate.height);

    // Result of _getLineSequences is one-indexed, so we remove the first element
    const candidateLineSequences = this._getLineSequences(candidateArea).slice(1);

    // Repeat pattern rows to (approximately) match number of candidate line sequences
    const patternLineSequences = this.pattern.reduce((acc, row) => ([
      ...acc,
      ...Array(candidate.scale).fill(row)
    ]), []);

    const rowCount = Math.min(candidateLineSequences.length, patternLineSequences.length);

    console.log({ candidateLineSequences, patternLineSequences })

    const lineMatchResults = Array(rowCount).fill()
      .map((_, index) => {
        const candidateLineSequence = candidateLineSequences[index];
        const patternLineSequence = patternLineSequences[index];
        const match = this._compareSequences(candidateLineSequence, patternLineSequence);

        return { candidateLineSequence, patternLineSequence, match };
      });

    console.log({ lineMatchResults })

    const lineMatchScore = Math.round(
      (lineMatchResults.filter(({ match }) => match).length * 100) / lineMatchResults.length
    ) / 100;

    return lineMatchScore;
  }
}

export default Pattern;
