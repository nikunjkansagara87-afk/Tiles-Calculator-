export interface TileSize {
  id: string;
  name: string; // e.g. "600 × 600 mm"
  inches: string; // e.g. "24\" × 24\""
  category: string; // e.g. "GVT / Vitrified Floor"
  pcsPerBox: number;
  sqftPerBox: number;
  sqmPerBox: number;
  weightPerBoxKg: number;
  defaultRate: number; // in ₹
  isCustom?: boolean;
}

export interface PatternTileComponent {
  sizeMm: string; // e.g. "600 × 600"
  inches: string;
  ratioPct: number; // percentage of total area (e.g. 44.44)
  sqftPerBox: number;
  weightPerBoxKg: number;
  rate: number; // ₹ per box or per sqft
  colorCode?: string;
}

export interface BlueprintTileBlock {
  id: string;
  sizeKey: '600' | '300x600_h' | '300x600_v' | '300';
  x: number; // grid col (0-based)
  y: number; // grid row (0-based)
  widthUnits: number; // 2 for 600, 2 for 300x600_h, 1 for 300x600_v, 1 for 300
  heightUnits: number; // 2 for 600, 1 for 300x600_h, 2 for 300x600_v, 1 for 300
  rotation?: number; // Individual tile rotation in degrees (0, 45, 90, 135, -45)
  gridRotation?: number; // Pattern grid rotation in degrees (0, 45, -45)
  cadStyle?: 'color' | 'cad-bw'; // Blueprint color or B&W CAD line style
  color?: string;
  label?: string;
}

export interface TilePattern {
  id: string; // p1 to p18
  code: string; // "P.1", "P.2", etc.
  name: string;
  subtitle: string;
  description: string;
  components: PatternTileComponent[];
  layoutType:
    | 'modular3'
    | 'modular4'
    | 'runner'
    | 'pinwheel'
    | 'versailles'
    | 'basketweave'
    | 'step'
    | 'slabs'
    | 'windmill'
    | 'plank'
    | 'cabochon'
    | 'cobble'
    | 'corridor'
    | 'herringbone'
    | 'quad'
    | 'industrial';

  // Modular Blueprint custom options (lightweight Grid Layout & Notes only)
  blueprintActiveTab?: 'layout' | 'table';
  customBlueprintLayout?: BlueprintTileBlock[]; // Placed touch-and-drop tile blocks
  compactBlueprintLayout?: string; // Ultra-lightweight compressed grid layout string for fast cloud sync
  blueprintRotation?: number; // 0, 45, -45 degrees
  blueprintStyle?: 'color' | 'cad-bw'; // 'color' or 'cad-bw'
  blueprintNotes?: string;
}

export interface QuotationLineItem {
  id: string;
  name: string;
  sizeMm?: string;
  source: 'standard' | 'pattern' | 'custom';
  patternCode?: string;
  boxQty: number;
  sqftPerBox: number;
  totalSqft: number;
  weightPerBoxKg: number;
  totalWeightKg: number;
  rateBasis: 'box' | 'sqft';
  unitRate: number;
  amount: number;
  notes?: string;
}

export interface QuotationCustomer {
  clientName: string;
  companyName: string;
  phone: string;
  email: string;
  deliverySite: string;
  city: string;
  state: string;
  quotationNo: string;
  quotationDate: string;
  validUntil: string;
}

export interface PartnerBrandLogo {
  id: string;
  name: string; // e.g. "GVT Slab Division", "Export Quality", "ISO 9001:2015"
  logoUrl: string; // Base64 or image URL
  badgeText?: string; // Optional short subtitle or badge
}

export type AccentColorName =
  | 'amber'
  | 'blue'
  | 'emerald'
  | 'indigo'
  | 'rose'
  | 'violet'
  | 'teal'
  | 'orange'
  | 'cyan'
  | 'slate';

export interface CompanyBrandConfig {
  companyName: string;
  tagline: string;
  creatorName: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  cityState: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  branch: string;

  // Primary Logo & Monogram
  logoUrl: string; // base64 or URL
  logoInitials: string;
  logoShape?: 'rounded' | 'square' | 'circle';
  logoSize?: 'sm' | 'md' | 'lg' | 'xl';
  logoFrameBg?: 'white' | 'dark' | 'transparent' | 'accent';

  // Partner / Sub-Brand Logos Showcase
  partnerLogos?: PartnerBrandLogo[];
  showPartnerLogosInHeader?: boolean;
  showPartnerLogosInPrint?: boolean;

  // Quotation Stamp & Custom Titles
  stampImageUrl?: string; // Digital stamp or signature image
  invoiceTitle?: string; // e.g. "ESTIMATE / QUOTATION"
  signatoryTitle?: string; // e.g. "Authorized Signatory"
  footerWatermark?: string;

  // App Interface & Theme Options
  themeGradient: string; // CSS background gradient or color
  bgImageUrl?: string; // Optional custom wallpaper image
  bgOverlayOpacity?: number; // 0 to 95
  accentColor?: AccentColorName;
  customAccentHex?: string; // Optional custom hex override
  headerStyle?: 'dark-slate' | 'midnight-black' | 'deep-navy' | 'glass-light' | 'accent-solid';
  cardStyle?: 'solid-white' | 'glass-frost' | 'warm-ivory' | 'soft-slate';
  cardRadius?: 'sharp' | 'classic' | 'modern' | 'pill';
  tableHeaderStyle?: 'slate-900' | 'accent' | 'navy-900' | 'charcoal';
  fontFamily?: 'jakarta' | 'mono' | 'serif' | 'system';

  // Top Announcement / Promo Banner
  showPromoBanner?: boolean;
  promoBannerText?: string;
  promoBannerBg?: string;

  // Quick Links for Users
  catalogueUrl?: string;
  websiteUrl?: string;
  whatsappDirect?: string;

  // Feature Visibility Control (e.g. temporary hide quotation for users)
  hideQuotationForUsers?: boolean;

  adminPin: string; // default "9999"
  termsAndConditions: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface FreightTaxConfig {
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  freightMode: 'fixed' | 'perTon' | 'percentage';
  freightValue: number; // amount, rate per ton, or percentage (%)
  freightPct?: number; // Transportation percentage (%)
  loadingCharges: number;
  insuranceCharges: number; // Insurance percentage (%)
  insurancePct?: number; // Insurance percentage (%)
  gstType: 'intra' | 'inter' | 'exempt' | 'custom'; // intra = 9% CGST + 9% SGST, inter = 18% IGST
  customGstRate: number;
}
