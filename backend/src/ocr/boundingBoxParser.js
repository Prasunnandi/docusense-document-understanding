/**
 * OCR Bounding Box & 2D Spatial Hierarchy Parser
 * Transforms flat raw OCR token coordinates into structured semantic document trees:
 * Line segmentation, reading order reconstruction, key-value pairing, and table row clustering.
 */

class OcrBoundingBoxParser {
  constructor(options = {}) {
    this.lineOverlapThreshold = options.lineOverlapThreshold || 0.5; // 50% vertical overlap = same line
    this.wordSpacingMaxThreshold = options.wordSpacingMaxThreshold || 35; // px max gap to join words
  }

  /**
   * Normalizes bounding boxes to 1000x1000 coordinate grid (LayoutLM standard)
   * @param {Array<number>} bbox - [x0, y0, x1, y1]
   * @param {number} pageWidth
   * @param {number} pageHeight
   */
  normalizeBbox(bbox, pageWidth = 1000, pageHeight = 1000) {
    const [x0, y0, x1, y1] = bbox;
    return [
      Math.round((x0 / pageWidth) * 1000),
      Math.round((y0 / pageHeight) * 1000),
      Math.round((x1 / pageWidth) * 1000),
      Math.round((y1 / pageHeight) * 1000)
    ];
  }

  /**
   * Groups raw OCR word tokens into coherent text lines based on geometric proximity
   * @param {Array<Object>} tokens - [{ text, bbox: [x0, y0, x1, y1], confidence }]
   * @returns {Array<Object>} Segmented lines sorted in human reading order (top-to-bottom, left-to-right)
   */
  segmentLines(tokens = []) {
    if (!tokens.length) return [];

    // Sort tokens initially by y0 (top), then x0 (left)
    const sortedTokens = [...tokens].sort((a, b) => a.bbox[1] - b.bbox[1] || a.bbox[0] - b.bbox[0]);

    const lines = [];

    for (const token of sortedTokens) {
      const [tX0, tY0, tX1, tY1] = token.bbox;
      const tHeight = tY1 - tY0;

      // Find an existing line with significant vertical overlap
      let matchedLine = null;
      for (const line of lines) {
        const [lX0, lY0, lX1, lY1] = line.bbox;
        const lHeight = lY1 - lY0;

        const overlapTop = Math.max(tY0, lY0);
        const overlapBottom = Math.min(tY1, lY1);
        const overlap = Math.max(0, overlapBottom - overlapTop);

        const minHeight = Math.min(tHeight, lHeight);
        if (minHeight > 0 && (overlap / minHeight) >= this.lineOverlapThreshold) {
          matchedLine = line;
          break;
        }
      }

      if (matchedLine) {
        matchedLine.tokens.push(token);
        // Expand line bounding box
        matchedLine.bbox[0] = Math.min(matchedLine.bbox[0], tX0);
        matchedLine.bbox[1] = Math.min(matchedLine.bbox[1], tY0);
        matchedLine.bbox[2] = Math.max(matchedLine.bbox[2], tX1);
        matchedLine.bbox[3] = Math.max(matchedLine.bbox[3], tY1);
      } else {
        lines.push({
          lineId: lines.length + 1,
          bbox: [...token.bbox],
          tokens: [token]
        });
      }
    }

    // Sort tokens inside each line left-to-right and assemble concatenated text
    lines.forEach(line => {
      line.tokens.sort((a, b) => a.bbox[0] - b.bbox[0]);
      line.text = line.tokens.map(t => t.text).join(' ');
      line.confidence = Math.round(
        (line.tokens.reduce((sum, t) => sum + (t.confidence || 0.95), 0) / line.tokens.length) * 100
      ) / 100;
    });

    // Sort lines top-to-bottom
    lines.sort((a, b) => a.bbox[1] - b.bbox[1]);
    return lines;
  }

  /**
   * Extracts Key-Value candidate pairs using spatial proximity heuristics (rightward / downward search)
   * @param {Array<Object>} lines - Segmented document lines
   * @param {Array<string>} targetKeys - Keywords e.g. ['Invoice #', 'Total', 'Due Date']
   */
  extractKeyValuePairs(lines = [], targetKeys = ['Invoice #', 'Total', 'Date', 'Vendor', 'Tax']) {
    const pairs = [];

    lines.forEach((line, lineIdx) => {
      targetKeys.forEach(key => {
        const lowerText = line.text.toLowerCase();
        const lowerKey = key.toLowerCase();

        if (lowerText.includes(lowerKey)) {
          // Check if value is on the same line to the right (e.g. "Invoice #: INV-2026-09")
          const keyPos = lowerText.indexOf(lowerKey);
          const remainder = line.text.substring(keyPos + key.length).replace(/^[:\s-]+/, '').trim();

          if (remainder.length > 0) {
            pairs.push({
              key,
              value: remainder,
              spatialRelation: 'INLINE_RIGHT',
              confidence: line.confidence,
              bbox: line.bbox
            });
          } else if (lineIdx + 1 < lines.length) {
            // Check line immediately below within 40px
            const nextLine = lines[lineIdx + 1];
            const vertGap = nextLine.bbox[1] - line.bbox[3];
            if (vertGap >= 0 && vertGap <= 45) {
              pairs.push({
                key,
                value: nextLine.text,
                spatialRelation: 'STACKED_DOWN',
                confidence: Math.min(line.confidence, nextLine.confidence),
                bbox: [line.bbox[0], line.bbox[1], nextLine.bbox[2], nextLine.bbox[3]]
              });
            }
          }
        }
      });
    });

    return pairs;
  }
}

export default OcrBoundingBoxParser;
export { OcrBoundingBoxParser };
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OcrBoundingBoxParser;
}
