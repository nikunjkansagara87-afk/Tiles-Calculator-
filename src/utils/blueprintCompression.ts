import { BlueprintTileBlock } from '../types';

const CODE_TO_KEY: Record<string, BlueprintTileBlock['sizeKey']> = {
  A: '600',
  H: '300x600_h',
  V: '300x600_v',
  S: '300',
};

const KEY_TO_CODE: Record<BlueprintTileBlock['sizeKey'], string> = {
  '600': 'A',
  '300x600_h': 'H',
  '300x600_v': 'V',
  '300': 'S',
};

/**
 * Compresses an array of BlueprintTileBlock into an ultra-lightweight string (~180 bytes for 37 tiles)
 * Format: "M45,bw|A0,0|H2,0r45|V4,0|S5,0"
 */
export function compressBlueprintLayout(
  blocks?: BlueprintTileBlock[],
  overrideGridRotation?: number,
  overrideCadStyle?: 'color' | 'cad-bw'
): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return '';

  const gridRot =
    overrideGridRotation !== undefined
      ? overrideGridRotation
      : blocks[0]?.gridRotation || 0;
  const style =
    overrideCadStyle !== undefined
      ? overrideCadStyle
      : blocks[0]?.cadStyle || 'color';

  const metaPrefix =
    gridRot !== 0 || style === 'cad-bw'
      ? `M${gridRot},${style === 'cad-bw' ? 'bw' : 'c'}|`
      : '';

  const body = blocks
    .map((b) => {
      const code = KEY_TO_CODE[b.sizeKey] || 'A';
      const x = Math.max(0, Math.round(Number(b.x) || 0));
      const y = Math.max(0, Math.round(Number(b.y) || 0));
      const rot = b.rotation ? Math.round(Number(b.rotation) || 0) : 0;
      return rot !== 0 ? `${code}${x},${y}r${rot}` : `${code}${x},${y}`;
    })
    .join('|');

  return `${metaPrefix}${body}`;
}

/**
 * Decompresses a compact layout string back into full BlueprintTileBlock objects
 */
export function decompressBlueprintLayout(
  compact?: string,
  fallbackBlocks?: BlueprintTileBlock[]
): BlueprintTileBlock[] {
  if (compact && typeof compact === 'string' && compact.trim().length > 0) {
    const parts = compact.trim().split('|');
    const result: BlueprintTileBlock[] = [];
    let gridRotation = 0;
    let cadStyle: 'color' | 'cad-bw' = 'color';

    parts.forEach((token, idx) => {
      if (!token) return;
      if (token[0] === 'M') {
        const metaParts = token.slice(1).split(',');
        gridRotation = parseInt(metaParts[0], 10) || 0;
        if (metaParts[1] === 'bw') cadStyle = 'cad-bw';
        return;
      }
      if (token.length < 4) return;
      const code = token[0];
      const sizeKey = CODE_TO_KEY[code];
      if (!sizeKey) return;
      const [coordPart, rotPart] = token.slice(1).split('r');
      const coords = coordPart.split(',');
      if (coords.length < 2) return;
      const x = parseInt(coords[0], 10);
      const y = parseInt(coords[1], 10);
      const rotation = rotPart ? parseInt(rotPart, 10) || 0 : 0;
      if (isNaN(x) || isNaN(y)) return;

      const widthUnits = sizeKey === '600' || sizeKey === '300x600_h' ? 2 : 1;
      const heightUnits = sizeKey === '600' || sizeKey === '300x600_v' ? 2 : 1;
      const block: BlueprintTileBlock = {
        id: `t${idx}`,
        sizeKey,
        x,
        y,
        widthUnits,
        heightUnits,
        label: sizeKey === '600' ? '600×600' : sizeKey === '300' ? '300²' : '300×600',
      };
      if (rotation !== 0) block.rotation = rotation;
      if (gridRotation !== 0) block.gridRotation = gridRotation;
      if (cadStyle !== 'color') block.cadStyle = cadStyle;
      result.push(block);
    });
    if (result.length > 0) return result;
  }

  if (Array.isArray(fallbackBlocks) && fallbackBlocks.length > 0) {
    return minifyBlueprintBlocks(fallbackBlocks);
  }
  return [];
}

/**
 * Strips redundant fields and normalizes IDs to keep customBlueprintLayout light in memory/JSON
 */
export function minifyBlueprintBlocks(blocks: BlueprintTileBlock[]): BlueprintTileBlock[] {
  return blocks.map((b, idx) => {
    const sizeKey: BlueprintTileBlock['sizeKey'] =
      b.sizeKey === '600' ||
      b.sizeKey === '300x600_h' ||
      b.sizeKey === '300x600_v' ||
      b.sizeKey === '300'
        ? b.sizeKey
        : '600';
    const widthUnits = sizeKey === '600' || sizeKey === '300x600_h' ? 2 : 1;
    const heightUnits = sizeKey === '600' || sizeKey === '300x600_v' ? 2 : 1;
    const out: BlueprintTileBlock = {
      id: `t${idx}`,
      sizeKey,
      x: Math.max(0, Math.round(Number(b.x) || 0)),
      y: Math.max(0, Math.round(Number(b.y) || 0)),
      widthUnits,
      heightUnits,
    };
    if (b.rotation) out.rotation = Math.round(Number(b.rotation) || 0);
    if (b.gridRotation) out.gridRotation = Math.round(Number(b.gridRotation) || 0);
    if (b.cadStyle && b.cadStyle !== 'color') out.cadStyle = b.cadStyle;
    return out;
  });
}

// Exact 37-tile full 10x8 Modular Interlock Layout for P.1 (45% 600x600, 40% 300x600, 15% 300x300)
const P1_FULL_37_TILES_COMPACT =
  'A0,0|V0,2|S1,2|A1,3|V0,4|S0,6|V1,5|H0,7|' +
  'H2,0|V2,1|S3,1|V4,0|A3,2|V3,4|S4,4|S2,5|A2,6|A4,5|H4,7|' +
  'S5,0|S6,0|A5,1|V5,3|S6,3|A6,4|V6,6|' +
  'A7,0|S9,0|V7,2|S8,2|V9,1|A8,3|V8,5|S9,5|S7,6|H7,7|V9,6';

// Exact 45° Diagonal Alternating Band Interlock Layout matching the reference CAD sketch
const DIAGONAL_45_PIC_COMPACT =
  'A0,0|V2,0|A3,0|V5,0|A6,0|V8,0|S9,0|S9,1|' +
  'S0,2|H1,2|S3,2|H4,2|S6,2|H7,2|S9,2|' +
  'V0,3|A1,3|V3,3|A4,3|V6,3|A7,3|V9,3|' +
  'H0,5|S2,5|H3,5|S5,5|H6,5|S8,5|S9,5|' +
  'A0,6|V2,6|A3,6|V5,6|A6,6|V8,6|S9,6|S9,7';

/**
 * Generates the exact 45-degree rotated diagonal interlocking pattern (like the reference CAD picture)
 */
export function getDiagonal45PicLayout(
  gridRotation = 45,
  cadStyle: 'color' | 'cad-bw' = 'cad-bw'
): BlueprintTileBlock[] {
  const prefix = `M${gridRotation},${cadStyle === 'cad-bw' ? 'bw' : 'c'}|`;
  return decompressBlueprintLayout(`${prefix}${DIAGONAL_45_PIC_COMPACT}`);
}

/**
 * Generates a complete, 100%-filled 10x8 (80 cells) modular layout for any pattern P.1-P.18
 * so every user always sees a full, rich architectural grid layout.
 */
export function getDefaultFullGridLayout(
  code: string,
  pct600 = 44,
  pct300x600 = 39,
  pct300 = 17
): BlueprintTileBlock[] {
  if (code === 'P.1' || code === 'P.2' || code === 'P.7') {
    return decompressBlueprintLayout(P1_FULL_37_TILES_COMPACT);
  }

  // Deterministic 10x8 grid packer matching target ratios
  const COLS = 10;
  const ROWS = 8;
  const occupied: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

  // Target unit counts out of 80
  let target600Count = Math.round(((pct600 / 100) * 80) / 4);
  let target300x600Count = Math.round(((pct300x600 / 100) * 80) / 2);
  if (pct600 === 0) target600Count = 0;
  if (pct300x600 === 0) target300x600Count = 0;

  // Seeded pseudo-random offset based on pattern code so each pattern has a distinct visual rhythm
  const codeNum = parseInt(code.replace(/\D/g, ''), 10) || 1;
  const blocks: BlueprintTileBlock[] = [];
  let idCounter = 0;

  const canFit = (c: number, r: number, w: number, h: number) => {
    if (c + w > COLS || r + h > ROWS) return false;
    for (let y = r; y < r + h; y++) {
      for (let x = c; x < c + w; x++) {
        if (occupied[y][x]) return false;
      }
    }
    return true;
  };

  const markOccupied = (c: number, r: number, w: number, h: number) => {
    for (let y = r; y < r + h; y++) {
      for (let x = c; x < c + w; x++) {
        occupied[y][x] = true;
      }
    }
  };

  // 1. Place 600x600 (2x2) blocks in staggered interlocking positions across the 10x8 grid
  if (target600Count > 0) {
    const candidate600Coords: Array<[number, number]> = [
      [0, 0],
      [5, 1],
      [7, 0],
      [1, 3],
      [3, 2],
      [8, 3],
      [6, 4],
      [2, 6],
      [4, 5],
      [0, 5],
      [7, 6],
      [3, 0],
      [5, 3],
      [1, 1],
      [8, 1],
      [0, 2],
    ];
    // Rotate candidate list slightly by codeNum for pattern variety
    const shift = (codeNum * 2) % candidate600Coords.length;
    const ordered = [
      ...candidate600Coords.slice(shift),
      ...candidate600Coords.slice(0, shift),
    ];

    let placed600 = 0;
    for (const [cx, cy] of ordered) {
      if (placed600 >= target600Count) break;
      if (canFit(cx, cy, 2, 2)) {
        markOccupied(cx, cy, 2, 2);
        blocks.push({
          id: `t${idCounter++}`,
          sizeKey: '600',
          x: cx,
          y: cy,
          widthUnits: 2,
          heightUnits: 2,
          label: '600×600',
        });
        placed600++;
      }
    }
    // If still more 600x600 needed, scan grid
    for (let r = 0; r < ROWS && placed600 < target600Count; r++) {
      for (let c = 0; c < COLS && placed600 < target600Count; c++) {
        if (canFit(c, r, 2, 2)) {
          markOccupied(c, r, 2, 2);
          blocks.push({
            id: `t${idCounter++}`,
            sizeKey: '600',
            x: c,
            y: r,
            widthUnits: 2,
            heightUnits: 2,
            label: '600×600',
          });
          placed600++;
        }
      }
    }
  }

  // 2. Place 300x600 (alternating vertical 1x2 and horizontal 2x1 for authentic interlocking)
  let placed300x600 = 0;
  for (let r = 0; r < ROWS && placed300x600 < target300x600Count; r++) {
    for (let c = 0; c < COLS && placed300x600 < target300x600Count; c++) {
      if (occupied[r][c]) continue;
      const preferVertical = (c + r + codeNum) % 2 === 0;
      if (preferVertical && canFit(c, r, 1, 2)) {
        markOccupied(c, r, 1, 2);
        blocks.push({
          id: `t${idCounter++}`,
          sizeKey: '300x600_v',
          x: c,
          y: r,
          widthUnits: 1,
          heightUnits: 2,
          label: '300×600',
        });
        placed300x600++;
      } else if (canFit(c, r, 2, 1)) {
        markOccupied(c, r, 2, 1);
        blocks.push({
          id: `t${idCounter++}`,
          sizeKey: '300x600_h',
          x: c,
          y: r,
          widthUnits: 2,
          heightUnits: 1,
          label: '300×600',
        });
        placed300x600++;
      } else if (canFit(c, r, 1, 2)) {
        markOccupied(c, r, 1, 2);
        blocks.push({
          id: `t${idCounter++}`,
          sizeKey: '300x600_v',
          x: c,
          y: r,
          widthUnits: 1,
          heightUnits: 2,
          label: '300×600',
        });
        placed300x600++;
      }
    }
  }

  // 3. Fill remaining cells with 300x300 (or 300x600 if pct300 === 0)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (occupied[r][c]) continue;
      if (pct300 === 0 && canFit(c, r, 2, 1)) {
        markOccupied(c, r, 2, 1);
        blocks.push({
          id: `t${idCounter++}`,
          sizeKey: '300x600_h',
          x: c,
          y: r,
          widthUnits: 2,
          heightUnits: 1,
          label: '300×600',
        });
      } else if (pct300 === 0 && canFit(c, r, 1, 2)) {
        markOccupied(c, r, 1, 2);
        blocks.push({
          id: `t${idCounter++}`,
          sizeKey: '300x600_v',
          x: c,
          y: r,
          widthUnits: 1,
          heightUnits: 2,
          label: '300×600',
        });
      } else {
        markOccupied(c, r, 1, 1);
        blocks.push({
          id: `t${idCounter++}`,
          sizeKey: '300',
          x: c,
          y: r,
          widthUnits: 1,
          heightUnits: 1,
          label: '300²',
        });
      }
    }
  }

  return blocks;
}
