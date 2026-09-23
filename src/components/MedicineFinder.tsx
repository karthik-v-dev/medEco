import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Pill, 
  ShoppingCart, 
  Thermometer, 
  Check, 
  Layers, 
  Sparkles,
  Tag,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Medicine, MedicineCategory } from '../types';

interface MedicineFinderProps {
  medicines: Medicine[];
  onAddToCart: (medicine: Medicine, quantity?: number) => void;
  onNavigateToRack: (rackId: string) => void;
  onOpenPos: () => void;
}

export const MedicineFinder: React.FC<MedicineFinderProps> = ({
  medicines,
  onAddToCart,
  onNavigateToRack,
  onOpenPos
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRack, setSelectedRack] = useState<string>('All');
  const [addedItemIds, setAddedItemIds] = useState<{ [id: string]: boolean }>({});

  const categories = ['All', 'Tablets', 'Syrups', 'Capsules', 'Injections', 'Ointments', 'Drops'];
  const uniqueRacks = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach(m => set.add(m.rackLocation.rackId));
    return ['All', ...Array.from(set)];
  }, [medicines]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return medicines.filter(med => {
      const matchesQuery = 
        !q ||
        med.name.toLowerCase().includes(q) ||
        med.genericName.toLowerCase().includes(q) ||
        med.brand.toLowerCase().includes(q) ||
        med.rackLocation.rackId.toLowerCase().includes(q) ||
        (med.rackLocation.boxNumber && med.rackLocation.boxNumber.toLowerCase().includes(q)) ||
        med.batchNumber.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'All' || med.category === selectedCategory;
      const matchesRack = selectedRack === 'All' || med.rackLocation.rackId === selectedRack;

      return matchesQuery && matchesCat && matchesRack;
    });
  }, [medicines, searchQuery, selectedCategory, selectedRack]);

  const handleAdd = (med: Medicine) => {
    onAddToCart(med, 1);
    setAddedItemIds(prev => ({ ...prev, [med.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [med.id]: false }));
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Tablet & Rack Locator</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Find where any medicine is stored instantly.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Customer asked for a tablet? Search by name, brand, or salt formula to get its exact <strong className="text-white font-bold">Rack, Shelf, and Box</strong> coordinates along with live stock and MRP cost.
          </p>

          {/* Prominent Search Bar */}
          <div className="mt-6 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tablet name (e.g. Dolo 650, Augmentin, Pan 40, Paracetamol, Rack A)..."
              className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl shadow-lg border border-transparent dark:border-slate-700 text-sm sm:text-base font-semibold focus:outline-hidden focus:ring-4 focus:ring-emerald-400/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Decorative background blurs */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -top-12 w-48 h-48 rounded-full bg-teal-400/20 blur-2xl pointer-events-none"></div>
      </div>

      {/* Filters: Category & Rack */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Category chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Rack Dropdown Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rack:</label>
          <select
            value={selectedRack}
            onChange={(e) => setSelectedRack(e.target.value)}
            className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            {uniqueRacks.map(r => (
              <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {r === 'All' ? 'All Racks' : r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Count and Quick Pos link */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <p>
          Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredMedicines.length}</span> medicines found
        </p>
        <button
          onClick={onOpenPos}
          className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
        >
          <span>Go to POS Billing</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching medicines found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            We couldn't find any medicine matching "<span className="font-semibold text-slate-700 dark:text-slate-300">{searchQuery}</span>". Try another spelling or check the full inventory.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredMedicines.map((med) => {
            const isAdded = addedItemIds[med.id];
            const isColdStorage = med.rackLocation.rackId.toLowerCase().includes('cold') || med.rackLocation.rackId.toLowerCase().includes('refrig');
            const isLowStock = med.stock <= med.minStockAlert && med.stock > 0;
            const isOutOfStock = med.stock === 0;

            return (
              <div
                key={med.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600/60 hover:shadow-lg transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Location Banner (HIGHLIGHTED STORAGE INFO) */}
                  <div className={`p-3 rounded-xl mb-3 flex items-start justify-between ${
                    isColdStorage 
                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200' 
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-lg ${
                        isColdStorage 
                          ? 'bg-blue-200 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200' 
                          : 'bg-emerald-200 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                            {med.rackLocation.rackId}
                          </span>
                          <span className="text-slate-400 font-bold">›</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/60 px-2 py-0.5 rounded shadow-2xs">
                            Shelf {med.rackLocation.shelfNumber}
                          </span>
                          {med.rackLocation.boxNumber && (
                            <>
                              <span className="text-slate-400 font-bold">›</span>
                              <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/60 px-1.5 py-0.5 rounded">
                                {med.rackLocation.boxNumber}
                              </span>
                            </>
                          )}
                        </div>
                        {med.rackLocation.description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                            {med.rackLocation.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToRack(med.rackLocation.rackId)}
                      title="View Rack on Map"
                      className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 p-1 hover:bg-white/60 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Medicine Brand & Name */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                          {med.category}
                        </span>
                        {med.requiresPrescription && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                            Rx Required
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {med.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                        {med.genericName}
                      </p>
                    </div>
                  </div>

                  {/* Details Pill Row */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Dosage & Pack</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{med.dosage} ({med.stripSize})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Batch / Expiry</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{med.batchNumber} • {med.expiryDate.slice(0, 7)}</span>
                    </div>
                  </div>

                  {/* Temperature Storage note */}
                  {med.rackLocation.temperatureNote && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-2.5 py-1 rounded-lg">
                      <Thermometer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">{med.rackLocation.temperatureNote}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Pricing & Add to Bill Section */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">₹</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{med.unitPrice.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400">/ pack</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        +{med.gstRate}% GST
                      </span>
                      {/* Stock status indicator */}
                      {isOutOfStock ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          <XCircle className="w-3 h-3" /> Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" /> Low stock ({med.stock})
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> In stock ({med.stock})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdd(med)}
                    disabled={isOutOfStock}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                      isOutOfStock
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        : isAdded
                        ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Bill</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
