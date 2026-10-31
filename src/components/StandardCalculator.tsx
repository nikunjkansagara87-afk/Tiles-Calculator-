import React, { useState } from 'react';
import { TileSize, QuotationLineItem, CompanyBrandConfig } from '../types';
import {
  formatINR,
  formatNumberIN,
  sqftToSqm,
  SQFT_PER_SQM,
  ACCENT_PALETTES,
  getCardContainerStyle,
  getTableHeaderClass,
} from '../utils/formatters';
import {
  Plus,
  Search,
  Check,
  Layers,
  SlidersHorizontal,
  Lock,
  Edit3,
  Trash2,
  Crown,
  ShieldAlert,
  CloudUpload,
  RotateCcw,
  LogIn,
  X,
  AlertTriangle,
  Calculator,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { isMasterAdmin, MASTER_ADMIN_EMAIL } from '../firebase';

interface StandardCalculatorProps {
  brand: CompanyBrandConfig;
  tiles: TileSize[];
  currentUser: User | null;
  onLogin: () => void;
  onUpdateTiles: (tiles: TileSize[]) => void;
  onSaveTilesToCloud?: (tiles: TileSize[]) => Promise<boolean>;
  onResetTilesToDefault?: () => void;
  onAddToQuotation: (item: QuotationLineItem) => void;
  onShowToast: (msg: string) => void;
}

const STANDARD_CATEGORIES = [
  'Vitrified / Porcelain Floor',
  'GVT / PGVT Glazed Vitrified',
  'Grand Large Slab (9mm)',
  'Mega Luxury Slab',
  'Double Charge / Vitrified Floor',
  'Digital Ceramic Wall',
  'Parking / Heavy Duty',
  'Wood Plank',
];

const QUICK_SIZE_PRESETS = [
  { label: '600 × 600 (4 pcs)', w: 600, l: 600, pcs: 4 },
  { label: '600 × 1200 (2 pcs)', w: 600, l: 1200, pcs: 2 },
  { label: '800 × 1600 (2 pcs)', w: 800, l: 1600, pcs: 2 },
  { label: '1200 × 1800 (2 pcs)', w: 1200, l: 1800, pcs: 2 },
  { label: '1200 × 2400 (1 pc)', w: 1200, l: 2400, pcs: 1 },
  { label: '300 × 600 (8 pcs)', w: 300, l: 600, pcs: 8 },
  { label: '800 × 800 (3 pcs)', w: 800, l: 800, pcs: 3 },
  { label: '200 × 1200 (6 pcs)', w: 200, l: 1200, pcs: 6 },
];

export const StandardCalculator: React.FC<StandardCalculatorProps> = ({
  brand,
  tiles,
  currentUser,
  onLogin,
  onUpdateTiles,
  onSaveTilesToCloud,
  onResetTilesToDefault,
  onAddToQuotation,
  onShowToast,
}) => {
  const isAdmin = isMasterAdmin(currentUser);

  const [baseSqft, setBaseSqft] = useState<number>(500);
  const [wastagePct, setWastagePct] = useState<number>(0);
  const [rateBasis, setRateBasis] = useState<'box' | 'sqft'>('sqft');
  const [gstPct, setGstPct] = useState<number>(18);
  const [insPct, setInsPct] = useState<number>(0.5);
  const [transMode, setTransMode] = useState<'percent' | 'ton'>(() => {
    try {
      const saved = localStorage.getItem('morbi_trans_mode');
      if (saved === 'ton' || saved === 'percent') return saved;
    } catch (e) {}
    return 'percent';
  });
  const [transPct, setTransPct] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morbi_trans_pct');
      if (saved !== null) return parseFloat(saved) || 0;
    } catch (e) {}
    return 3;
  });
  const [transPerTon, setTransPerTon] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morbi_trans_per_ton');
      if (saved !== null) return parseFloat(saved) || 0;
    } catch (e) {}
    return 1000;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const accent = ACCENT_PALETTES[brand.accentColor || 'amber'] || ACCENT_PALETTES.amber;
  const cardStyle = getCardContainerStyle(brand);
  const tableHeaderClass = getTableHeaderClass(brand);

  // Local tile rate state for inputs (default 0)
  const [tileRates, setTileRates] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    tiles.forEach((t) => {
      initial[t.id] = t.isCustom ? (t.defaultRate || 0) : 0;
    });
    return initial;
  });

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authActionContext, setAuthActionContext] = useState<string>('edit');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingTile, setEditingTile] = useState<TileSize | null>(null);
  const [deletingTile, setDeletingTile] = useState<TileSize | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Add Tile Modal State (Universal Auto Calculation using: (((width*length)/1000000)*Pic in Box)*10.764)
  const [addWidthMm, setAddWidthMm] = useState<number>(600);
  const [addLengthMm, setAddLengthMm] = useState<number>(600);
  const [addPicInBox, setAddPicInBox] = useState<number>(4);
  const [addCategory, setAddCategory] = useState<string>(STANDARD_CATEGORIES[0]);
  const [addCustomWt, setAddCustomWt] = useState<string>('');
  const [addRate, setAddRate] = useState<number>(0);

  // Edit Tile Form state
  const [editName, setEditName] = useState<string>('');
  const [editInches, setEditInches] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editPcs, setEditPcs] = useState<number>(4);
  const [editSqft, setEditSqft] = useState<number>(15.5);
  const [editWt, setEditWt] = useState<number>(28);
  const [editRate, setEditRate] = useState<number>(0);

  // Calculations
  const validBaseSqft = Math.max(0, baseSqft || 0);
  const validWastagePct = Math.max(0, wastagePct || 0);
  const wastageSqft = (validBaseSqft * validWastagePct) / 100;
  const netSqft = validBaseSqft + wastageSqft;
  const netSqm = sqftToSqm(netSqft);

  const categories = ['all', ...Array.from(new Set(tiles.map((t) => t.category)))];

  const filteredTiles = tiles.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.inches.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleRateChange = (tileId: string, val: number) => {
    setTileRates((prev) => ({ ...prev, [tileId]: val }));
  };

  const handleTransModeChange = (mode: 'percent' | 'ton') => {
    setTransMode(mode);
    try {
      localStorage.setItem('morbi_trans_mode', mode);
    } catch (e) {}
  };

  const handleTransPctChange = (val: number) => {
    setTransPct(val);
    try {
      localStorage.setItem('morbi_trans_pct', String(val));
    } catch (e) {}
  };

  const handleTransPerTonChange = (val: number) => {
    setTransPerTon(val);
    try {
      localStorage.setItem('morbi_trans_per_ton', String(val));
    } catch (e) {}
  };

  const handleAddRowToQuote = (tile: TileSize) => {
    const boxSqft = tile.sqftPerBox || 1;
    const exactBoxes = netSqft / boxSqft;
    const reqBoxes = Math.ceil(exactBoxes);
    const actualSqft = reqBoxes * boxSqft;
    const totalWtKg = reqBoxes * (tile.weightPerBoxKg || 0);
    const rate = tileRates[tile.id] ?? tile.defaultRate ?? 0;

    let amount = 0;
    if (rateBasis === 'box') {
      amount = reqBoxes * rate;
    } else {
      amount = actualSqft * rate;
    }

    const item: QuotationLineItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: `${tile.name} (${tile.category})`,
      sizeMm: tile.name,
      source: 'standard',
      boxQty: reqBoxes,
      sqftPerBox: tile.sqftPerBox,
      totalSqft: Math.round(actualSqft * 100) / 100,
      weightPerBoxKg: tile.weightPerBoxKg,
      totalWeightKg: Math.round(totalWtKg * 100) / 100,
      rateBasis,
      unitRate: rate,
      amount: Math.round(amount * 100) / 100,
    };

    onAddToQuotation(item);
    setAddedItemIds((prev) => ({ ...prev, [tile.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [tile.id]: false }));
    }, 1500);

    onShowToast(`Added ${tile.name} (${reqBoxes} boxes) to Quotation`);
  };

  // Universal Auto Calculation Formula: (((width * length) / 1000000) * Pic in Box) * 10.764
  const parsedWidth = Math.max(0, addWidthMm || 0);
  const parsedLength = Math.max(0, addLengthMm || 0);
  const parsedPicInBox = Math.max(1, addPicInBox || 1);

  // Sqm per box: ((width * length) / 1000000) * picInBox
  const autoSqmPerBox = ((parsedWidth * parsedLength) / 1000000) * parsedPicInBox;
  // Sqft per box with exact requested formula: (((width * length) / 1000000) * picInBox) * 10.764
  const autoSqftPerBox = Math.round(autoSqmPerBox * 10.764 * 100) / 100;
  // Single piece stats
  const singleTileSqm = (parsedWidth * parsedLength) / 1000000;
  const singleTileSqft = Math.round(singleTileSqm * 10.764 * 100) / 100;
  // Universal auto naming & inches
  const autoTileName = `${parsedWidth} × ${parsedLength} mm`;
  const autoInches = `${Math.round(parsedWidth / 25.4)}" × ${Math.round(parsedLength / 25.4)}"`;
  // Auto weight estimate (~19.5 kg/sqm for Morbi vitrified tiles)
  const autoWeightEst = Math.round(autoSqmPerBox * 19.5 * 10) / 10;
  const effectiveWeight = addCustomWt !== '' ? parseFloat(addCustomWt) || autoWeightEst : autoWeightEst;

  // Open Add Modal - Open for ALL users
  const handleOpenAddModal = () => {
    setShowAddModal(true);
  };

  // Create Custom Tile - Open for ALL users
  const handleCreateCustomTile = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedWidth <= 0 || parsedLength <= 0 || parsedPicInBox <= 0) {
      onShowToast('Please enter valid Width, Length (mm) and Pic in Box');
      return;
    }

    const newTile: TileSize = {
      id: 'custom-tile-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: autoTileName,
      inches: autoInches,
      category: addCategory,
      pcsPerBox: parsedPicInBox,
      sqftPerBox: autoSqftPerBox,
      sqmPerBox: Math.round(autoSqmPerBox * 1000) / 1000,
      weightPerBoxKg: effectiveWeight,
      defaultRate: Math.max(0, addRate || 0),
      isCustom: true,
    };

    const updated = [newTile, ...tiles];
    onUpdateTiles(updated);
    setTileRates((prev) => ({ ...prev, [newTile.id]: newTile.defaultRate }));
    setShowAddModal(false);
    onShowToast(`Added tile size "${newTile.name}" (${newTile.sqftPerBox} sqft/box)`);
  };

  // Open Edit Modal (Custom tiles open for all; factory presets require admin)
  const handleOpenEditModal = (tile: TileSize) => {
    if (!isAdmin && !tile.isCustom) {
      setAuthActionContext('edit factory catalog tile sizes');
      setShowAuthModal(true);
      return;
    }
    setEditingTile(tile);
    setEditName(tile.name);
    setEditInches(tile.inches);
    setEditCategory(tile.category);
    setEditPcs(tile.pcsPerBox);
    setEditSqft(tile.sqftPerBox);
    setEditWt(tile.weightPerBoxKg);
    setEditRate(tile.defaultRate ?? 0);
  };

  // Save Edit Tile
  const handleSaveEditTile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTile) return;
    if (!isAdmin && !editingTile.isCustom) {
      setEditingTile(null);
      setAuthActionContext('edit factory tile sizes');
      setShowAuthModal(true);
      return;
    }
    if (!editName.trim()) return;

    const updatedTiles = tiles.map((t) => {
      if (t.id === editingTile.id) {
        const sqft = Math.max(0.1, editSqft || 1);
        return {
          ...t,
          name: editName.trim(),
          inches: editInches.trim() || t.inches,
          category: editCategory.trim() || t.category,
          pcsPerBox: Math.max(1, editPcs || 1),
          sqftPerBox: sqft,
          sqmPerBox: sqftToSqm(sqft),
          weightPerBoxKg: Math.max(1, editWt || 1),
          defaultRate: Math.max(0, editRate || 0),
        };
      }
      return t;
    });

    onUpdateTiles(updatedTiles);
    setTileRates((prev) => ({ ...prev, [editingTile.id]: editRate }));
    setEditingTile(null);
    onShowToast(`Tile size "${editName.trim()}" specifications updated`);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (tile: TileSize) => {
    if (!isAdmin && !tile.isCustom) {
      setAuthActionContext('remove factory tile sizes from catalog');
      setShowAuthModal(true);
      return;
    }
    setDeletingTile(tile);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingTile) return;
    if (!isAdmin && !deletingTile.isCustom) {
      setDeletingTile(null);
      setAuthActionContext('remove factory tile sizes');
      setShowAuthModal(true);
      return;
    }

    const updated = tiles.filter((t) => t.id !== deletingTile.id);
    onUpdateTiles(updated);
    onShowToast(`Tile "${deletingTile.name}" removed from inventory`);
    setDeletingTile(null);
  };

  // Cloud Publish handler
  const handlePublishCatalog = async () => {
    if (!isAdmin) {
      setAuthActionContext('publish tile catalog to cloud');
      setShowAuthModal(true);
      return;
    }
    if (!onSaveTilesToCloud) {
      onShowToast('Cloud sync handler is not configured');
      return;
    }
    setIsPublishing(true);
    await onSaveTilesToCloud(tiles);
    setIsPublishing(false);
  };

  return (
    <div className="space-y-5">

      {/* Top Controls Card */}
      <div className={`${cardStyle.className} p-4 sm:p-5`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className={`w-5 h-5 ${accent.textAccent}`} />
              <span>Standard Tile Box, Weight & Quotation Estimator</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input required area to compute exact boxes, packaging coverage with wastage margin, truck weight & pricing.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 font-semibold mr-1">Presets:</span>
            {[200, 500, 1000, 2500, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setBaseSqft(preset)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all ${
                  baseSqft === preset
                    ? `${accent.bgSolid} text-white border-transparent shadow-xs`
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {formatNumberIN(preset, 0)} sqft
              </button>
            ))}
          </div>
        </div>

        {/* Inputs Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Base Area Input */}
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Required Area (Sq.Ft.)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={baseSqft || ''}
                onChange={(e) => setBaseSqft(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-base font-extrabold rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                sqft
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Carpet / laying floor area</p>
          </div>

          {/* Wastage Margin */}
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Wastage & Cutting Allowance (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="25"
                step="1"
                value={wastagePct}
                onChange={(e) => setWastagePct(parseFloat(e.target.value) || 0)}
                className="w-20 px-3 py-2 text-base font-extrabold rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <div className="flex-1 flex gap-1">
                {[0, 5, 8, 10].map((w) => (
                  <button
                    key={w}
                    onClick={() => setWastagePct(w)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded border ${
                      wastagePct === w
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {w}%
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              + {formatNumberIN(wastageSqft, 1)} sqft reserve for breakage & corners
            </p>
          </div>

          {/* Net Target Sqft */}
          <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80">
            <div className="text-xs font-bold text-amber-900">Total Billable Area</div>
            <div className="text-2xl font-black text-amber-950 font-tabular mt-0.5">
              {formatNumberIN(netSqft, 2)}{' '}
              <span className="text-xs font-bold text-amber-800">sqft</span>
            </div>
            <p className="text-[10px] text-amber-800 mt-1">
              Base {formatNumberIN(validBaseSqft, 0)} sqft + {validWastagePct}% buffer
            </p>
          </div>

          {/* Net Target Sqm */}
          <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-200/80">
            <div className="text-xs font-bold text-blue-900">Metric Equivalent</div>
            <div className="text-2xl font-black text-blue-950 font-tabular mt-0.5">
              {formatNumberIN(netSqm, 2)}{' '}
              <span className="text-xs font-bold text-blue-800">sq.meter</span>
            </div>
            <p className="text-[10px] text-blue-700 mt-1">
              Metric area for Morbi export & specs
            </p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200/70">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search sizes (e.g. 600, 1200, slab)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-700"
              >
                <option value="all">All Tile Categories</option>
                {categories
                  .filter((c) => c !== 'all')
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 px-1">Rate Basis:</span>
              <button
                onClick={() => setRateBasis('sqft')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                  rateBasis === 'sqft'
                    ? `${accent.bgSolid} text-white shadow-xs`
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ / Sqft
              </button>
              <button
                onClick={() => setRateBasis('box')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                  rateBasis === 'box'
                    ? `${accent.bgSolid} text-white shadow-xs`
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ / Box
              </button>
            </div>

            {/* Quick Tax, Insurance & Transportation Adjusters */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-1 px-1">
                <span className="text-[11px] font-bold text-slate-600">Tax:</span>
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={gstPct}
                  onChange={(e) => setGstPct(parseFloat(e.target.value) || 0)}
                  className="w-11 px-1 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-900 text-center text-xs"
                />
                <span className="text-[10px] text-slate-500 font-bold">%</span>
              </div>
              <div className="h-3.5 w-px bg-slate-300" />
              <div className="flex items-center gap-1 px-1">
                <span className="text-[11px] font-bold text-slate-600">Ins:</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={insPct}
                  onChange={(e) => setInsPct(parseFloat(e.target.value) || 0)}
                  className="w-12 px-1 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-900 text-center text-xs"
                />
                <span className="text-[10px] text-slate-500 font-bold">%</span>
              </div>
              <div className="h-3.5 w-px bg-slate-300" />
              {/* Transport with TWO user-selectable options: Fix Amount on Ton (₹/Ton) and % */}
              <div className="flex items-center gap-1.5 px-1 bg-white/70 py-0.5 rounded-md border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700">Trans:</span>

                {/* Option 1 & 2 Selector: Fix Amount on Ton (₹/Ton) vs % */}
                <div className="flex items-center bg-slate-200/90 p-0.5 rounded text-[10px] font-extrabold border border-slate-300">
                  <button
                    type="button"
                    onClick={() => handleTransModeChange('ton')}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      transMode === 'ton'
                        ? 'bg-amber-600 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900 font-bold'
                    }`}
                    title="Option 1: Fix Amount on Ton (₹ / Metric Ton based on actual tile consignment weight)"
                  >
                    ₹/Ton
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTransModeChange('percent')}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      transMode === 'percent'
                        ? 'bg-amber-600 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900 font-bold'
                    }`}
                    title="Option 2: Percentage (% of goods amount)"
                  >
                    %
                  </button>
                </div>

                {/* Live Value Input */}
                {transMode === 'ton' ? (
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px] text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={transPerTon}
                      onChange={(e) => handleTransPerTonChange(parseFloat(e.target.value) || 0)}
                      className="w-16 px-1 py-0.5 rounded bg-white border border-slate-300 font-extrabold text-slate-900 text-right text-xs focus:ring-1 focus:ring-amber-500 outline-none font-tabular"
                      title="Fix Amount on Ton (e.g. ₹1,000 / Ton or ₹1,200 / Ton)"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">/Ton</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5">
                    <input
                      type="number"
                      min="0"
                      max="40"
                      step="0.5"
                      value={transPct}
                      onChange={(e) => handleTransPctChange(parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 rounded bg-white border border-slate-300 font-extrabold text-slate-900 text-center text-xs focus:ring-1 focus:ring-amber-500 outline-none font-tabular"
                      title="Transportation Percentage (e.g. 3%)"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Add Custom Size Button - Open for All Users */}
            <button
              onClick={handleOpenAddModal}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors ${accent.bgSolid} ${accent.bgHover} text-white`}
              title="Add New Tile Size (Open for all users - auto calculates Sq.Ft from Width × Length × Pic in Box)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tile Size</span>
            </button>

            {isAdmin && onSaveTilesToCloud && (
              <button
                onClick={handlePublishCatalog}
                disabled={isPublishing}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                title="Publish tile catalog changes live to Firestore for all users"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{isPublishing ? 'Publishing...' : 'Publish to Cloud'}</span>
              </button>
            )}

            {isAdmin && onResetTilesToDefault && (
              <button
                onClick={() => setShowResetModal(true)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Restore default factory tile catalog"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className={`${cardStyle.className} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className={`${tableHeaderClass} text-[11px] uppercase tracking-wider font-semibold`}>
                <th className="py-3 px-3.5">Tile Size (mm & in)</th>
                <th className="py-3 px-2 text-center">Pcs / Box</th>
                <th className="py-3 px-2 text-right">Box Sqft</th>
                <th className="py-3 px-3 text-right bg-black/25 text-amber-300 font-extrabold">
                  Req. Boxes
                </th>
                <th className="py-3 px-2 text-right">Actual Area</th>
                <th className="py-3 px-2 text-right">Per Box Wt</th>
                <th className="py-3 px-3 text-right font-extrabold">Total Weight</th>
                <th className="py-3 px-3 text-right min-w-[130px]">
                  <div>Rate ({rateBasis === 'box' ? '₹/Box' : '₹/Sqft'})</div>
                  <div className="text-[9px] text-amber-300/80 normal-case font-normal">
                    (1 sqm = 10.764 sqft)
                  </div>
                </th>
                <th className="py-3 px-3 text-right font-extrabold">Est. Amount</th>
                <th className="py-3 px-3 text-right bg-emerald-950/20 text-emerald-300 font-extrabold min-w-[170px]">
                  <div>Total Amount</div>
                  <div className="text-[9px] text-emerald-200 normal-case font-normal">
                    (Est. + {gstPct}% Tax + {insPct}% Ins + {transMode === 'ton' ? `₹${formatNumberIN(transPerTon, 0)}/Ton` : `${transPct}%`} Trans)
                  </div>
                </th>
                <th className="py-3 px-3 text-center min-w-[130px]">
                  {isAdmin ? 'Actions (Admin)' : 'Action'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/95">
              {filteredTiles.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No tile sizes match your search query.
                  </td>
                </tr>
              ) : (
                filteredTiles.map((tile) => {
                  const boxSqft = tile.sqftPerBox || 1;
                  const boxSqm = sqftToSqm(boxSqft);
                  const exactBoxes = netSqft / boxSqft;
                  const reqBoxes = Math.ceil(exactBoxes);
                  const actualSqft = reqBoxes * boxSqft;
                  const surplusSqft = actualSqft - netSqft;
                  const totalWtKg = reqBoxes * tile.weightPerBoxKg;
                  const totalWtTons = totalWtKg / 1000;
                  const rate = tileRates[tile.id] ?? tile.defaultRate ?? 0;
                  const amount = rateBasis === 'box' ? reqBoxes * rate : actualSqft * rate;
                  const isAdded = !!addedItemIds[tile.id];

                  // Equivalent rates across units:
                  const boxRate = rateBasis === 'box' ? rate : rate * boxSqft;
                  const sqftRate = rateBasis === 'sqft' ? rate : (boxSqft > 0 ? rate / boxSqft : 0);
                  // 1 Sq.M = 10.7639104 Sq.Ft -> Rate per Sq.M = Rate per Sq.Ft × 10.764
                  const rateInSqmt = rateBasis === 'box'
                    ? (boxSqm > 0 ? rate / boxSqm : 0)
                    : rate * SQFT_PER_SQM;

                  // Tax, Insurance & Transportation calculations for Total Amount:
                  const lineTax = (amount * Math.max(0, gstPct)) / 100;
                  const lineInsurance = (amount * Math.max(0, insPct)) / 100;
                  const lineTransport = transMode === 'ton'
                    ? totalWtTons * Math.max(0, transPerTon)
                    : (amount * Math.max(0, transPct)) / 100;
                  const lineTotalAmount = amount + lineTax + lineInsurance + lineTransport;

                  // Exact Per Box Calculations:
                  // Base Price per Box (ex-factory):
                  const perBoxBase = boxRate;
                  // Total Landed Price per Box (inclusive of Tax, Insurance & Transportation):
                  const perBoxTotal = reqBoxes > 0
                    ? lineTotalAmount / reqBoxes
                    : (transMode === 'ton'
                        ? perBoxBase * (1 + (gstPct + insPct) / 100) + ((tile.weightPerBoxKg / 1000) * transPerTon)
                        : perBoxBase * (1 + (gstPct + insPct + transPct) / 100));

                  return (
                    <tr
                      key={tile.id}
                      className="hover:bg-amber-50/40 transition-colors group"
                    >
                      {/* Size & Info */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{tile.name}</span>
                          {tile.isCustom && (
                            <span className={`text-[10px] ${accent.badgeBg} ${accent.badgeText} px-1.5 py-0.2 rounded font-bold`}>
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>{tile.inches}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400 truncate max-w-[140px]">{tile.category}</span>
                        </div>
                      </td>

                      {/* Pcs/Box */}
                      <td className="py-2.5 px-2 text-center font-tabular font-semibold text-slate-700">
                        {tile.pcsPerBox}
                      </td>

                      {/* Box Sqft */}
                      <td className="py-2.5 px-2 text-right font-tabular text-slate-700">
                        {formatNumberIN(tile.sqftPerBox, 2)}
                      </td>

                      {/* Req. Boxes */}
                      <td className="py-2.5 px-3 text-right bg-amber-50/50">
                        <div className="font-extrabold text-amber-900 font-tabular text-sm">
                          {reqBoxes}{' '}
                          <span className="text-[10px] font-normal text-amber-700">boxes</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-tabular">
                          ({formatNumberIN(exactBoxes, 2)} exact)
                        </div>
                      </td>

                      {/* Actual Area */}
                      <td className="py-2.5 px-2 text-right">
                        <div className="font-tabular font-bold text-slate-800">
                          {formatNumberIN(actualSqft, 2)} sqft
                        </div>
                        <div className="text-[10px] text-emerald-600 font-tabular">
                          +{formatNumberIN(surplusSqft, 2)} surplus
                        </div>
                      </td>

                      {/* Per Box Wt */}
                      <td className="py-2.5 px-2 text-right font-tabular text-slate-600">
                        {tile.weightPerBoxKg} kg
                      </td>

                      {/* Total Weight */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-tabular font-bold text-slate-900">
                          {formatNumberIN(totalWtKg, 0)} kg
                        </div>
                        <div className="text-[10px] text-slate-500 font-tabular">
                          {formatNumberIN(totalWtTons, 2)} Tons
                        </div>
                      </td>

                      {/* Rate Input */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="relative inline-block w-full">
                          <span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            value={rate ?? 0}
                            min="0"
                            step="any"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              handleRateChange(
                                tile.id,
                                e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full pl-5 pr-2 py-1 rounded border border-slate-300 bg-white font-extrabold text-right text-slate-900 font-tabular focus:ring-1 focus:ring-amber-500 outline-none text-xs"
                          />
                        </div>
                        <div
                          className="text-[10px] text-slate-500 font-tabular mt-0.5"
                          title={
                            rateBasis === 'sqft'
                              ? `1 Sq.M = 10.764 Sq.Ft\nRate: ₹${rate}/sqft × 10.764 = ₹${formatNumberIN(rateInSqmt, 2)}/sqmt\n(Base Box Price: ₹${formatNumberIN(boxRate, 2)} for ${boxSqft} sqft / ${boxSqm.toFixed(2)} sqm)`
                              : `Rate: ₹${rate}/box ÷ ${boxSqm.toFixed(2)} sqm = ₹${formatNumberIN(rateInSqmt, 2)}/sqmt\n(Sqft Price: ₹${formatNumberIN(sqftRate, 2)}/sqft)`
                          }
                        >
                          <div className="font-bold text-slate-700">
                            {rateBasis === 'sqft'
                              ? `₹${formatNumberIN(boxRate, 2)} / box`
                              : `₹${formatNumberIN(sqftRate, 2)} / sqft`}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            ₹{formatNumberIN(rateInSqmt, 2)} / sqmt
                          </div>
                        </div>
                      </td>

                      {/* Line Est. Amount (Base ex-factory) */}
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 font-tabular">
                        <div>{formatINR(amount)}</div>
                        <div className="text-[10px] font-semibold text-slate-600 font-tabular">
                          ₹{formatNumberIN(perBoxBase, 2)} / box
                        </div>
                        <div className="text-[9px] text-slate-400 font-normal">Ex-Factory</div>
                      </td>

                      {/* Total Amount = Est. Amount + Tax + Insurance + Transportation */}
                      <td className="py-2.5 px-3 text-right bg-emerald-50/40">
                        <div className="font-black text-emerald-950 font-tabular text-sm">
                          {formatINR(lineTotalAmount)}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-800 font-tabular">
                          ₹{formatNumberIN(perBoxTotal, 2)} / box (Landed)
                        </div>
                        <div className="text-[9px] text-slate-500 font-tabular mt-0.5">
                          + GST ({gstPct}%): {formatINR(lineTax)}
                        </div>
                        <div className="text-[9px] text-slate-500 font-tabular">
                          + Ins ({insPct}%): {formatINR(lineInsurance)} · Trans ({transMode === 'ton' ? `₹${formatNumberIN(transPerTon, 0)}/T` : `${transPct}%`}): {formatINR(lineTransport)}
                        </div>
                      </td>

                      {/* Actions: Quote + Admin Controls */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Add to Quote (Hidden for regular users while quotation module is temporarily hidden) */}
                          {(isAdmin || brand.hideQuotationForUsers === false) && (
                            <button
                              onClick={() => handleAddRowToQuote(tile)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 whitespace-nowrap ${
                                isAdded
                                  ? 'bg-emerald-600 text-white'
                                  : `${accent.bgSolid} ${accent.bgHover} text-white`
                              }`}
                              title="Add calculated boxes to quotation"
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Quote</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Edit & Remove Controls (Open for custom tiles; Admin for factory) */}
                          {(isAdmin || tile.isCustom) ? (
                            <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                              <button
                                onClick={() => handleOpenEditModal(tile)}
                                className="p-1.5 rounded-md hover:bg-amber-100 text-amber-700 hover:text-amber-900 transition-colors"
                                title={tile.isCustom ? "Edit Custom Tile Specifications" : "Edit Tile Specifications (Admin)"}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(tile)}
                                className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-colors"
                                title={tile.isCustom ? "Delete Custom Tile Size" : "Remove Tile Size (Admin)"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="pl-1 border-l border-slate-200">
                              <button
                                onClick={() => {
                                  setAuthActionContext('edit or remove factory catalog sizes');
                                  setShowAuthModal(true);
                                }}
                                className="p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
                                title="Factory preset locked (Admin Only)"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Admin Authentication Barrier Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Master Admin Permission Required
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Restricted Catalog Management Access
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-medium">
                Permission to <strong>{authActionContext}</strong> in Section 1 is strictly reserved for the authorized Master Admin:
              </p>
              <div className="bg-white px-3 py-2 rounded-lg border border-amber-300 font-mono font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{MASTER_ADMIN_EMAIL}</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Regular users can freely calculate boxes, view weights, and generate quotes, but catalog definitions can only be altered by the Master Admin.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  onLogin();
                }}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg ${accent.bgSolid} ${accent.bgHover} text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in as Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Tile Modal (Open for All Users with Universal Auto Calculation) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 my-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Add Tile Size (Auto Calculated)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Universal Measurement Calculator • Open to All Users
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formula Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-300/80 rounded-xl p-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Universal Calculation Formula:</span>
              </div>
              <code className="block mt-1 text-[11px] font-mono font-bold text-slate-800 bg-white/80 px-2 py-1 rounded border border-amber-200">
                (((Width × Length) ÷ 1,000,000) × Pic in Box) × 10.764
              </code>
            </div>

            <form onSubmit={handleCreateCustomTile} className="space-y-4">
              {/* 3 Core User Inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Enter Tile Dimensions & Packaging:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700">Width (mm)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="600"
                      value={addWidthMm || ''}
                      onChange={(e) => setAddWidthMm(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">e.g. 600, 800</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700">Length (mm)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="600"
                      value={addLengthMm || ''}
                      onChange={(e) => setAddLengthMm(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">e.g. 1200, 1600</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700">Pic in Box (pcs)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="4"
                      value={addPicInBox || ''}
                      onChange={(e) => setAddPicInBox(parseInt(e.target.value) || 1)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">pieces / box</span>
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-500">Quick Size Presets:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {QUICK_SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setAddWidthMm(preset.w);
                        setAddLengthMm(preset.l);
                        setAddPicInBox(preset.pcs);
                      }}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Universal Auto-Calculated Results Card */}
              <div className="bg-amber-50/70 border border-amber-300/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">Auto Calculated Coverage:</span>
                  <span className="text-xs font-semibold text-amber-700 font-mono">
                    {autoTileName} • {autoInches}
                  </span>
                </div>

                <div className="flex items-baseline justify-between bg-white rounded-lg p-3 border border-amber-200 shadow-xs">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                      Square Feet / Box (Sq.Ft)
                    </div>
                    <div className="text-2xl font-black text-amber-950 font-tabular">
                      {formatNumberIN(autoSqftPerBox, 2)}{' '}
                      <span className="text-sm font-bold text-amber-700">sq.ft</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                      Square Meter / Box (Sq.M)
                    </div>
                    <div className="text-xl font-black text-slate-800 font-tabular">
                      {formatNumberIN(autoSqmPerBox, 3)}{' '}
                      <span className="text-xs font-bold text-slate-500">sq.m</span>
                    </div>
                  </div>
                </div>

                {/* Calculation Details */}
                <div className="grid grid-cols-3 gap-2 text-[11px] bg-amber-100/60 p-2 rounded-lg text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Per Piece Area:</span>
                    <strong>{formatNumberIN(singleTileSqft, 2)} sqft</strong> ({formatNumberIN(singleTileSqm, 3)} sqm)
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Est. Box Weight:</span>
                    <strong>{effectiveWeight} kg</strong> (~19.5 kg/sqm)
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Inches Conversion:</span>
                    <strong>{autoInches}</strong>
                  </div>
                </div>
              </div>

              {/* Optional Category and Default Rate (Default 0) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">Category</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800"
                  >
                    {STANDARD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700">
                    Weight (kg)/Box <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder={String(autoWeightEst)}
                    value={addCustomWt}
                    onChange={(e) => setAddCustomWt(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700">
                    Default Rate (₹/Box)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={addRate}
                    onChange={(e) => setAddRate(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-extrabold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Default is 0</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg ${accent.bgSolid} ${accent.bgHover} text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Tile Inventory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Tile Modal (Open for Custom Tiles or Admin) */}
      {editingTile && (isAdmin || editingTile.isCustom) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Edit Tile Size & Specs
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Modifying {editingTile.name} • Master Admin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTile(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">Tile Size Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Inches Spec</label>
                  <input
                    type="text"
                    value={editInches}
                    onChange={(e) => setEditInches(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">Pcs / Box</label>
                  <input
                    type="number"
                    min="1"
                    value={editPcs}
                    onChange={(e) => setEditPcs(parseInt(e.target.value) || 1)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">Sqft / Box</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={editSqft}
                    onChange={(e) => setEditSqft(parseFloat(e.target.value) || 1)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    ≈ {formatNumberIN(sqftToSqm(editSqft), 2)} sqm
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">Wt (kg)/Box</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={editWt}
                    onChange={(e) => setEditWt(parseFloat(e.target.value) || 1)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Default Rate (₹ / Box)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editRate}
                  onChange={(e) => setEditRate(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTile(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg ${accent.bgSolid} ${accent.bgHover} text-white text-xs font-bold shadow-sm`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation Modal (Admin only) */}
      {deletingTile && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Remove Tile Size</h3>
                <p className="text-[11px] text-slate-500">Confirm deletion</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to remove{' '}
              <strong className="text-slate-900 font-bold">{deletingTile.name}</strong> (
              {deletingTile.category}) from the standard catalog?
            </p>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-0.5">
              <div>Packaging: {deletingTile.pcsPerBox} pcs · {deletingTile.sqftPerBox} sqft/box</div>
              <div>Weight: {deletingTile.weightPerBoxKg} kg/box</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTile(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Delete Tile Size
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Reset to Defaults Confirmation Modal */}
      {showResetModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-2.5 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Reset Tile Catalog</h3>
                <p className="text-[11px] text-slate-500">Restore factory standards</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              This will restore all tile sizes back to the default Morbi standard catalog list. Any custom tiles added will be reset.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  onResetTilesToDefault?.();
                }}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
