import React, { useState } from 'react';
import { CompanyBrandConfig } from '../types';
import {
  Calculator,
  Grid3X3,
  FileText,
  ArrowRightLeft,
  ShieldCheck,
  Truck,
  LogIn,
  LogOut,
  Crown,
  UserCheck,
  Cloud,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { isMasterAdmin, MASTER_ADMIN_EMAIL } from '../firebase';
import { ACCENT_PALETTES } from '../utils/formatters';

interface HeaderProps {
  brand: CompanyBrandConfig;
  activeTab: 'standard' | 'pattern' | 'quotation';
  onTabChange: (tab: 'standard' | 'pattern' | 'quotation') => void;
  quotationItemCount: number;
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenUnitConverter: () => void;
  onOpenTruckAdvisor: () => void;
  onTriggerAdminModal: () => void;
  onShowToast: (msg: string) => void;
  isCloudSynced: boolean;
  canAccessQuotation?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  brand,
  activeTab,
  onTabChange,
  quotationItemCount,
  currentUser,
  onLogin,
  onLogout,
  onOpenUnitConverter,
  onOpenTruckAdvisor,
  onTriggerAdminModal,
  onShowToast,
  isCloudSynced,
  canAccessQuotation,
}) => {
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const isAdmin = isMasterAdmin(currentUser);
  const canShowQuotation = canAccessQuotation ?? (isAdmin || brand.hideQuotationForUsers === false);
  const accent = ACCENT_PALETTES[brand.accentColor || 'amber'] || ACCENT_PALETTES.amber;

  const handleSecretBadgeTap = () => {
    const now = Date.now();
    let newCount = 1;
    if (now - lastTapTime < 2500) {
      newCount = tapCount + 1;
    }
    setLastTapTime(now);
    setTapCount(newCount);

    if (newCount >= 5) {
      setTapCount(0);
      onShowToast('🔑 Opening Brand & Interface Studio');
      onTriggerAdminModal();
    } else if (newCount >= 2) {
      onShowToast(`Tap ${5 - newCount} more times to open Brand Studio`);
    }
  };

  // Header surface styling
  const isLightHeader = brand.headerStyle === 'glass-light';
  const getHeaderBgClass = () => {
    switch (brand.headerStyle) {
      case 'midnight-black':
        return 'bg-zinc-950/95 border-zinc-800 text-white';
      case 'deep-navy':
        return 'bg-[#06152d]/95 border-blue-900/50 text-white';
      case 'glass-light':
        return 'bg-white/95 border-slate-200 text-slate-900';
      case 'accent-solid':
        return `${accent.bgSolid} border-white/15 text-white`;
      default:
        return 'bg-slate-900/95 border-slate-800 text-white';
    }
  };

  // Logo dimensions & shape
  const logoSizeClasses: Record<string, string> = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-11 w-11 text-base',
    lg: 'h-13 w-13 text-lg',
    xl: 'h-15 w-15 text-xl',
  };
  const logoShapeClasses: Record<string, string> = {
    rounded: 'rounded-xl',
    square: 'rounded-none',
    circle: 'rounded-full',
  };
  const logoFrameClasses: Record<string, string> = {
    white: 'bg-white border-slate-300 p-1',
    dark: 'bg-slate-900 border-slate-700 p-1',
    transparent: 'bg-transparent border-transparent p-0',
    accent: `${accent.bgSolid} border-white/30 p-1 text-white`,
  };

  const sizeCls = logoSizeClasses[brand.logoSize || 'md'] || logoSizeClasses.md;
  const shapeCls = logoShapeClasses[brand.logoShape || 'rounded'] || logoShapeClasses.rounded;
  const frameCls = logoFrameClasses[brand.logoFrameBg || 'white'] || logoFrameClasses.white;

  const partnerLogos = brand.partnerLogos || [];
  const showPartners = brand.showPartnerLogosInHeader !== false && partnerLogos.length > 0;

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b shadow-xl transition-colors no-print ${getHeaderBgClass()}`}>
      {/* Optional Admin Announcement / Showroom Promo Banner */}
      {brand.showPromoBanner && brand.promoBannerText && (
        <div
          className="px-4 py-1.5 text-white text-xs font-bold text-center flex items-center justify-center gap-2 border-b border-white/10"
          style={{
            background:
              brand.promoBannerBg ||
              'linear-gradient(90deg, #b45309 0%, #d97706 50%, #b45309 100%)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{brand.promoBannerText}</span>
          {brand.catalogueUrl && (
            <a
              href={brand.catalogueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-extrabold ml-2 inline-flex items-center gap-1 shrink-0 hover:opacity-90"
            >
              <span>View E-Catalogue</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Top primary row */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark & Primary Logo */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.companyName}
              referrerPolicy="no-referrer"
              className={`${sizeCls} ${shapeCls} ${frameCls} object-contain border shadow-sm shrink-0`}
            />
          ) : (
            <div
              className={`${sizeCls} ${shapeCls} ${accent.bgSolid} text-white flex items-center justify-center font-extrabold tracking-wider shadow-md shrink-0`}
            >
              {brand.logoInitials || 'NK'}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-extrabold text-sm sm:text-base tracking-tight truncate ${
                  isLightHeader ? 'text-slate-900' : 'text-white'
                }`}
              >
                {brand.companyName}
              </span>
              {isCloudSynced && (
                <span
                  title="Live Cloud Synced across all users"
                  className={`hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    isLightHeader
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30'
                  }`}
                >
                  <Cloud className="w-2.5 h-2.5" />
                  <span>Live</span>
                </span>
              )}
            </div>
            <p
              className={`text-[11px] hidden sm:block truncate max-w-md ${
                isLightHeader ? 'text-slate-500' : 'text-slate-300/80'
              }`}
            >
              {brand.tagline}
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single Line) */}
        <nav
          className={`hidden lg:flex items-center gap-1.5 p-1 rounded-xl border ${
            isLightHeader
              ? 'bg-slate-100 border-slate-200'
              : 'bg-black/25 border-white/10'
          }`}
        >
          <button
            onClick={() => onTabChange('standard')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'standard'
                ? `${accent.bgSolid} text-white shadow-sm`
                : isLightHeader
                ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>1. Tile Box Calculator</span>
          </button>
          <button
            onClick={() => onTabChange('pattern')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pattern'
                ? `${accent.bgSolid} text-white shadow-sm`
                : isLightHeader
                ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>2. Pattern Coverage (P.1–P.18)</span>
          </button>
          {canShowQuotation && (
            <button
              onClick={() => onTabChange('quotation')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'quotation'
                  ? `${accent.bgSolid} text-white shadow-sm`
                  : isLightHeader
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Quotation & GST</span>
              {isAdmin && brand.hideQuotationForUsers !== false && (
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                  Admin Only
                </span>
              )}
              {quotationItemCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-950 ml-1 shadow-xs">
                  {quotationItemCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: Actions & Auth / Admin Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {brand.catalogueUrl && (
            <a
              href={brand.catalogueUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Digital Tile Catalogue"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                isLightHeader
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Catalogue</span>
            </a>
          )}

          <button
            onClick={onOpenUnitConverter}
            title="Tile Unit Converter (Sqft, Sqm, Brass, mm, Inches)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              isLightHeader
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/15'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Units</span>
          </button>

          <button
            onClick={onOpenTruckAdvisor}
            title="Truck Load & Weight Feasibility"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              isLightHeader
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/15'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Truck</span>
          </button>

          {/* Admin / User Auth Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              {isAdmin ? (
                <button
                  onClick={onTriggerAdminModal}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md border border-amber-300"
                  title={`Logged in as Master Admin (${currentUser.email}) - Click to customize Brand, Logos & App Interface`}
                >
                  <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                  <span className="hidden sm:inline">Theme & Brand Studio</span>
                </button>
              ) : (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
                    isLightHeader
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : 'bg-white/10 border-white/15 text-slate-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline truncate max-w-[100px]">
                    {currentUser.displayName || currentUser.email}
                  </span>
                </div>
              )}

              <button
                onClick={onLogout}
                title="Sign Out"
                className={`p-1.5 rounded-lg transition-colors border ${
                  isLightHeader
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                    : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-white/15'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className={`px-3 py-1.5 rounded-lg ${accent.bgSolid} ${accent.bgHover} text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors`}
              title={`Sign in with Google (Admin: ${MASTER_ADMIN_EMAIL})`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          )}

          {/* Secret Creator Credit Badge with 5-tap trigger */}
          <button
            onClick={handleSecretBadgeTap}
            title="Created by Nikunj Kansagara"
            className={`cursor-pointer select-none text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              isLightHeader
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Created by {brand.creatorName}</span>
          </button>
        </div>
      </div>

      {/* Partner / Sub-Brand Logos Strip (Visible if Admin added partner/division logos) */}
      {showPartners && (
        <div
          className={`border-t px-4 py-1.5 ${
            isLightHeader
              ? 'bg-slate-50/90 border-slate-200'
              : 'bg-black/25 border-white/10'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                isLightHeader ? 'text-slate-400' : 'text-slate-400'
              }`}
            >
              Our Brands & Divisions:
            </span>
            <div className="flex items-center gap-2.5">
              {partnerLogos.map((pl) => (
                <div
                  key={pl.id}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border shrink-0 transition-transform hover:scale-[1.02] ${
                    isLightHeader
                      ? 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                      : 'bg-white/10 border-white/15 text-white'
                  }`}
                >
                  {pl.logoUrl && (
                    <img
                      src={pl.logoUrl}
                      alt={pl.name}
                      referrerPolicy="no-referrer"
                      className="h-5 w-auto max-w-[60px] object-contain rounded-xs bg-white p-0.5"
                    />
                  )}
                  <span className="text-xs font-bold whitespace-nowrap">{pl.name}</span>
                  {pl.badgeText && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      {pl.badgeText}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile navigation tab strip */}
      <div
        className={`lg:hidden flex items-center justify-between border-t px-2 py-1.5 overflow-x-auto gap-1 ${
          isLightHeader ? 'border-slate-200' : 'border-white/10'
        }`}
      >
        <button
          onClick={() => onTabChange('standard')}
          className={`flex-1 min-w-[100px] text-center py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'standard'
              ? `${accent.bgSolid} text-white`
              : isLightHeader
              ? 'text-slate-600'
              : 'text-slate-300'
          }`}
        >
          📦 1. Tile Box
        </button>
        <button
          onClick={() => onTabChange('pattern')}
          className={`flex-1 min-w-[120px] text-center py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'pattern'
              ? `${accent.bgSolid} text-white`
              : isLightHeader
              ? 'text-slate-600'
              : 'text-slate-300'
          }`}
        >
          🧩 2. Patterns (P.1–18)
        </button>
        {canShowQuotation && (
          <button
            onClick={() => onTabChange('quotation')}
            className={`flex-1 min-w-[110px] text-center py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'quotation'
                ? `${accent.bgSolid} text-white`
                : isLightHeader
                ? 'text-slate-600'
                : 'text-slate-300'
            }`}
          >
            <span>📄 3. Quotation</span>
            {isAdmin && brand.hideQuotationForUsers !== false && (
              <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">
                Admin
              </span>
            )}
            {quotationItemCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-950">
                {quotationItemCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
