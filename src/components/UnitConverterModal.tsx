import React, { useState } from 'react';
import { ArrowRightLeft, Square, Ruler, Scale } from 'lucide-react';
import { SQFT_PER_SQM, SQFT_PER_BRASS, formatNumberIN } from '../utils/formatters';

interface UnitConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnitConverterModal: React.FC<UnitConverterModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'area' | 'length' | 'weight'>('area');

  // Area state
  const [sqft, setSqft] = useState<number>(1000);

  // Length state
  const [mm, setMm] = useState<number>(600);

  // Weight state
  const [kg, setKg] = useState<number>(1000);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm sm:text-base">Morbi Tile Unit Converter</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-center">
          <button
            onClick={() => setActiveTab('area')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'area'
                ? 'bg-white border-b-2 border-amber-600 text-amber-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Area</span>
          </button>
          <button
            onClick={() => setActiveTab('length')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'length'
                ? 'bg-white border-b-2 border-amber-600 text-amber-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Tile Size</span>
          </button>
          <button
            onClick={() => setActiveTab('weight')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'weight'
                ? 'bg-white border-b-2 border-amber-600 text-amber-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Weight</span>
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Area Converter */}
          {activeTab === 'area' && (
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block">Square Feet (Sq.ft)</label>
                <input
                  type="number"
                  value={sqft || ''}
                  onChange={(e) => setSqft(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-base font-tabular focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-900 block">
                    Square Meters (Sq.m / M²)
                  </span>
                  <div className="text-base font-extrabold text-amber-950 font-tabular mt-0.5">
                    {formatNumberIN(sqft / SQFT_PER_SQM, 2)}
                  </div>
                  <span className="text-[10px] text-amber-700">1 m² = 10.764 sq.ft</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-900 block">
                    Brass (Gujarat Standard)
                  </span>
                  <div className="text-base font-extrabold text-emerald-950 font-tabular mt-0.5">
                    {formatNumberIN(sqft / SQFT_PER_BRASS, 2)}
                  </div>
                  <span className="text-[10px] text-emerald-700">1 Brass = 100 sq.ft</span>
                </div>
              </div>
            </div>
          )}

          {/* Length / Dimension Converter */}
          {activeTab === 'length' && (
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block">Millimeters (mm)</label>
                <input
                  type="number"
                  value={mm || ''}
                  onChange={(e) => setMm(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-base font-tabular focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] uppercase font-bold text-blue-900 block">
                    Inches (")
                  </span>
                  <div className="text-base font-extrabold text-blue-950 font-tabular mt-0.5">
                    {formatNumberIN(mm / 25.4, 2)}″
                  </div>
                  <span className="text-[10px] text-blue-700">1 inch = 25.4 mm</span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] uppercase font-bold text-purple-900 block">
                    Feet (ft)
                  </span>
                  <div className="text-base font-extrabold text-purple-950 font-tabular mt-0.5">
                    {formatNumberIN(mm / 304.8, 2)}′
                  </div>
                  <span className="text-[10px] text-purple-700">1 foot = 304.8 mm</span>
                </div>
              </div>
            </div>
          )}

          {/* Weight Converter */}
          {activeTab === 'weight' && (
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block">Kilograms (kg)</label>
                <input
                  type="number"
                  value={kg || ''}
                  onChange={(e) => setKg(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-base font-tabular focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-900 block">
                    Metric Tons (T)
                  </span>
                  <div className="text-base font-extrabold text-amber-950 font-tabular mt-0.5">
                    {formatNumberIN(kg / 1000, 3)} Tons
                  </div>
                  <span className="text-[10px] text-amber-700">1 Ton = 1,000 kg</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 border border-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-700 block">
                    Pounds (lbs)
                  </span>
                  <div className="text-base font-extrabold text-slate-900 font-tabular mt-0.5">
                    {formatNumberIN(kg * 2.20462, 1)} lbs
                  </div>
                  <span className="text-[10px] text-slate-500">1 kg = 2.205 lbs</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
