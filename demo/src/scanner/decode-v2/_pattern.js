import Jimp from 'jimp';

const BLACK = Jimp.rgbaToInt(0, 0, 0, 255);
const WHITE = Jimp.rgbaToInt(255, 255, 255, 255);
class Pattern {
  constructor(options) {
    this.pattern = options.pattern;
    this.lightDarkCutoff = options.lightDarkCutoff || Jimp.rgbaToInt(10, 10, 10, 255);
    this.drawDebug = options.drawDebug;
    this.accuracy = options.accuracy || 0.5;
    this.patternMatchThreshold = options.patternMatchThreshold || this.accuracy;
    this.minSegmentLength = options.minSegmentLength || 5;
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

    return bestCandidates;
  }

  _findOutlines(input) {
    const outlines = input.clone();
    outlines
      .greyscale()
      .contrast(0.1)
      .scan(0, 0, outlines.bitmap.width, outlines.bitmap.height, (x, y) => {
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
        x: 0,
        y,
        value: outlines.getPixelColour(1, y) === BLACK ? 1 : 0, 
        length: 0 
      };

      for(let x = 1; x <= outlines.bitmap.width; x++) {
        const pixelValue = outlines.getPixelColour(x, y) === BLACK ? 1 : 0;

        if(currentLineSegment.value === pixelValue) {
          currentLineSegment.length++;
        } else {
          if(currentLineSegment.length >= this.minSegmentLength) {
            lineSequences[y].push(currentLineSegment);
          }

          currentLineSegment = { x, y, value: pixelValue, length: 1 }
        }
      }

      if(currentLineSegment.length >= this.minSegmentLength) {
        lineSequences[y].push(currentLineSegment);
      }
    }

    const deduplicatedSequences = this._deduplicateSequences(lineSequences);

    return deduplicatedSequences.map(s => this._calculateRelativeSegmentLengths(s));
  }

  _findCandidatesWithLineSequences(lineSequences) {
    const candidates = [];

    lineSequences.forEach(row => {
      row.forEach((segment, segmentIndex) => {
        const overlappingCandidate = candidates.some(({ x, y, width, height }) => {
          const overlapX = segment.x >= x && segment.x <= (x + width);
          const overlapY = segment.y >= y && segment.y <= (y + height);

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
          x: segment.x,
          y: segment.y,
          scale,
          width: checkSequenceWidth,
          height: checkSequenceHeight,
        })
      });
    });

    return candidates;
  }

  _calculateRelativeSegmentLengths(sequence) {
    const segmentLengths = sequence
      .map(({ length }) => Number(length))
      .sort((a, b) => a - b);

    const smallestSegmentLength = segmentLengths[0];
    const baseLengths = segmentLengths.filter(
      x => x >= smallestSegmentLength * this.accuracy && x <= smallestSegmentLength * (2 - this.accuracy)
    );
    const baseLength = baseLengths.reduce((acc, x) => acc + x, 0) / baseLengths.length;

    const result = sequence.map(segment => ({ 
      ...segment, 
      relativeLength: segment.length / baseLength,
    }));

    return result;
  }

  _trimSequence(sequence) {
    return sequence.slice(
      sequence[0].value === 0 ? 1 : 0,
      sequence[sequence.length - 1].value === 0 ? (sequence.length - 1) : sequence.length
    )
  }

  _compareSequences(seq1, seq2) {
    const seq1Values = this._trimSequence(seq1).map(({ value }) => value)

    const seq2Values = this._trimSequence(seq2).map(({ value }) => value)


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
    const seq1RelativeSegmentLengths = this._calculateRelativeSegmentLengths(seq1).map(({ relativeLength }) => relativeLength);
    const seq2RelativeSegmentLengths = this._calculateRelativeSegmentLengths(seq2).map(({ relativeLength }) => relativeLength);

    for(let i = 0; i < seq1RelativeSegmentLengths.length; i++) {
      const l1 = seq1RelativeSegmentLengths[i];
      const l2 = seq2RelativeSegmentLengths[i];

      if(l1 < l2 * this.accuracy || l1 > l2 * (2 - this.accuracy)) {
        return false;
      }
    }

    return true;
  }

  _deduplicateSequences(sequences) {
    const matchCounts = [];
    const deduplicatedSequences = sequences.reduce((acc, sequence) => {
      if(!acc.length) {
        matchCounts.push(0);
        return [ sequence ];
      }

      const matchesPrevious = this._compareSequences(sequence, acc[acc.length - 1]);
      if(matchesPrevious) {
        matchCounts[matchCounts.length - 1] += 1;
      } else {
        // If this row has appeared less than 1 time, discard it

        if(matchCounts[matchCounts.length - 1] < 1) {
          acc.pop();
          matchCounts.pop();
        }

        matchCounts.push(0);
        acc.push(sequence);
      }

      return acc;
    }, []);

    return deduplicatedSequences;
  }

  _calculateCandidateMatchScore(outlines, candidate) {
    const candidateArea = outlines.clone().crop(candidate.x, candidate.y, candidate.width, candidate.height);

    // Result of _getLineSequences is one-indexed, so we remove the first element
    const candidateLineSequences = this._getLineSequences(candidateArea);

    const patternLineSequences = this.pattern;

    const rowCount = Math.min(candidateLineSequences.length, patternLineSequences.length);


    const lineMatchResults = Array(rowCount).fill()
      .map((_, index) => {
        const candidateLineSequence = candidateLineSequences[index];
        const patternLineSequence = patternLineSequences[index];
        const match = this._compareSequences(candidateLineSequence, patternLineSequence);

        return { candidateLineSequence, patternLineSequence, match };
      });

    const lineMatchScore = Math.round(
      (lineMatchResults.filter(({ match }) => match).length * 100) / lineMatchResults.length
    ) / 100;

    return lineMatchScore;
  }
}

export default Pattern;
