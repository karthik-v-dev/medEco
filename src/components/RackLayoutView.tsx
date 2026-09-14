import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  MapPin, 
  Package, 
  Thermometer, 
  ChevronRight, 
  Search, 
  ShoppingCart, 
  Pill, 
  Info 
} from 'lucide-react';
import { Medicine } from '../types';

interface RackLayoutViewProps {
  medicines: Medicine[];
  initialRackId?: string;
  onAddToCart: (medicine: Medicine) => void;
}

export const RackLayoutView: React.FC<RackLayoutViewProps> = ({
  medicines,
  initialRackId = 'Rack A',
  onAddToCart
}) => {
  // Group medicines by rack
  const racksData = useMemo(() => {
    const map: Record<string, {
      totalMedicines: number;
      shelves: Record<number, Medicine[]>;
      isColdStorage: boolean;
      description: string;
    }> = {};

    medicines.forEach(med => {
      const rackId = med.rackLocation.rackId;
      if (!map[rackId]) {
        const isCold = rackId.toLowerCase().includes('cold') || rackId.toLowerCase().includes('refrig');
        map[rackId] = {
          totalMedicines: 0,
          shelves: {},
          isColdStorage: isCold,
          description: isCold ? 'Refrigerated 2°C - 8°C' : 'Dry Storage Shelves'
        };
      }
      map[rackId].totalMedicines++;
      const s = med.rackLocation.shelfNumber || 1;
      if (!map[rackId].shelves[s]) {
        map[rackId].shelves[s] = [];
      }
      map[rackId].shelves[s].push(med);
    });

    return map;
  }, [medicines]);

  const rackIds = Object.keys(racksData);
  const [selectedRack, setSelectedRack] = useState<string>(
    rackIds.includes(initialRackId) ? initialRackId : rackIds[0] || 'Rack A'
  );

  const currentRackInfo = racksData[selectedRack];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Store Architecture & Shelving</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Pharmacy Visual Rack Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Physical layout of medicines stored in racks, shelves, and bins.
          </p>
        </div>

        {/* Rack Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {rackIds.map(rack => {
            const isSelected = selectedRack === rack;
            const count = racksData[rack]?.totalMedicines || 0;
            const isCold = racksData[rack]?.isColdStorage;

            return (
              <button
                key={rack}
                onClick={() => setSelectedRack(rack)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all ${
                  isSelected
                    ? isCold 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isCold ? <Thermometer className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                <span>{rack}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Rack Shelves View */}
      {currentRackInfo && (
        <div className="space-y-6">
          {/* Rack Information Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            currentRackInfo.isColdStorage 
              ? 'bg-blue-50 border-blue-200 text-blue-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                currentRackInfo.isColdStorage ? 'bg-blue-200 text-blue-800' : 'bg-emerald-200 text-emerald-800'
              }`}>
                {selectedRack.slice(-1) || 'R'}
              </div>
              <div>
                <h3 className="font-extrabold text-base">{selectedRack}</h3>
                <p className="text-xs opacity-80">
                  {currentRackInfo.isColdStorage ? 'Monitored temperature (2°C - 8°C) • Insulin, Vaccines, Biologicals' : 'Standard Pharmacy Storage Bay'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xl font-black">{currentRackInfo.totalMedicines}</span>
              <span className="text-xs opacity-75 block">Items Stocked</span>
            </div>
          </div>

          {/* Shelves Layout (Shelves stacked physically: Shelf 1 on top or orderly) */}
          <div className="space-y-4">
            {Object.keys(currentRackInfo.shelves)
              .sort((a, b) => Number(a) - Number(b))
              .map(shelfNumStr => {
                const shelfNum = Number(shelfNumStr);
                const medsInShelf = currentRackInfo.shelves[shelfNum] || [];

                return (
                  <div 
                    key={shelfNum}
                    className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs relative overflow-hidden"
                  >
                    {/* Shelf Label header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-mono font-bold text-xs">
                          S{shelfNum}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            Shelf Level {shelfNum}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {medsInShelf.length} medicines in this compartment
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                        Capacity: {medsInShelf.reduce((acc, m) => acc + m.stock, 0)} units total
                      </span>
                    </div>

                    {/* Medicines on this shelf */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {medsInShelf.map(med => (
                        <div 
                          key={med.id}
                          className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded shadow-2xs">
                                {med.rackLocation.boxNumber || `Bin-${shelfNum}`}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                ₹{med.unitPrice.toFixed(2)}
                              </span>
                            </div>

                            <h5 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                              {med.name}
                            </h5>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {med.genericName}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-slate-600">
                              Stock: <strong className={med.stock <= med.minStockAlert ? 'text-amber-600' : 'text-slate-800'}>{med.stock}</strong>
                            </span>

                            <button
                              onClick={() => onAddToCart(med)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                              title="Add to Bill"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Bill</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
