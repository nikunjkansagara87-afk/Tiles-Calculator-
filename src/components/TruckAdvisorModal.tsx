import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { TRUCK_OPTIONS, formatNumberIN } from '../utils/formatters';

interface TruckAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeightKg: number;
}

export const TruckAdvisorModal: React.FC<TruckAdvisorModalProps> = ({
  isOpen,
  onClose,
  currentWeightKg,
}) => {
  const [testWeightTons, setTestWeightTons] = useState<number>(
    currentWeightKg > 0 ? Math.round((currentWeightKg / 1000) * 100) / 100 : 21.0
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Morbi Dispatch Truck & Weight Advisor
              </h3>
              <p className="text-[11px] text-slate-400">
                Official RTO & transport loading limits for ceramic tile dispatches
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

        <div className="p-4 sm:p-5 space-y-4">
          {/* Test / Live Weight Bar */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Consignment Weight to Check:
              </span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={testWeightTons}
                  onChange={(e) => setTestWeightTons(parseFloat(e.target.value) || 0)}
                  className="w-28 px-2.5 py-1 rounded-lg border border-slate-300 font-extrabold text-sm font-tabular focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <span className="text-xs font-bold text-slate-700">Metric Tons</span>
                {currentWeightKg > 0 && (
                  <button
                    onClick={() => setTestWeightTons(Math.round((currentWeightKg / 1000) * 100) / 100)}
                    className="text-[11px] text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded font-semibold transition-colors"
                  >
                    Use Quote Weight ({formatNumberIN(currentWeightKg / 1000, 2)} T)
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Total in Kilograms:</span>
              <span className="text-sm font-extrabold text-slate-900 font-tabular">
                {formatNumberIN(testWeightTons * 1000, 0)} kg
              </span>
            </div>
          </div>

          {/* Truck Fleet Cards */}
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {TRUCK_OPTIONS.map((truck) => {
              const loadPct = Math.round((testWeightTons / truck.capacityTons) * 100);
              const isOverweight = testWeightTons > truck.capacityTons;
              const isRecommended =
                testWeightTons <= truck.capacityTons &&
                (truck.capacityTons - testWeightTons < 8 || truck.capacityTons === 2.5);

              return (
                <div
                  key={truck.type}
                  className={`p-3 rounded-xl border transition-all ${
                    isRecommended
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : isOverweight
                      ? 'border-slate-200 bg-slate-50/60 opacity-80'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">{truck.type}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                          {truck.wheels}
                        </span>
                        {isRecommended && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Recommended</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{truck.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-slate-900 font-tabular">
                        {truck.capacityTons} Tons Limit
                      </span>
                      <div className="text-[10px] font-mono">
                        {isOverweight ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1 justify-end">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overweight ({loadPct}%)</span>
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">{loadPct}% Capacity Used</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${
                        isOverweight
                          ? 'bg-rose-500'
                          : loadPct > 85
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, loadPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
          >
            Close Advisor
          </button>
        </div>
      </div>
    </div>
  );
};
