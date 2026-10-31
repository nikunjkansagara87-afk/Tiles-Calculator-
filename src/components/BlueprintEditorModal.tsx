import React, { useState, useEffect } from 'react';
import { TilePattern, BlueprintTileBlock, PatternTileComponent } from '../types';
import {
  compressBlueprintLayout,
  decompressBlueprintLayout,
  getDefaultFullGridLayout,
  getDiagonal45PicLayout,
  minifyBlueprintBlocks,
} from '../utils/blueprintCompression';
import { isMasterAdmin, MASTER_ADMIN_EMAIL } from '../firebase';
import { User } from 'firebase/auth';
import {
  X,
  Grid,
  Trash2,
  RotateCw,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  CloudUpload,
  Info,
  Compass,
  Eye,
} from 'lucide-react';

interface BlueprintEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pattern: TilePattern;
  currentUser: User | null;
  onSavePattern: (updatedPattern: TilePattern, publishToCloud?: boolean) => Promise<boolean | void>;
  onShowToast: (msg: string) => void;
}

// Grid size: 10 columns by 8 rows (each unit = 300 mm)
const GRID_COLS = 10;
const GRID_ROWS = 8;

interface PaletteTile {
  sizeKey: '600' | '300x600_h' | '300x600_v' | '300';
  name: string;
  nominalMm: string;
  widthUnits: number;
  heightUnits: number;
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

const PALETTE_TILES: PaletteTile[] = [
  {
    sizeKey: '600',
    name: '600×600 mm',
    nominalMm: '600 × 600 mm (24"×24")',
    widthUnits: 2,
    heightUnits: 2,
    colorBg: 'bg-blue-600',
    colorBorder: 'border-blue-400',
    colorText: 'text-white',
  },
  {
    sizeKey: '300x600_h',
    name: '300×600 Horiz.',
    nominalMm: '300 × 600 mm (12"×24" H)',
    widthUnits: 2,
    heightUnits: 1,
    colorBg: 'bg-amber-600',
    colorBorder: 'border-amber-400',
    colorText: 'text-white',
  },
  {
    sizeKey: '300x600_v',
    name: '300×600 Vert.',
    nominalMm: '300 × 600 mm (12"×24" V)',
    widthUnits: 1,
    heightUnits: 2,
    colorBg: 'bg-amber-700',
    colorBorder: 'border-amber-400',
    colorText: 'text-white',
  },
  {
    sizeKey: '300',
    name: '300×300 mm',
    nominalMm: '300 × 300 mm (12"×12")',
    widthUnits: 1,
    heightUnits: 1,
    colorBg: 'bg-emerald-600',
    colorBorder: 'border-emerald-400',
    colorText: 'text-white',
  },
];

export const BlueprintEditorModal: React.FC<BlueprintEditorModalProps> = ({
  isOpen,
  onClose,
  pattern,
  currentUser,
  onSavePattern,
  onShowToast,
}) => {
  const isAdmin = isMasterAdmin(currentUser);
  const [isSaving, setIsSaving] = useState(false);

  // Generate initial full 10x8 modular layout based on pattern code and ratios
  function generateDefaultLayout(code: string): BlueprintTileBlock[] {
    const c600 = pattern.components.find((c) => c.sizeMm.includes('600 × 600'))?.ratioPct ?? 44;
    const c300x600 = pattern.components.find((c) => c.sizeMm.includes('300 × 600'))?.ratioPct ?? 39;
    const c300 = pattern.components.find((c) => c.sizeMm.includes('300 × 300'))?.ratioPct ?? 17;
    return getDefaultFullGridLayout(code, c600, c300x600, c300);
  }

  // Touch and Drop Grid State
  const [placedTiles, setPlacedTiles] = useState<BlueprintTileBlock[]>(() => {
    const existing = decompressBlueprintLayout(
      pattern.compactBlueprintLayout,
      pattern.customBlueprintLayout
    );
    return existing.length > 0 ? existing : generateDefaultLayout(pattern.code);
  });

  // Palette & Grid Rotation State (0°, 45°, -45°)
  const [gridRotation, setGridRotation] = useState<number>(() => {
    const existing = decompressBlueprintLayout(
      pattern.compactBlueprintLayout,
      pattern.customBlueprintLayout
    );
    return pattern.blueprintRotation ?? existing[0]?.gridRotation ?? 0;
  });

  // Palette individual tile rotation (0°, 45°, 90°, 135°)
  const [paletteTileAngle, setPaletteTileAngle] = useState<number>(0);

  // Blueprint visual style ('color' vs 'cad-bw' matching the attached reference pic)
  const [cadStyle, setCadStyle] = useState<'color' | 'cad-bw'>(() => {
    const existing = decompressBlueprintLayout(
      pattern.compactBlueprintLayout,
      pattern.customBlueprintLayout
    );
    return pattern.blueprintStyle ?? existing[0]?.cadStyle ?? 'color';
  });

  // Toggle between Clipped Room Frame Preview (like reference pic) and Full Editable Grid when rotated
  const [clipRoomFrame, setClipRoomFrame] = useState<boolean>(true);

  const [selectedPaletteKey, setSelectedPaletteKey] = useState<PaletteTile['sizeKey']>('600');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<{
    source: 'palette' | 'grid';
    sizeKey: PaletteTile['sizeKey'];
    id?: string;
  } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const [blueprintNotes, setBlueprintNotes] = useState<string>(pattern.blueprintNotes || '');

  // Local components & subtitle state so applied placed-tile ratios persist when publishing
  const [localComponents, setLocalComponents] = useState<PatternTileComponent[]>(() =>
    pattern.components.map((c) => ({ ...c }))
  );
  const [localSubtitle, setLocalSubtitle] = useState<string>(pattern.subtitle || '');

  // Sync state whenever pattern changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const existing = decompressBlueprintLayout(
        pattern.compactBlueprintLayout,
        pattern.customBlueprintLayout
      );
      setPlacedTiles(existing.length > 0 ? existing : generateDefaultLayout(pattern.code));
      setGridRotation(pattern.blueprintRotation ?? existing[0]?.gridRotation ?? 0);
      setCadStyle(pattern.blueprintStyle ?? existing[0]?.cadStyle ?? 'color');
      setBlueprintNotes(pattern.blueprintNotes || '');
      setLocalComponents(pattern.components.map((c) => ({ ...c })));
      setLocalSubtitle(pattern.subtitle || '');
    }
  }, [isOpen, pattern]);

  if (!isOpen) return null;

  // --- Rotate Palette Handler ---
  const handleRotatePalette = () => {
    // Cycle Grid/Palette Rotation: 0° -> 45° Diagonal -> -45° Diagonal -> 0°
    if (gridRotation === 0) {
      setGridRotation(45);
      onShowToast('↻ Tile Palette & Grid rotated to 45° Diagonal!');
    } else if (gridRotation === 45) {
      setGridRotation(-45);
      onShowToast('↻ Tile Palette & Grid rotated to -45° Diagonal!');
    } else {
      setGridRotation(0);
      onShowToast('↻ Tile Palette & Grid reset to 0° Straight!');
    }
  };

  // Flip 300x600 in palette or cycle palette tile angle
  const handleFlipPaletteTile = (e: React.MouseEvent, sizeKey: PaletteTile['sizeKey']) => {
    e.stopPropagation();
    if (sizeKey === '300x600_h') {
      setSelectedPaletteKey('300x600_v');
      onShowToast('Switched palette to 300×600 Vertical (1×2)');
    } else if (sizeKey === '300x600_v') {
      setSelectedPaletteKey('300x600_h');
      onShowToast('Switched palette to 300×600 Horizontal (2×1)');
    } else {
      const nextAngle = (paletteTileAngle + 45) % 180;
      setPaletteTileAngle(nextAngle);
      if (nextAngle === 45 && gridRotation === 0) {
        setGridRotation(45);
      } else if (nextAngle === 0 && gridRotation !== 0) {
        setGridRotation(0);
      }
      onShowToast(`Palette tile angle set to ${nextAngle}°`);
    }
  };

  // --- Grid Collision & Placement Helpers ---
  const isCellOccupied = (
    col: number,
    row: number,
    width: number,
    height: number,
    ignoreId?: string
  ): boolean => {
    if (col < 0 || row < 0 || col + width > GRID_COLS || row + height > GRID_ROWS) {
      return true;
    }

    for (const tile of placedTiles) {
      if (ignoreId && tile.id === ignoreId) continue;
      const overlapX = col < tile.x + tile.widthUnits && col + width > tile.x;
      const overlapY = row < tile.y + tile.heightUnits && row + height > tile.y;
      if (overlapX && overlapY) return true;
    }
    return false;
  };

  const handlePlaceTile = (
    col: number,
    row: number,
    sizeKey: PaletteTile['sizeKey'],
    existingId?: string
  ) => {
    const paletteDef = PALETTE_TILES.find((p) => p.sizeKey === sizeKey);
    if (!paletteDef) return;

    if (isCellOccupied(col, row, paletteDef.widthUnits, paletteDef.heightUnits, existingId)) {
      onShowToast('⚠️ Space occupied or exceeds grid boundary!');
      return;
    }

    if (existingId) {
      setPlacedTiles((prev) =>
        prev.map((t) =>
          t.id === existingId
            ? {
                ...t,
                x: col,
                y: row,
                widthUnits: paletteDef.widthUnits,
                heightUnits: paletteDef.heightUnits,
                sizeKey,
              }
            : t
        )
      );
      setSelectedBlockId(existingId);
    } else {
      const newBlock: BlueprintTileBlock = {
        id: `t${Date.now()}`,
        sizeKey,
        x: col,
        y: row,
        widthUnits: paletteDef.widthUnits,
        heightUnits: paletteDef.heightUnits,
        ...(paletteTileAngle !== 0 ? { rotation: paletteTileAngle } : {}),
        ...(gridRotation !== 0 ? { gridRotation } : {}),
        ...(cadStyle !== 'color' ? { cadStyle } : {}),
        label: sizeKey === '600' ? '600×600' : sizeKey === '300' ? '300²' : '300×600',
      };
      setPlacedTiles((prev) => [...prev, newBlock]);
      setSelectedBlockId(newBlock.id);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedBlockId) return;
    setPlacedTiles((prev) => prev.filter((t) => t.id !== selectedBlockId));
    setSelectedBlockId(null);
  };

  // Rotate selected tile 90° (flips 300x600 H <-> V, or rotates square tile)
  const handleRotateSelected90 = () => {
    if (!selectedBlockId) return;
    const target = placedTiles.find((t) => t.id === selectedBlockId);
    if (!target) return;

    if (target.sizeKey === '300x600_h') {
      if (!isCellOccupied(target.x, target.y, 1, 2, target.id)) {
        setPlacedTiles((prev) =>
          prev.map((t) =>
            t.id === target.id
              ? { ...t, sizeKey: '300x600_v', widthUnits: 1, heightUnits: 2 }
              : t
          )
        );
      } else {
        onShowToast('Cannot flip to vertical: adjacent space occupied!');
      }
    } else if (target.sizeKey === '300x600_v') {
      if (!isCellOccupied(target.x, target.y, 2, 1, target.id)) {
        setPlacedTiles((prev) =>
          prev.map((t) =>
            t.id === target.id
              ? { ...t, sizeKey: '300x600_h', widthUnits: 2, heightUnits: 1 }
              : t
          )
        );
      } else {
        onShowToast('Cannot flip to horizontal: adjacent space occupied!');
      }
    } else {
      const nextRot = ((target.rotation || 0) + 90) % 360;
      setPlacedTiles((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, rotation: nextRot } : t))
      );
      onShowToast(`Rotated tile to ${nextRot}°`);
    }
  };

  // Rotate selected tile by 45° increment
  const handleRotateSelected45 = () => {
    if (!selectedBlockId) return;
    const target = placedTiles.find((t) => t.id === selectedBlockId);
    if (!target) return;
    const nextRot = ((target.rotation || 0) + 45) % 180;
    setPlacedTiles((prev) =>
      prev.map((t) => (t.id === target.id ? { ...t, rotation: nextRot } : t))
    );
    onShowToast(`Tile rotated to ${nextRot}°`);
  };

  // Load the exact 45° Diagonal Alternating Band Pattern from the user's reference image
  const handleLoad45DiagonalPicPreset = () => {
    const diagBlocks = getDiagonal45PicLayout(45, cadStyle);
    setPlacedTiles(diagBlocks);
    setGridRotation(45);
    setClipRoomFrame(true);
    onShowToast('✨ Generated 45° Diagonal Interlocking Pattern (Reference Pic Style)!');
  };

  // Compute live layout statistics & ratios from placed tiles
  const layoutStats = React.useMemo(() => {
    let count600 = 0;
    let count300x600 = 0;
    let count300 = 0;

    placedTiles.forEach((tile) => {
      if (tile.sizeKey === '600') count600++;
      else if (tile.sizeKey === '300x600_h' || tile.sizeKey === '300x600_v') count300x600++;
      else if (tile.sizeKey === '300') count300++;
    });

    const areaUnits600 = count600 * 4;
    const areaUnits300x600 = count300x600 * 2;
    const areaUnits300 = count300 * 1;
    const totalAreaUnits = areaUnits600 + areaUnits300x600 + areaUnits300;

    const pct600 = totalAreaUnits > 0 ? Math.round((areaUnits600 / totalAreaUnits) * 100) : 0;
    const pct300x600 = totalAreaUnits > 0 ? Math.round((areaUnits300x600 / totalAreaUnits) * 100) : 0;
    const pct300 = totalAreaUnits > 0 ? Math.max(0, 100 - pct600 - pct300x600) : 0;

    return {
      count600,
      count300x600,
      count300,
      totalTiles: placedTiles.length,
      totalAreaUnits,
      pct600,
      pct300x600,
      pct300,
    };
  }, [placedTiles]);

  // Helper to attach current gridRotation & cadStyle metadata to blocks
  const prepareBlocksWithMeta = (blocks: BlueprintTileBlock[]): BlueprintTileBlock[] => {
    return minifyBlueprintBlocks(
      blocks.map((b) => ({
        ...b,
        gridRotation,
        cadStyle,
      }))
    );
  };

  // Apply placed tile ratios directly to pattern components
  const handleApplyRatiosToPattern = () => {
    if (layoutStats.totalTiles === 0) {
      onShowToast('Place some tiles on the grid first!');
      return;
    }

    const prev600 = localComponents.find((c) => c.sizeMm.includes('600 × 600') || c.sizeMm.includes('600X600'));
    const prev300x600 = localComponents.find((c) => c.sizeMm.includes('300 × 600') || c.sizeMm.includes('300X600'));
    const prev300 = localComponents.find((c) => c.sizeMm.includes('300 × 300') || c.sizeMm.includes('300X300'));

    const updatedComponents: PatternTileComponent[] = [
      {
        sizeMm: '600 × 600',
        inches: '24" × 24"',
        ratioPct: layoutStats.pct600,
        sqftPerBox: prev600?.sqftPerBox || 11.62,
        weightPerBoxKg: prev600?.weightPerBoxKg || 28,
        rate: prev600?.rate || 380,
        colorCode: '#2563eb',
      },
      {
        sizeMm: '300 × 600',
        inches: '12" × 24"',
        ratioPct: layoutStats.pct300x600,
        sqftPerBox: prev300x600?.sqftPerBox || 7.70,
        weightPerBoxKg: prev300x600?.weightPerBoxKg || 18.5,
        rate: prev300x600?.rate || 260,
        colorCode: '#d97706',
      },
      {
        sizeMm: '300 × 300',
        inches: '12" × 12"',
        ratioPct: layoutStats.pct300,
        sqftPerBox: prev300?.sqftPerBox || 6.69,
        weightPerBoxKg: prev300?.weightPerBoxKg || 16.5,
        rate: prev300?.rate || 230,
        colorCode: '#059669',
      },
    ];

    const newSubtitle = `600×600 (${layoutStats.pct600}%) + 300×600 (${layoutStats.pct300x600}%) + 300×300 (${layoutStats.pct300}%)`;
    setLocalComponents(updatedComponents);
    setLocalSubtitle(newSubtitle);

    const cleanBlocks = prepareBlocksWithMeta(placedTiles);
    const compactStr = compressBlueprintLayout(cleanBlocks, gridRotation, cadStyle);

    const updatedPattern: TilePattern = {
      id: pattern.id,
      code: pattern.code,
      name: pattern.name,
      subtitle: newSubtitle,
      description: pattern.description || newSubtitle,
      components: updatedComponents,
      layoutType: pattern.layoutType || 'modular3',
      customBlueprintLayout: cleanBlocks,
      ...(compactStr ? { compactBlueprintLayout: compactStr } : {}),
      ...(gridRotation !== 0 ? { blueprintRotation: gridRotation } : {}),
      ...(cadStyle !== 'color' ? { blueprintStyle: cadStyle } : {}),
      blueprintActiveTab: 'layout',
    };
    if (blueprintNotes && blueprintNotes.trim()) {
      updatedPattern.blueprintNotes = blueprintNotes.trim();
    }

    onSavePattern(updatedPattern, false);
    onShowToast(
      `Applied ratios: 600²: ${layoutStats.pct600}%, 300×600: ${layoutStats.pct300x600}%, 300²: ${layoutStats.pct300}%`
    );
  };

  // --- Final Save & Cloud Publish ---
  const handleSaveAndPublish = async (publishToCloud: boolean) => {
    setIsSaving(true);
    try {
      const cleanBlocks = prepareBlocksWithMeta(placedTiles);
      const compactStr = compressBlueprintLayout(cleanBlocks, gridRotation, cadStyle);

      const updatedPattern: TilePattern = {
        id: pattern.id,
        code: pattern.code,
        name: pattern.name,
        subtitle: localSubtitle,
        description: pattern.description || localSubtitle,
        components: localComponents,
        layoutType: pattern.layoutType || 'modular3',
        customBlueprintLayout: cleanBlocks,
        ...(compactStr ? { compactBlueprintLayout: compactStr } : {}),
        ...(gridRotation !== 0 ? { blueprintRotation: gridRotation } : {}),
        ...(cadStyle !== 'color' ? { blueprintStyle: cadStyle } : {}),
        blueprintActiveTab: 'layout',
      };

      if (blueprintNotes && blueprintNotes.trim()) {
        updatedPattern.blueprintNotes = blueprintNotes.trim();
      }

      const ok = await onSavePattern(updatedPattern, publishToCloud);
      if (ok !== false) {
        onShowToast(
          publishToCloud
            ? '☁️ Grid Layout published live to Cloud! All users will see updates.'
            : '✓ Grid Layout saved locally.'
        );
        onClose();
      }
    } catch (e) {
      console.error(e);
      onShowToast('Failed to save blueprint.');
    } finally {
      setIsSaving(false);
    }
  };

  const isBwMode = cadStyle === 'cad-bw';
  const effectivePreviewAngle = gridRotation !== 0 ? gridRotation : paletteTileAngle;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-600 text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 font-extrabold text-xs">
                  {pattern.code}
                </span>
                <h3 className="text-base font-extrabold tracking-tight">
                  Modular Blueprint Studio — Touch & Drop Grid
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Editing blueprint for <span className="text-slate-200 font-bold">{pattern.name}</span>
                {isAdmin ? (
                  <span className="ml-2 text-emerald-400 font-bold">
                    ● Admin Mode ({MASTER_ADMIN_EMAIL})
                  </span>
                ) : (
                  <span className="ml-2 text-amber-400 font-bold">● Preview Mode</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header Bar */}
        <div className="px-5 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-800">
            <Grid className="w-4 h-4 text-amber-600" />
            <span>Touch & Drop Modular Grid Layout</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold">
              {placedTiles.length} tiles
            </span>
            {gridRotation !== 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold">
                {gridRotation}° Diagonal Rotated
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>
              1 Grid Unit = <span className="font-extrabold text-slate-800">300 mm × 300 mm</span>
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Tile Palette & Rotation Controls Toolbar */}
          <div className="p-3 bg-slate-900 rounded-xl text-white space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Tile Palette:</span>
                {PALETTE_TILES.map((tile) => {
                  const isSel = selectedPaletteKey === tile.sizeKey;
                  const iconW = tile.widthUnits === 2 ? 'w-3.5' : 'w-2';
                  const iconH = tile.heightUnits === 2 ? 'h-3.5' : 'h-2';
                  return (
                    <div
                      key={tile.sizeKey}
                      className={`rounded-lg border font-bold text-xs flex items-center overflow-hidden transition-all ${
                        isSel
                          ? 'bg-amber-600 border-amber-300 text-white shadow-md ring-2 ring-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPaletteKey(tile.sizeKey)}
                        draggable
                        onDragStart={() => {
                          setDraggedBlock({ source: 'palette', sizeKey: tile.sizeKey });
                        }}
                        className="px-2.5 py-1.5 flex items-center gap-2 cursor-pointer"
                        title="Click to select tile, then click any grid cell to place (or drag onto grid)"
                      >
                        <span
                          style={{
                            transform: `rotate(${effectivePreviewAngle}deg)`,
                          }}
                          className={`${iconW} ${iconH} rounded-[2px] border border-white/60 transition-transform inline-block shrink-0 ${
                            tile.sizeKey === '600'
                              ? 'bg-blue-400'
                              : tile.sizeKey === '300'
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span>{tile.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">
                          ({tile.widthUnits}×{tile.heightUnits})
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleFlipPaletteTile(e, tile.sizeKey)}
                        className="px-1.5 py-1.5 border-l border-white/15 hover:bg-black/25 text-white/80 hover:text-white transition-colors"
                        title="Rotate this palette tile orientation (0° / 45° / 90°)"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Rotate Palette & Selected Tile Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRotatePalette}
                  className={`px-2.5 py-1.5 rounded-lg font-extrabold text-xs flex items-center gap-1.5 border transition-all ${
                    gridRotation !== 0
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                      : 'bg-slate-800 border-slate-600 text-amber-300 hover:bg-slate-700'
                  }`}
                  title="Rotate Tile Palette & Grid between 0° Straight, 45° Diagonal, and -45° Diagonal"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>
                    Rotate Palette ({gridRotation === 0 ? '0°' : `${gridRotation}°`})
                  </span>
                </button>

                {selectedBlockId && (
                  <>
                    <button
                      type="button"
                      onClick={handleRotateSelected90}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      title="Rotate selected tile 90° (Flip Horizontal / Vertical)"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>90°</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRotateSelected45}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      title="Rotate selected tile by 45°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>45°</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      title="Delete selected tile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setPlacedTiles([])}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1"
                  title="Clear all tiles"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Second Row in Palette Bar: Angle Presets, CAD B&W Style Toggle & 1-Click 45° Pic Pattern */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">Pattern Angle:</span>
                {[
                  { deg: 0, label: '0° Straight' },
                  { deg: 45, label: '45° Diagonal (Pic Style)' },
                  { deg: -45, label: '-45° Diagonal' },
                ].map((opt) => (
                  <button
                    key={opt.deg}
                    type="button"
                    onClick={() => setGridRotation(opt.deg)}
                    className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                      gridRotation === opt.deg
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}

                <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

                <span className="text-[11px] font-bold text-slate-400">Render Style:</span>
                <button
                  type="button"
                  onClick={() => setCadStyle('color')}
                  className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                    cadStyle === 'color'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Color Blueprint
                </button>
                <button
                  type="button"
                  onClick={() => setCadStyle('cad-bw')}
                  className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                    cadStyle === 'cad-bw'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  B&W CAD Line (Pic Style)
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {gridRotation !== 0 && (
                  <button
                    type="button"
                    onClick={() => setClipRoomFrame((v) => !v)}
                    className={`px-2.5 py-1 rounded-md font-bold text-[11px] flex items-center gap-1 border ${
                      clipRoomFrame
                        ? 'bg-emerald-600/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                    title="Toggle between clipped rectangular room frame and unclipped rotated grid"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{clipRoomFrame ? 'Room Frame Clipped' : 'Full Grid View'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLoad45DiagonalPicPreset}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
                  title="Generate the 45° rotated diagonal interlocking pattern matching the reference image"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate 45° Diagonal Pattern (Pic Style)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Instructions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-amber-700 font-extrabold">💡 Touch & Drop:</span>
              <span>
                Select or rotate a tile in the palette above, then <b>tap/click any grid cell</b> to
                place. Tap any placed tile to rotate (<b>45°</b> or <b>90°</b>) or delete.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPlacedTiles(generateDefaultLayout(pattern.code));
                  setGridRotation(0);
                }}
                className="text-amber-800 hover:underline font-bold whitespace-nowrap"
              >
                Reload 0° Preset
              </button>
              <button
                type="button"
                onClick={handleLoad45DiagonalPicPreset}
                className="text-indigo-700 hover:underline font-bold whitespace-nowrap"
              >
                Reload 45° Pic Preset
              </button>
            </div>
          </div>

          {/* Interactive Modular Grid Canvas */}
          <div className="overflow-x-auto p-4 bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-inner flex flex-col items-center">
            {/* Outer Room Frame Container */}
            <div
              className={`relative flex items-center justify-center rounded-lg transition-all ${
                isBwMode ? 'bg-white border-[3px] border-neutral-800' : 'bg-slate-950 border-2 border-slate-500'
              } ${gridRotation !== 0 && clipRoomFrame ? 'overflow-hidden shadow-2xl' : 'p-2'}`}
              style={{
                width: gridRotation !== 0 && !clipRoomFrame ? '720px' : `${GRID_COLS * 56}px`,
                height: gridRotation !== 0 && !clipRoomFrame ? '720px' : `${GRID_ROWS * 56}px`,
              }}
            >
              {/* Background Repeating Seamless Tiles for Clipped 45° Room Frame Corners */}
              {gridRotation !== 0 && clipRoomFrame && placedTiles.length > 0 && (
                <div
                  className="absolute pointer-events-none select-none"
                  style={{
                    width: `${GRID_COLS * 56}px`,
                    height: `${GRID_ROWS * 56}px`,
                    transform: `rotate(${gridRotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                >
                  {[-1, 0, 1].map((ox) =>
                    [-1, 0, 1].map((oy) => {
                      if (ox === 0 && oy === 0) return null;
                      return (
                        <div
                          key={`ghost-${ox}-${oy}`}
                          className="absolute inset-0"
                          style={{
                            transform: `translate(${ox * GRID_COLS * 56}px, ${oy * GRID_ROWS * 56}px)`,
                          }}
                        >
                          {placedTiles.map((tile) => {
                            const is600 = tile.sizeKey === '600';
                            const is300 = tile.sizeKey === '300';
                            const bgClass = isBwMode
                              ? 'bg-white text-neutral-800 border-neutral-800'
                              : is600
                              ? 'bg-blue-600/90 text-white border-blue-400'
                              : is300
                              ? 'bg-emerald-600/90 text-white border-emerald-400'
                              : 'bg-amber-600/90 text-white border-amber-400';

                            return (
                              <div
                                key={`g-${ox}-${oy}-${tile.id}`}
                                style={{
                                  left: `${tile.x * 56}px`,
                                  top: `${tile.y * 56}px`,
                                  width: `${tile.widthUnits * 56}px`,
                                  height: `${tile.heightUnits * 56}px`,
                                  transform: tile.rotation ? `rotate(${tile.rotation}deg)` : undefined,
                                }}
                                className={`absolute border-[1.5px] flex flex-col items-center justify-center p-1 ${bgClass} ${
                                  isBwMode ? 'rounded-none' : 'rounded-md'
                                }`}
                              />
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Primary Interactive 10x8 Grid Plane (Rotatable to 0°, 45°, -45°) */}
              <div
                className="relative select-none transition-transform duration-300"
                style={{
                  width: `${GRID_COLS * 56}px`,
                  height: `${GRID_ROWS * 56}px`,
                  transform: gridRotation !== 0 ? `rotate(${gridRotation}deg)` : undefined,
                  transformOrigin: 'center center',
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggedBlock || !hoverCell) return;
                  handlePlaceTile(
                    hoverCell.col,
                    hoverCell.row,
                    draggedBlock.sizeKey,
                    draggedBlock.source === 'grid' ? draggedBlock.id : undefined
                  );
                  setDraggedBlock(null);
                }}
              >
                {/* Grid Lines Overlay */}
                <div
                  className="absolute inset-0 grid pointer-events-none"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
                  }}
                >
                  {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`border border-dashed ${
                        isBwMode ? 'border-slate-300' : 'border-slate-800/80'
                      }`}
                    />
                  ))}
                </div>

                {/* Clickable Grid Cells for Touch/Click Placement */}
                <div
                  className="absolute inset-0 grid"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
                  }}
                >
                  {Array.from({ length: GRID_ROWS }).map((_, r) =>
                    Array.from({ length: GRID_COLS }).map((_, c) => (
                      <div
                        key={`cell-${c}-${r}`}
                        onMouseEnter={() => setHoverCell({ col: c, row: r })}
                        onClick={() => {
                          handlePlaceTile(c, r, selectedPaletteKey);
                        }}
                        className="hover:bg-amber-400/25 cursor-pointer transition-colors"
                      />
                    ))
                  )}
                </div>

                {/* Placed Tile Blocks */}
                {placedTiles.map((tile) => {
                  const isSelected = selectedBlockId === tile.id;
                  const is600 = tile.sizeKey === '600';
                  const is300 = tile.sizeKey === '300';
                  const bgClass = isBwMode
                    ? 'bg-white text-neutral-900 border-neutral-800 hover:bg-amber-50/60'
                    : is600
                    ? 'bg-blue-600/90 text-white border-blue-400'
                    : is300
                    ? 'bg-emerald-600/90 text-white border-emerald-400'
                    : 'bg-amber-600/90 text-white border-amber-400';

                  return (
                    <div
                      key={tile.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlockId(tile.id);
                      }}
                      draggable
                      onDragStart={() => {
                        setDraggedBlock({
                          source: 'grid',
                          sizeKey: tile.sizeKey,
                          id: tile.id,
                        });
                      }}
                      style={{
                        left: `${tile.x * 56}px`,
                        top: `${tile.y * 56}px`,
                        width: `${tile.widthUnits * 56}px`,
                        height: `${tile.heightUnits * 56}px`,
                        transform: tile.rotation ? `rotate(${tile.rotation}deg)` : undefined,
                      }}
                      className={`absolute border-[2px] cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-1 transition-all select-none ${bgClass} ${
                        isBwMode ? 'rounded-none shadow-none' : 'rounded-md shadow-md'
                      } ${
                        isSelected
                          ? 'ring-4 ring-amber-400 z-20 scale-[1.02]'
                          : 'z-10'
                      }`}
                    >
                      <span
                        className={`font-extrabold text-[10px] leading-tight text-center ${
                          isBwMode ? 'text-neutral-700' : 'drop-shadow'
                        }`}
                      >
                        {tile.sizeKey === '600'
                          ? '600×600'
                          : tile.sizeKey === '300'
                          ? '300²'
                          : '300×600'}
                      </span>
                      <span
                        className={`text-[8.5px] font-mono ${
                          isBwMode ? 'text-neutral-400' : 'opacity-80'
                        }`}
                      >
                        {tile.widthUnits * 300}×{tile.heightUnits * 300}
                        {tile.rotation ? ` (${tile.rotation}°)` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Real-time Layout Ratio & Statistics Summary */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Live Area Ratio & Placed Tile Counts
                </h4>
              </div>
              <button
                type="button"
                onClick={handleApplyRatiosToPattern}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Placed Ratios to Pattern Calculator</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">600×600 TILES</span>
                <span className="text-lg font-black text-blue-600">{layoutStats.count600} pcs</span>
                <span className="text-xs font-bold text-blue-900 block mt-0.5">
                  {layoutStats.pct600}% area share
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">300×600 TILES</span>
                <span className="text-lg font-black text-amber-600">
                  {layoutStats.count300x600} pcs
                </span>
                <span className="text-xs font-bold text-amber-900 block mt-0.5">
                  {layoutStats.pct300x600}% area share
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">300×300 TILES</span>
                <span className="text-lg font-black text-emerald-600">
                  {layoutStats.count300} pcs
                </span>
                <span className="text-xs font-bold text-emerald-900 block mt-0.5">
                  {layoutStats.pct300}% area share
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">
                  TOTAL TILES PLACED
                </span>
                <span className="text-lg font-black text-slate-900">
                  {layoutStats.totalTiles} pcs
                </span>
                <span className="text-xs font-bold text-slate-600 block mt-0.5">
                  {(layoutStats.totalAreaUnits * 0.09).toFixed(2)} m² coverage
                </span>
              </div>
            </div>
          </div>

          {/* Technical Blueprint Notes Field */}
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Architectural & Installation Notes (Optional)
            </label>
            <input
              type="text"
              value={blueprintNotes}
              onChange={(e) => setBlueprintNotes(e.target.value)}
              placeholder="e.g. 45° diagonal laying course, recommended 3mm spacer joint"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Ultra-lightweight compressed layout (&lt;1 KB) syncs rotation &amp; CAD view to all users.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleSaveAndPublish(true)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isSaving ? 'Publishing...' : 'Save & Publish to Cloud (All Users)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSaveAndPublish(false)}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Save Local Only</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
