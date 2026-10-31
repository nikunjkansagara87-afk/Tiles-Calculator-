import React from 'react';
import { CompanyBrandConfig, QuotationCustomer, QuotationLineItem, FreightTaxConfig } from '../types';
import { formatINR, formatNumberIN } from '../utils/formatters';
import { numberToIndianWords } from '../utils/numberToWords';

interface PrintQuotationProps {
  brand: CompanyBrandConfig;
  customer: QuotationCustomer;
  items: QuotationLineItem[];
  freightTax: FreightTaxConfig;
  calculations: {
    subtotal: number;
    discountAmount: number;
    freightAmount: number;
    insurancePct?: number;
    insuranceAmount?: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
    grandTotal: number;
    totalBoxes: number;
    totalSqft: number;
    totalWeightKg: number;
  };
}

export const PrintQuotation: React.FC<PrintQuotationProps> = ({
  brand,
  customer,
  items,
  freightTax,
  calculations,
}) => {
  const partnerLogos = brand.partnerLogos || [];
  const showPartnerPrint = brand.showPartnerLogosInPrint !== false && partnerLogos.length > 0;

  return (
    <div className="print-only text-slate-900 font-sans p-6 bg-white max-w-[800px] mx-auto text-xs">
      {/* Top Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-start gap-4">
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.companyName}
              referrerPolicy="no-referrer"
              className="h-16 w-16 object-contain border border-slate-300 p-1 rounded bg-white"
            />
          ) : (
            <div className="h-14 w-14 bg-slate-900 text-white flex items-center justify-center font-extrabold text-xl rounded">
              {brand.logoInitials || 'NK'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">
              {brand.companyName}
            </h1>
            <p className="text-[11px] text-slate-600 font-medium">{brand.tagline}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {brand.address}, {brand.cityState}
            </p>
            <p className="text-[10px] text-slate-700 font-semibold mt-0.5">
              GSTIN: <span className="font-mono">{brand.gstin}</span> | Mobile:{' '}
              <span>{brand.phone}</span> | Email: <span>{brand.email}</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block bg-slate-900 text-white font-extrabold px-3 py-1 text-xs uppercase tracking-wider rounded mb-1">
            {brand.invoiceTitle || 'ESTIMATE / QUOTATION'}
          </div>
          <div className="text-[11px] font-bold text-slate-900 font-mono">
            {customer.quotationNo}
          </div>
          <div className="text-[10px] text-slate-600">Date: {customer.quotationDate}</div>
          <div className="text-[10px] text-slate-600">Valid Until: {customer.validUntil}</div>
        </div>
      </div>

      {/* Optional Partner / Sub-Brand Logos Strip on Print */}
      {showPartnerPrint && (
        <div className="flex items-center gap-3 flex-wrap border border-slate-200 rounded px-3 py-1.5 mb-3 bg-slate-50/60">
          <span className="text-[9px] font-extrabold uppercase text-slate-500">
            Authorized Brands & Divisions:
          </span>
          {partnerLogos.map((pl) => (
            <div key={pl.id} className="flex items-center gap-1.5 border-r border-slate-200 pr-2.5 last:border-none">
              {pl.logoUrl && (
                <img
                  src={pl.logoUrl}
                  alt={pl.name}
                  referrerPolicy="no-referrer"
                  className="h-4 w-auto max-w-[48px] object-contain"
                />
              )}
              <span className="text-[10px] font-bold text-slate-800">{pl.name}</span>
              {pl.badgeText && (
                <span className="text-[8px] text-slate-500">({pl.badgeText})</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bill To & Dispatch Details */}
      <div className="grid grid-cols-2 gap-4 border border-slate-300 p-3 rounded mb-4 bg-slate-50/50">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">
            Customer / Consignee:
          </span>
          <div className="text-sm font-extrabold text-slate-900">
            {customer.clientName || 'Valued Customer'}
          </div>
          {customer.companyName && (
            <div className="text-xs font-semibold text-slate-700">{customer.companyName}</div>
          )}
          <div className="text-[11px] text-slate-600 mt-1">
            Phone / WhatsApp: <b>{customer.phone || 'N/A'}</b>
          </div>
          {customer.email && (
            <div className="text-[11px] text-slate-600">Email: {customer.email}</div>
          )}
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">
            Delivery Site / Destination:
          </span>
          <div className="text-xs text-slate-800 font-medium">
            {customer.deliverySite || 'Factory Gate Dispatch (Morbi, Gujarat)'}
          </div>
          <div className="text-xs font-semibold text-slate-900 mt-0.5">
            {customer.city} {customer.state ? `, ${customer.state}` : ''}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            Dispatch Origin: <b>Morbi, Gujarat (Hub)</b>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full text-left border-collapse border border-slate-300 text-[11px] mb-4">
        <thead>
          <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold">
            <th className="py-2 px-2 border border-slate-700 w-8 text-center">#</th>
            <th className="py-2 px-2 border border-slate-700">Tile Description & Size</th>
            <th className="py-2 px-2 border border-slate-700 text-center w-16">Boxes</th>
            <th className="py-2 px-2 border border-slate-700 text-right w-16">Sqft/Bx</th>
            <th className="py-2 px-2 border border-slate-700 text-right w-20">Total Area</th>
            <th className="py-2 px-2 border border-slate-700 text-right w-16">Weight</th>
            <th className="py-2 px-2 border border-slate-700 text-right w-20">Rate (₹)</th>
            <th className="py-2 px-2 border border-slate-700 text-right w-24">Amount (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item, index) => (
            <tr key={item.id} className="border-b border-slate-200">
              <td className="py-1.5 px-2 text-center text-slate-600 border border-slate-300 font-mono">
                {index + 1}
              </td>
              <td className="py-1.5 px-2 border border-slate-300">
                <div className="font-bold text-slate-900">{item.name}</div>
                {item.sizeMm && (
                  <div className="text-[10px] text-slate-500">{item.sizeMm}</div>
                )}
                {item.notes && (
                  <div className="text-[9px] text-slate-400 italic">{item.notes}</div>
                )}
              </td>
              <td className="py-1.5 px-2 text-center font-bold text-slate-900 border border-slate-300 font-mono">
                {item.boxQty}
              </td>
              <td className="py-1.5 px-2 text-right border border-slate-300 font-mono">
                {item.sqftPerBox ? formatNumberIN(item.sqftPerBox, 2) : '-'}
              </td>
              <td className="py-1.5 px-2 text-right border border-slate-300 font-mono">
                {item.totalSqft ? `${formatNumberIN(item.totalSqft, 2)} sqft` : '-'}
              </td>
              <td className="py-1.5 px-2 text-right border border-slate-300 font-mono">
                {item.totalWeightKg ? `${formatNumberIN(item.totalWeightKg, 0)} kg` : '-'}
              </td>
              <td className="py-1.5 px-2 text-right border border-slate-300 font-mono">
                ₹{formatNumberIN(item.unitRate, 2)}
                <span className="text-[9px] text-slate-500 block">
                  /{item.rateBasis}
                </span>
              </td>
              <td className="py-1.5 px-2 text-right font-bold text-slate-900 border border-slate-300 font-mono">
                {formatINR(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 font-bold">
          <tr>
            <td colSpan={2} className="py-2 px-2 text-slate-900 border border-slate-300">
              Total Quantities:
            </td>
            <td className="py-2 px-2 text-center border border-slate-300 font-mono">
              {calculations.totalBoxes} Bxs
            </td>
            <td className="py-2 px-2 border border-slate-300"></td>
            <td className="py-2 px-2 text-right border border-slate-300 font-mono">
              {formatNumberIN(calculations.totalSqft, 2)} sqft
            </td>
            <td className="py-2 px-2 text-right border border-slate-300 font-mono">
              {formatNumberIN(calculations.totalWeightKg / 1000, 2)} T
            </td>
            <td className="py-2 px-2 text-right border border-slate-300">Subtotal:</td>
            <td className="py-2 px-2 text-right font-extrabold border border-slate-300 font-mono">
              {formatINR(calculations.subtotal)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Tax & Financial Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Left Side: Bank Details & Logistics */}
        <div className="space-y-3">
          <div className="border border-slate-300 p-2.5 rounded bg-slate-50/50">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
              Bank Details for Electronic Transfer (NEFT / RTGS):
            </span>
            <div className="text-[11px] text-slate-800 space-y-0.5">
              <div>
                Bank Name: <b>{brand.bankName}</b>
              </div>
              <div>
                Account Name: <b>{brand.companyName}</b>
              </div>
              <div>
                Account No: <b className="font-mono">{brand.accountNo}</b>
              </div>
              <div>
                IFSC Code: <b className="font-mono">{brand.ifscCode}</b>
              </div>
              <div>
                Branch: <b>{brand.branch}</b>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 p-2.5 rounded text-[10px] text-slate-600">
            <div>
              Total Estimated Dispatch Weight:{' '}
              <b className="text-slate-900 font-mono">
                {formatNumberIN(calculations.totalWeightKg, 0)} kg (
                {formatNumberIN(calculations.totalWeightKg / 1000, 2)} Metric Tons)
              </b>
            </div>
            <div>
              Consignment Packaging:{' '}
              <b className="text-slate-900 font-mono">{calculations.totalBoxes} Corrugated Boxes</b>
            </div>
          </div>
        </div>

        {/* Right Side: Totals calculation */}
        <div className="border border-slate-300 p-3 rounded bg-slate-50 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-700">
            <span>Subtotal (Goods):</span>
            <span className="font-mono font-semibold">{formatINR(calculations.subtotal)}</span>
          </div>

          {calculations.discountAmount > 0 && (
            <div className="flex justify-between text-rose-700">
              <span>Trade Discount:</span>
              <span className="font-mono font-semibold">- {formatINR(calculations.discountAmount)}</span>
            </div>
          )}

          {calculations.freightAmount > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>
                Freight & Transport Charges{' '}
                {freightTax.freightMode === 'perTon' && (
                  <span className="text-[10px] text-slate-500">(@ ₹{freightTax.freightValue}/Ton)</span>
                )}
                {freightTax.freightMode === 'percentage' && (
                  <span className="text-[10px] text-slate-500">(@ {freightTax.freightValue}%)</span>
                )}:
              </span>
              <span className="font-mono font-semibold">{formatINR(calculations.freightAmount)}</span>
            </div>
          )}

          {freightTax.loadingCharges > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>Loading & Hamali Charges:</span>
              <span className="font-mono font-semibold">{formatINR(freightTax.loadingCharges)}</span>
            </div>
          )}

          {(calculations.insuranceAmount ?? 0) > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>
                Transit Insurance ({calculations.insurancePct ?? freightTax.insurancePct ?? freightTax.insuranceCharges ?? 0}%):
              </span>
              <span className="font-mono font-semibold">{formatINR(calculations.insuranceAmount || 0)}</span>
            </div>
          )}

          <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-slate-800">
            <span>Taxable Consignment Value:</span>
            <span className="font-mono">{formatINR(calculations.taxableAmount)}</span>
          </div>

          {freightTax.gstType === 'intra' && (
            <>
              <div className="flex justify-between text-slate-700 text-[11px]">
                <span>CGST (Central GST) @ 9%:</span>
                <span className="font-mono font-semibold">{formatINR(calculations.cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-700 text-[11px]">
                <span>SGST (State GST) @ 9%:</span>
                <span className="font-mono font-semibold">{formatINR(calculations.sgstAmount)}</span>
              </div>
            </>
          )}

          {freightTax.gstType === 'inter' && (
            <div className="flex justify-between text-slate-700 text-[11px]">
              <span>IGST (Integrated GST) @ 18%:</span>
              <span className="font-mono font-semibold">{formatINR(calculations.igstAmount)}</span>
            </div>
          )}

          {freightTax.gstType === 'custom' && (
            <div className="flex justify-between text-slate-700 text-[11px]">
              <span>GST @ {freightTax.customGstRate}%:</span>
              <span className="font-mono font-semibold">{formatINR(calculations.totalTax)}</span>
            </div>
          )}

          <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline font-extrabold text-sm text-slate-950">
            <span>FINAL NET PAYABLE:</span>
            <span className="font-mono text-base">{formatINR(calculations.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="bg-slate-100 p-2 rounded border border-slate-300 text-[11px] mb-4">
        <span className="font-bold text-slate-700">Amount in Words: </span>
        <span className="font-bold text-slate-950 italic">
          {numberToIndianWords(calculations.grandTotal)}
        </span>
      </div>

      {/* Terms & Conditions & Signatures */}
      <div className="grid grid-cols-12 gap-4 pt-2 border-t border-slate-300">
        <div className="col-span-8">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
            Terms & Conditions (Morbi Ceramic Standards):
          </span>
          <ul className="text-[9px] text-slate-600 space-y-0.5 list-disc pl-3">
            {brand.termsAndConditions.slice(0, 6).map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ul>
          {brand.footerWatermark && (
            <div className="mt-2 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
              {brand.footerWatermark} — System by {brand.creatorName}
            </div>
          )}
        </div>

        <div className="col-span-4 flex flex-col justify-between items-end text-right">
          <div>
            <div className="text-[10px] text-slate-600 font-semibold">For, {brand.companyName}</div>
          </div>

          <div className="my-2 flex flex-col items-end">
            {brand.stampImageUrl ? (
              <img
                src={brand.stampImageUrl}
                alt="Authorized Stamp"
                referrerPolicy="no-referrer"
                className="h-16 w-auto max-w-[140px] object-contain mb-1"
              />
            ) : (
              <div className="h-10" />
            )}
            <div className="border-t border-slate-400 w-36 text-center text-[10px] font-bold text-slate-800 pt-1">
              {brand.signatoryTitle || 'Authorized Signatory'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
