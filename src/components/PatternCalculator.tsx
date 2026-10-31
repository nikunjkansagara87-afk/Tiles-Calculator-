import React, { useState, useMemo } from 'react';
import { QuotationLineItem, CompanyBrandConfig, TilePattern } from '../types';
import {
  PATTERNS_LIST,
  DEFAULT_MODULAR_FACTORS,
  ModularFactors,
  computeModularMatrix,
  PatternCoverageRow,
} from '../data/patterns';
import { PatternDiagram } from './PatternDiagram';
import { BlueprintEditorModal } from './BlueprintEditorModal';
import {
  formatINR,
  formatNumberIN,
  getRecommendedTruck,
  ACCENT_PALETTES,
  getCardContainerStyle,
  getTableHeaderClass,
  STORAGE_KEYS,
} from '../utils/formatters';
import { isMasterAdmin } from '../firebase';
import { User } from 'firebase/auth';
import {
  Table,
  Layers,
  Calculator,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Check,
  RotateCcw,
  Info,
  Sparkles,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Grid,
  Sliders,
  Edit2,
  PenTool,
} from 'lucide-react';

interface PatternCalculatorProps {
  brand: CompanyBrandConfig;
  patterns?: TilePattern[];
  currentUser?: User | null;
  onOpenPatternManager?: (patternId?: string) => void;
  onAddToQuotation: (item: QuotationLineItem) => void;
  onShowToast: (msg: string) => void;
  onSavePatternsToCloud?: (newPatterns: TilePattern[]) => Promise<boolean>;
  onUpdatePatterns?: (newPatterns: TilePattern[]) => void;
}

export const PatternCalculator: React.FC<PatternCalculatorProps> = ({
  brand,
  patterns = PATTERNS_LIST,
  currentUser = null,
  onOpenPatternManager,
  onAddToQuotation,
  onShowToast,
  onSavePatternsToCloud,
  onUpdatePatterns,
}) => {
  const isAdmin = isMasterAdmin(currentUser);
  const activePatterns = patterns && patterns.length > 0 ? patterns : PATTERNS_LIST;

  // Blueprint Studio Modal states
  const [showBlueprintEditor, setShowBlueprintEditor] = useState<boolean>(false);
  const [editingBlueprintPattern, setEditingBlueprintPattern] = useState<TilePattern | null>(null);

  // Navigation / View modes (P.1–P.18 Cards & Single Calculator)
  const [activeView, setActiveView] = useState<'cards' | 'single'>('cards');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('p1');

  // Master Area & Factor states (Factory standard defaults: 3,000 sqft, 11.62, 7.70, 6.69)
  const [masterSqft, setMasterSqft] = useState<number>(3000);
  const [factors, setFactors] = useState<ModularFactors>(DEFAULT_MODULAR_FACTORS);
  const [boxMode, setBoxMode] = useState<'exact' | 'ceil'>('exact');
  const [filterType, setFilterType] = useState<'all' | '3size' | '2size'>('all');

  // Single pattern specific controls
  const [wastagePct, setWastagePct] = useState<number>(5);
  const [rateBasis, setRateBasis] = useState<'box' | 'sqft'>('box');
  const [addedAll, setAddedAll] = useState<boolean>(false);
  const [componentOverrides, setComponentOverrides] = useState<
    Record<string, { sqftPerBox: number; weightPerBoxKg: number; rate: number }>
  >({});

  const accent = ACCENT_PALETTES[brand.accentColor || 'amber'] || ACCENT_PALETTES.amber;
  const cardStyle = getCardContainerStyle(brand);
  const tableHeaderClass = getTableHeaderClass(brand);

  // Computed matrix across all active patterns (P.1 to P.18 + any custom/uploaded patterns)
  const matrixRows = useMemo(() => {
    return computeModularMatrix(masterSqft, factors, activePatterns);
  }, [masterSqft, factors, activePatterns]);

  // Filtered rows for table / cards
  const filteredRows = useMemo(() => {
    return matrixRows.filter((r) => {
      const activeSizes = (r.pct600x600 > 0 ? 1 : 0) + (r.pct300x600 > 0 ? 1 : 0) + (r.pct300x300 > 0 ? 1 : 0);
      if (filterType === '3size') return activeSizes === 3;
      if (filterType === '2size') return activeSizes === 2;
      return true;
    });
  }, [matrixRows, filterType]);

  // Stats across patterns
  const stats = useMemo(() => {
    if (!matrixRows.length) return { minBoxes: 0, maxBoxes: 0, minCode: '', maxCode: '', avgBoxes: 0 };
    let minB = Infinity;
    let maxB = -Infinity;
    let minC = '';
    let maxC = '';
    let sum = 0;

    matrixRows.forEach((r) => {
      const val = boxMode === 'exact' ? r.totalBoxesExact : r.totalBoxesCeil;
      sum += val;
      if (val < minB) {
        minB = val;
        minC = r.code;
      }
      if (val > maxB) {
        maxB = val;
        maxC = r.code;
      }
    });

    return {
      minBoxes: minB,
      maxBoxes: maxB,
      minCode: minC,
      maxCode: maxC,
      avgBoxes: sum / matrixRows.length,
    };
  }, [matrixRows, boxMode]);

  // Current selected pattern for Single View
  const currentPattern = useMemo(() => {
    return (
      activePatterns.find((p) => p.id === selectedPatternId) ||
      activePatterns.find((p) => 'p' + p.code.replace('P.', '') === selectedPatternId) ||
      activePatterns[0]
    );
  }, [activePatterns, selectedPatternId]);

  const currentPatternIndex = activePatterns.findIndex((p) => p.id === currentPattern.id);

  // Save modified blueprint (touch-and-drop or B&W sketch) to pattern and Firestore
  const handleSaveBlueprintPattern = async (
    updatedPattern: TilePattern,
    publishToCloud?: boolean
  ): Promise<boolean | void> => {
    const updatedList = activePatterns.map((p) =>
      p.id === updatedPattern.id ? updatedPattern : p
    );

    if (onUpdatePatterns) {
      onUpdatePatterns(updatedList);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_PATTERNS, JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }

    if (publishToCloud && onSavePatternsToCloud) {
      return await onSavePatternsToCloud(updatedList);
    }
    return true;
  };

  // Single pattern calculations
  const validSingleBaseSqft = Math.max(0, masterSqft || 0);
  const validWastagePct = Math.max(0, wastagePct || 0);
  const wastageSqft = (validSingleBaseSqft * validWastagePct) / 100;
  const netSingleSqft = validSingleBaseSqft + wastageSqft;

  const getCompValues = (compIdx: number) => {
    const defaultComp = currentPattern.components[compIdx];
    const key = `${selectedPatternId}-${compIdx}`;
    const override = componentOverrides[key];

    // Align default sqftPerBox with active factors
    let defaultFactor = defaultComp.sqftPerBox;
    if (defaultComp.sizeMm.includes('600 × 600')) defaultFactor = factors.sqft600x600;
    else if (defaultComp.sizeMm.includes('300 × 600')) defaultFactor = factors.sqft300x600;
    else if (defaultComp.sizeMm.includes('300 × 300')) defaultFactor = factors.sqft300x300;

    return {
      sqftPerBox: override?.sqftPerBox ?? defaultFactor,
      weightPerBoxKg: override?.weightPerBoxKg ?? defaultComp.weightPerBoxKg,
      rate: override?.rate ?? defaultComp.rate,
    };
  };

  const handleUpdateComp = (
    compIdx: number,
    field: 'sqftPerBox' | 'weightPerBoxKg' | 'rate',
    val: number
  ) => {
    const key = `${selectedPatternId}-${compIdx}`;
    const current = getCompValues(compIdx);
    setComponentOverrides((prev) => ({
      ...prev,
      [key]: {
        ...current,
        [field]: val,
      },
    }));
  };

  let totalPatternAmount = 0;
  let totalPatternBoxes = 0;
  let totalPatternWeightKg = 0;
  let totalActualSqft = 0;

  const componentCalculations = currentPattern.components.map((comp, idx) => {
    const { sqftPerBox, weightPerBoxKg, rate } = getCompValues(idx);
    const targetSqft = (netSingleSqft * comp.ratioPct) / 100;
    const exactBoxes = targetSqft / (sqftPerBox || 1);
    const usedBoxes = boxMode === 'ceil' ? Math.ceil(exactBoxes) : exactBoxes;
    const actualSqft = usedBoxes * sqftPerBox;
    const weightKg = usedBoxes * weightPerBoxKg;

    let lineAmount = 0;
    if (rateBasis === 'box') {
      lineAmount = usedBoxes * rate;
    } else {
      lineAmount = actualSqft * rate;
    }

    totalPatternAmount += lineAmount;
    totalPatternBoxes += boxMode === 'ceil' ? usedBoxes : Math.round(usedBoxes * 100) / 100;
    totalPatternWeightKg += weightKg;
    totalActualSqft += actualSqft;

    return {
      ...comp,
      sqftPerBox,
      weightPerBoxKg,
      rate,
      targetSqft,
      exactBoxes,
      usedBoxes,
      actualSqft,
      weightKg,
      lineAmount,
    };
  });

  const truckAdvice = getRecommendedTruck(totalPatternWeightKg);

  // Add a specific pattern to the quotation
  const handleAddPatternToQuotation = (patternToQuote: TilePattern, targetAreaSqft: number) => {
    patternToQuote.components.forEach((item) => {
      let factor = item.sqftPerBox;
      if (item.sizeMm.includes('600 × 600')) factor = factors.sqft600x600;
      else if (item.sizeMm.includes('300 × 600')) factor = factors.sqft300x600;
      else if (item.sizeMm.includes('300 × 300')) factor = factors.sqft300x300;

      const sizeSqft = (targetAreaSqft * item.ratioPct) / 100;
      const exactBoxes = sizeSqft / (factor || 1);
      const usedBoxes = boxMode === 'ceil' ? Math.ceil(exactBoxes) : Math.round(exactBoxes * 100) / 100;
      const actualSqft = usedBoxes * factor;
      const weightKg = usedBoxes * item.weightPerBoxKg;
      const amount = usedBoxes * item.rate;

      const quoteItem: QuotationLineItem = {
        id: 'pat-item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: `Pattern ${patternToQuote.code} - ${item.sizeMm} (${item.ratioPct}%)`,
        sizeMm: item.sizeMm,
        source: 'pattern',
        patternCode: patternToQuote.code,
        boxQty: boxMode === 'ceil' ? Math.ceil(usedBoxes) : Math.round(usedBoxes * 100) / 100,
        sqftPerBox: factor,
        totalSqft: Math.round(actualSqft * 100) / 100,
        weightPerBoxKg: item.weightPerBoxKg,
        totalWeightKg: Math.round(weightKg * 100) / 100,
        rateBasis: 'box',
        unitRate: item.rate,
        amount: Math.round(amount * 100) / 100,
        notes: `Factory Modular Pattern ${patternToQuote.code} (${item.ratioPct}% area share)`,
      };
      onAddToQuotation(quoteItem);
    });

    onShowToast(`Added all sizes for ${patternToQuote.code} (${targetAreaSqft.toLocaleString()} Sqft) to Quotation!`);
  };

  const handleAddCurrentToQuotation = () => {
    componentCalculations.forEach((item) => {
      const quoteItem: QuotationLineItem = {
        id: 'pat-item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: `Pattern ${currentPattern.code} - ${item.sizeMm} (${item.ratioPct}%)`,
        sizeMm: item.sizeMm,
        source: 'pattern',
        patternCode: currentPattern.code,
        boxQty: boxMode === 'ceil' ? Math.ceil(item.usedBoxes) : Math.round(item.usedBoxes * 100) / 100,
        sqftPerBox: item.sqftPerBox,
        totalSqft: Math.round(item.actualSqft * 100) / 100,
        weightPerBoxKg: item.weightPerBoxKg,
        totalWeightKg: Math.round(item.weightKg * 100) / 100,
        rateBasis,
        unitRate: item.rate,
        amount: Math.round(item.lineAmount * 100) / 100,
        notes: `Modular layout component for ${currentPattern.name}`,
      };
      onAddToQuotation(quoteItem);
    });

    setAddedAll(true);
    setTimeout(() => setAddedAll(false), 2000);
    onShowToast(`Added all ${componentCalculations.length} sizes of ${currentPattern.code} to Quotation!`);
  };

  // Export Master Matrix to CSV matching user's spreadsheet structure
  const handleExportCSV = () => {
    let csv = `Master Total Sqft,${masterSqft},Box Coverage Factors (Sqft/Box),,,,,,,,,\n`;
    csv += `,,,600X600 mm,,${factors.sqft600x600},,,,,,,\n`;
    csv += `,,,300X600 mm,,${factors.sqft300x600},,,,,,,\n`;
    csv += `,,,300X300 mm,,${factors.sqft300x300},,,,,,,\n`;
    csv += `,,,,,,,,,,,,\n`;
    csv += `Pattern,600x600 %,300x600 %,300x300 %,600x600 Sqft,300x600 Sqft,300x300 Sqft,Total Sqft,600x600 Boxes,300x600 Boxes,300x300 Boxes,Total Boxes\n`;

    matrixRows.forEach((r) => {
      const b600 = boxMode === 'exact' ? r.boxes600x600Exact.toFixed(2) : r.boxes600x600Ceil;
      const b300x600 = boxMode === 'exact' ? r.boxes300x600Exact.toFixed(2) : r.boxes300x600Ceil;
      const b300 = boxMode === 'exact' ? r.boxes300x300Exact.toFixed(2) : r.boxes300x300Ceil;
      const bTotal = boxMode === 'exact' ? r.totalBoxesExact.toFixed(2) : r.totalBoxesCeil;

      csv += `${r.code},${r.pct600x600}%,${r.pct300x600}%,${r.pct300x300}%,"${r.sqft600x600.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}","${r.sqft300x600.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}","${r.sqft300x300.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}","${r.totalSqft.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}",${b600},${b300x600},${b300},${bTotal}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tile_Pattern_Coverage_Calculator_P1_to_P18_${masterSqft}sqft.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Exported P.1 to P.18 Master Matrix to CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Master Area & Factory Coverage Factors */}
      <div className={`${cardStyle.className} p-4 sm:p-5 space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md ${accent.badgeBg} ${accent.badgeText} font-extrabold text-xs`}>
                Morbi Factory Standard
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Tile Pattern Coverage Calculator (P.1 through P.18)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authentic factory specification matrix across 18 modular interlocking paving designs.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start lg:self-auto">
            <button
              onClick={() => setActiveView('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'cards'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>P.1–P.18 Cards</span>
            </button>
            <button
              onClick={() => setActiveView('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'single'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Single Calculator</span>
            </button>
          </div>
        </div>

        {/* Global Controls: Master Total Sqft + Factors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
          {/* Master Sqft */}
          <div className="lg:col-span-2 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-3 rounded-xl border border-amber-300/80">
            <label className="block text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">
              Master Total Sqft
            </label>
            <div className="mt-1 relative">
              <input
                type="number"
                value={masterSqft || ''}
                min="1"
                step="any"
                onChange={(e) => setMasterSqft(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border-2 border-amber-500 bg-white font-extrabold text-slate-900 text-base focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-amber-800">
                Sqft
              </span>
            </div>
            <p className="text-[10px] text-amber-800/80 mt-1 font-medium">
              Updates all 18 patterns simultaneously
            </p>
          </div>

          {/* Factor 600x600 */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                600×600 mm
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Sqft/Box</span>
            </div>
            <input
              type="number"
              value={factors.sqft600x600}
              step="0.01"
              onChange={(e) =>
                setFactors((f) => ({ ...f, sqft600x600: parseFloat(e.target.value) || 0 }))
              }
              className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Std: 11.62 (4 pcs / 1.44 m²)</p>
          </div>

          {/* Factor 300x600 */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                300×600 mm
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Sqft/Box</span>
            </div>
            <input
              type="number"
              value={factors.sqft300x600}
              step="0.01"
              onChange={(e) =>
                setFactors((f) => ({ ...f, sqft300x600: parseFloat(e.target.value) || 0 }))
              }
              className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Std: 7.70 (4 pcs / 0.72 m²)</p>
          </div>

          {/* Factor 300x300 */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                300×300 mm
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Sqft/Box</span>
            </div>
            <input
              type="number"
              value={factors.sqft300x300}
              step="0.01"
              onChange={(e) =>
                setFactors((f) => ({ ...f, sqft300x300: parseFloat(e.target.value) || 0 }))
              }
              className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Std: 6.69 (7 pcs / 0.63 m²)</p>
          </div>

          {/* Box Mode & Reset */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-700 block">Box Display</span>
              <select
                value={boxMode}
                onChange={(e) => setBoxMode(e.target.value as 'exact' | 'ceil')}
                className="w-full mt-1.5 px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 text-xs outline-none"
              >
                <option value="exact">Exact Decimals (e.g. 113.60)</option>
                <option value="ceil">Full Boxes / Ceil (e.g. 114)</option>
              </select>
            </div>
            <button
              onClick={() => setFactors(DEFAULT_MODULAR_FACTORS)}
              className="mt-2 text-[11px] text-slate-500 hover:text-amber-600 flex items-center gap-1 font-semibold transition-colors"
              title="Reset factors to 11.62, 7.70, 6.69"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Std Factors</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-500">
              Coverage for <b className="text-slate-900 font-tabular">{masterSqft.toLocaleString()} Sqft</b>:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              Lowest Boxes: {stats.minCode} ({stats.minBoxes.toFixed(2)} Boxes)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-bold">
              Highest Boxes: {stats.maxCode} ({stats.maxBoxes.toFixed(2)} Boxes)
            </span>
            <span className="text-slate-500 hidden sm:inline">
              Avg: <b className="font-tabular text-slate-700">{stats.avgBoxes.toFixed(1)} Boxes</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onOpenPatternManager && (
              <button
                onClick={() => onOpenPatternManager()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-sm transition-all"
                title="Admin: Upload new patterns and edit existing patterns"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>⚙️ Upload & Edit Patterns</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: P.1 to P.18 GRID CARDS */}
      {activeView === 'cards' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Grid className="w-4 h-4 text-amber-500" />
                <span>P.1 to P.18 Modular Breakdown Cards</span>
              </h3>
              <p className="text-xs text-slate-500">
                Individual pattern breakdown cards for <b>{masterSqft.toLocaleString()} Sqft</b>.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({matrixRows.length})
              </button>
              <button
                onClick={() => setFilterType('3size')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterType === '3size' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                3-Size Combos
              </button>
              <button
                onClick={() => setFilterType('2size')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterType === '2size' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                2-Size Combos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRows.map((r) => {
              const fullPatternObj = activePatterns.find((p) => p.code === r.code) || activePatterns[0] || PATTERNS_LIST[0];
              const b600 = boxMode === 'exact' ? r.boxes600x600Exact.toFixed(2) : r.boxes600x600Ceil;
              const b300x600 = boxMode === 'exact' ? r.boxes300x600Exact.toFixed(2) : r.boxes300x600Ceil;
              const b300 = boxMode === 'exact' ? r.boxes300x300Exact.toFixed(2) : r.boxes300x300Ceil;
              const bTotal = boxMode === 'exact' ? r.totalBoxesExact.toFixed(2) : r.totalBoxesCeil;

              return (
                <div
                  key={r.code}
                  className={`${cardStyle.className} p-3.5 hover:shadow-md transition-shadow space-y-2.5 border border-slate-200`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded font-extrabold text-xs bg-amber-600 text-white">
                        {r.code}
                      </span>
                      <span className="font-extrabold text-slate-900 text-xs truncate max-w-[150px]">
                        {r.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isAdmin && onOpenPatternManager && (
                        <button
                          onClick={() => onOpenPatternManager(fullPatternObj.id)}
                          className="text-[10px] text-slate-500 hover:text-amber-800 font-bold flex items-center gap-0.5 bg-slate-100 hover:bg-amber-100 px-1.5 py-0.5 rounded"
                          title="Edit pattern"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedPatternId(fullPatternObj.id);
                          setActiveView('single');
                        }}
                        className="text-[10px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-0.5"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* 4-column sub-table matching user sheet */}
                  <table className="w-full text-[11px] font-tabular">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-100 text-[10px] uppercase">
                        <th className="text-left font-bold py-1">Size</th>
                        <th className="text-center font-bold py-1">%</th>
                        <th className="text-right font-bold py-1">Sqft</th>
                        <th className="text-right font-bold py-1">Boxes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-1 font-semibold text-blue-900">600×600</td>
                        <td className="py-1 text-center font-bold text-slate-700">{r.pct600x600}%</td>
                        <td className="py-1 text-right text-slate-700">{formatNumberIN(r.sqft600x600, 2)}</td>
                        <td className="py-1 text-right font-extrabold text-blue-900">{r.pct600x600 > 0 ? b600 : '0.00'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-amber-900">300×600</td>
                        <td className="py-1 text-center font-bold text-slate-700">{r.pct300x600}%</td>
                        <td className="py-1 text-right text-slate-700">{formatNumberIN(r.sqft300x600, 2)}</td>
                        <td className="py-1 text-right font-extrabold text-amber-900">{r.pct300x600 > 0 ? b300x600 : '0.00'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-emerald-900">300×300</td>
                        <td className="py-1 text-center font-bold text-slate-700">{r.pct300x300}%</td>
                        <td className="py-1 text-right text-slate-700">{formatNumberIN(r.sqft300x300, 2)}</td>
                        <td className="py-1 text-right font-extrabold text-emerald-900">{r.pct300x300 > 0 ? b300 : '0.00'}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                        <td className="py-1.5 text-slate-900">Total</td>
                        <td className="py-1.5 text-center text-slate-500">—</td>
                        <td className="py-1.5 text-right text-slate-900">{formatNumberIN(r.totalSqft, 2)}</td>
                        <td className="py-1.5 text-right text-amber-700 font-black">{bTotal}</td>
                      </tr>
                    </tbody>
                  </table>

                  <button
                    onClick={() => handleAddPatternToQuotation(fullPatternObj, masterSqft)}
                    className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add {r.code} to Quotation</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: SINGLE PATTERN DETAILED CALCULATOR & BILL GENERATOR */}
      {activeView === 'single' && (
        <div className="space-y-6">
          <div className={`${cardStyle.className} p-4 sm:p-5 space-y-4`}>
            {/* Pattern Navigator & Stepper */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPatternIndex <= 0}
                  onClick={() => {
                    const prev = activePatterns[currentPatternIndex - 1];
                    if (prev) setSelectedPatternId(prev.id);
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700"
                  title="Previous Pattern"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-600 text-white font-black text-sm">
                    {currentPattern.code}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight flex items-center gap-2">
                      <span>{currentPattern.name}</span>
                      {isAdmin && onOpenPatternManager && (
                        <button
                          onClick={() => onOpenPatternManager(currentPattern.id)}
                          className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Edit this pattern ratios and details"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500">{currentPattern.subtitle}</p>
                  </div>
                </div>
                <button
                  disabled={currentPatternIndex >= activePatterns.length - 1}
                  onClick={() => {
                    const next = activePatterns[currentPatternIndex + 1];
                    if (next) setSelectedPatternId(next.id);
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700"
                  title="Next Pattern"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Fast dropdown switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 hidden md:inline">Jump to:</span>
                <select
                  value={selectedPatternId}
                  onChange={(e) => setSelectedPatternId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-extrabold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {activePatterns.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setActiveView('cards')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>All P.1–P.18 Cards</span>
                </button>
              </div>
            </div>

            {/* Inputs: Target Sqft, Wastage, Rates Mode */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Base Area to Tile
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    value={masterSqft || ''}
                    min="1"
                    step="any"
                    onChange={(e) => setMasterSqft(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-extrabold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                    Sqft
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  Wastage Allowance
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    value={wastagePct || ''}
                    min="0"
                    max="50"
                    step="0.5"
                    onChange={(e) => setWastagePct(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-extrabold text-amber-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-amber-700">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  +{formatNumberIN(wastageSqft, 2)} Sqft buffer
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                  Net Billing Sqft
                </label>
                <div className="mt-1 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 font-black text-emerald-900 text-sm font-tabular">
                  {formatNumberIN(netSingleSqft, 2)} Sqft
                </div>
                <p className="text-[10px] text-emerald-700 mt-0.5">Base + Wastage buffer</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Quotation Pricing Basis
                </label>
                <select
                  value={rateBasis}
                  onChange={(e) => setRateBasis(e.target.value as 'box' | 'sqft')}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="box">Rate per Box (₹/Box)</option>
                  <option value="sqft">Rate per Sqft (₹/Sqft)</option>
                </select>
              </div>
            </div>

            {/* Layout Schematic Diagram & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
              <div className="lg:col-span-5">
                <PatternDiagram
                  pattern={currentPattern}
                  isAdmin={isAdmin}
                  onOpenBlueprintEditor={() => {
                    setEditingBlueprintPattern(currentPattern);
                    setShowBlueprintEditor(true);
                  }}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col justify-between space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {currentPattern.code}: {currentPattern.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {currentPattern.description}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-400 block font-bold">TOTAL BOXES</span>
                    <span className="font-extrabold text-amber-600 text-sm font-tabular">
                      {boxMode === 'ceil' ? totalPatternBoxes : totalPatternBoxes.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-400 block font-bold">TOTAL WEIGHT</span>
                    <span className="font-extrabold text-slate-900 text-sm font-tabular">
                      {(totalPatternWeightKg / 1000).toFixed(2)} Tons
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-400 block font-bold">ESTIMATED VALUE</span>
                    <span className="font-extrabold text-emerald-600 text-sm font-tabular">
                      {formatINR(totalPatternAmount)}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚚</span>
                    <div>
                      <span className="font-bold text-amber-950">
                        {truckAdvice.recommended.type}
                      </span>
                      <p className="text-[11px] text-amber-800">
                        {truckAdvice.fits
                          ? `${truckAdvice.loadPct}% payload utilized (${(totalPatternWeightKg / 1000).toFixed(2)} / ${truckAdvice.recommended.capacityTons}T)`
                          : `Exceeds single truck limit (${truckAdvice.loadPct}%), multi-vehicle dispatch recommended`}
                      </p>
                    </div>
                  </div>
                  {(isAdmin || brand.hideQuotationForUsers === false) && (
                    <button
                      onClick={handleAddCurrentToQuotation}
                      disabled={addedAll}
                      className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                        addedAll
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {addedAll ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add All Sizes to Quote</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Individual Component Breakdown & Custom Calibration Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Component Tile Formats & Price Configuration
                </h4>
                <span className="text-[11px] text-slate-400">
                  You can calibrate rates, packing factor, and weight per size
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="py-2 px-3 text-left">Tile Format</th>
                      <th className="py-2 px-2 text-center">Share (%)</th>
                      <th className="py-2 px-2 text-right">Target Sqft</th>
                      <th className="py-2 px-2 text-center">Sqft/Box Factor</th>
                      <th className="py-2 px-2 text-right">Boxes ({boxMode})</th>
                      <th className="py-2 px-2 text-right">Actual Sqft</th>
                      <th className="py-2 px-2 text-right">Wt/Box (Kg)</th>
                      <th className="py-2 px-2 text-right">Total Wt (Kg)</th>
                      <th className="py-2 px-2 text-right">Rate (₹)</th>
                      <th className="py-2 px-3 text-right">Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-tabular">
                    {componentCalculations.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.sizeMm}</div>
                          <div className="text-[10px] text-slate-400">{item.inches}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-amber-700">
                          {item.ratioPct}%
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium text-slate-700">
                          {formatNumberIN(item.targetSqft, 2)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            value={item.sqftPerBox}
                            step="0.01"
                            onChange={(e) =>
                              handleUpdateComp(idx, 'sqftPerBox', parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-1.5 py-1 text-center font-bold border border-slate-300 rounded bg-white text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right font-black text-amber-600 text-sm">
                          {boxMode === 'ceil' ? item.usedBoxes : item.usedBoxes.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium text-slate-700">
                          {formatNumberIN(item.actualSqft, 2)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            value={item.weightPerBoxKg}
                            step="0.5"
                            onChange={(e) =>
                              handleUpdateComp(idx, 'weightPerBoxKg', parseFloat(e.target.value) || 0)
                            }
                            className="w-14 px-1 py-1 text-right font-bold border border-slate-300 rounded bg-white text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium text-slate-600">
                          {formatNumberIN(item.weightKg, 1)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            value={item.rate}
                            step="1"
                            onChange={(e) =>
                              handleUpdateComp(idx, 'rate', parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-1.5 py-1 text-right font-bold border border-slate-300 rounded bg-white text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 text-xs">
                          {formatINR(item.lineAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                      <td className="py-2.5 px-3">Total Combined</td>
                      <td className="py-2.5 px-2 text-center text-amber-700">100%</td>
                      <td className="py-2.5 px-2 text-right">{formatNumberIN(netSingleSqft, 2)}</td>
                      <td className="py-2.5 px-2 text-center">—</td>
                      <td className="py-2.5 px-2 text-right text-amber-700 font-black text-sm">
                        {boxMode === 'ceil' ? totalPatternBoxes : totalPatternBoxes.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-right">{formatNumberIN(totalActualSqft, 2)}</td>
                      <td className="py-2.5 px-2 text-right">—</td>
                      <td className="py-2.5 px-2 text-right">
                        {(totalPatternWeightKg / 1000).toFixed(2)} T
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-500">—</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 text-sm font-black">
                        {formatINR(totalPatternAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modular Blueprint Studio & Touch-and-Drop / Scratch Modal */}
      {showBlueprintEditor && editingBlueprintPattern && (
        <BlueprintEditorModal
          isOpen={showBlueprintEditor}
          onClose={() => {
            setShowBlueprintEditor(false);
            setEditingBlueprintPattern(null);
          }}
          pattern={editingBlueprintPattern}
          currentUser={currentUser}
          onSavePattern={handleSaveBlueprintPattern}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
