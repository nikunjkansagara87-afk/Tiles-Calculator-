import { TilePattern } from '../types';

export interface ModularFactors {
  sqft600x600: number; // default 11.62
  sqft300x600: number; // default 7.70
  sqft300x300: number; // default 6.69
}

export const DEFAULT_MODULAR_FACTORS: ModularFactors = {
  sqft600x600: 11.62,
  sqft300x600: 7.70,
  sqft300x300: 6.69,
};

export interface PatternCoverageRow {
  code: string;
  name: string;
  subtitle: string;
  pct600x600: number;
  pct300x600: number;
  pct300x300: number;
  sqft600x600: number;
  sqft300x600: number;
  sqft300x300: number;
  totalSqft: number;
  boxes600x600Exact: number;
  boxes300x600Exact: number;
  boxes300x300Exact: number;
  totalBoxesExact: number;
  boxes600x600Ceil: number;
  boxes300x600Ceil: number;
  boxes300x300Ceil: number;
  totalBoxesCeil: number;
}

// Master list of P.1 through P.18 with authentic Morbi factory coverage percentages
export const PATTERNS_LIST: TilePattern[] = [
  {
    id: 'p1',
    code: 'P.1',
    name: '3-Size Modular Interlock',
    subtitle: '600×600 (44%) + 300×600 (39%) + 300×300 (17%)',
    description: 'Morbi classic 3-format interlocking courtyard pattern with optimal multi-scale load distribution.',
    layoutType: 'modular3',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 44,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 39,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 17,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p2',
    code: 'P.2',
    name: 'Opus Modular Classic',
    subtitle: '600×600 (44%) + 300×600 (39%) + 300×300 (17%)',
    description: 'French architectural stone paver layout with staggered joints across 3 modular formats.',
    layoutType: 'modular3',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 44,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 39,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 17,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p3',
    code: 'P.3',
    name: '600-Dominant Grand Grid',
    subtitle: '600×600 (57%) + 300×600 (23%) + 300×300 (20%)',
    description: 'High-coverage 600×600 primary field with decorative accent strips and corner keys.',
    layoutType: 'modular3',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 57,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 23,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 20,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p4',
    code: 'P.4',
    name: '300×600 Staggered Band',
    subtitle: '600×600 (14%) + 300×600 (63%) + 300×300 (23%)',
    description: 'Dynamic corridor layout dominated by 300×600 rectangular tiles with perimeter square anchors.',
    layoutType: 'runner',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 14,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 63,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 23,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p5',
    code: 'P.5',
    name: 'Balanced Trio Mosaic',
    subtitle: '600×600 (41%) + 300×600 (36%) + 300×300 (23%)',
    description: 'Harmonious multi-tier terrace layout balancing large squares, rectangular bricks, and small keys.',
    layoutType: 'modular3',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 41,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 36,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 23,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p6',
    code: 'P.6',
    name: 'Dual-Offset Runner Combo',
    subtitle: '600×600 (40%) + 300×600 (44%) + 300×300 (16%)',
    description: 'Alternating wide and narrow horizontal bands designed for extended driveway expanses.',
    layoutType: 'runner',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 40,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 44,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 16,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p7',
    code: 'P.7',
    name: 'Triple Symmetry Paving',
    subtitle: '600×600 (44%) + 300×600 (39%) + 300×300 (17%)',
    description: 'High aesthetic architectural outdoor paving with symmetric 44-39-17 interlock configuration.',
    layoutType: 'modular3',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 44,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 39,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 17,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p8',
    code: 'P.8',
    name: 'Grand Field with Square Anchors',
    subtitle: '600×600 (57%) + 300×600 (30%) + 300×300 (13%)',
    description: 'Clean open-floor look emphasizing large 600×600 tiles with discreet 300-series stepping courses.',
    layoutType: 'modular3',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 57,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 30,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 13,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p9',
    code: 'P.9',
    name: 'Modern Trio Promenade',
    subtitle: '600×600 (41%) + 300×600 (36%) + 300×300 (23%)',
    description: 'Heavy duty commercial promenade paving engineered for high footfall plazas and showrooms.',
    layoutType: 'modular3',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 41,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 36,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 23,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p10',
    code: 'P.10',
    name: '2-Size Large Duo (600×600 + 300×600)',
    subtitle: '600×600 (70%) + 300×600 (30%) + 300×300 (0%)',
    description: 'Two-size modular combination yielding the lowest box count per sqft (297.6 boxes per 3,000 sqft).',
    layoutType: 'runner',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 70,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 30,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
    ],
  },
  {
    id: 'p11',
    code: 'P.11',
    name: '2-Size Rectangular Runner (300×600 + 300×300)',
    subtitle: '600×600 (0%) + 300×600 (76%) + 300×300 (24%)',
    description: 'Linear 300-width series combo for balconies, walkways, and verandas without 600×600 tiles.',
    layoutType: 'runner',
    components: [
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 76,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 24,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p12',
    code: 'P.12',
    name: '2-Size Half-and-Half (300×600 + 300×300)',
    subtitle: '600×600 (0%) + 300×600 (49%) + 300×300 (51%)',
    description: 'Equal split between 300×600 bricks and 300×300 squares creating a uniform basketweave rhythm.',
    layoutType: 'basketweave',
    components: [
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 49,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 51,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p13',
    code: 'P.13',
    name: 'Architectural Trio Matrix',
    subtitle: '600×600 (45%) + 300×600 (30%) + 300×300 (25%)',
    description: 'Geometric 45-30-25 proportion popular in modern architectural terrace and resort decking.',
    layoutType: 'modular3',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 45,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 30,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 25,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p14',
    code: 'P.14',
    name: 'Maximum Field Courtyard',
    subtitle: '600×600 (62%) + 300×600 (25%) + 300×300 (13%)',
    description: 'High 62% slab coverage reducing grout joints while maintaining a rich multi-tile pattern look.',
    layoutType: 'modular3',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 62,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 25,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 13,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p15',
    code: 'P.15',
    name: 'Harmonious Trio Paving',
    subtitle: '600×600 (56%) + 300×600 (28%) + 300×300 (16%)',
    description: 'Classic 2:1 ratio between 600s and 300s providing smooth geometric flow across large halls.',
    layoutType: 'modular3',
    components: [
      {
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: 56,
        sqftPerBox: 11.62,
        weightPerBoxKg: 28.0,
        rate: 380,
        colorCode: 'blue',
      },
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 28,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 16,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p16',
    code: 'P.16',
    name: 'Small-Scale Accent Grid (300×600 + 300×300)',
    subtitle: '600×600 (0%) + 300×600 (40%) + 300×300 (60%)',
    description: 'Square-dominant fine paver arrangement without 600×600 tiles, ideal for residential driveways.',
    layoutType: 'basketweave',
    components: [
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 40,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 60,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p17',
    code: 'P.17',
    name: 'Long Linear Accent (300×600 + 300×300)',
    subtitle: '600×600 (0%) + 300×600 (75%) + 300×300 (25%)',
    description: '3:1 linear-to-square ratio for elegant garden paths and building perimeter corridors.',
    layoutType: 'runner',
    components: [
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 75,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 25,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
  {
    id: 'p18',
    code: 'P.18',
    name: 'Narrow Corridor Runner (300×600 + 300×300)',
    subtitle: '600×600 (0%) + 300×600 (78%) + 300×300 (22%)',
    description: 'Highest rectangular ratio pairing 78% 300×600 tiles with 22% 300×300 interlock blocks.',
    layoutType: 'runner',
    components: [
      {
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: 78,
        sqftPerBox: 7.70,
        weightPerBoxKg: 18.0,
        rate: 260,
        colorCode: 'amber',
      },
      {
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: 22,
        sqftPerBox: 6.69,
        weightPerBoxKg: 16.0,
        rate: 230,
        colorCode: 'emerald',
      },
    ],
  },
];

// Raw percentage table for P.1 to P.18 as per the authentic factory spreadsheet
export const MODULAR_PATTERN_PERCENTAGES: Record<
  string,
  { pct600x600: number; pct300x600: number; pct300x300: number }
> = {
  'P.1': { pct600x600: 44, pct300x600: 39, pct300x300: 17 },
  'P.2': { pct600x600: 44, pct300x600: 39, pct300x300: 17 },
  'P.3': { pct600x600: 57, pct300x600: 23, pct300x300: 20 },
  'P.4': { pct600x600: 14, pct300x600: 63, pct300x300: 23 },
  'P.5': { pct600x600: 41, pct300x600: 36, pct300x300: 23 },
  'P.6': { pct600x600: 40, pct300x600: 44, pct300x300: 16 },
  'P.7': { pct600x600: 44, pct300x600: 39, pct300x300: 17 },
  'P.8': { pct600x600: 57, pct300x600: 30, pct300x300: 13 },
  'P.9': { pct600x600: 41, pct300x600: 36, pct300x300: 23 },
  'P.10': { pct600x600: 70, pct300x600: 30, pct300x300: 0 },
  'P.11': { pct600x600: 0, pct300x600: 76, pct300x300: 24 },
  'P.12': { pct600x600: 0, pct300x600: 49, pct300x300: 51 },
  'P.13': { pct600x600: 45, pct300x600: 30, pct300x300: 25 },
  'P.14': { pct600x600: 62, pct300x600: 25, pct300x300: 13 },
  'P.15': { pct600x600: 56, pct300x600: 28, pct300x300: 16 },
  'P.16': { pct600x600: 0, pct300x600: 40, pct300x300: 60 },
  'P.17': { pct600x600: 0, pct300x600: 75, pct300x300: 25 },
  'P.18': { pct600x600: 0, pct300x600: 78, pct300x300: 22 },
};

export function computeModularMatrix(
  masterSqft: number,
  factors: ModularFactors = DEFAULT_MODULAR_FACTORS,
  customPatternsList: TilePattern[] = PATTERNS_LIST
): PatternCoverageRow[] {
  const validSqft = Math.max(0, masterSqft || 0);

  return customPatternsList.map((p) => {
    let pcts = MODULAR_PATTERN_PERCENTAGES[p.code];
    if (!pcts) {
      const c600 = p.components.find((c) => c.sizeMm.includes('600 × 600') || c.sizeMm.includes('600X600'));
      const c300x600 = p.components.find((c) => c.sizeMm.includes('300 × 600') || c.sizeMm.includes('300X600'));
      const c300 = p.components.find((c) => c.sizeMm.includes('300 × 300') || c.sizeMm.includes('300X300'));
      pcts = {
        pct600x600: c600 ? c600.ratioPct : 0,
        pct300x600: c300x600 ? c300x600.ratioPct : 0,
        pct300x300: c300 ? c300.ratioPct : 0,
      };
    }

    const sqft600x600 = (validSqft * pcts.pct600x600) / 100;
    const sqft300x600 = (validSqft * pcts.pct300x600) / 100;
    const sqft300x300 = (validSqft * pcts.pct300x300) / 100;

    const boxes600x600Exact =
      pcts.pct600x600 > 0 && factors.sqft600x600 > 0
        ? sqft600x600 / factors.sqft600x600
        : 0;
    const boxes300x600Exact =
      pcts.pct300x600 > 0 && factors.sqft300x600 > 0
        ? sqft300x600 / factors.sqft300x600
        : 0;
    const boxes300x300Exact =
      pcts.pct300x300 > 0 && factors.sqft300x300 > 0
        ? sqft300x300 / factors.sqft300x300
        : 0;

    const totalBoxesExact =
      boxes600x600Exact + boxes300x600Exact + boxes300x300Exact;

    const boxes600x600Ceil = Math.ceil(boxes600x600Exact);
    const boxes300x600Ceil = Math.ceil(boxes300x600Exact);
    const boxes300x300Ceil = Math.ceil(boxes300x300Exact);
    const totalBoxesCeil =
      boxes600x600Ceil + boxes300x600Ceil + boxes300x300Ceil;

    return {
      code: p.code,
      name: p.name,
      subtitle: p.subtitle,
      pct600x600: pcts.pct600x600,
      pct300x600: pcts.pct300x600,
      pct300x300: pcts.pct300x300,
      sqft600x600,
      sqft300x600,
      sqft300x300,
      totalSqft: sqft600x600 + sqft300x600 + sqft300x300,
      boxes600x600Exact,
      boxes300x600Exact,
      boxes300x300Exact,
      totalBoxesExact,
      boxes600x600Ceil,
      boxes300x600Ceil,
      boxes300x300Ceil,
      totalBoxesCeil,
    };
  });
}
