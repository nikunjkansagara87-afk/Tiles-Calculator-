import React from 'react';
import { QuotationCustomer, QuotationLineItem, FreightTaxConfig } from '../types';
import { formatINR } from '../utils/formatters';
import { FileText, Trash2, FolderOpen, Download, Upload } from 'lucide-react';

export interface SavedQuotationRecord {
  id: string;
  savedAt: string;
  customer: QuotationCustomer;
  items: QuotationLineItem[];
  freightTax: FreightTaxConfig;
  grandTotal: number;
}

interface SavedQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedQuotes: SavedQuotationRecord[];
  onLoadQuote: (record: SavedQuotationRecord) => void;
  onDeleteQuote: (id: string) => void;
  onShowToast: (msg: string) => void;
}

export const SavedQuotesModal: React.FC<SavedQuotesModalProps> = ({
  isOpen,
  onClose,
  savedQuotes,
  onLoadQuote,
  onDeleteQuote,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedQuotes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `morbi_tile_quotations_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Exported quotations backup to JSON');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Saved Quotations History</h3>
              <p className="text-[11px] text-slate-400">
                {savedQuotes.length} quotation{savedQuotes.length === 1 ? '' : 's'} stored locally in browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {savedQuotes.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-700">No saved quotations yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Click <b>Save Quote</b> in the Quotation Builder tab to keep records of your estimates.
              </p>
            </div>
          ) : (
            savedQuotes.map((record) => (
              <div
                key={record.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {record.customer.quotationNo || 'Estimate'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(record.savedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 font-medium mt-0.5">
                    {record.customer.clientName || 'Unnamed Customer'}{' '}
                    {record.customer.companyName ? `(${record.customer.companyName})` : ''}
                  </div>

                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {record.items.length} items · Total:{' '}
                    <b className="text-slate-900">{formatINR(record.grandTotal)}</b>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onLoadQuote(record);
                      onClose();
                      onShowToast(`Loaded ${record.customer.quotationNo}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Load Quote
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Delete this saved quotation?')) {
                        onDeleteQuote(record.id);
                        onShowToast('Quotation record deleted');
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {savedQuotes.length > 0 && (
            <button
              onClick={handleExportJSON}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All (JSON)</span>
            </button>
          )}

          <div className="ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
