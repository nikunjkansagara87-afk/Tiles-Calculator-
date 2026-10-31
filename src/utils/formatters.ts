import { CompanyBrandConfig, AccentColorName } from '../types';

export function formatINR(val: number): string {
  if (isNaN(val)) return '₹0.00';
  return '₹' + val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumberIN(val: number, decimals: number = 2): string {
  if (isNaN(val)) return '0';
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export const SQFT_PER_SQM = 10.7639104;
export const SQFT_PER_BRASS = 100.0;

export function sqftToSqm(sqft: number): number {
  return sqft / SQFT_PER_SQM;
}

export function sqmToSqft(sqm: number): number {
  return sqm * SQFT_PER_SQM;
}

export function sqftToBrass(sqft: number): number {
  return sqft / SQFT_PER_BRASS;
}

export interface TruckOption {
  type: string;
  capacityTons: number;
  wheels: string;
  description: string;
}

export const TRUCK_OPTIONS: TruckOption[] = [
  { type: 'Pickup / Mini Truck (Eicher / Bolero)', capacityTons: 2.5, wheels: '4 Wheeler', description: 'Local site sample delivery' },
  { type: 'Medium Truck (1109 / 1412)', capacityTons: 7.5, wheels: '6 Wheeler', description: 'Intra-state retail delivery' },
  { type: 'Standard 10-Wheeler Truck', capacityTons: 16.0, wheels: '10 Wheeler', description: 'Regional distributor transport' },
  { type: '12-Wheeler Taurus Truck', capacityTons: 21.0, wheels: '12 Wheeler', description: 'Standard Morbi long-haul carrier' },
  { type: '14-Wheeler Multi-Axle Truck', capacityTons: 28.0, wheels: '14 Wheeler', description: 'High-volume project direct dispatch' },
  { type: 'Heavy Articulated Trailer', capacityTons: 35.0, wheels: '18-22 Wheeler', description: 'Port export container & mega projects' },
];

export function getRecommendedTruck(weightKg: number): { recommended: TruckOption; loadPct: number; fits: boolean } {
  const tons = weightKg / 1000;
  for (const truck of TRUCK_OPTIONS) {
    if (tons <= truck.capacityTons) {
      const loadPct = Math.round((tons / truck.capacityTons) * 100);
      return { recommended: truck, loadPct, fits: true };
    }
  }
  const maxTruck = TRUCK_OPTIONS[TRUCK_OPTIONS.length - 1];
  return {
    recommended: maxTruck,
    loadPct: Math.round((tons / maxTruck.capacityTons) * 100),
    fits: false,
  };
}

export interface AccentPalette {
  name: AccentColorName;
  label: string;
  hex: string;
  bgSolid: string;
  bgHover: string;
  textAccent: string;
  borderAccent: string;
  badgeBg: string;
  badgeText: string;
}

export const ACCENT_PALETTES: Record<AccentColorName, AccentPalette> = {
  amber: {
    name: 'amber',
    label: 'Morbi Gold (Amber)',
    hex: '#d97706',
    bgSolid: 'bg-amber-600',
    bgHover: 'hover:bg-amber-700',
    textAccent: 'text-amber-500',
    borderAccent: 'border-amber-500',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
  },
  blue: {
    name: 'blue',
    label: 'Cobalt Porcelain (Blue)',
    hex: '#2563eb',
    bgSolid: 'bg-blue-600',
    bgHover: 'hover:bg-blue-700',
    textAccent: 'text-blue-500',
    borderAccent: 'border-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
  },
  emerald: {
    name: 'emerald',
    label: 'Verde Marble (Emerald)',
    hex: '#059669',
    bgHover: 'hover:bg-emerald-700',
    bgSolid: 'bg-emerald-600',
    textAccent: 'text-emerald-500',
    borderAccent: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
  },
  indigo: {
    name: 'indigo',
    label: 'Royal Vitrified (Indigo)',
    hex: '#4f46e5',
    bgSolid: 'bg-indigo-600',
    bgHover: 'hover:bg-indigo-700',
    textAccent: 'text-indigo-500',
    borderAccent: 'border-indigo-500',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
  },
  rose: {
    name: 'rose',
    label: 'Terracotta Kiln (Rose)',
    hex: '#e11d48',
    bgSolid: 'bg-rose-600',
    bgHover: 'hover:bg-rose-700',
    textAccent: 'text-rose-500',
    borderAccent: 'border-rose-500',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
  },
  violet: {
    name: 'violet',
    label: 'Imperial Quartz (Violet)',
    hex: '#7c3aed',
    bgSolid: 'bg-violet-600',
    bgHover: 'hover:bg-violet-700',
    textAccent: 'text-violet-500',
    borderAccent: 'border-violet-500',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-900',
  },
  teal: {
    name: 'teal',
    label: 'Aqua Mosaic (Teal)',
    hex: '#0d9488',
    bgSolid: 'bg-teal-600',
    bgHover: 'hover:bg-teal-700',
    textAccent: 'text-teal-500',
    borderAccent: 'border-teal-500',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-900',
  },
  orange: {
    name: 'orange',
    label: 'Fired Clay (Orange)',
    hex: '#ea580c',
    bgSolid: 'bg-orange-600',
    bgHover: 'hover:bg-orange-700',
    textAccent: 'text-orange-500',
    borderAccent: 'border-orange-500',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
  },
  cyan: {
    name: 'cyan',
    label: 'Glazed Ice (Cyan)',
    hex: '#0891b2',
    bgSolid: 'bg-cyan-600',
    bgHover: 'hover:bg-cyan-700',
    textAccent: 'text-cyan-500',
    borderAccent: 'border-cyan-500',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-900',
  },
  slate: {
    name: 'slate',
    label: 'Architectural Basalt (Slate)',
    hex: '#334155',
    bgSolid: 'bg-slate-800',
    bgHover: 'hover:bg-slate-900',
    textAccent: 'text-slate-400',
    borderAccent: 'border-slate-600',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-900',
  },
};

export const WORKSPACE_BACKGROUND_PRESETS = [
  { name: 'Dark Slate (Default)', category: 'Dark', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
  { name: 'Deep Navy Vitrified', category: 'Dark', value: 'linear-gradient(135deg, #021226 0%, #0a2540 100%)' },
  { name: 'Charcoal Granite', category: 'Dark', value: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)' },
  { name: 'Emerald Italian Marble', category: 'Dark', value: 'linear-gradient(135deg, #042f2e 0%, #0f4c3a 100%)' },
  { name: 'Royal Onyx & Gold', category: 'Dark', value: 'linear-gradient(135deg, #0c0a09 0%, #292524 55%, #451a03 100%)' },
  { name: 'Espresso Wood Plank', category: 'Dark', value: 'linear-gradient(135deg, #271711 0%, #432818 100%)' },
  { name: 'Terracotta Kiln Glow', category: 'Dark', value: 'linear-gradient(135deg, #3b0711 0%, #681823 100%)' },
  { name: 'Midnight Sapphire', category: 'Dark', value: 'linear-gradient(135deg, #0f1026 0%, #1e1b4b 100%)' },
  { name: 'Obsidian Matte Black', category: 'Dark', value: 'linear-gradient(135deg, #050505 0%, #141414 100%)' },
  { name: 'Warm Terrazzo Stone', category: 'Dark', value: 'linear-gradient(135deg, #2b1f1d 0%, #44322e 100%)' },
  { name: 'Industrial Concrete', category: 'Medium', value: 'linear-gradient(135deg, #334155 0%, #475569 100%)' },
  { name: 'Oceanic Slate', category: 'Medium', value: 'linear-gradient(135deg, #0f3443 0%, #1e4d5c 100%)' },
  { name: 'Alabaster Clean White', category: 'Light', value: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' },
  { name: 'Ivory Travertine', category: 'Light', value: 'linear-gradient(135deg, #faf8f5 0%, #efeae1 100%)' },
  { name: 'Sandstone Sahara', category: 'Light', value: 'linear-gradient(135deg, #fdfbf7 0%, #f3e9d2 100%)' },
  { name: 'Carrara Frost', category: 'Light', value: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)' },
];

export function getCardContainerStyle(brand: CompanyBrandConfig): { className: string; style?: React.CSSProperties } {
  const radiusMap: Record<string, string> = {
    sharp: 'rounded-md',
    classic: 'rounded-xl',
    modern: 'rounded-2xl',
    pill: 'rounded-3xl',
  };
  const surfaceMap: Record<string, string> = {
    'solid-white': 'bg-white border-slate-200 shadow-sm',
    'glass-frost': 'bg-white/92 backdrop-blur-md border-white/60 shadow-lg',
    'warm-ivory': 'bg-[#fdfcf9] border-amber-200/70 shadow-sm',
    'soft-slate': 'bg-slate-50/95 border-slate-300 shadow-sm',
  };
  const rClass = radiusMap[brand.cardRadius || 'modern'] || 'rounded-2xl';
  const sClass = surfaceMap[brand.cardStyle || 'solid-white'] || 'bg-white border-slate-200 shadow-sm';
  return {
    className: `${rClass} ${sClass} border`,
  };
}

export function getTableHeaderClass(brand: CompanyBrandConfig): string {
  const style = brand.tableHeaderStyle || 'slate-900';
  const accent = ACCENT_PALETTES[brand.accentColor || 'amber'] || ACCENT_PALETTES.amber;
  switch (style) {
    case 'accent':
      return `${accent.bgSolid} text-white`;
    case 'navy-900':
      return 'bg-[#0a192f] text-white';
    case 'charcoal':
      return 'bg-zinc-900 text-white';
    default:
      return 'bg-slate-900 text-white';
  }
}

export const DEFAULT_BRAND_CONFIG: CompanyBrandConfig = {
  companyName: 'MORBI CERAMIC & VITRIFIED TILES',
  tagline: 'Wholesale Slabs, Parking Tiles & Modular Pattern Quotation System',
  creatorName: 'Nikunj Kansagara',
  gstin: '24AAACK1234F1Z8',
  phone: '+91 98250 99999',
  email: 'sales@morbitiles.com',
  address: '8-A National Highway, Trajpar Char Rasta, Near Makansar',
  cityState: 'Morbi - 363642, Gujarat, India',
  bankName: 'HDFC Bank Ltd',
  accountNo: '50200087654321',
  ifscCode: 'HDFC0000345',
  branch: 'Morbi Main Branch, Gujarat',
  logoUrl: '',
  logoInitials: 'NK',
  logoShape: 'rounded',
  logoSize: 'md',
  logoFrameBg: 'white',
  partnerLogos: [],
  showPartnerLogosInHeader: true,
  showPartnerLogosInPrint: true,
  stampImageUrl: '',
  invoiceTitle: 'ESTIMATE / QUOTATION',
  signatoryTitle: 'Authorized Signatory',
  footerWatermark: 'Quality Verified Morbi Ceramic Consignment',
  themeGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  bgImageUrl: '',
  bgOverlayOpacity: 75,
  accentColor: 'amber',
  customAccentHex: '#d97706',
  headerStyle: 'dark-slate',
  cardStyle: 'solid-white',
  cardRadius: 'modern',
  tableHeaderStyle: 'slate-900',
  fontFamily: 'jakarta',
  showPromoBanner: false,
  promoBannerText: '✨ New 800×1600 mm & 1200×1800 mm High-Gloss GVT Slabs In Stock — Direct Factory Dispatch from Morbi',
  promoBannerBg: 'linear-gradient(90deg, #b45309 0%, #d97706 50%, #b45309 100%)',
  catalogueUrl: '',
  websiteUrl: '',
  whatsappDirect: '',
  hideQuotationForUsers: true,
  adminPin: '9999',
  termsAndConditions: [
    'Prices are ex-factory Morbi, Gujarat unless specified otherwise.',
    'GST @ 18% (CGST 9% + SGST 9% or IGST 18%) is applicable as per government norms.',
    'Transit breakages up to 1% to 2% are standard industry tolerance in ceramic goods.',
    'Shade and caliber variation is an inherent characteristic of natural ceramic firing.',
    'Unloading, local site handling, and crane charges are strictly at buyer’s scope.',
    'Payment terms: 100% advance payment required prior to loading vehicle at factory gate.',
    'Goods once sold and inspected at factory will not be taken back or exchanged.',
    'Subject to Morbi (Gujarat) jurisdiction only.',
  ],
};

export const STORAGE_KEYS = {
  BRAND_CONFIG: 'morbi_tile_brand_config_v2',
  SAVED_TILES: 'morbi_tile_standard_sizes_v2',
  SAVED_QUOTES: 'morbi_tile_saved_quotations_v2',
  CURRENT_QUOTE: 'morbi_tile_current_quote_v2',
  SAVED_PATTERNS: 'morbi_tile_saved_patterns_v2',
};
