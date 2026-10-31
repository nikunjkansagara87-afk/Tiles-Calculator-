import React, { useState, useEffect } from 'react';
import { TilePattern, PatternTileComponent } from '../types';
import { PATTERNS_LIST } from '../data/patterns';
import { isMasterAdmin, MASTER_ADMIN_EMAIL } from '../firebase';
import { User } from 'firebase/auth';
import {
  Upload,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  AlertCircle,
  FileSpreadsheet,
  CloudUpload,
  Layers,
  Sparkles,
  Info,
  X,
  LogIn,
  Sliders,
} from 'lucide-react';

interface PatternManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patterns: TilePattern[];
  currentUser: User | null;
  onLogin: () => void;
  onSavePatternsToCloud: (newPatterns: TilePattern[]) => Promise<boolean>;
  onShowToast: (msg: string) => void;
  initialEditingPatternId?: string | null;
}

export const PatternManagerModal: React.FC<PatternManagerModalProps> = ({
  isOpen,
  onClose,
  patterns,
  currentUser,
  onLogin,
  onSavePatternsToCloud,
  onShowToast,
  initialEditingPatternId,
}) => {
  const isAdmin = isMasterAdmin(currentUser);

  // Local working copy of patterns list
  const [localPatterns, setLocalPatterns] = useState<TilePattern[]>(patterns);
  const [activeTab, setActiveTab] = useState<'list' | 'editor' | 'csv'>('list');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // Editor form state for creating or editing a single pattern
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formSubtitle, setFormSubtitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formLayoutType, setFormLayoutType] = useState<TilePattern['layoutType']>('modular3');

  // Modular components form state
  const [pct600, setPct600] = useState<number>(44);
  const [pct300x600, setPct300x600] = useState<number>(39);
  const [pct300, setPct300] = useState<number>(17);

  const [sqftFactor600, setSqftFactor600] = useState<number>(11.62);
  const [sqftFactor300x600, setSqftFactor300x600] = useState<number>(7.70);
  const [sqftFactor300, setSqftFactor300] = useState<number>(6.69);

  const [rate600, setRate600] = useState<number>(380);
  const [rate300x600, setRate300x600] = useState<number>(260);
  const [rate300, setRate300] = useState<number>(230);

  // CSV paste input
  const [csvText, setCsvText] = useState<string>('');

  useEffect(() => {
    setLocalPatterns(patterns);
  }, [patterns, isOpen]);

  useEffect(() => {
    if (initialEditingPatternId) {
      handleStartEdit(initialEditingPatternId);
    }
  }, [initialEditingPatternId]);

  if (!isOpen) return null;

  const totalPercentage = Math.round((pct600 + pct300x600 + pct300) * 100) / 100;
  const is100Pct = Math.abs(totalPercentage - 100) < 0.01;

  const handleStartCreate = () => {
    setEditingId(null);
    const nextNum = localPatterns.length + 1;
    setFormCode(`P.${nextNum}`);
    setFormName(`Custom Modular Design ${nextNum}`);
    setFormSubtitle('600×600 (40%) + 300×600 (40%) + 300×300 (20%)');
    setFormDescription('Architectural paver layout configured by master admin.');
    setFormLayoutType('modular3');
    setPct600(40);
    setPct300x600(40);
    setPct300(20);
    setSqftFactor600(11.62);
    setSqftFactor300x600(7.70);
    setSqftFactor300(6.69);
    setRate600(380);
    setRate300x600(260);
    setRate300(230);
    setActiveTab('editor');
  };

  const handleStartEdit = (patternId: string) => {
    const target = localPatterns.find((p) => p.id === patternId);
    if (!target) return;

    setEditingId(target.id);
    setFormCode(target.code);
    setFormName(target.name);
    setFormSubtitle(target.subtitle);
    setFormDescription(target.description);
    setFormLayoutType(target.layoutType || 'modular3');

    const c600 = target.components.find((c) => c.sizeMm.includes('600 × 600') || c.sizeMm.includes('600X600'));
    const c300x600 = target.components.find((c) => c.sizeMm.includes('300 × 600') || c.sizeMm.includes('300X600'));
    const c300 = target.components.find((c) => c.sizeMm.includes('300 × 300') || c.sizeMm.includes('300X300'));

    setPct600(c600 ? c600.ratioPct : 0);
    setPct300x600(c300x600 ? c300x600.ratioPct : 0);
    setPct300(c300 ? c300.ratioPct : 0);

    setSqftFactor600(c600?.sqftPerBox || 11.62);
    setSqftFactor300x600(c300x600?.sqftPerBox || 7.70);
    setSqftFactor300(c300?.sqftPerBox || 6.69);

    setRate600(c600?.rate || 380);
    setRate300x600(c300x600?.rate || 260);
    setRate300(c300?.rate || 230);

    setActiveTab('editor');
  };

  // Builds a clean TilePattern with zero undefined properties
  const buildEditedPatternItem = (): TilePattern | null => {
    if (!formCode.trim()) {
      onShowToast('Please provide a Pattern Code (e.g. P.19)');
      return null;
    }
    if (!formName.trim()) {
      onShowToast('Please provide a Pattern Name');
      return null;
    }
    if (!is100Pct) {
      onShowToast(`Percentage shares must sum to 100%! Current sum: ${totalPercentage}%`);
      return null;
    }

    const newComponents: PatternTileComponent[] = [];
    if (pct600 > 0) {
      newComponents.push({
        sizeMm: '600 × 600 mm',
        inches: '24" × 24"',
        ratioPct: pct600,
        sqftPerBox: sqftFactor600 || 11.62,
        weightPerBoxKg: 28.0,
        rate: rate600 || 380,
        colorCode: 'blue',
      });
    }
    if (pct300x600 > 0) {
      newComponents.push({
        sizeMm: '300 × 600 mm',
        inches: '12" × 24"',
        ratioPct: pct300x600,
        sqftPerBox: sqftFactor300x600 || 7.70,
        weightPerBoxKg: 18.0,
        rate: rate300x600 || 260,
        colorCode: 'amber',
      });
    }
    if (pct300 > 0) {
      newComponents.push({
        sizeMm: '300 × 300 mm',
        inches: '12" × 12"',
        ratioPct: pct300,
        sqftPerBox: sqftFactor300 || 6.69,
        weightPerBoxKg: 16.0,
        rate: rate300 || 230,
        colorCode: 'emerald',
      });
    }

    const autoSubtitle = `${pct600 > 0 ? `600×600 (${pct600}%) ` : ''}${
      pct300x600 > 0 ? `+ 300×600 (${pct300x600}%) ` : ''
    }${pct300 > 0 ? `+ 300×300 (${pct300}%)` : ''}`.trim();

    const targetExisting = editingId ? localPatterns.find((p) => p.id === editingId) : null;

    const updatedItem: TilePattern = {
      id: editingId || `custom-p-${Date.now()}`,
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      subtitle: formSubtitle.trim() || autoSubtitle,
      description: formDescription.trim() || `Modular paving pattern ${formCode}`,
      layoutType: formLayoutType || 'modular3',
      components: newComponents,
    };

    if (targetExisting?.customBlueprintLayout && targetExisting.customBlueprintLayout.length > 0) {
      updatedItem.customBlueprintLayout = targetExisting.customBlueprintLayout;
    }
    if (targetExisting?.compactBlueprintLayout) {
      updatedItem.compactBlueprintLayout = targetExisting.compactBlueprintLayout;
    }
    if (targetExisting?.blueprintNotes) {
      updatedItem.blueprintNotes = targetExisting.blueprintNotes;
    }
    if (targetExisting?.blueprintActiveTab) {
      updatedItem.blueprintActiveTab = targetExisting.blueprintActiveTab;
    }

    return updatedItem;
  };

  const handleSaveEditorForm = async (publishImmediately = false) => {
    const updatedItem = buildEditedPatternItem();
    if (!updatedItem) return;

    const nextList = editingId
      ? localPatterns.map((p) => (p.id === editingId ? updatedItem : p))
      : [...localPatterns, updatedItem];

    setLocalPatterns(nextList);

    if (publishImmediately) {
      setIsSaving(true);
      try {
        const ok = await onSavePatternsToCloud(nextList);
        if (ok) {
          setActiveTab('list');
        }
      } finally {
        setIsSaving(false);
      }
    } else {
      onShowToast(`Pattern ${updatedItem.code} staged! Click "Publish Patterns to Cloud" to sync live.`);
      setActiveTab('list');
    }
  };

  const handleDeletePattern = (id: string, code: string) => {
    if (localPatterns.length <= 1) {
      onShowToast('Cannot delete the last remaining pattern.');
      return;
    }
    setLocalPatterns((prev) => prev.filter((p) => p.id !== id));
    onShowToast(`Removed ${code}. Click "Publish Patterns to Cloud" to apply.`);
  };

  const handleResetToFactoryStandards = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      onShowToast('Click "Confirm Reset" again to restore P.1–P.18 factory defaults.');
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setConfirmReset(false);
    setLocalPatterns(PATTERNS_LIST);
    onShowToast('Reset to factory standard P.1 through P.18. Click "Publish Patterns to Cloud" to sync.');
  };

  // CSV Import Parser
  const handleParseCsv = () => {
    if (!csvText.trim()) {
      onShowToast('Please paste CSV text');
      return;
    }

    try {
      const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
      const parsedPatterns: TilePattern[] = [];

      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim().replace(/"/g, ''));
        if (parts.length >= 4) {
          const code = parts[0].toUpperCase();
          if (code.toLowerCase().includes('pattern') || code.toLowerCase().includes('size')) continue;

          const p600 = parseFloat(parts[1].replace('%', '')) || 0;
          const p300x600 = parseFloat(parts[2].replace('%', '')) || 0;
          const p300 = parseFloat(parts[3].replace('%', '')) || 0;
          const name = parts[4] || `Modular Layout ${code}`;

          if (p600 + p300x600 + p300 > 0) {
            const comps: PatternTileComponent[] = [];
            if (p600 > 0) {
              comps.push({
                sizeMm: '600 × 600 mm',
                inches: '24" × 24"',
                ratioPct: p600,
                sqftPerBox: 11.62,
                weightPerBoxKg: 28.0,
                rate: 380,
                colorCode: 'blue',
              });
            }
            if (p300x600 > 0) {
              comps.push({
                sizeMm: '300 × 600 mm',
                inches: '12" × 24"',
                ratioPct: p300x600,
                sqftPerBox: 7.70,
                weightPerBoxKg: 18.0,
                rate: 260,
                colorCode: 'amber',
              });
            }
            if (p300 > 0) {
              comps.push({
                sizeMm: '300 × 300 mm',
                inches: '12" × 12"',
                ratioPct: p300,
                sqftPerBox: 6.69,
                weightPerBoxKg: 16.0,
                rate: 230,
                colorCode: 'emerald',
              });
            }

            parsedPatterns.push({
              id: 'imp-' + code.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now(),
              code,
              name,
              subtitle: `${p600 > 0 ? `600×600 (${p600}%) ` : ''}${
                p300x600 > 0 ? `+ 300×600 (${p300x600}%) ` : ''
              }${p300 > 0 ? `+ 300×300 (${p300}%)` : ''}`.trim(),
              description: `Imported modular pattern ${code}`,
              layoutType: p600 === 0 ? 'runner' : 'modular3',
              components: comps,
            });
          }
        }
      }

      if (parsedPatterns.length === 0) {
        onShowToast('Could not find valid pattern rows in the pasted CSV.');
        return;
      }

      setLocalPatterns((prev) => {
        const map = new Map<string, TilePattern>();
        prev.forEach((p) => map.set(p.code, p));
        parsedPatterns.forEach((p) => map.set(p.code, p));
        return Array.from(map.values());
      });

      onShowToast(`Successfully imported ${parsedPatterns.length} patterns! Click "Publish Patterns to Cloud" to sync live.`);
      setActiveTab('list');
      setCsvText('');
    } catch (e) {
      console.error(e);
      onShowToast('Error parsing CSV format. Please check structure.');
    }
  };

  // Publish all patterns to Cloud Firestore (/settings/patterns)
  const handlePublishToCloud = async () => {
    if (!isAdmin) {
      onShowToast(`Only Master Admin (${MASTER_ADMIN_EMAIL}) can publish patterns.`);
      return;
    }

    let listToPublish = localPatterns;

    // If the admin is currently inside the Create/Edit tab, automatically include their active form edits!
    if (activeTab === 'editor' && formCode.trim()) {
      const editedItem = buildEditedPatternItem();
      if (!editedItem) return;
      listToPublish = editingId
        ? localPatterns.map((p) => (p.id === editingId ? editedItem : p))
        : [...localPatterns, editedItem];
      setLocalPatterns(listToPublish);
    }

    setIsSaving(true);
    try {
      const ok = await onSavePatternsToCloud(listToPublish);
      if (ok) {
        onShowToast('✓ All patterns published to Cloud Firestore! All users will see these changes live.');
        setActiveTab('list');
      }
    } catch (e) {
      console.error(e);
      onShowToast('Failed to publish patterns to Cloud.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight flex items-center gap-2">
                <span>Modular Pattern Studio & Uploader</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono border border-amber-500/30">
                  Admin Only
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Upload new patterns, edit existing ratios, or import from Google Sheet / CSV
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

        {/* Auth Barrier Notice if Not Logged in as Master Admin */}
        {!isAdmin ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold">
              🔒
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="font-extrabold text-slate-900 text-base">
                Owner Authentication Required
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Adding and modifying patterns affects live production calculations for all users and clients. Please sign in with the authorized admin account:
              </p>
              <div className="mt-2.5 py-1 px-3 rounded-lg bg-slate-100 border border-slate-300 font-mono text-xs font-bold text-slate-900 inline-block">
                {MASTER_ADMIN_EMAIL}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={onLogin}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with Google ({MASTER_ADMIN_EMAIL})</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 shrink-0 text-xs font-bold">
              <div className="flex gap-1 overflow-x-auto py-1">
                <button
                  onClick={() => setActiveTab('list')}
                  className={`py-2 px-3.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'list'
                      ? 'bg-white text-amber-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Patterns ({localPatterns.length})</span>
                </button>
                <button
                  onClick={() => {
                    handleStartCreate();
                    setActiveTab('editor');
                  }}
                  className={`py-2 px-3.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'editor' && !editingId
                      ? 'bg-white text-amber-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create / Edit Pattern</span>
                </button>
                <button
                  onClick={() => setActiveTab('csv')}
                  className={`py-2 px-3.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'csv'
                      ? 'bg-white text-amber-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Upload from CSV</span>
                </button>
              </div>

              <div className="flex items-center gap-2 py-1">
                <button
                  onClick={handleResetToFactoryStandards}
                  className={`text-[11px] flex items-center gap-1 font-semibold transition-colors px-2 py-1 rounded ${
                    confirmReset
                      ? 'bg-rose-600 text-white font-extrabold'
                      : 'text-slate-500 hover:text-rose-600'
                  }`}
                  title="Reset to 18 authentic factory patterns"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{confirmReset ? '⚠ Click to Confirm Reset' : 'Reset Factory Defaults'}</span>
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* TAB 1: ALL PATTERNS LIST */}
              {activeTab === 'list' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Active Patterns in System ({localPatterns.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Click "Edit" on any pattern to modify its name, ratios, blueprint, or rates, or create new designs.
                      </p>
                    </div>
                    <button
                      onClick={handleStartCreate}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Pattern</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto border border-slate-200 rounded-xl">
                    {localPatterns.map((pat) => {
                      const c600 = pat.components.find((c) => c.sizeMm.includes('600 × 600') || c.sizeMm.includes('600X600'));
                      const c300x600 = pat.components.find((c) => c.sizeMm.includes('300 × 600') || c.sizeMm.includes('300X600'));
                      const c300 = pat.components.find((c) => c.sizeMm.includes('300 × 300') || c.sizeMm.includes('300X300'));

                      return (
                        <div
                          key={pat.id}
                          className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-md bg-amber-600 text-white font-extrabold text-xs font-mono">
                              {pat.code}
                            </span>
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                                <span>{pat.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({pat.layoutType || 'modular3'})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {pat.subtitle}
                              </div>
                            </div>
                          </div>

                          {/* Share Pills */}
                          <div className="flex items-center gap-2 font-tabular">
                            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                              600²: {c600 ? c600.ratioPct : 0}%
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                              300×600: {c300x600 ? c300x600.ratioPct : 0}%
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                              300²: {c300 ? c300.ratioPct : 0}%
                            </span>

                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleStartEdit(pat.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="Edit this pattern"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePattern(pat.id, pat.code)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-rose-600 transition-colors"
                                title="Delete this pattern"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: PATTERN EDITOR FORM */}
              {activeTab === 'editor' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {editingId ? `Editing Pattern ${formCode}` : 'Create Brand New Pattern'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Configure exact percentage proportions across the 3 modular tile sizes and attach an optional B&W Blueprint.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('list')}
                      className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                    >
                      Back to List
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Pattern Code</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. P.19"
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-extrabold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Pattern Name</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Grand Courtyard Trio"
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Layout Type</label>
                      <select
                        value={formLayoutType}
                        onChange={(e) => setFormLayoutType(e.target.value as TilePattern['layoutType'])}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        <option value="modular3">3-Size Modular Interlock</option>
                        <option value="runner">2-Size / 3-Size Runner Bond</option>
                        <option value="basketweave">Basketweave / Checker Split</option>
                        <option value="versailles">Versailles Courtyard Layout</option>
                        <option value="pinwheel">Pinwheel Interlock</option>
                        <option value="slabs">Large Field Slabs</option>
                        <option value="industrial">High-Traffic Industrial</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">Description / Usage</label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="e.g. High-durability interlocking formula for commercial verandas"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  {/* Component Breakdown Card with live % sum validator */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                        Tile Ratios & Packaging Factors
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">Total Ratio:</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-extrabold text-xs font-tabular ${
                            is100Pct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {totalPercentage}% {is100Pct ? '✓ Valid (100%)' : '⚠ Must Equal 100%'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* 600x600 */}
                      <div className="p-3 rounded-lg bg-white border border-blue-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-900 text-xs">600×600 mm</span>
                          <span className="text-[10px] text-blue-600 font-mono">24"×24"</span>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Area Share (%)</label>
                          <input
                            type="number"
                            value={pct600}
                            min="0"
                            max="100"
                            step="1"
                            onChange={(e) => setPct600(parseFloat(e.target.value) || 0)}
                            className="w-full mt-0.5 px-2 py-1 rounded border border-blue-300 font-extrabold text-blue-900 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[9px] text-slate-400">Sqft/Box</label>
                            <input
                              type="number"
                              value={sqftFactor600}
                              step="0.01"
                              onChange={(e) => setSqftFactor600(parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-0.5 rounded border border-slate-200 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400">Rate (₹/Box)</label>
                            <input
                              type="number"
                              value={rate600}
                              step="1"
                              onChange={(e) => setRate600(parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-0.5 rounded border border-slate-200 text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 300x600 */}
                      <div className="p-3 rounded-lg bg-white border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 text-xs">300×600 mm</span>
                          <span className="text-[10px] text-amber-600 font-mono">12"×24"</span>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Area Share (%)</label>
                          <input
                            type="number"
                            value={pct300x600}
                            min="0"
                            max="100"
                            step="1"
                            onChange={(e) => setPct300x600(parseFloat(e.target.value) || 0)}
                            className="w-full mt-0.5 px-2 py-1 rounded border border-amber-300 font-extrabold text-amber-900 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[9px] text-slate-400">Sqft/Box</label>
                            <input
                              type="number"
                              value={sqftFactor300x600}
                              step="0.01"
                              onChange={(e) => setSqftFactor300x600(parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-0.5 rounded border border-slate-200 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400">Rate (₹/Box)</label>
                            <input
                              type="number"
                              value={rate300x600}
                              step="1"
                              onChange={(e) => setRate300x600(parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-0.5 rounded border border-slate-200 text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 300x300 */}
                      <div className="p-3 rounded-lg bg-white border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 text-xs">300×300 mm</span>
                          <span className="text-[10px] text-emerald-600 font-mono">12"×12"</span>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Area Share (%)</label>
                          <input
                            type="number"
                            value={pct300}
                            min="0"
                            max="100"
                            step="1"
                            onChange={(e) => setPct300(parseFloat(e.target.value) || 0)}
                            className="w-full mt-0.5 px-2 py-1 rounded border border-emerald-300 font-extrabold text-emerald-900 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[9px] text-slate-400">Sqft/Box</label>
                            <input
                              type="number"
                              value={sqftFactor300}
                              step="0.01"
                              onChange={(e) => setSqftFactor300(parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-0.5 rounded border border-slate-200 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400">Rate (₹/Box)</label>
                            <input
                              type="number"
                              value={rate300}
                              step="1"
                              onChange={(e) => setRate300(parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-0.5 rounded border border-slate-200 text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEditorForm(false)}
                      disabled={!is100Pct || isSaving}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{editingId ? 'Stage Pattern Update' : 'Add to Staging List'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEditorForm(true)}
                      disabled={!is100Pct || isSaving}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5"
                    >
                      <CloudUpload className="w-4 h-4" />
                      <span>{isSaving ? 'Publishing...' : 'Save & Publish to Cloud Now'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: CSV IMPORT */}
              {activeTab === 'csv' && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Bulk Upload Patterns via CSV or Google Sheet
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Paste rows directly from your Google Sheet or export file. Expected columns:
                      <code className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono">
                        Pattern Code, 600×600 %, 300×600 %, 300×300 %, Name (optional)
                      </code>
                    </p>
                  </div>

                  <textarea
                    rows={8}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder={`P.19, 40%, 35%, 25%, Heavy Commercial Courtyard\nP.20, 50%, 50%, 0%, Twin Slab Paving\nP.21, 0%, 70%, 30%, Walkway Promenade`}
                    className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setCsvText(
                          `P.19, 40%, 35%, 25%, High-Traffic Promenade\nP.20, 50%, 50%, 0%, Large Format Duo\nP.21, 0%, 70%, 30%, Resort Corridor Walkway`
                        )
                      }
                      className="text-[11px] text-amber-700 hover:underline font-semibold"
                    >
                      Paste Sample Rows
                    </button>

                    <button
                      type="button"
                      onClick={handleParseCsv}
                      className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Process & Import Rows</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Cloud Publish Action */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-slate-500">
                <span>Staging: </span>
                <b className="text-slate-800">{localPatterns.length} Patterns</b>
                <span className="mx-1">·</span>
                <span>Clicking publish syncs immediately to all users via Firestore</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePublishToCloud}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{isSaving ? 'Publishing...' : 'Publish Patterns to Cloud'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
