import React, { useState } from 'react';
import {
  CompanyBrandConfig,
  QuotationCustomer,
  QuotationLineItem,
  FreightTaxConfig,
} from '../types';
import {
  formatINR,
  formatNumberIN,
  getRecommendedTruck,
  ACCENT_PALETTES,
  getCardContainerStyle,
  getTableHeaderClass,
} from '../utils/formatters';
import { numberToIndianWords } from '../utils/numberToWords';
import {
  Printer,
  Share2,
  Trash2,
  Plus,
  Copy,
  BookmarkCheck,
  Truck,
  Building,
  User,
  Phone,
  MapPin,
  FileCheck2,
  Stamp,
} from 'lucide-react';

interface QuotationBuilderProps {
  brand: CompanyBrandConfig;
  customer: QuotationCustomer;
  onUpdateCustomer: (customer: QuotationCustomer) => void;
  items: QuotationLineItem[];
  onUpdateItems: (items: QuotationLineItem[]) => void;
  freightTax: FreightTaxConfig;
  onUpdateFreightTax: (config: FreightTaxConfig) => void;
  onShowToast: (msg: string) => void;
  onSaveQuotationToHistory: () => void;
  onOpenSavedQuotes: () => void;
  savedQuotesCount: number;
}

export const QuotationBuilder: React.FC<QuotationBuilderProps> = ({
  brand,
  customer,
  onUpdateCustomer,
  items,
  onUpdateItems,
  freightTax,
  onUpdateFreightTax,
  onShowToast,
  onSaveQuotationToHistory,
  onOpenSavedQuotes,
  savedQuotesCount,
}) => {
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [customItemName, setCustomItemName] = useState<string>('Tile Adhesive 20kg Bag');
  const [customItemQty, setCustomItemQty] = useState<number>(10);
  const [customItemRate, setCustomItemRate] = useState<number>(320);
  const [customItemWt, setCustomItemWt] = useState<number>(20);

  const accent = ACCENT_PALETTES[brand.accentColor || 'amber'] || ACCENT_PALETTES.amber;
  const cardStyle = getCardContainerStyle(brand);
  const tableHeaderClass = getTableHeaderClass(brand);

  // Line item modifications
  const handleItemQtyChange = (itemId: string, newQty: number) => {
    const updated = items.map((item) => {
      if (item.id === itemId) {
        const qty = Math.max(1, newQty);
        const totalSqft = item.sqftPerBox ? qty * item.sqftPerBox : 0;
        const totalWeightKg = qty * (item.weightPerBoxKg || 0);
        let amount = 0;
        if (item.rateBasis === 'box') {
          amount = qty * item.unitRate;
        } else {
          amount = totalSqft * item.unitRate;
        }
        return {
          ...item,
          boxQty: qty,
          totalSqft: Math.round(totalSqft * 100) / 100,
          totalWeightKg: Math.round(totalWeightKg * 100) / 100,
          amount: Math.round(amount * 100) / 100,
        };
      }
      return item;
    });
    onUpdateItems(updated);
  };

  const handleItemRateChange = (itemId: string, newRate: number) => {
    const updated = items.map((item) => {
      if (item.id === itemId) {
        let amount = 0;
        if (item.rateBasis === 'box') {
          amount = item.boxQty * newRate;
        } else {
          amount = item.totalSqft * newRate;
        }
        return {
          ...item,
          unitRate: newRate,
          amount: Math.round(amount * 100) / 100,
        };
      }
      return item;
    });
    onUpdateItems(updated);
  };

  const handleRemoveItem = (itemId: string) => {
    const updated = items.filter((i) => i.id !== itemId);
    onUpdateItems(updated);
    onShowToast('Item removed from quotation');
  };

  const handleClearAllItems = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      onShowToast('Click "Confirm Clear" again to clear all quotation items.');
      setTimeout(() => setConfirmClear(false), 3500);
      return;
    }
    setConfirmClear(false);
    onUpdateItems([]);
    onShowToast('Quotation items cleared');
  };

  // Add custom auxiliary product / service
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;

    const newItem: QuotationLineItem = {
      id: 'custom-quote-item-' + Date.now(),
      name: customItemName.trim(),
      source: 'custom',
      boxQty: customItemQty,
      sqftPerBox: 0,
      totalSqft: 0,
      weightPerBoxKg: customItemWt,
      totalWeightKg: customItemQty * customItemWt,
      rateBasis: 'box',
      unitRate: customItemRate,
      amount: customItemQty * customItemRate,
      notes: 'Auxiliary tiling material / service',
    };

    onUpdateItems([...items, newItem]);
    setShowAddCustomModal(false);
    setCustomItemName('');
    onShowToast(`Added "${newItem.name}" to quotation`);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const totalBoxes = items.reduce((sum, item) => sum + (item.source !== 'custom' ? item.boxQty : 0), 0);
  const totalSqft = items.reduce((sum, item) => sum + (item.totalSqft || 0), 0);
  const totalWeightKg = items.reduce((sum, item) => sum + (item.totalWeightKg || 0), 0);
  const totalTons = totalWeightKg / 1000;

  // Discount
  let discountAmount = 0;
  if (freightTax.discountType === 'percentage') {
    discountAmount = (subtotal * Math.max(0, freightTax.discountValue)) / 100;
  } else {
    discountAmount = Math.max(0, freightTax.discountValue);
  }

  // Freight / Transportation
  let freightAmount = 0;
  if (freightTax.freightMode === 'perTon') {
    freightAmount = totalTons * Math.max(0, freightTax.freightValue);
  } else if (freightTax.freightMode === 'percentage') {
    freightAmount = (Math.max(0, subtotal - discountAmount) * Math.max(0, freightTax.freightValue || freightTax.freightPct || 0)) / 100;
  } else {
    freightAmount = Math.max(0, freightTax.freightValue);
  }

  // Transit Insurance in % (calculated on net goods value: subtotal - discountAmount)
  const insurancePct = Math.max(0, freightTax.insurancePct ?? freightTax.insuranceCharges ?? 0);
  const insuranceAmount = (Math.max(0, subtotal - discountAmount) * insurancePct) / 100;

  const taxableAmount = Math.max(
    0,
    subtotal - discountAmount + freightAmount + (freightTax.loadingCharges || 0) + insuranceAmount
  );

  // Taxes
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
  const truckAdvice = getRecommendedTruck(totalWeightKg);

  // WhatsApp Share Generator
  const handleShareWhatsApp = () => {
    let text = `*${brand.invoiceTitle || 'ESTIMATE / QUOTATION'} - ${brand.companyName}*\n`;
    text += `Quotation No: ${customer.quotationNo}\n`;
    text += `Date: ${customer.quotationDate}\n`;
    text += `Customer: ${customer.clientName || 'Valued Customer'}\n`;
    if (customer.deliverySite) text += `Destination: ${customer.deliverySite}\n`;
    text += `------------------------------------\n`;
    text += `*ITEM DETAILS:*\n`;

    items.forEach((item, index) => {
      text += `${index + 1}. ${item.name}\n`;
      text += `   Qty: ${item.boxQty} Bxs | Area: ${item.totalSqft} sqft | Rate: ₹${item.unitRate}/${item.rateBasis} | Total: ₹${item.amount.toLocaleString('en-IN')}\n`;
    });

    text += `------------------------------------\n`;
    text += `Subtotal: ₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    if (discountAmount > 0) text += `Discount: -₹${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    if (freightAmount > 0) text += `Freight / Transport: ₹${freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    if (insuranceAmount > 0) text += `Transit Insurance (${insurancePct}%): ₹${insuranceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    text += `GST: ₹${totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    text += `*GRAND TOTAL: ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n`;
    text += `*(${numberToIndianWords(grandTotal)})*\n`;
    text += `Total Weight: ${totalTons.toFixed(2)} Tons (${totalBoxes} Boxes)\n`;
    text += `------------------------------------\n`;
    text += `Bank Transfer: ${brand.bankName} | A/C: ${brand.accountNo} | IFSC: ${brand.ifscCode}\n`;
    text += `Contact: ${brand.phone} | Morbi, Gujarat`;

    const phoneClean = customer.phone.replace(/[^0-9]/g, '');
    const url =
      phoneClean.length >= 10
        ? `https://api.whatsapp.com/send?phone=${
            phoneClean.startsWith('91') ? phoneClean : '91' + phoneClean
          }&text=${encodeURIComponent(text)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    let text = `${brand.invoiceTitle || 'ESTIMATE / QUOTATION'} - ${brand.companyName}\n`;
    text += `Quotation No: ${customer.quotationNo} | Date: ${customer.quotationDate}\n`;
    text += `Customer: ${customer.clientName}\n\n`;
    items.forEach((item, index) => {
      text += `${index + 1}. ${item.name} - ${item.boxQty} Boxes (₹${item.amount.toLocaleString('en-IN')})\n`;
    });
    text += `\nSubtotal: ₹${subtotal.toLocaleString('en-IN')}\n`;
    text += `Taxes: ₹${totalTax.toLocaleString('en-IN')}\n`;
    text += `Net Payable: ₹${grandTotal.toLocaleString('en-IN')}\n`;
    text += `Weight: ${totalTons.toFixed(2)} Tons (${totalBoxes} Boxes)`;

    navigator.clipboard.writeText(text);
    onShowToast('Quotation text copied to clipboard');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Quotation Header & Actions Bar */}
      <div className={`${cardStyle.className} p-4 sm:p-5 no-print`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 uppercase">
                {brand.invoiceTitle || 'PROFORMA QUOTATION & TAX BUILDER'}
              </span>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-300">
                {customer.quotationNo}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live calculation with Morbi standard freight logistics, GST split (18%), and instant A4 PDF printing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onSaveQuotationToHistory}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <BookmarkCheck className={`w-3.5 h-3.5 ${accent.textAccent}`} />
              <span>Save Quote</span>
            </button>

            <button
              onClick={onOpenSavedQuotes}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Saved ({savedQuotesCount})</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              <span>Copy</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Customer & Project Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>Customer / Contact *</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rajeshbhai Patel"
              value={customer.clientName}
              onChange={(e) => onUpdateCustomer({ ...customer, clientName: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <Building className="w-3 h-3 text-slate-400" />
              <span>Firm / Project Name</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Shivalik Residency Project"
              value={customer.companyName}
              onChange={(e) => onUpdateCustomer({ ...customer, companyName: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>Mobile / WhatsApp</span>
            </label>
            <input
              type="text"
              placeholder="+91 98980 XXXXX"
              value={customer.phone}
              onChange={(e) => onUpdateCustomer({ ...customer, phone: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Delivery Site / City</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ahmedabad / Bangalore Site"
              value={customer.deliverySite}
              onChange={(e) => onUpdateCustomer({ ...customer, deliverySite: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Date, Number & Validity Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/70 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Estimate No:</span>
            <input
              type="text"
              value={customer.quotationNo}
              onChange={(e) => onUpdateCustomer({ ...customer, quotationNo: e.target.value })}
              className="px-2 py-1 rounded border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Date:</span>
            <input
              type="date"
              value={customer.quotationDate}
              onChange={(e) => onUpdateCustomer({ ...customer, quotationDate: e.target.value })}
              className="px-2 py-1 rounded border border-slate-300 bg-white font-medium text-slate-900 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Valid Until:</span>
            <input
              type="date"
              value={customer.validUntil}
              onChange={(e) => onUpdateCustomer({ ...customer, validUntil: e.target.value })}
              className="px-2 py-1 rounded border border-slate-300 bg-white font-medium text-slate-900 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className={`${cardStyle.className} overflow-hidden no-print`}>
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Quotation Line Items ({items.length})
            </h3>
            <span className="text-xs text-slate-500">
              · Total: {formatNumberIN(totalSqft, 2)} sqft · {totalBoxes} boxes · {formatNumberIN(totalTons, 2)} Tons
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddCustomModal(true)}
              className={`px-3 py-1 rounded-lg ${accent.bgSolid} ${accent.bgHover} text-white text-xs font-bold flex items-center gap-1 shadow-xs`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Material / Service</span>
            </button>

            {items.length > 0 && (
              <button
                onClick={handleClearAllItems}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  confirmClear
                    ? 'bg-rose-600 text-white font-bold'
                    : 'text-rose-600 hover:bg-rose-50'
                }`}
                title="Clear all line items"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmClear ? 'Confirm Clear?' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className={`${tableHeaderClass} text-[11px] uppercase tracking-wider font-semibold`}>
                <th className="py-2.5 px-3 w-8">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-center w-24">Box Qty</th>
                <th className="py-2.5 px-2 text-right">Sqft/Box</th>
                <th className="py-2.5 px-3 text-right">Total Area</th>
                <th className="py-2.5 px-3 text-right">Weight (kg)</th>
                <th className="py-2.5 px-3 text-right w-28">Rate (₹)</th>
                <th className="py-2.5 px-3 text-right font-extrabold">Amount (₹)</th>
                <th className="py-2.5 px-2 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/95">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm text-slate-600">Your quotation is currently empty.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Go to <b>1. Tile Box Calculator</b> or <b>2. Pattern Coverage (P.1–P.18)</b> and click <b>+ Quote</b> to add items here.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-xs">{index + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        {item.sizeMm && <span>{item.sizeMm}</span>}
                        {item.source === 'pattern' && (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold text-[10px]">
                            Pattern
                          </span>
                        )}
                        {item.source === 'custom' && (
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-bold text-[10px]">
                            Material
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Box Qty input */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.boxQty}
                        onChange={(e) => handleItemQtyChange(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 px-1.5 py-1 rounded border border-slate-300 bg-white font-extrabold text-center text-slate-900 font-tabular text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </td>

                    {/* Sqft/Box */}
                    <td className="py-2.5 px-2 text-right font-tabular text-slate-600">
                      {item.sqftPerBox ? formatNumberIN(item.sqftPerBox, 2) : '-'}
                    </td>

                    {/* Total Area */}
                    <td className="py-2.5 px-3 text-right font-tabular font-bold text-slate-800">
                      {item.totalSqft ? `${formatNumberIN(item.totalSqft, 2)} sqft` : '-'}
                    </td>

                    {/* Weight */}
                    <td className="py-2.5 px-3 text-right font-tabular text-slate-700">
                      {item.totalWeightKg ? `${formatNumberIN(item.totalWeightKg, 0)} kg` : '-'}
                    </td>

                    {/* Rate Input */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="relative inline-block w-full">
                        <span className="absolute left-1.5 top-1 text-slate-400 text-[10px]">₹</span>
                        <input
                          type="number"
                          value={item.unitRate}
                          step="any"
                          onChange={(e) => handleItemRateChange(item.id, parseFloat(e.target.value) || 0)}
                          className="w-full pl-4 pr-1 py-1 rounded border border-slate-300 bg-white text-right font-extrabold text-slate-900 font-tabular text-xs"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block">/{item.rateBasis}</span>
                    </td>

                    {/* Line Total */}
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 font-tabular">
                      {formatINR(item.amount)}
                    </td>

                    {/* Delete */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logistics & Financial Calculations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 no-print">
        {/* Logistics & Truck Advice Strip */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                <span>Morbi Freight & Truck Feasibility</span>
              </span>
              <span className="text-xs font-bold text-slate-300 font-mono">
                {formatNumberIN(totalTons, 2)} Tons
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="text-xs font-extrabold text-white">
                {truckAdvice.recommended.type} ({truckAdvice.recommended.wheels})
              </div>
              <p className="text-[11px] text-slate-400">
                {truckAdvice.recommended.description} · Rated limit: {truckAdvice.recommended.capacityTons} Tons
              </p>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    truckAdvice.loadPct > 100
                      ? 'bg-rose-500'
                      : truckAdvice.loadPct > 85
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, truckAdvice.loadPct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
                <span>Load Utilization: {truckAdvice.loadPct}%</span>
                <span>{truckAdvice.loadPct > 100 ? '⚠️ Exceeds capacity' : '✓ Safe load'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Boxes:</span>
                <div className="text-sm font-extrabold text-amber-300 font-tabular">{totalBoxes} Boxes</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Area:</span>
                <div className="text-sm font-extrabold text-emerald-300 font-tabular">
                  {formatNumberIN(totalSqft, 2)} sqft
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details & Digital Stamp Preview */}
          <div className={`${cardStyle.className} p-4 text-xs space-y-3`}>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 block">
                  Payment Deposit Account:
                </span>
                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank:</span>
                    <span className="font-bold text-slate-900">{brand.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account No:</span>
                    <span className="font-mono font-bold text-slate-900">{brand.accountNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC Code:</span>
                    <span className="font-mono font-bold text-slate-900">{brand.ifscCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Branch:</span>
                    <span className="text-slate-800">{brand.branch}</span>
                  </div>
                </div>
              </div>

              {brand.stampImageUrl && (
                <div className="border border-slate-200 rounded-xl p-2 bg-white text-center shrink-0">
                  <img
                    src={brand.stampImageUrl}
                    alt="Authorized Stamp"
                    referrerPolicy="no-referrer"
                    className="h-14 w-auto max-w-[100px] object-contain mx-auto"
                  />
                  <span className="text-[9px] font-bold text-slate-500 block mt-1">
                    {brand.signatoryTitle || 'Authorized Stamp'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial & Tax Settlement Card */}
        <div className={`lg:col-span-7 ${cardStyle.className} p-4 sm:p-5 space-y-4`}>
          <h3 className="font-extrabold text-slate-900 text-sm border-b pb-2">
            Pricing, Freight & Tax Calculation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Discount */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">Trade Discount</label>
              <div className="flex gap-2">
                <select
                  value={freightTax.discountType}
                  onChange={(e) =>
                    onUpdateFreightTax({
                      ...freightTax,
                      discountType: e.target.value as 'percentage' | 'fixed',
                    })
                  }
                  className="px-2 py-1 rounded border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="percentage">% Pct</option>
                  <option value="fixed">Fixed ₹</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={freightTax.discountValue || ''}
                  onChange={(e) =>
                    onUpdateFreightTax({
                      ...freightTax,
                      discountValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-bold text-right text-xs"
                />
              </div>
              <span className="text-[10px] text-rose-600 block">
                - {formatINR(discountAmount)}
              </span>
            </div>

            {/* Freight */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">Freight & Transportation</label>
              <div className="flex gap-2">
                <select
                  value={freightTax.freightMode}
                  onChange={(e) =>
                    onUpdateFreightTax({
                      ...freightTax,
                      freightMode: e.target.value as 'fixed' | 'perTon' | 'percentage',
                    })
                  }
                  className="px-2 py-1 rounded border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="perTon">₹ / Ton (Fix on Ton)</option>
                  <option value="percentage">% Percentage</option>
                  <option value="fixed">Fixed ₹ Total</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={freightTax.freightValue || ''}
                  onChange={(e) =>
                    onUpdateFreightTax({
                      ...freightTax,
                      freightValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-bold text-right text-xs"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                {freightTax.freightMode === 'perTon'
                  ? `${formatNumberIN(totalTons, 2)} Tons × ₹${freightTax.freightValue}/Ton = ${formatINR(freightAmount)}`
                  : freightTax.freightMode === 'percentage'
                  ? `${freightTax.freightValue}% of ${formatINR(subtotal - discountAmount)} = ${formatINR(freightAmount)}`
                  : formatINR(freightAmount)}
              </span>
            </div>

            {/* Loading / Hamali */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">Loading & Hamali Charges (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={freightTax.loadingCharges || ''}
                onChange={(e) =>
                  onUpdateFreightTax({
                    ...freightTax,
                    loadingCharges: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-bold text-right text-xs"
              />
              <span className="text-[10px] text-slate-500 block">
                + {formatINR(freightTax.loadingCharges || 0)}
              </span>
            </div>

            {/* Transit Insurance in % */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">Transit Insurance (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={insurancePct || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateFreightTax({
                      ...freightTax,
                      insurancePct: val,
                      insuranceCharges: val,
                    });
                  }}
                  placeholder="0"
                  className="w-full px-2 pr-6 py-1 rounded border border-slate-300 bg-white font-bold text-right text-xs"
                />
                <span className="absolute right-2 top-1 text-slate-400 font-bold text-xs">%</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                + {formatINR(insuranceAmount)} ({insurancePct}% of goods)
              </span>
            </div>

            {/* GST Type Selection */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
              <label className="font-bold text-slate-700 block">GST Tax Category</label>
              <select
                value={freightTax.gstType}
                onChange={(e) =>
                  onUpdateFreightTax({
                    ...freightTax,
                    gstType: e.target.value as any,
                  })
                }
                className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white font-bold text-slate-900"
              >
                <option value="intra">Intra-State: CGST 9% + SGST 9% (18%)</option>
                <option value="inter">Inter-State: IGST 18%</option>
                <option value="exempt">Zero / Exempt (0%)</option>
                <option value="custom">Custom Tax Rate</option>
              </select>
              {freightTax.gstType === 'custom' && (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={freightTax.customGstRate}
                  onChange={(e) =>
                    onUpdateFreightTax({
                      ...freightTax,
                      customGstRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Custom GST %"
                  className="w-full mt-1 px-2 py-0.5 rounded border border-slate-300 bg-white text-xs"
                />
              )}
            </div>
          </div>

          {/* Financial Summary Breakdown List */}
          <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal of Goods:</span>
              <span className="font-tabular font-bold text-slate-900">{formatINR(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span className="font-tabular font-bold">- {formatINR(discountAmount)}</span>
              </div>
            )}

            {freightAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Freight & Transportation:</span>
                <span className="font-tabular font-bold text-slate-900">{formatINR(freightAmount)}</span>
              </div>
            )}

            {freightTax.loadingCharges > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Loading & Hamali:</span>
                <span className="font-tabular font-bold text-slate-900">
                  {formatINR(freightTax.loadingCharges)}
                </span>
              </div>
            )}

            {insuranceAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Transit Insurance ({insurancePct}%):</span>
                <span className="font-tabular font-bold text-slate-900">
                  {formatINR(insuranceAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between font-bold text-slate-800 border-t pt-2">
              <span>Taxable Value:</span>
              <span className="font-tabular">{formatINR(taxableAmount)}</span>
            </div>

            {freightTax.gstType === 'intra' && (
              <>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>CGST @ 9%:</span>
                  <span className="font-tabular font-semibold text-slate-800">
                    {formatINR(cgstAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>SGST @ 9%:</span>
                  <span className="font-tabular font-semibold text-slate-800">
                    {formatINR(sgstAmount)}
                  </span>
                </div>
              </>
            )}

            {freightTax.gstType === 'inter' && (
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>IGST @ 18%:</span>
                <span className="font-tabular font-semibold text-slate-800">
                  {formatINR(igstAmount)}
                </span>
              </div>
            )}

            {freightTax.gstType === 'custom' && (
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>GST @ {freightTax.customGstRate}%:</span>
                <span className="font-tabular font-semibold text-slate-800">
                  {formatINR(totalTax)}
                </span>
              </div>
            )}

            <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline font-extrabold text-base text-slate-950">
              <span>FINAL NET PAYABLE:</span>
              <span className="font-tabular text-xl text-amber-900">{formatINR(grandTotal)}</span>
            </div>

            {/* Indian Currency in Words */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-950 font-medium">
              <span className="font-bold">In Words: </span>
              <span className="italic">{numberToIndianWords(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Material Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-slate-900 text-sm">Add Material / Service</h4>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block">Item / Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tile Adhesive 20kg, Grout, Spacers"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(parseInt(e.target.value) || 1)}
                    className="w-full mt-1 px-2 py-1 rounded border border-slate-300 text-xs font-bold font-tabular"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={customItemRate}
                    onChange={(e) => setCustomItemRate(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2 py-1 rounded border border-slate-300 text-xs font-bold font-tabular"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Unit Wt (kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={customItemWt}
                    onChange={(e) => setCustomItemWt(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2 py-1 rounded border border-slate-300 text-xs font-bold font-tabular"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-lg ${accent.bgSolid} ${accent.bgHover} text-white text-xs font-bold shadow-xs`}
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
