/**
 * Spatial Table Reconstruction and Row-Column Cell Parser
 * Reconstructs structured tabular data (headers, rows, columns, cells) from
 * unstructured 2D OCR word bounding boxes [x0, y0, x1, y1] without requiring line-ruling borders.
 */

export class SpatialTableExtractor {
  /**
   * @param {Object} [options]
   * @param {number} [options.columnGapThreshold=20] - Minimum horizontal pixel gap between distinct columns
   * @param {number} [options.rowOverlapThreshold=0.45] - Minimum vertical intersection-over-height for row grouping
   * @param {boolean} [options.hasHeader=true] - Whether row 0 is treated as column headers
   */
  constructor(options = {}) {
    this.columnGapThreshold = options.columnGapThreshold ?? 20;
    this.rowOverlapThreshold = options.rowOverlapThreshold ?? 0.45;
    this.hasHeader = options.hasHeader ?? true;
  }

  /**
   * Check if two bounding boxes vertically overlap sufficiently to belong to the same row
   */
  _isVerticalOverlap(boxA, boxB) {
    const topA = boxA[1];
    const botA = boxA[3];
    const topB = boxB[1];
    const botB = boxB[3];

    const overlapTop = Math.max(topA, topB);
    const overlapBot = Math.min(botA, botB);
    const overlapH = Math.max(0, overlapBot - overlapTop);

    const heightA = botA - topA;
    const heightB = botB - topB;
    const minHeight = Math.min(heightA, heightB);

    return minHeight > 0 && overlapH / minHeight >= this.rowOverlapThreshold;
  }

  /**
   * Group tokens into horizontal rows based on vertical coordinate overlap
   * @param {Array<Object>} tokens - Array of { text, bbox: [x0, y0, x1, y1] }
   * @returns {Array<Array<Object>>} Rows of tokens, sorted top-to-bottom, tokens within row sorted left-to-right
   */
  groupTokensIntoRows(tokens) {
    if (!tokens || tokens.length === 0) return [];

    // Sort tokens primarily by y0 (top), secondarily by x0 (left)
    const sorted = [...tokens].sort((a, b) => a.bbox[1] - b.bbox[1] || a.bbox[0] - b.bbox[0]);

    const rowGroups = []; // Array of { bbox: [x0, y0, x1, y1], tokens: [] }

    for (const token of sorted) {
      let matchedRow = null;

      for (const row of rowGroups) {
        if (this._isVerticalOverlap(token.bbox, row.bbox)) {
          matchedRow = row;
          break;
        }
      }

      if (matchedRow) {
        matchedRow.tokens.push(token);
        // Expand row vertical bounds
        matchedRow.bbox[1] = Math.min(matchedRow.bbox[1], token.bbox[1]);
        matchedRow.bbox[3] = Math.max(matchedRow.bbox[3], token.bbox[3]);
        matchedRow.bbox[0] = Math.min(matchedRow.bbox[0], token.bbox[0]);
        matchedRow.bbox[2] = Math.max(matchedRow.bbox[2], token.bbox[2]);
      } else {
        rowGroups.push({
          bbox: [...token.bbox],
          tokens: [token]
        });
      }
    }

    // Sort rows from top to bottom
    rowGroups.sort((a, b) => a.bbox[1] - b.bbox[1]);

    // Sort tokens within each row left to right
    return rowGroups.map((group) => group.tokens.sort((a, b) => a.bbox[0] - b.bbox[0]));
  }

  /**
   * Discover column boundary intervals using 1D horizontal projection clustering
   * @param {Array<Object>} tokens
   * @returns {Array<{ index: number, minX: number, maxX: number, centerX: number }>}
   */
  detectColumnBoundaries(tokens) {
    if (!tokens || tokens.length === 0) return [];

    // Collect all token horizontal spans [x0, x1]
    const spans = tokens.map((t) => ({ x0: t.bbox[0], x1: t.bbox[2] }));

    // Sort spans by left edge
    spans.sort((a, b) => a.x0 - b.x0);

    // Merge overlapping or nearby spans to identify column zones
    const rawClusters = [];
    let currentCluster = { minX: spans[0].x0, maxX: spans[0].x1 };

    for (let i = 1; i < spans.length; i++) {
      const span = spans[i];
      if (span.x0 <= currentCluster.maxX + this.columnGapThreshold) {
        currentCluster.maxX = Math.max(currentCluster.maxX, span.x1);
      } else {
        rawClusters.push(currentCluster);
        currentCluster = { minX: span.x0, maxX: span.x1 };
      }
    }
    rawClusters.push(currentCluster);

    return rawClusters.map((col, idx) => ({
      index: idx,
      minX: col.minX,
      maxX: col.maxX,
      centerX: (col.minX + col.maxX) / 2
    }));
  }

  /**
   * Reconstruct table grid from unstructured OCR tokens
   * @param {Array<Object>} tokens - [{ text, bbox: [x0, y0, x1, y1], confidence }]
   * @returns {Object} Structured table with headers, rows, markdown, and json
   */
  extractTable(tokens) {
    if (!tokens || tokens.length === 0) {
      return { headers: [], rows: [], totalRows: 0, totalColumns: 0, records: [], markdown: '' };
    }

    const rowsOfTokens = this.groupTokensIntoRows(tokens);
    const columns = this.detectColumnBoundaries(tokens);

    const numCols = columns.length;
    const grid = [];

    // Assign each token in a row to its best matching column
    for (const rowTokens of rowsOfTokens) {
      const cellTexts = new Array(numCols).fill('');

      for (const token of rowTokens) {
        const tokenMidX = (token.bbox[0] + token.bbox[2]) / 2;

        // Find nearest or enclosing column
        let bestColIdx = 0;
        let minDistance = Infinity;

        for (let c = 0; c < numCols; c++) {
          const col = columns[c];
          // Check direct containment
          if (token.bbox[0] >= col.minX - 10 && token.bbox[2] <= col.maxX + 10) {
            bestColIdx = c;
            minDistance = 0;
            break;
          }
          const dist = Math.abs(tokenMidX - col.centerX);
          if (dist < minDistance) {
            minDistance = dist;
            bestColIdx = c;
          }
        }

        cellTexts[bestColIdx] = cellTexts[bestColIdx]
          ? `${cellTexts[bestColIdx]} ${token.text}`.trim()
          : token.text.trim();
      }

      // Only push non-empty rows
      if (cellTexts.some((c) => c.length > 0)) {
        grid.push(cellTexts);
      }
    }

    if (grid.length === 0) {
      return { headers: [], rows: [], totalRows: 0, totalColumns: numCols, records: [], markdown: '' };
    }

    let headers = [];
    let dataRows = [];

    if (this.hasHeader && grid.length > 1) {
      headers = grid[0].map((h, i) => (h ? h : `Column_${i + 1}`));
      dataRows = grid.slice(1);
    } else {
      headers = Array.from({ length: numCols }, (_, i) => `Column_${i + 1}`);
      dataRows = grid;
    }

    // Convert to structured records
    const records = dataRows.map((row) => {
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx] || '';
      });
      return record;
    });

    // Generate Markdown table representation
    const mdHeader = `| ${headers.join(' | ')} |`;
    const mdSeparator = `| ${headers.map(() => '---').join(' | ')} |`;
    const mdRows = dataRows.map((row) => `| ${row.map((c) => c || '').join(' | ')} |`).join('\n');
    const markdown = `${mdHeader}\n${mdSeparator}\n${mdRows}`;

    // Generate CSV representation
    const csvHeader = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');
    const csvRows = dataRows
      .map((row) => row.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csv = `${csvHeader}\n${csvRows}`;

    return {
      headers,
      rows: dataRows,
      totalRows: dataRows.length,
      totalColumns: numCols,
      columnBoundaries: columns,
      records,
      markdown,
      csv
    };
  }
}

// Dual ESM & CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SpatialTableExtractor
  };
}

export default SpatialTableExtractor;
