import React, { useState } from 'react';
import { TilePattern } from '../types';
import {
  decompressBlueprintLayout,
  getDefaultFullGridLayout,
} from '../utils/blueprintCompression';
import {
  Grid,
  Table,
  Maximize2,
  X,
  Edit2,
  RotateCw,
  FileCode2,
} from 'lucide-react';

interface PatternDiagramProps {
  pattern: TilePattern;
  isAdmin?: boolean;
  onOpenBlueprintEditor?: () => void;
}

// Authentic Google Sheet benchmark data for P.1 through P.18
const GOOGLE_SHEET_BENCHMARKS: Record<
  string,
  {
    pct600: number;
    pct300x600: number;
    pct300: number;
    sqft600: string;
    sqft300x600: string;
    sqft300: string;
    boxes600: string;
    boxes300x600: string;
    boxes300: string;
    totalBoxes: string;
    typeLabel: string;
  }
> = {
  'P.1': {
    pct600: 44,
    pct300x600: 39,
    pct300: 17,
    sqft600: '1,320.00',
    sqft300x600: '1,170.00',
    sqft300: '510.00',
    boxes600: '113.60',
    boxes300x600: '151.95',
    boxes300: '76.23',
    totalBoxes: '341.78',
    typeLabel: '3-Size Modular Combo',
  },
  'P.2': {
    pct600: 44,
    pct300x600: 39,
    pct300: 17,
    sqft600: '1,320.00',
    sqft300x600: '1,170.00',
    sqft300: '510.00',
    boxes600: '113.60',
    boxes300x600: '151.95',
    boxes300: '76.23',
    totalBoxes: '341.78',
    typeLabel: '3-Size Opus Romano Variant',
  },
  'P.3': {
    pct600: 57,
    pct300x600: 23,
    pct300: 20,
    sqft600: '1,710.00',
    sqft300x600: '690.00',
    sqft300: '600.00',
    boxes600: '147.16',
    boxes300x600: '89.61',
    boxes300: '89.69',
    totalBoxes: '326.46',
    typeLabel: '600-Dominant Grand Grid',
  },
  'P.4': {
    pct600: 14,
    pct300x600: 63,
    pct300: 23,
    sqft600: '420.00',
    sqft300x600: '1,890.00',
    sqft300: '690.00',
    boxes600: '36.14',
    boxes300x600: '245.45',
    boxes300: '103.14',
    totalBoxes: '384.74',
    typeLabel: '300×600 Staggered Runner',
  },
  'P.5': {
    pct600: 41,
    pct300x600: 36,
    pct300: 23,
    sqft600: '1,230.00',
    sqft300x600: '1,080.00',
    sqft300: '690.00',
    boxes600: '105.85',
    boxes300x600: '140.26',
    boxes300: '103.14',
    totalBoxes: '349.25',
    typeLabel: 'Balanced Trio Mosaic',
  },
  'P.6': {
    pct600: 40,
    pct300x600: 44,
    pct300: 16,
    sqft600: '1,200.00',
    sqft300x600: '1,320.00',
    sqft300: '480.00',
    boxes600: '103.27',
    boxes300x600: '171.43',
    boxes300: '71.75',
    totalBoxes: '346.45',
    typeLabel: 'Dual-Offset Runner Combo',
  },
  'P.7': {
    pct600: 44,
    pct300x600: 39,
    pct300: 17,
    sqft600: '1,320.00',
    sqft300x600: '1,170.00',
    sqft300: '510.00',
    boxes600: '113.60',
    boxes300x600: '151.95',
    boxes300: '76.23',
    totalBoxes: '341.78',
    typeLabel: 'Triple Symmetry Paving',
  },
  'P.8': {
    pct600: 57,
    pct300x600: 30,
    pct300: 13,
    sqft600: '1,710.00',
    sqft300x600: '900.00',
    sqft300: '390.00',
    boxes600: '147.16',
    boxes300x600: '116.88',
    boxes300: '58.30',
    totalBoxes: '322.34',
    typeLabel: 'Grand Field with Square Anchors',
  },
  'P.9': {
    pct600: 41,
    pct300x600: 36,
    pct300: 23,
    sqft600: '1,230.00',
    sqft300x600: '1,080.00',
    sqft300: '690.00',
    boxes600: '105.85',
    boxes300x600: '140.26',
    boxes300: '103.14',
    totalBoxes: '349.25',
    typeLabel: 'Modern Trio Promenade',
  },
  'P.10': {
    pct600: 70,
    pct300x600: 30,
    pct300: 0,
    sqft600: '2,100.00',
    sqft300x600: '900.00',
    sqft300: '0.00',
    boxes600: '180.72',
    boxes300x600: '116.88',
    boxes300: '0.00',
    totalBoxes: '297.61',
    typeLabel: '2-Size Large Duo (600×600 + 300×600)',
  },
  'P.11': {
    pct600: 0,
    pct300x600: 76,
    pct300: 24,
    sqft600: '0.00',
    sqft300x600: '2,280.00',
    sqft300: '720.00',
    boxes600: '0.00',
    boxes300x600: '296.10',
    boxes300: '107.62',
    totalBoxes: '403.73',
    typeLabel: '2-Size Rectangular Runner (300×600 + 300×300)',
  },
  'P.12': {
    pct600: 0,
    pct300x600: 49,
    pct300: 51,
    sqft600: '0.00',
    sqft300x600: '1,470.00',
    sqft300: '1,530.00',
    boxes600: '0.00',
    boxes300x600: '190.91',
    boxes300: '228.70',
    totalBoxes: '419.61',
    typeLabel: '2-Size Half-and-Half (300×600 + 300×300)',
  },
  'P.13': {
    pct600: 45,
    pct300x600: 30,
    pct300: 25,
    sqft600: '1,350.00',
    sqft300x600: '900.00',
    sqft300: '750.00',
    boxes600: '116.18',
    boxes300x600: '116.88',
    boxes300: '112.11',
    totalBoxes: '345.17',
    typeLabel: 'Architectural Trio Matrix',
  },
  'P.14': {
    pct600: 62,
    pct300x600: 25,
    pct300: 13,
    sqft600: '1,860.00',
    sqft300x600: '750.00',
    sqft300: '390.00',
    boxes600: '160.07',
    boxes300x600: '97.40',
    boxes300: '58.30',
    totalBoxes: '315.77',
    typeLabel: 'Maximum Field Courtyard',
  },
  'P.15': {
    pct600: 56,
    pct300x600: 28,
    pct300: 16,
    sqft600: '1,680.00',
    sqft300x600: '840.00',
    sqft300: '480.00',
    boxes600: '144.58',
    boxes300x600: '109.09',
    boxes300: '71.75',
    totalBoxes: '325.42',
    typeLabel: 'Harmonious Trio Paving',
  },
  'P.16': {
    pct600: 0,
    pct300x600: 40,
    pct300: 60,
    sqft600: '0.00',
    sqft300x600: '1,200.00',
    sqft300: '1,800.00',
    boxes600: '0.00',
    boxes300x600: '155.84',
    boxes300: '269.06',
    totalBoxes: '424.90',
    typeLabel: 'Small-Scale Accent Grid (300×600 + 300×300)',
  },
  'P.17': {
    pct600: 0,
    pct300x600: 75,
    pct300: 25,
    sqft600: '0.00',
    sqft300x600: '2,250.00',
    sqft300: '750.00',
    boxes600: '0.00',
    boxes300x600: '292.21',
    boxes300: '112.11',
    totalBoxes: '404.32',
    typeLabel: 'Long Linear Accent (300×600 + 300×300)',
  },
  'P.18': {
    pct600: 0,
    pct300x600: 78,
    pct300: 22,
    sqft600: '0.00',
    sqft300x600: '2,340.00',
    sqft300: '660.00',
    boxes600: '0.00',
    boxes300x600: '303.90',
    boxes300: '98.65',
    totalBoxes: '402.55',
    typeLabel: 'Narrow Corridor Runner (300×600 + 300×300)',
  },
};

export const PatternDiagram: React.FC<PatternDiagramProps> = ({
  pattern,
  isAdmin = false,
  onOpenBlueprintEditor,
}) => {
  const pCode = pattern.code;

  const [activeView, setActiveView] = useState<'layout' | 'table'>(() => {
    return pattern.blueprintActiveTab === 'table' ? 'table' : 'layout';
  });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const hasCustomLayout =
    Boolean(pattern.compactBlueprintLayout) ||
    (Array.isArray(pattern.customBlueprintLayout) && pattern.customBlueprintLayout.length > 0);

  // Extract component percentages dynamically so custom/edited patterns work flawlessly
  const c600Comp = pattern.components.find((c) => c.sizeMm.includes('600 × 600') || c.sizeMm.includes('600X600'));
  const c300x600Comp = pattern.components.find((c) => c.sizeMm.includes('300 × 600') || c.sizeMm.includes('300X600'));
  const c300Comp = pattern.components.find((c) => c.sizeMm.includes('300 × 300') || c.sizeMm.includes('300X300'));

  const staticBm = GOOGLE_SHEET_BENCHMARKS[pCode];
  const pct600 = c600Comp ? c600Comp.ratioPct : staticBm?.pct600 ?? 0;
  const pct300x600 = c300x600Comp ? c300x600Comp.ratioPct : staticBm?.pct300x600 ?? 0;
  const pct300 = c300Comp ? c300Comp.ratioPct : staticBm?.pct300 ?? 0;

  // Full 10x8 Modular Grid blocks (uses compressed/custom layout or full 10x8 default layout)
  const activeGridBlocks = React.useMemo(() => {
    const decoded = decompressBlueprintLayout(
      pattern.compactBlueprintLayout,
      pattern.customBlueprintLayout
    );
    if (decoded.length > 0) return decoded;
    return getDefaultFullGridLayout(pCode, pct600, pct300x600, pct300);
  }, [
    pattern.compactBlueprintLayout,
    pattern.customBlueprintLayout,
    pCode,
    pct600,
    pct300x600,
    pct300,
  ]);

  const savedRotation = pattern.blueprintRotation ?? activeGridBlocks[0]?.gridRotation ?? 0;
  const savedStyle: 'color' | 'cad-bw' =
    pattern.blueprintStyle ?? activeGridBlocks[0]?.cadStyle ?? 'color';

  const [viewRotation, setViewRotation] = useState<number>(savedRotation);
  const [viewStyle, setViewStyle] = useState<'color' | 'cad-bw'>(savedStyle);

  React.useEffect(() => {
    setActiveView(pattern.blueprintActiveTab === 'table' ? 'table' : 'layout');
  }, [pattern.id, pattern.blueprintActiveTab]);

  React.useEffect(() => {
    setViewRotation(savedRotation);
    setViewStyle(savedStyle);
  }, [pattern.id, savedRotation, savedStyle, pattern.compactBlueprintLayout]);

  const sqft600 = staticBm && staticBm.pct600 === pct600
    ? staticBm.sqft600
    : ((3000 * pct600) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sqft300x600 = staticBm && staticBm.pct300x600 === pct300x600
    ? staticBm.sqft300x600
    : ((3000 * pct300x600) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sqft300 = staticBm && staticBm.pct300 === pct300
    ? staticBm.sqft300
    : ((3000 * pct300) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const f600 = c600Comp?.sqftPerBox || 11.62;
  const f300x600 = c300x600Comp?.sqftPerBox || 7.70;
  const f300 = c300Comp?.sqftPerBox || 6.69;

  const boxes600 = staticBm && staticBm.pct600 === pct600 && f600 === 11.62
    ? staticBm.boxes600
    : pct600 > 0 ? (((3000 * pct600) / 100) / f600).toFixed(2) : '0.00';
  const boxes300x600 = staticBm && staticBm.pct300x600 === pct300x600 && f300x600 === 7.70
    ? staticBm.boxes300x600
    : pct300x600 > 0 ? (((3000 * pct300x600) / 100) / f300x600).toFixed(2) : '0.00';
  const boxes300 = staticBm && staticBm.pct300 === pct300 && f300 === 6.69
    ? staticBm.boxes300
    : pct300 > 0 ? (((3000 * pct300) / 100) / f300).toFixed(2) : '0.00';

  const totalBoxes = staticBm && staticBm.pct600 === pct600 && f600 === 11.62 && f300x600 === 7.70 && f300 === 6.69
    ? staticBm.totalBoxes
    : (parseFloat(boxes600) + parseFloat(boxes300x600) + parseFloat(boxes300)).toFixed(2);

  const typeLabel = staticBm?.typeLabel || (
    pct600 === 0
      ? '2-Size (300×600 + 300×300)'
      : pct300 === 0
      ? '2-Size (600×600 + 300×600)'
      : '3-Size Modular Combo'
  );

  const benchmark = {
    pct600,
    pct300x600,
    pct300,
    sqft600,
    sqft300x600,
    sqft300,
    boxes600,
    boxes300x600,
    boxes300,
    totalBoxes,
    typeLabel,
  };

  // Colors matching factory technical standards
  const c600 = '#2563eb'; // Blue for 600x600
  const c300x600 = '#d97706'; // Amber for 300x600
  const c300 = '#059669'; // Emerald for 300x300

  const isCadBw = viewStyle === 'cad-bw';
  const tileOffsets = viewRotation !== 0 ? [-1, 0, 1] : [0];

  const renderSvgTiles = (keyPrefix: string) => {
    const CELL = 56;
    const W = 560;
    const H = 448;

    return tileOffsets.flatMap((ox) =>
      tileOffsets.flatMap((oy) =>
        activeGridBlocks.map((t) => {
          const isCenterCopy = ox === 0 && oy === 0;
          const x = t.x * CELL + ox * W + (isCadBw ? 0 : 1.5);
          const y = t.y * CELL + oy * H + (isCadBw ? 0 : 1.5);
          const w = t.widthUnits * CELL - (isCadBw ? 0 : 3);
          const h = t.heightUnits * CELL - (isCadBw ? 0 : 3);

          const is600 = t.sizeKey === '600';
          const is300 = t.sizeKey === '300';
          const isVert = t.sizeKey === '300x600_v';

          const fill = isCadBw
            ? '#ffffff'
            : is600
            ? '#2563eb'
            : is300
            ? '#059669'
            : isVert
            ? '#b45309'
            : '#d97706';
          const stroke = isCadBw
            ? '#262626'
            : is600
            ? '#60a5fa'
            : is300
            ? '#34d399'
            : '#fbbf24';

          const titleText = is600 ? '600×600' : is300 ? '300²' : '300×600';
          const subText = is600
            ? '600×600 mm'
            : is300
            ? '300×300 mm'
            : isVert
            ? '300×600 mm'
            : '600×300 mm';

          const tileRot = t.rotation || 0;
          const cx = x + w / 2;
          const cy = y + h / 2;

          return (
            <g
              key={`${keyPrefix}-${ox}-${oy}-${t.id}`}
              transform={tileRot ? `rotate(${tileRot} ${cx} ${cy})` : undefined}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={fill}
                fillOpacity={isCadBw ? '1' : '0.95'}
                stroke={stroke}
                strokeWidth={isCadBw ? '2.4' : '2'}
                rx={isCadBw ? '0' : '6'}
              />
              {!isCadBw && isCenterCopy && (
                <>
                  {is600 && (
                    <>
                      <text
                        x={cx}
                        y={cy - 3}
                        fill="#ffffff"
                        fontSize="14"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        {titleText}
                      </text>
                      <text
                        x={cx}
                        y={cy + 12}
                        fill="rgba(255,255,255,0.82)"
                        fontSize="9.5"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {subText}
                      </text>
                    </>
                  )}
                  {!is600 && !is300 && !isVert && (
                    <>
                      <text
                        x={cx}
                        y={cy - 2}
                        fill="#ffffff"
                        fontSize="12"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        {titleText}
                      </text>
                      <text
                        x={cx}
                        y={cy + 11}
                        fill="rgba(255,255,255,0.82)"
                        fontSize="8.5"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {subText}
                      </text>
                    </>
                  )}
                  {isVert && (
                    <>
                      <text
                        x={cx}
                        y={cy - 5}
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        300×600
                      </text>
                      <text
                        x={cx}
                        y={cy + 7}
                        fill="rgba(255,255,255,0.82)"
                        fontSize="7.5"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        300×600
                      </text>
                      <text
                        x={cx}
                        y={cy + 17}
                        fill="rgba(255,255,255,0.75)"
                        fontSize="7.5"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        mm
                      </text>
                    </>
                  )}
                  {is300 && (
                    <>
                      <text
                        x={cx}
                        y={cy - 3}
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        300²
                      </text>
                      <text
                        x={cx}
                        y={cy + 9}
                        fill="rgba(255,255,255,0.82)"
                        fontSize="7.2"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        300×300
                      </text>
                    </>
                  )}
                </>
              )}
            </g>
          );
        })
      )
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-700/70 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden shadow-xl text-white">
      {/* Blueprint Header */}
      <div className="w-full pb-2 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-extrabold text-[11px] font-mono border border-amber-500/30">
              {pCode}
            </span>
            <span className="font-bold text-slate-100 text-xs">Modular Blueprint & CAD</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onOpenBlueprintEditor && (
              <button
                type="button"
                onClick={onOpenBlueprintEditor}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
                title="Modify touch & drop layout or rotate Tile Palette"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Blueprint (Admin)</span>
              </button>
            )}
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              {benchmark.typeLabel}
            </span>
          </div>
        </div>

        {/* View Tabs & Quick Angle / CAD Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveView('layout')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                activeView === 'layout'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>Grid Layout</span>
              {hasCustomLayout && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Custom placed layout active" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                activeView === 'table'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3 h-3" />
              <span>Spec Table</span>
            </button>
          </div>

          {activeView === 'layout' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setViewRotation((prev) => (prev === 0 ? 45 : prev === 45 ? -45 : 0))
                }
                className={`px-2 py-1 rounded-md font-extrabold text-[10px] flex items-center gap-1 transition-all border ${
                  viewRotation !== 0
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Rotate Blueprint Angle (0° / 45° Diagonal / -45°)"
              >
                <RotateCw className="w-3 h-3" />
                <span>{viewRotation === 0 ? '0°' : `${viewRotation}° Diag`}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewStyle((prev) => (prev === 'color' ? 'cad-bw' : 'color'))}
                className={`px-2 py-1 rounded-md font-extrabold text-[10px] flex items-center gap-1 transition-all border ${
                  isCadBw
                    ? 'bg-white text-slate-950 border-white'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Switch between Color Blueprint and B&W CAD Line style"
              >
                <FileCode2 className="w-3 h-3" />
                <span>{isCadBw ? 'B&W CAD' : 'Color'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Enlarge Full Blueprint"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. FULL PROPORTIONAL 10x8 MODULAR GRID LAYOUT VIEW */}
      {activeView === 'layout' && (
        <div className="w-full my-2 flex flex-col items-center">
          <div
            onClick={() => setIsLightboxOpen(true)}
            title="Click to enlarge full modular layout"
            className={`w-full rounded-xl border-2 p-1.5 shadow-inner cursor-zoom-in overflow-hidden transition-colors ${
              isCadBw
                ? 'bg-white border-slate-400'
                : 'bg-slate-950 border-slate-700/90'
            }`}
          >
            <svg
              viewBox="0 0 560 448"
              className="w-full h-auto block select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id={`bp-clip-${pCode}`}>
                  <rect width="560" height="448" rx={isCadBw ? '0' : '6'} />
                </clipPath>
                <pattern
                  id={`bp-grid-${pCode}`}
                  width="56"
                  height="56"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 56 0 L 0 0 0 56"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.16)"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                </pattern>
              </defs>

              <g clipPath={`url(#bp-clip-${pCode})`}>
                <rect
                  width="560"
                  height="448"
                  fill={isCadBw ? '#ffffff' : '#020617'}
                  rx={isCadBw ? '0' : '6'}
                />
                {!isCadBw && (
                  <rect width="560" height="448" fill={`url(#bp-grid-${pCode})`} rx="6" />
                )}

                <g
                  transform={
                    viewRotation !== 0 ? `rotate(${viewRotation} 280 224)` : undefined
                  }
                >
                  {renderSvgTiles('card')}
                </g>
              </g>

              {/* Outer CAD frame border matching reference picture */}
              <rect
                x="1.2"
                y="1.2"
                width="557.6"
                height="445.6"
                fill="none"
                stroke={isCadBw ? '#262626' : 'rgba(148,163,184,0.35)'}
                strokeWidth={isCadBw ? '2.5' : '1.5'}
                rx={isCadBw ? '0' : '6'}
              />
            </svg>
          </div>
          <div className="w-full flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
            <span>
              Full 10×8 Modular Grid ({activeGridBlocks.length} tiles
              {viewRotation !== 0 ? ` • ${viewRotation}° Diagonal` : ''}
              {isCadBw ? ' • B&W CAD' : ''})
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full View</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. BENCHMARK SPECIFICATION TABLE PRIMARY VIEW */}
      {activeView === 'table' && (
        <div className="w-full my-2 bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs font-tabular">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] font-bold text-slate-300">
            <span>Google Sheet Specification Matrix</span>
            <span className="text-amber-400">Benchmark: 3,000 Sqft Base</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                <th className="py-1">Size</th>
                <th className="py-1 text-center">Share %</th>
                <th className="py-1 text-right">Sqft</th>
                <th className="py-1 text-right">Boxes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              <tr>
                <td className="py-1.5 text-blue-300 font-semibold">600×600 mm</td>
                <td className="py-1.5 text-center text-blue-400 font-bold">{benchmark.pct600}%</td>
                <td className="py-1.5 text-right text-slate-200">{benchmark.sqft600}</td>
                <td className="py-1.5 text-right font-extrabold text-blue-400">{benchmark.boxes600}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-amber-300 font-semibold">300×600 mm</td>
                <td className="py-1.5 text-center text-amber-400 font-bold">{benchmark.pct300x600}%</td>
                <td className="py-1.5 text-right text-slate-200">{benchmark.sqft300x600}</td>
                <td className="py-1.5 text-right font-extrabold text-amber-400">{benchmark.boxes300x600}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-emerald-300 font-semibold">300×300 mm</td>
                <td className="py-1.5 text-center text-emerald-400 font-bold">{benchmark.pct300}%</td>
                <td className="py-1.5 text-right text-slate-200">{benchmark.sqft300}</td>
                <td className="py-1.5 text-right font-extrabold text-emerald-400">{benchmark.boxes300}</td>
              </tr>
              <tr className="border-t-2 border-slate-700 font-extrabold text-white">
                <td className="py-1.5">Total</td>
                <td className="py-1.5 text-center text-amber-400">100%</td>
                <td className="py-1.5 text-right">3,000.00</td>
                <td className="py-1.5 text-right text-amber-400 text-sm font-black">{benchmark.totalBoxes}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Blueprint Legend with Color Chips */}
      {activeView !== 'table' && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-slate-800 text-[11px]">
          {benchmark.pct600 > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded border border-blue-500/40">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: c600 }} />
              <span className="text-slate-300">600×600 mm:</span>
              <span className="font-extrabold text-blue-400 font-tabular">{benchmark.pct600}%</span>
            </div>
          )}
          {benchmark.pct300x600 > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded border border-amber-500/40">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: c300x600 }} />
              <span className="text-slate-300">300×600 mm:</span>
              <span className="font-extrabold text-amber-400 font-tabular">{benchmark.pct300x600}%</span>
            </div>
          )}
          {benchmark.pct300 > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded border border-emerald-500/40">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: c300 }} />
              <span className="text-slate-300">300×300 mm:</span>
              <span className="font-extrabold text-emerald-400 font-tabular">{benchmark.pct300}%</span>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal for Full Resolution Grid Layout or B&W Blueprint */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700 relative space-y-3 cursor-default text-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-extrabold text-xs">
                  {pCode}
                </span>
                <h4 className="font-extrabold text-sm">
                  {pattern.name} — Full Modular Blueprint ({activeGridBlocks.length} Tiles
                  {viewRotation !== 0 ? ` • ${viewRotation}° Diagonal` : ''})
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setViewRotation((prev) => (prev === 0 ? 45 : prev === 45 ? -45 : 0))
                  }
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Angle: {viewRotation}°</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setViewStyle((prev) => (prev === 'color' ? 'cad-bw' : 'color'))
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 border border-slate-600"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>{isCadBw ? 'B&W CAD Line' : 'Color Blueprint'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div
              className={`max-h-[75vh] flex items-center justify-center overflow-auto rounded-xl p-3 border ${
                isCadBw
                  ? 'bg-white border-slate-300'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <svg
                viewBox="0 0 560 448"
                className="w-full max-w-[720px] h-auto block select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <clipPath id={`bp-lb-clip-${pCode}`}>
                    <rect width="560" height="448" rx={isCadBw ? '0' : '6'} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#bp-lb-clip-${pCode})`}>
                  <rect
                    width="560"
                    height="448"
                    fill={isCadBw ? '#ffffff' : '#020617'}
                    rx={isCadBw ? '0' : '6'}
                  />
                  <g
                    transform={
                      viewRotation !== 0 ? `rotate(${viewRotation} 280 224)` : undefined
                    }
                  >
                    {renderSvgTiles('lb')}
                  </g>
                </g>
                <rect
                  x="1.2"
                  y="1.2"
                  width="557.6"
                  height="445.6"
                  fill="none"
                  stroke={isCadBw ? '#262626' : 'rgba(148,163,184,0.35)'}
                  strokeWidth={isCadBw ? '2.5' : '1.5'}
                  rx={isCadBw ? '0' : '6'}
                />
              </svg>
            </div>
            {pattern.blueprintNotes && (
              <p className="text-xs text-amber-300/90 italic">Note: {pattern.blueprintNotes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
