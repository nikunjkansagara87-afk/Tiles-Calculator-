import React, { useState, useEffect } from 'react';
import { CompanyBrandConfig, PartnerBrandLogo, AccentColorName } from '../types';
import {
  Shield,
  Building,
  Palette,
  RotateCcw,
  Upload,
  Check,
  Crown,
  Lock,
  LogIn,
  AlertCircle,
  CloudUpload,
  Image as ImageIcon,
  Layout,
  Plus,
  Trash2,
  Stamp,
  Sparkles,
  Globe,
  FileCheck,
  Layers,
  EyeOff,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { isMasterAdmin, MASTER_ADMIN_EMAIL } from '../firebase';
import {
  DEFAULT_BRAND_CONFIG,
  ACCENT_PALETTES,
  WORKSPACE_BACKGROUND_PRESETS,
} from '../utils/formatters';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: CompanyBrandConfig;
  currentUser: User | null;
  onLogin: () => void;
  onSaveBrandToCloud: (newBrand: CompanyBrandConfig) => Promise<boolean>;
  onShowToast: (msg: string) => void;
  onOpenPatternManager?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  brand,
  currentUser,
  onLogin,
  onSaveBrandToCloud,
  onShowToast,
  onOpenPatternManager,
}) => {
  const isAdmin = isMasterAdmin(currentUser);

  // Form state
  const [form, setForm] = useState<CompanyBrandConfig>(brand);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'logos' | 'interface' | 'wallpaper' | 'terms'
  >('logos');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // Partner logo addition inputs
  const [newPartnerName, setNewPartnerName] = useState<string>('');
  const [newPartnerBadge, setNewPartnerBadge] = useState<string>('');
  const [newPartnerLogoUrl, setNewPartnerLogoUrl] = useState<string>('');

  useEffect(() => {
    setForm({
      ...DEFAULT_BRAND_CONFIG,
      ...brand,
      partnerLogos: brand.partnerLogos || [],
    });
  }, [brand, isOpen]);

  if (!isOpen) return null;

  // File upload helper -> lightweight compressed base64 data URL so Firestore publishing is fast & under 1MB
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (base64: string) => void,
    maxSizeMB: number = 2.0
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      onShowToast(`Image size exceeds ${maxSizeMB}MB limit. Please use a smaller file or URL.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      if (!raw || !raw.startsWith('data:image/') || raw.length < 25000) {
        onLoaded(raw);
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 420;
          let w = img.width || 420;
          let h = img.height || 300;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            onLoaded(raw);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/webp', 0.78);
          onLoaded(compressed.length < raw.length ? compressed : raw);
        } catch {
          onLoaded(raw);
        }
      };
      img.onerror = () => onLoaded(raw);
      img.src = raw;
    };
    reader.readAsDataURL(file);
  };

  const handleAddPartnerLogo = () => {
    if (!newPartnerName.trim()) {
      onShowToast('Please enter a Brand or Division name');
      return;
    }
    const newPartner: PartnerBrandLogo = {
      id: 'partner-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      name: newPartnerName.trim(),
      badgeText: newPartnerBadge.trim() || undefined,
      logoUrl: newPartnerLogoUrl.trim(),
    };
    setForm((prev) => ({
      ...prev,
      partnerLogos: [...(prev.partnerLogos || []), newPartner],
    }));
    setNewPartnerName('');
    setNewPartnerBadge('');
    setNewPartnerLogoUrl('');
    onShowToast(`Added "${newPartner.name}" to Brand Showcase`);
  };

  const handleRemovePartnerLogo = (id: string) => {
    setForm((prev) => ({
      ...prev,
      partnerLogos: (prev.partnerLogos || []).filter((p) => p.id !== id),
    }));
  };

  const handlePublish = async () => {
    if (!isAdmin) {
      onShowToast(`Only ${MASTER_ADMIN_EMAIL} can publish changes`);
      return;
    }
    setIsSaving(true);
    try {
      const success = await onSaveBrandToCloud(form);
      if (success) {
        onShowToast('✓ Brand, Logos & App Interface published live for all users!');
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      onShowToast('Click "Reset Defaults" again to confirm resetting brand & theme.');
      setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    setConfirmReset(false);
    setForm(DEFAULT_BRAND_CONFIG);
    onShowToast('Reset to default template. Click Publish to apply globally.');
  };

  const selectedAccent = ACCENT_PALETTES[form.accentColor || 'amber'] || ACCENT_PALETTES.amber;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 no-print">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Master Admin Interface, Logos & Theme Studio
                </h3>
                {isAdmin ? (
                  <span className="text-[10px] font-extrabold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                    Verified Admin
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                    Restricted
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Customize app interface, brand logos, colors, wallpapers & invoice stamp — synced live to all users
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-2xl leading-none px-2"
          >
            &times;
          </button>
        </div>

        {/* Authorization Gate */}
        {!isAdmin ? (
          <div className="p-6 sm:p-8 space-y-4 text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-extrabold text-slate-900">
                Master Admin Login Required
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Customizing the App Interface, Brand Logos, Themes, and Quotation Stamp affects all users live and is restricted exclusively to:
              </p>
              <div className="mt-2.5 py-1.5 px-3 rounded-lg bg-slate-100 border border-slate-300 font-mono text-xs font-extrabold text-slate-900 inline-block">
                {MASTER_ADMIN_EMAIL}
              </div>
            </div>

            {currentUser && currentUser.email ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  Currently signed in as <b>{currentUser.email}</b> (Standard User). Please sign in with <b>{MASTER_ADMIN_EMAIL}</b> to unlock the Studio.
                </span>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with Google ({MASTER_ADMIN_EMAIL})</span>
              </button>
            </div>
          </div>
        ) : (
          /* Authorized Master Admin Studio */
          <>
            {/* Live Preview Strip */}
            <div
              className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0"
              style={{
                backgroundImage: form.themeGradient || DEFAULT_BRAND_CONFIG.themeGradient,
              }}
            >
              <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-white">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Preview"
                    className="h-7 w-7 object-contain bg-white rounded p-0.5"
                  />
                ) : (
                  <div
                    className={`h-7 w-7 rounded flex items-center justify-center font-extrabold text-xs text-white ${selectedAccent.bgSolid}`}
                  >
                    {form.logoInitials || 'NK'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-extrabold leading-tight">{form.companyName}</div>
                  <div className="text-[10px] text-slate-300 leading-tight truncate max-w-[240px]">
                    {form.tagline}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 bg-black/30 px-2.5 py-1 rounded-lg">
                  Accent: {selectedAccent.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 bg-black/30 px-2.5 py-1 rounded-lg">
                  Partners: {(form.partnerLogos || []).length} Logos
                </span>
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 text-xs font-bold gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('logos')}
                className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'logos'
                    ? 'border-amber-600 text-amber-800 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>1. Brand Logos & Stamp</span>
              </button>

              <button
                onClick={() => setActiveTab('interface')}
                className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'interface'
                    ? 'border-amber-600 text-amber-800 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>2. App Interface & Colors</span>
              </button>

              <button
                onClick={() => setActiveTab('wallpaper')}
                className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'wallpaper'
                    ? 'border-amber-600 text-amber-800 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>3. Backgrounds & Wallpaper</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-amber-600 text-amber-800 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>4. Company Info & Banner</span>
              </button>

              <button
                onClick={() => setActiveTab('terms')}
                className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'terms'
                    ? 'border-amber-600 text-amber-800 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>5. Bank & Terms</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenPatternManager) onOpenPatternManager();
                }}
                className="py-3 px-3.5 border-b-2 border-transparent text-amber-800 hover:text-amber-950 transition-colors flex items-center gap-1.5 whitespace-nowrap bg-amber-100/60 hover:bg-amber-100 font-extrabold"
                title="Upload new patterns or edit existing ratios"
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>6. Upload & Edit Patterns ↗</span>
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* ==========================================
                  TAB 1: BRAND LOGOS, MULTI-BRANDS & STAMP
              =========================================== */}
              {activeTab === 'logos' && (
                <div className="space-y-6">
                  {/* Section A: Primary Company Logo */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          Primary Company Logo & Monogram
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Displayed in the top navigation bar and at the top of printed quotations/PDFs.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Logo Preview Box */}
                      <div className="md:col-span-3 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900 text-white border border-slate-700">
                        {form.logoUrl ? (
                          <img
                            src={form.logoUrl}
                            alt="Logo Preview"
                            className={`h-16 w-16 object-contain border p-1 ${
                              form.logoShape === 'circle'
                                ? 'rounded-full'
                                : form.logoShape === 'square'
                                ? 'rounded-none'
                                : 'rounded-xl'
                            } ${
                              form.logoFrameBg === 'dark'
                                ? 'bg-slate-900 border-slate-700'
                                : form.logoFrameBg === 'transparent'
                                ? 'bg-transparent border-transparent'
                                : 'bg-white border-slate-300'
                            }`}
                          />
                        ) : (
                          <div
                            className={`h-16 w-16 ${selectedAccent.bgSolid} text-white flex items-center justify-center font-extrabold text-xl shadow-md ${
                              form.logoShape === 'circle'
                                ? 'rounded-full'
                                : form.logoShape === 'square'
                                ? 'rounded-none'
                                : 'rounded-xl'
                            }`}
                          >
                            {form.logoInitials || 'NK'}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 mt-2">Header Preview</span>
                      </div>

                      {/* Upload & URL Controls */}
                      <div className="md:col-span-9 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            <span>Upload Logo Image (PNG/JPG/SVG)</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleFileUpload(e, (base64) => {
                                  setForm((prev) => ({ ...prev, logoUrl: base64 }));
                                  onShowToast('Primary logo loaded');
                                })
                              }
                              className="hidden"
                            />
                          </label>

                          {form.logoUrl && (
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, logoUrl: '' })}
                              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
                            >
                              Remove Image (Use Monogram)
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-2">
                            <label className="font-bold text-slate-600 text-[11px] block">
                              Or Paste Direct Logo Image URL
                            </label>
                            <input
                              type="text"
                              placeholder="https://example.com/my-logo.png"
                              value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl}
                              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                              className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-600 text-[11px] block">
                              Fallback Initials
                            </label>
                            <input
                              type="text"
                              maxLength={4}
                              value={form.logoInitials}
                              onChange={(e) =>
                                setForm({ ...form, logoInitials: e.target.value.toUpperCase() })
                              }
                              className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-extrabold text-center text-xs"
                            />
                          </div>
                        </div>

                        {/* Shape, Size & Frame Style */}
                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                          <div>
                            <label className="font-bold text-slate-600 text-[11px] block">
                              Logo Shape
                            </label>
                            <select
                              value={form.logoShape || 'rounded'}
                              onChange={(e) =>
                                setForm({ ...form, logoShape: e.target.value as any })
                              }
                              className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs"
                            >
                              <option value="rounded">Rounded Box</option>
                              <option value="square">Sharp Square</option>
                              <option value="circle">Circle Badge</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-bold text-slate-600 text-[11px] block">
                              Logo Size
                            </label>
                            <select
                              value={form.logoSize || 'md'}
                              onChange={(e) =>
                                setForm({ ...form, logoSize: e.target.value as any })
                              }
                              className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs"
                            >
                              <option value="sm">Small (36px)</option>
                              <option value="md">Medium (44px)</option>
                              <option value="lg">Large (52px)</option>
                              <option value="xl">Extra Large (60px)</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-bold text-slate-600 text-[11px] block">
                              Logo Frame Bg
                            </label>
                            <select
                              value={form.logoFrameBg || 'white'}
                              onChange={(e) =>
                                setForm({ ...form, logoFrameBg: e.target.value as any })
                              }
                              className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs"
                            >
                              <option value="white">White Card</option>
                              <option value="dark">Dark Slate</option>
                              <option value="transparent">Transparent</option>
                              <option value="accent">Brand Accent</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Multi-Brand / Partner Logos Showcase */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          Partner Brands, Sub-Divisions & Certification Logos
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Add multiple brand logos (e.g. GVT Division, Parking Tiles Brand, ISO 9001, CE Certified) to display in the header strip and on printed quotations.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-bold">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.showPartnerLogosInHeader !== false}
                            onChange={(e) =>
                              setForm({ ...form, showPartnerLogosInHeader: e.target.checked })
                            }
                            className="rounded text-amber-600"
                          />
                          <span>Show in App Header</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.showPartnerLogosInPrint !== false}
                            onChange={(e) =>
                              setForm({ ...form, showPartnerLogosInPrint: e.target.checked })
                            }
                            className="rounded text-amber-600"
                          />
                          <span>Show on Print PDF</span>
                        </label>
                      </div>
                    </div>

                    {/* Add Partner Brand Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-xl bg-white border border-slate-200 items-end">
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-slate-600 block">
                          Brand / Division Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Royal GVT Slabs / ISO 9001"
                          value={newPartnerName}
                          onChange={(e) => setNewPartnerName(e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-600 block">
                          Category Badge (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. GVT / Export / Floor"
                          value={newPartnerBadge}
                          onChange={(e) => setNewPartnerBadge(e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-600 block">
                          Upload Logo or Paste URL
                        </label>
                        <div className="flex items-center gap-1 mt-1">
                          <label className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer border border-slate-300 shrink-0">
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleFileUpload(
                                  e,
                                  (base64) => {
                                    setNewPartnerLogoUrl(base64);
                                    onShowToast('Partner logo file ready');
                                  },
                                  0.5
                                )
                              }
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="or URL"
                            value={newPartnerLogoUrl.startsWith('data:') ? 'Uploaded Image' : newPartnerLogoUrl}
                            onChange={(e) => setNewPartnerLogoUrl(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddPartnerLogo}
                          className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Brand</span>
                        </button>
                      </div>
                    </div>

                    {/* Existing Partner Logos List */}
                    {(form.partnerLogos || []).length === 0 ? (
                      <div className="text-center py-4 text-slate-400 text-xs">
                        No secondary brand logos added yet. Add your sub-brands, slab series, or certification badges above.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {(form.partnerLogos || []).map((pl) => (
                          <div
                            key={pl.id}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {pl.logoUrl ? (
                                <img
                                  src={pl.logoUrl}
                                  alt={pl.name}
                                  className="h-8 w-8 object-contain rounded border border-slate-100 p-0.5 shrink-0"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  LOGO
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate text-xs">
                                  {pl.name}
                                </div>
                                {pl.badgeText && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-semibold">
                                    {pl.badgeText}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePartnerLogo(pl.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Remove brand"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section C: Authorized Stamp / Signature & Invoice Header */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-amber-600" />
                        <span>Quotation Digital Stamp, Signature & Document Title</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Upload your authorized company rubber stamp or signature image to appear automatically on quotations and printed PDFs.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-3 flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 h-24">
                        {form.stampImageUrl ? (
                          <img
                            src={form.stampImageUrl}
                            alt="Stamp Preview"
                            className="max-h-16 w-auto object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400">No Stamp Uploaded</span>
                        )}
                      </div>

                      <div className="md:col-span-9 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            <span>Upload Stamp / Signature Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleFileUpload(
                                  e,
                                  (base64) => {
                                    setForm((prev) => ({ ...prev, stampImageUrl: base64 }));
                                    onShowToast('Authorized stamp image uploaded');
                                  },
                                  0.8
                                )
                              }
                              className="hidden"
                            />
                          </label>

                          {form.stampImageUrl && (
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, stampImageUrl: '' })}
                              className="text-xs text-rose-600 font-bold hover:underline"
                            >
                              Remove Stamp
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 text-[11px] block">
                              Quotation Document Badge Title
                            </label>
                            <input
                              type="text"
                              placeholder="ESTIMATE / QUOTATION"
                              value={form.invoiceTitle || ''}
                              onChange={(e) => setForm({ ...form, invoiceTitle: e.target.value })}
                              className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 text-[11px] block">
                              Signatory Label
                            </label>
                            <input
                              type="text"
                              placeholder="Authorized Signatory"
                              value={form.signatoryTitle || ''}
                              onChange={(e) => setForm({ ...form, signatoryTitle: e.target.value })}
                              className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB 2: APP INTERFACE, COLORS & TYPOGRAPHY
              =========================================== */}
              {activeTab === 'interface' && (
                <div className="space-y-5">
                  {/* Accent Color Picker */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <span className="font-extrabold text-slate-900 text-sm block">
                      1. Primary Brand Accent Color (Buttons, Active Tabs, Highlights)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {(Object.keys(ACCENT_PALETTES) as AccentColorName[]).map((key) => {
                        const pal = ACCENT_PALETTES[key];
                        const isSelected = (form.accentColor || 'amber') === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setForm({ ...form, accentColor: key })}
                            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all bg-white ${
                              isSelected
                                ? 'border-slate-900 ring-2 ring-slate-900/20 font-extrabold shadow-xs'
                                : 'border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-5 h-5 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: pal.hex }}
                              />
                              <span className="text-[11px] text-slate-800 truncate">
                                {pal.label.split(' ')[0]}
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Header Style & Table Header Style */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                      <span className="font-extrabold text-slate-900 text-sm block">
                        2. Top Navigation Header Style
                      </span>
                      <div className="space-y-2">
                        {[
                          { id: 'dark-slate', label: 'Dark Slate Glass (Default)' },
                          { id: 'midnight-black', label: 'Midnight Pitch Black' },
                          { id: 'deep-navy', label: 'Deep Navy Ceramic' },
                          { id: 'glass-light', label: 'Crisp White Light Mode' },
                          { id: 'accent-solid', label: 'Solid Brand Accent Bar' },
                        ].map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer bg-white ${
                              (form.headerStyle || 'dark-slate') === opt.id
                                ? 'border-amber-600 font-bold bg-amber-50/20'
                                : 'border-slate-200'
                            }`}
                          >
                            <span>{opt.label}</span>
                            <input
                              type="radio"
                              name="headerStyle"
                              checked={(form.headerStyle || 'dark-slate') === opt.id}
                              onChange={() => setForm({ ...form, headerStyle: opt.id as any })}
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                      <span className="font-extrabold text-slate-900 text-sm block">
                        3. Data Table Header Style
                      </span>
                      <div className="space-y-2">
                        {[
                          { id: 'slate-900', label: 'Dark Slate (Default)' },
                          { id: 'accent', label: 'Match Brand Accent Color' },
                          { id: 'navy-900', label: 'Executive Deep Navy' },
                          { id: 'charcoal', label: 'Matte Charcoal Black' },
                        ].map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer bg-white ${
                              (form.tableHeaderStyle || 'slate-900') === opt.id
                                ? 'border-amber-600 font-bold bg-amber-50/20'
                                : 'border-slate-200'
                            }`}
                          >
                            <span>{opt.label}</span>
                            <input
                              type="radio"
                              name="tableHeaderStyle"
                              checked={(form.tableHeaderStyle || 'slate-900') === opt.id}
                              onChange={() => setForm({ ...form, tableHeaderStyle: opt.id as any })}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Surface, Corner Radius & Font Family */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <label className="font-extrabold text-slate-900 text-xs block">
                        4. Card Surface Style
                      </label>
                      <select
                        value={form.cardStyle || 'solid-white'}
                        onChange={(e) => setForm({ ...form, cardStyle: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      >
                        <option value="solid-white">Solid Crisp White</option>
                        <option value="glass-frost">Frosted Glassmorphism</option>
                        <option value="warm-ivory">Warm Ivory Travertine</option>
                        <option value="soft-slate">Soft Slate Gray</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <label className="font-extrabold text-slate-900 text-xs block">
                        5. Card Corner Geometry
                      </label>
                      <select
                        value={form.cardRadius || 'modern'}
                        onChange={(e) => setForm({ ...form, cardRadius: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      >
                        <option value="sharp">Sharp Architectural (6px)</option>
                        <option value="classic">Classic Rounded (12px)</option>
                        <option value="modern">Modern Smooth (16px)</option>
                        <option value="pill">Soft Luxury Curve (24px)</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <label className="font-extrabold text-slate-900 text-xs block">
                        6. App Typography Style
                      </label>
                      <select
                        value={form.fontFamily || 'jakarta'}
                        onChange={(e) => setForm({ ...form, fontFamily: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      >
                        <option value="jakarta">Plus Jakarta Sans (Modern)</option>
                        <option value="system">Clean System Sans</option>
                        <option value="serif">Editorial Luxury Serif</option>
                        <option value="mono">Technical Monospace</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB 3: BACKGROUNDS & CUSTOM WALLPAPER
              =========================================== */}
              {activeTab === 'wallpaper' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm mb-2">
                      Curated Ceramic, Marble & Architectural Background Presets (16 Themes)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {WORKSPACE_BACKGROUND_PRESETS.map((preset) => {
                        const isSelected =
                          form.themeGradient === preset.value && !form.bgImageUrl;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() =>
                              setForm({ ...form, themeGradient: preset.value, bgImageUrl: '' })
                            }
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition-all relative overflow-hidden ${
                              isSelected
                                ? 'border-amber-500 ring-2 ring-amber-500 font-extrabold shadow-md'
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                            style={{ backgroundImage: preset.value }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-black/40 text-white backdrop-blur-xs">
                                {preset.category}
                              </span>
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-xs font-bold leading-tight drop-shadow ${
                                preset.category === 'Light' ? 'text-slate-900' : 'text-white'
                              }`}
                            >
                              {preset.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Wallpaper Image Upload or URL */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Custom Showroom Photo or Slab Texture Wallpaper
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Upload a custom tile texture or showroom background image, or paste a high-res image URL.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Upload Background Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileUpload(
                              e,
                              (base64) => {
                                setForm((prev) => ({ ...prev, bgImageUrl: base64 }));
                                onShowToast('Custom wallpaper image set');
                              },
                              1.5
                            )
                          }
                          className="hidden"
                        />
                      </label>

                      {form.bgImageUrl && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, bgImageUrl: '' })}
                          className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs"
                        >
                          Clear Wallpaper Image
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 text-[11px] block">
                          Or Paste Wallpaper Image URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://example.com/marble-slab.jpg"
                          value={form.bgImageUrl?.startsWith('data:') ? '' : form.bgImageUrl || ''}
                          onChange={(e) => setForm({ ...form, bgImageUrl: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 text-[11px] block">
                          Wallpaper Dark Overlay Opacity ({form.bgOverlayOpacity ?? 75}%)
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="95"
                          value={form.bgOverlayOpacity ?? 75}
                          onChange={(e) =>
                            setForm({ ...form, bgOverlayOpacity: parseInt(e.target.value) || 75 })
                          }
                          className="w-full mt-2 accent-amber-600"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="font-bold text-slate-700 text-[11px] block">
                        Custom CSS Gradient or Hex Color
                      </label>
                      <input
                        type="text"
                        placeholder="linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                        value={form.themeGradient}
                        onChange={(e) => setForm({ ...form, themeGradient: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB 4: COMPANY PROFILE, LINKS & PROMO BANNER
              =========================================== */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Company Identity & Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block">
                          Company / Brand Name *
                        </label>
                        <input
                          type="text"
                          value={form.companyName}
                          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block">
                          Creator / Owner Credit Badge
                        </label>
                        <input
                          type="text"
                          value={form.creatorName}
                          onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block">Tagline / Subtitle</label>
                      <input
                        type="text"
                        value={form.tagline}
                        onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block">GSTIN Number</label>
                        <input
                          type="text"
                          value={form.gstin}
                          onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block">Phone / WhatsApp</label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block">Email Address</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 block">
                          Factory / Showroom Address
                        </label>
                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block">City, Pin & State</label>
                        <input
                          type="text"
                          value={form.cityState}
                          onChange={(e) => setForm({ ...form, cityState: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Top Announcement / Showroom Promo Banner */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          Top Showroom Announcement Banner & Digital Catalogue Link
                        </h4>
                      </div>
                      <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!form.showPromoBanner}
                          onChange={(e) =>
                            setForm({ ...form, showPromoBanner: e.target.checked })
                          }
                          className="rounded text-amber-600 w-4 h-4"
                        />
                        <span>Enable Top Banner</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block">
                          Announcement Banner Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ✨ New 800×1600 mm GVT Collection In Stock"
                          value={form.promoBannerText || ''}
                          onChange={(e) => setForm({ ...form, promoBannerText: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block">
                          Digital E-Catalogue URL (PDF / Google Drive Link)
                        </label>
                        <input
                          type="text"
                          placeholder="https://drive.google.com/..."
                          value={form.catalogueUrl || ''}
                          onChange={(e) => setForm({ ...form, catalogueUrl: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Temporary Feature Visibility Control */}
                  <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/70 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-amber-200/80 text-amber-900 shrink-0">
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            Temporary Feature Visibility: Quotation & GST Builder
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            When enabled, the Quotation tab, PDF generator, and "+ Quote" buttons are hidden from general users and accessible only in Master Admin mode.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold bg-white px-3 py-2 rounded-xl border border-amber-300 shadow-2xs shrink-0 self-start sm:self-center">
                        <input
                          type="checkbox"
                          checked={form.hideQuotationForUsers !== false}
                          onChange={(e) =>
                            setForm({ ...form, hideQuotationForUsers: e.target.checked })
                          }
                          className="rounded text-amber-600 w-4 h-4"
                        />
                        <span className="text-slate-800">Hide from Users</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB 5: BANK ACCOUNT & TERMS
              =========================================== */}
              {activeTab === 'terms' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <span className="font-extrabold text-slate-900 text-sm block">
                      RTGS / NEFT Bank Account Details
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block">Bank Name</label>
                        <input
                          type="text"
                          value={form.bankName}
                          onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block">Account Number</label>
                        <input
                          type="text"
                          value={form.accountNo}
                          onChange={(e) => setForm({ ...form, accountNo: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block">IFSC Code</label>
                        <input
                          type="text"
                          value={form.ifscCode}
                          onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block">Branch Name</label>
                        <input
                          type="text"
                          value={form.branch}
                          onChange={(e) => setForm({ ...form, branch: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <span className="font-extrabold text-slate-900 text-sm block">
                      Terms & Conditions (One per line)
                    </span>
                    <textarea
                      rows={6}
                      value={form.termsAndConditions.join('\n')}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          termsAndConditions: e.target.value
                            .split('\n')
                            .filter((line) => line.trim().length > 0),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handlePublish}
                  className={`px-5 py-2 rounded-xl ${selectedAccent.bgSolid} ${selectedAccent.bgHover} text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50`}
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{isSaving ? 'Publishing Live...' : 'Publish Changes to All Users'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
