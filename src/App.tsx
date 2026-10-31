/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TileSize,
  TilePattern,
  QuotationLineItem,
  QuotationCustomer,
  CompanyBrandConfig,
  FreightTaxConfig,
} from './types';
import { INITIAL_STANDARD_TILES } from './data/standardTiles';
import { PATTERNS_LIST } from './data/patterns';
import {
  DEFAULT_BRAND_CONFIG,
  STORAGE_KEYS,
} from './utils/formatters';
import {
  compressBlueprintLayout,
  decompressBlueprintLayout,
  minifyBlueprintBlocks,
} from './utils/blueprintCompression';
import { Header } from './components/Header';
import { StandardCalculator } from './components/StandardCalculator';
import { PatternCalculator } from './components/PatternCalculator';
import { PatternManagerModal } from './components/PatternManagerModal';
import { QuotationBuilder } from './components/QuotationBuilder';
import { PrintQuotation } from './components/PrintQuotation';
import { AdminModal } from './components/AdminModal';
import { UnitConverterModal } from './components/UnitConverterModal';
import { TruckAdvisorModal } from './components/TruckAdvisorModal';
import { SavedQuotesModal, SavedQuotationRecord } from './components/SavedQuotesModal';
import { Toast } from './components/Toast';

// Firebase imports
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  isMasterAdmin,
  MASTER_ADMIN_EMAIL,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function App() {
  // Current authenticated user
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Brand Configuration (Synced with Firestore in real-time)
  const [brand, setBrand] = useState<CompanyBrandConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRAND_CONFIG);
      if (saved) return { ...DEFAULT_BRAND_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BRAND_CONFIG;
  });

  // Standard Tile Sizes List (Default rate is 0 for all standard tiles)
  const [tiles, setTiles] = useState<TileSize[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_TILES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t: TileSize) => (t.isCustom ? t : { ...t, defaultRate: 0 }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STANDARD_TILES;
  });

  // Modular Patterns List (Synced live with Cloud Firestore /settings/patterns)
  const [patterns, setPatterns] = useState<TilePattern[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_PATTERNS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => {
            const { blueprintImage, blueprintScratchSvg, ...clean } = p;
            return {
              ...clean,
              blueprintActiveTab: clean.blueprintActiveTab === 'table' ? 'table' : 'layout',
            };
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return PATTERNS_LIST;
  });

  // Pattern Manager Modal states
  const [showPatternManager, setShowPatternManager] = useState<boolean>(false);
  const [patternManagerTargetId, setPatternManagerTargetId] = useState<string | null>(null);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'standard' | 'pattern' | 'quotation'>('standard');

  // Quotation Items List
  const [quotationItems, setQuotationItems] = useState<QuotationLineItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_QUOTE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items) return parsed.items;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Customer Details for Quotation
  const [customer, setCustomer] = useState<QuotationCustomer>(() => {
    const today = new Date();
    const validDate = new Date();
    validDate.setDate(today.getDate() + 15);

    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const validStr = `${validDate.getFullYear()}-${pad(validDate.getMonth() + 1)}-${pad(validDate.getDate())}`;

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_QUOTE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customer) return parsed.customer;
      }
    } catch (e) {
      console.error(e);
    }

    return {
      clientName: '',
      companyName: '',
      phone: '',
      email: '',
      deliverySite: '',
      city: 'Ahmedabad',
      state: 'Gujarat',
      quotationNo: `QTN-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      quotationDate: todayStr,
      validUntil: validStr,
    };
  });

  // Freight & Tax Settings
  const [freightTax, setFreightTax] = useState<FreightTaxConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_QUOTE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.freightTax) return parsed.freightTax;
      }
    } catch (e) {
      console.error(e);
    }
    return {
      discountType: 'percentage',
      discountValue: 0,
      freightMode: 'fixed',
      freightValue: 0,
      loadingCharges: 0,
      insuranceCharges: 0,
      gstType: 'intra', // CGST 9% + SGST 9% = 18%
      customGstRate: 18,
    };
  });

  // Saved Quotations Archive
  const [savedQuotes, setSavedQuotes] = useState<SavedQuotationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_QUOTES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Modals & Popups
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showUnitConverter, setShowUnitConverter] = useState<boolean>(false);
  const [showTruckAdvisor, setShowTruckAdvisor] = useState<boolean>(false);
  const [showSavedQuotes, setShowSavedQuotes] = useState<boolean>(false);

  // Toast System
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        if (isMasterAdmin(user)) {
          showToast(`✓ Welcome Master Admin: ${user.email}`);
        } else {
          showToast(`Signed in as ${user.displayName || user.email}`);
        }
      }
    });

    testFirestoreConnection();
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync on `/settings/brand`
  // Whenever the admin changes studio/brand/interface settings, all users receive the update immediately!
  useEffect(() => {
    const brandDocRef = doc(db, 'settings', 'brand');
    const unsubscribe = onSnapshot(
      brandDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as CompanyBrandConfig;
          setBrand((prev) => ({
            ...DEFAULT_BRAND_CONFIG,
            ...prev,
            ...data,
          }));
          setIsCloudSynced(true);
        } else {
          setIsCloudSynced(false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/brand');
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync on `/settings/patterns`
  // Whenever the admin uploads or edits patterns, all users receive the updated patterns immediately!
  useEffect(() => {
    const patternsDocRef = doc(db, 'settings', 'patterns');
    const unsubscribe = onSnapshot(
      patternsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.patternsList) && data.patternsList.length > 0) {
            const hydrated: TilePattern[] = data.patternsList.map((pat: TilePattern) => {
              const expandedBlocks = decompressBlueprintLayout(
                pat.compactBlueprintLayout,
                pat.customBlueprintLayout
              );
              return {
                ...pat,
                ...(expandedBlocks.length > 0 ? { customBlueprintLayout: expandedBlocks } : {}),
              };
            });
            setPatterns(hydrated);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/patterns');
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync on `/settings/tiles`
  // Whenever the admin updates or publishes tile sizes, all users receive the updated list immediately!
  useEffect(() => {
    const tilesDocRef = doc(db, 'settings', 'tiles');
    const unsubscribe = onSnapshot(
      tilesDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.tilesList) && data.tilesList.length > 0) {
            setTiles(data.tilesList);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/tiles');
      }
    );

    return () => unsubscribe();
  }, []);

  // Save to local cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BRAND_CONFIG, JSON.stringify(brand));
    } catch (e) {
      console.error(e);
    }
  }, [brand]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_PATTERNS, JSON.stringify(patterns));
    } catch (e) {
      console.error(e);
    }
  }, [patterns]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_TILES, JSON.stringify(tiles));
    } catch (e) {
      console.error(e);
    }
  }, [tiles]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_QUOTE,
        JSON.stringify({ items: quotationItems, customer, freightTax })
      );
    } catch (e) {
      console.error(e);
    }
  }, [quotationItems, customer, freightTax]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_QUOTES, JSON.stringify(savedQuotes));
    } catch (e) {
      console.error(e);
    }
  }, [savedQuotes]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        if (isMasterAdmin(result.user)) {
          showToast(`✓ Master Admin verified: ${result.user.email}`);
        } else {
          showToast(`Logged in as ${result.user.email}. (Admin is ${MASTER_ADMIN_EMAIL})`);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      showToast(error.message || 'Login cancelled or failed');
    }
  };

  // Handle Sign Out
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Signed out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  // Helper to compress base64 blueprint images so Firestore 1 MiB document limit is never exceeded
  // Includes an 800ms safety timeout so image decoding can never hang cloud publishing
  const compressDataUrlIfNeeded = (dataUrl?: string): Promise<string> => {
    if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 25000) {
      return Promise.resolve(dataUrl || '');
    }
    return new Promise((resolve) => {
      let settled = false;
      const done = (val: string) => {
        if (!settled) {
          settled = true;
          resolve(val);
        }
      };
      const timer = setTimeout(() => done(dataUrl), 800);
      const img = new Image();
      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 480;
          let w = img.width || 480;
          let h = img.height || 340;
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
            done(dataUrl);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          done(canvas.toDataURL('image/jpeg', 0.68));
        } catch {
          done(dataUrl);
        }
      };
      img.onerror = () => {
        clearTimeout(timer);
        done(dataUrl);
      };
      img.src = dataUrl;
    });
  };

  // Publish Brand & Studio settings to Cloud Firestore
  // Only accessible to nikunj.kansagara87@gmail.com
  const handleSaveBrandToCloud = async (newBrand: CompanyBrandConfig): Promise<boolean> => {
    const activeUser = currentUser || auth.currentUser;
    if (!isMasterAdmin(activeUser)) {
      showToast(`Please sign in as Master Admin (${MASTER_ADMIN_EMAIL}) to publish changes.`);
      return false;
    }

    try {
      // Compress any heavy base64 images so the Firestore document stays lightweight (< 200 KB)
      const [logoUrl, stampImageUrl, bgImageUrl] = await Promise.all([
        compressDataUrlIfNeeded(newBrand.logoUrl),
        compressDataUrlIfNeeded(newBrand.stampImageUrl),
        compressDataUrlIfNeeded(newBrand.bgImageUrl),
      ]);

      const partnerLogos = await Promise.all(
        (newBrand.partnerLogos || []).map(async (pl) => ({
          ...pl,
          logoUrl: await compressDataUrlIfNeeded(pl.logoUrl),
        }))
      );

      const rawPayload: CompanyBrandConfig = {
        ...newBrand,
        logoUrl,
        stampImageUrl,
        bgImageUrl,
        partnerLogos,
        updatedAt: new Date().toISOString(),
        updatedBy: activeUser?.email || MASTER_ADMIN_EMAIL,
      };

      // Strip any undefined fields so Firestore setDoc never rejects the payload
      const sanitizedPayload: CompanyBrandConfig = JSON.parse(JSON.stringify(rawPayload));

      const brandDocRef = doc(db, 'settings', 'brand');
      await setDoc(brandDocRef, sanitizedPayload);
      setBrand(sanitizedPayload);
      setIsCloudSynced(true);
      showToast('☁️ Brand, Logos & Interface published live to all users!');
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/brand');
      showToast('Failed to save brand settings to cloud database');
      return false;
    }
  };

  // Publish Patterns to Cloud Firestore (/settings/patterns)
  // Only accessible to nikunj.kansagara87@gmail.com
  const handleSavePatternsToCloud = async (newPatterns: TilePattern[]): Promise<boolean> => {
    const activeUser = currentUser || auth.currentUser;
    if (!isMasterAdmin(activeUser)) {
      showToast(`Please sign in as Master Admin (${MASTER_ADMIN_EMAIL}) to publish patterns.`);
      return false;
    }

    try {
      // Compress Grid Layout into ultra-light ~180B string (zero base64 images)
      const cloudPatterns: TilePattern[] = [];
      const localHydratedPatterns: TilePattern[] = [];

      for (const pat of newPatterns) {
        const blocks = decompressBlueprintLayout(
          pat.compactBlueprintLayout,
          pat.customBlueprintLayout
        );
        const compactStr = compressBlueprintLayout(
          blocks,
          pat.blueprintRotation ?? blocks[0]?.gridRotation ?? 0,
          pat.blueprintStyle ?? blocks[0]?.cadStyle ?? 'color'
        );

        const baseClean: TilePattern = {
          id: pat.id || `p-${Date.now()}`,
          code: pat.code || 'P.1',
          name: pat.name || 'Modular Pattern',
          subtitle: pat.subtitle || '',
          description: pat.description || '',
          layoutType: pat.layoutType || 'modular3',
          components: (pat.components || []).map((c) => ({
            sizeMm: c.sizeMm || '600 × 600',
            inches: c.inches || '24" × 24"',
            ratioPct: Number(c.ratioPct) || 0,
            sqftPerBox: Number(c.sqftPerBox) || 11.62,
            weightPerBoxKg: Number(c.weightPerBoxKg) || 28,
            rate: Number(c.rate) || 380,
            colorCode: c.colorCode || '#2563eb',
          })),
        };

        if (pat.blueprintNotes) baseClean.blueprintNotes = pat.blueprintNotes;
        if (pat.blueprintActiveTab === 'layout' || pat.blueprintActiveTab === 'table') {
          baseClean.blueprintActiveTab = pat.blueprintActiveTab;
        }
        const effectiveRot = pat.blueprintRotation ?? blocks[0]?.gridRotation ?? 0;
        if (effectiveRot !== 0) baseClean.blueprintRotation = effectiveRot;
        const effectiveStyle = pat.blueprintStyle ?? blocks[0]?.cadStyle ?? 'color';
        if (effectiveStyle !== 'color') baseClean.blueprintStyle = effectiveStyle;

        // Cloud payload stores the ultra-lightweight compactBlueprintLayout string (~180 bytes)
        const cloudItem: TilePattern = {
          ...baseClean,
          ...(compactStr ? { compactBlueprintLayout: compactStr } : {}),
        };
        cloudPatterns.push(cloudItem);

        // Local state keeps both compactBlueprintLayout and hydrated customBlueprintLayout
        const localItem: TilePattern = {
          ...baseClean,
          ...(compactStr ? { compactBlueprintLayout: compactStr } : {}),
          ...(blocks.length > 0 ? { customBlueprintLayout: minifyBlueprintBlocks(blocks) } : {}),
        };
        localHydratedPatterns.push(localItem);
      }

      // Update local state immediately so UI feels instantaneous
      setPatterns(localHydratedPatterns);

      // Deep sanitize to guarantee zero undefined values anywhere in the Firestore document
      const safeCloudList: TilePattern[] = JSON.parse(JSON.stringify(cloudPatterns));

      const patternsDocRef = doc(db, 'settings', 'patterns');
      await setDoc(patternsDocRef, {
        patternsList: safeCloudList,
        updatedAt: new Date().toISOString(),
        updatedBy: activeUser?.email || MASTER_ADMIN_EMAIL,
      });

      setIsCloudSynced(true);
      showToast('☁️ Full Grid Layout compressed & published live to all users!');
      return true;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/patterns');
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to publish patterns: ${errMsg.slice(0, 80)}`);
      return false;
    }
  };

  // Publish Tiles Catalog to Cloud Firestore (/settings/tiles)
  // Only accessible to nikunj.kansagara87@gmail.com
  const handleSaveTilesToCloud = async (newTiles: TileSize[]): Promise<boolean> => {
    const activeUser = currentUser || auth.currentUser;
    if (!isMasterAdmin(activeUser)) {
      showToast(`Please sign in as Master Admin (${MASTER_ADMIN_EMAIL}) to publish tile catalog.`);
      return false;
    }

    try {
      const sanitizedTiles: TileSize[] = JSON.parse(JSON.stringify(newTiles));
      const tilesDocRef = doc(db, 'settings', 'tiles');
      await setDoc(tilesDocRef, {
        tilesList: sanitizedTiles,
        updatedAt: new Date().toISOString(),
        updatedBy: activeUser?.email || MASTER_ADMIN_EMAIL,
      });
      setTiles(sanitizedTiles);
      setIsCloudSynced(true);
      showToast('☁️ Tile size catalog published live to all users!');
      return true;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/tiles');
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to publish tile sizes: ${errMsg.slice(0, 80)}`);
      return false;
    }
  };

  // Reset tile catalog to default standard sizes
  const handleResetTilesToDefault = async () => {
    const activeUser = currentUser || auth.currentUser;
    if (!isMasterAdmin(activeUser)) {
      showToast(`Please sign in as Master Admin (${MASTER_ADMIN_EMAIL}) to reset tile catalog.`);
      return;
    }
    setTiles(INITIAL_STANDARD_TILES);
    await handleSaveTilesToCloud(INITIAL_STANDARD_TILES);
    showToast('Factory standard tile catalog restored and synced.');
  };

  // Quotation Add Handler
  const handleAddToQuotation = (newItem: QuotationLineItem) => {
    setQuotationItems((prev) => {
      const existingIdx = prev.findIndex(
        (it) =>
          it.name === newItem.name &&
          it.unitRate === newItem.unitRate &&
          it.rateBasis === newItem.rateBasis
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        const existing = copy[existingIdx];
        const newBoxQty = existing.boxQty + newItem.boxQty;
        const newTotalSqft = existing.sqftPerBox ? newBoxQty * existing.sqftPerBox : 0;
        const newTotalWeight = newBoxQty * (existing.weightPerBoxKg || 0);
        let newAmount = 0;
        if (existing.rateBasis === 'box') {
          newAmount = newBoxQty * existing.unitRate;
        } else {
          newAmount = newTotalSqft * existing.unitRate;
        }

        copy[existingIdx] = {
          ...existing,
          boxQty: newBoxQty,
          totalSqft: Math.round(newTotalSqft * 100) / 100,
          totalWeightKg: Math.round(newTotalWeight * 100) / 100,
          amount: Math.round(newAmount * 100) / 100,
        };
        return copy;
      }
      return [...prev, newItem];
    });
  };

  // Calculations for Print and Summary
  const subtotal = quotationItems.reduce((sum, item) => sum + item.amount, 0);
  const totalBoxes = quotationItems.reduce(
    (sum, item) => sum + (item.source !== 'custom' ? item.boxQty : 0),
    0
  );
  const totalSqft = quotationItems.reduce((sum, item) => sum + (item.totalSqft || 0), 0);
  const totalWeightKg = quotationItems.reduce((sum, item) => sum + (item.totalWeightKg || 0), 0);
  const totalTons = totalWeightKg / 1000;

  let discountAmount = 0;
  if (freightTax.discountType === 'percentage') {
    discountAmount = (subtotal * Math.max(0, freightTax.discountValue)) / 100;
  } else {
    discountAmount = Math.max(0, freightTax.discountValue);
  }

  let freightAmount = 0;
  if (freightTax.freightMode === 'perTon') {
    freightAmount = totalTons * Math.max(0, freightTax.freightValue);
  } else {
    freightAmount = Math.max(0, freightTax.freightValue);
  }

  const insurancePct = Math.max(0, freightTax.insurancePct ?? freightTax.insuranceCharges ?? 0);
  const insuranceAmount = (Math.max(0, subtotal - discountAmount) * insurancePct) / 100;

  const taxableAmount = Math.max(
    0,
    subtotal - discountAmount + freightAmount + (freightTax.loadingCharges || 0) + insuranceAmount
  );

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let totalTax = 0;

  if (freightTax.gstType === 'intra') {
    cgstAmount = (taxableAmount * 9) / 100;
    sgstAmount = (taxableAmount * 9) / 100;
    totalTax = cgstAmount + sgstAmount;
  } else if (freightTax.gstType === 'inter') {
    igstAmount = (taxableAmount * 18) / 100;
    totalTax = igstAmount;
  } else if (freightTax.gstType === 'custom') {
    totalTax = (taxableAmount * Math.max(0, freightTax.customGstRate)) / 100;
  }

  const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

  // Save current quote to history
  const handleSaveQuotationToHistory = () => {
    if (quotationItems.length === 0) {
      showToast('Cannot save an empty quotation');
      return;
    }
    const newRecord: SavedQuotationRecord = {
      id: 'quote-rec-' + Date.now(),
      savedAt: new Date().toISOString(),
      customer: { ...customer },
      items: [...quotationItems],
      freightTax: { ...freightTax },
      grandTotal,
    };
    setSavedQuotes((prev) => [newRecord, ...prev]);
    showToast(`Quotation ${customer.quotationNo} saved to history`);
  };

  const handleLoadSavedQuote = (record: SavedQuotationRecord) => {
    setCustomer(record.customer);
    setQuotationItems(record.items);
    setFreightTax(record.freightTax);
    setActiveTab('quotation');
  };

  const handleDeleteSavedQuote = (id: string) => {
    setSavedQuotes((prev) => prev.filter((r) => r.id !== id));
  };

  // Compute font family style
  const fontFamilyMap: Record<string, string> = {
    jakarta: "'Plus Jakarta Sans', system-ui, sans-serif",
    system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, Cambria, 'Times New Roman', Times, serif",
    mono: "'JetBrains Mono', monospace",
  };

  // Compute background style (supports custom image with scrim overlay OR gradient)
  const overlayAlpha = ((brand.bgOverlayOpacity ?? 75) / 100).toFixed(2);
  const appBackgroundStyle: React.CSSProperties = {
    backgroundImage: brand.bgImageUrl
      ? `linear-gradient(rgba(15, 23, 42, ${overlayAlpha}), rgba(15, 23, 42, ${overlayAlpha})), url(${brand.bgImageUrl})`
      : (brand.themeGradient || DEFAULT_BRAND_CONFIG.themeGradient),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: fontFamilyMap[brand.fontFamily || 'jakarta'],
  };

  const isAdmin = isMasterAdmin(currentUser);
  const isQuotationHiddenForUsers = brand.hideQuotationForUsers !== false;
  const canAccessQuotation = isAdmin || !isQuotationHiddenForUsers;

  // Auto-switch away from quotation tab if non-admin user while feature is hidden
  useEffect(() => {
    if (!canAccessQuotation && activeTab === 'quotation') {
      setActiveTab('standard');
    }
  }, [canAccessQuotation, activeTab]);

  return (
    <div
      className="min-h-screen text-slate-800 transition-colors selection:bg-amber-500 selection:text-white"
      style={appBackgroundStyle}
    >
      {/* Toast Notification Banner */}
      <Toast message={toastMessage} />

      {/* Main Header with Admin Status, Multi-Brand Strip & Cloud Sync */}
      <Header
        brand={brand}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'quotation' && !canAccessQuotation) {
            showToast('Quotation feature is currently private / admin only');
            return;
          }
          setActiveTab(tab);
        }}
        quotationItemCount={quotationItems.length}
        currentUser={currentUser}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
        onOpenUnitConverter={() => setShowUnitConverter(true)}
        onOpenTruckAdvisor={() => setShowTruckAdvisor(true)}
        onTriggerAdminModal={() => setShowAdminModal(true)}
        onShowToast={showToast}
        isCloudSynced={isCloudSynced}
        canAccessQuotation={canAccessQuotation}
      />

      {/* Main Application Container */}
      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-6">
        {/* TAB 1: Standard Tile Box & Weight Calculator */}
        {activeTab === 'standard' && (
          <StandardCalculator
            brand={brand}
            tiles={tiles}
            currentUser={currentUser}
            onLogin={handleGoogleLogin}
            onUpdateTiles={setTiles}
            onSaveTilesToCloud={handleSaveTilesToCloud}
            onResetTilesToDefault={handleResetTilesToDefault}
            onAddToQuotation={handleAddToQuotation}
            onShowToast={showToast}
          />
        )}

        {/* TAB 2: Pattern Coverage Calculator (P.1 through P.18 & Custom) */}
        {activeTab === 'pattern' && (
          <PatternCalculator
            brand={brand}
            patterns={patterns}
            currentUser={currentUser}
            onOpenPatternManager={(patternId) => {
              setPatternManagerTargetId(patternId || null);
              setShowPatternManager(true);
            }}
            onSavePatternsToCloud={handleSavePatternsToCloud}
            onUpdatePatterns={setPatterns}
            onAddToQuotation={handleAddToQuotation}
            onShowToast={showToast}
          />
        )}

        {/* TAB 3: Quotation, Freight & Tax Proforma Builder (Admin-only while hidden for users) */}
        {activeTab === 'quotation' && canAccessQuotation && (
          <QuotationBuilder
            brand={brand}
            customer={customer}
            onUpdateCustomer={setCustomer}
            items={quotationItems}
            onUpdateItems={setQuotationItems}
            freightTax={freightTax}
            onUpdateFreightTax={setFreightTax}
            onShowToast={showToast}
            onSaveQuotationToHistory={handleSaveQuotationToHistory}
            onOpenSavedQuotes={() => setShowSavedQuotes(true)}
            savedQuotesCount={savedQuotes.length}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-6 border-t border-slate-500/25 text-slate-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-200">{brand.companyName}</span>
          {isCloudSynced && (
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
              Cloud Synced
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdminModal(true)}
            className="hover:text-amber-400 transition-colors flex items-center gap-1 font-semibold"
          >
            <span>Theme & Brand Studio</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
              {isMasterAdmin(currentUser) ? 'Admin Open' : 'Admin Only'}
            </span>
          </button>
          <span>·</span>
          <span className="text-amber-400 font-semibold">
            Created by {brand.creatorName}
          </span>
        </div>
      </footer>

      {/* Printable Quotation View (Visible only during window.print()) */}
      <PrintQuotation
        brand={brand}
        customer={customer}
        items={quotationItems}
        freightTax={freightTax}
        calculations={{
          subtotal,
          discountAmount,
          freightAmount,
          insurancePct,
          insuranceAmount,
          taxableAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalTax,
          grandTotal,
          totalBoxes,
          totalSqft,
          totalWeightKg,
        }}
      />

      {/* Admin Brand, Logos & Interface Studio Modal */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        brand={brand}
        currentUser={currentUser}
        onLogin={handleGoogleLogin}
        onSaveBrandToCloud={handleSaveBrandToCloud}
        onShowToast={showToast}
        onOpenPatternManager={() => {
          setPatternManagerTargetId(null);
          setShowPatternManager(true);
        }}
      />

      {/* Admin Modular Pattern Studio & Uploader Modal */}
      <PatternManagerModal
        isOpen={showPatternManager}
        onClose={() => setShowPatternManager(false)}
        patterns={patterns}
        currentUser={currentUser}
        onLogin={handleGoogleLogin}
        onSavePatternsToCloud={handleSavePatternsToCloud}
        onShowToast={showToast}
        initialEditingPatternId={patternManagerTargetId}
      />

      {/* Unit Converter Modal */}
      <UnitConverterModal
        isOpen={showUnitConverter}
        onClose={() => setShowUnitConverter(false)}
      />

      {/* Truck Weight Advisor Modal */}
      <TruckAdvisorModal
        isOpen={showTruckAdvisor}
        onClose={() => setShowTruckAdvisor(false)}
        currentWeightKg={totalWeightKg}
      />

      {/* Saved Quotations History Modal */}
      <SavedQuotesModal
        isOpen={showSavedQuotes}
        onClose={() => setShowSavedQuotes(false)}
        savedQuotes={savedQuotes}
        onLoadQuote={handleLoadSavedQuote}
        onDeleteQuote={handleDeleteSavedQuote}
        onShowToast={showToast}
      />
    </div>
  );
}
