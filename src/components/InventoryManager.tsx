import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Save, 
  Layers, 
  Pill,
  Filter
} from 'lucide-react';
import { Medicine, MedicineCategory, RackLocation } from '../types';
import { saveMedicine, deleteMedicine } from '../services/firebase';

interface InventoryManagerProps {
  medicines: Medicine[];
  onSelectRack: (rackId: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  medicines,
  onSelectRack
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brand: '',
    category: 'Tablets' as MedicineCategory,
    dosage: '500 mg',
    stripSize: '10 tablets/strip',
    unitPrice: 50.00,
    costPrice: 35.00,
    stock: 100,
    minStockAlert: 15,
    batchNumber: 'BAT-2026-01',
    expiryDate: '2027-12-31',
    gstRate: 12,
    rackId: 'Rack A',
    shelfNumber: 1,
    boxNumber: 'Box-01',
    description: 'General dry storage',
    temperatureNote: 'Store below 25°C',
    requiresPrescription: false,
    notes: ''
  });

  const categories: string[] = ['All', 'Tablets', 'Syrups', 'Capsules', 'Injections', 'Ointments', 'Drops'];

  const filteredMedicines = useMemo(() => {
    const q = search.toLowerCase().trim();
    return medicines.filter(m => {
      const matchSearch = 
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q) ||
        m.rackLocation.rackId.toLowerCase().includes(q);

      const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
      const matchStock = !showLowStockOnly || m.stock <= m.minStockAlert;

      return matchSearch && matchCat && matchStock;
    });
  }, [medicines, search, selectedCategory, showLowStockOnly]);

  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      genericName: '',
      brand: '',
      category: 'Tablets',
      dosage: '500 mg',
      stripSize: '10 tablets/strip',
      unitPrice: 50.00,
      costPrice: 35.00,
      stock: 100,
      minStockAlert: 15,
      batchNumber: `BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      expiryDate: '2027-12-31',
      gstRate: 12,
      rackId: 'Rack A',
      shelfNumber: 1,
      boxNumber: 'Box-01',
      description: 'Eye-level shelf',
      temperatureNote: 'Store below 25°C',
      requiresPrescription: false,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Medicine) => {
    setEditingMedicine(m);
    setFormData({
      name: m.name,
      genericName: m.genericName,
      brand: m.brand,
      category: m.category,
      dosage: m.dosage,
      stripSize: m.stripSize,
      unitPrice: m.unitPrice,
      costPrice: m.costPrice,
      stock: m.stock,
      minStockAlert: m.minStockAlert,
      batchNumber: m.batchNumber,
      expiryDate: m.expiryDate,
      gstRate: m.gstRate,
      rackId: m.rackLocation.rackId,
      shelfNumber: m.rackLocation.shelfNumber,
      boxNumber: m.rackLocation.boxNumber || '',
      description: m.rackLocation.description || '',
      temperatureNote: m.rackLocation.temperatureNote || '',
      requiresPrescription: m.requiresPrescription,
      notes: m.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const medicineToSave: Medicine = {
      id: editingMedicine ? editingMedicine.id : `med-${Date.now()}`,
      name: formData.name.trim(),
      genericName: formData.genericName.trim() || formData.name.trim(),
      brand: formData.brand.trim() || 'Generic',
      category: formData.category,
      dosage: formData.dosage.trim(),
      stripSize: formData.stripSize.trim(),
      unitPrice: Number(formData.unitPrice),
      costPrice: Number(formData.costPrice),
      stock: Number(formData.stock),
      minStockAlert: Number(formData.minStockAlert),
      batchNumber: formData.batchNumber.trim(),
      expiryDate: formData.expiryDate,
      gstRate: Number(formData.gstRate),
      rackLocation: {
        rackId: formData.rackId.trim(),
        shelfNumber: Number(formData.shelfNumber),
        boxNumber: formData.boxNumber.trim() || undefined,
        description: formData.description.trim() || undefined,
        temperatureNote: formData.temperatureNote.trim() || undefined
      },
      requiresPrescription: formData.requiresPrescription,
      notes: formData.notes.trim() || undefined
    };

    await saveMedicine(medicineToSave);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      await deleteMedicine(id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Store Master Data</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Medicine Inventory & Rack Location Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Maintain exact shelf locations, unit costs, GST slabs, and stock levels.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, salt, batch, rack..."
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>

          {/* Low Stock Toggle */}
          <button
            type="button"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
              showLowStockOnly 
                ? 'bg-amber-500 text-white border-amber-600' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Alert</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <th className="py-3 px-4">Medicine & Formula</th>
              <th className="py-3 px-3">Storage Rack Location</th>
              <th className="py-3 px-3 text-right">Cost / MRP</th>
              <th className="py-3 px-3 text-right">GST Rate</th>
              <th className="py-3 px-3 text-right">Stock</th>
              <th className="py-3 px-3">Batch / Expiry</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMedicines.map(med => {
              const isLowStock = med.stock <= med.minStockAlert;
              return (
                <tr key={med.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Pill className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-slate-900 text-xs block">{med.name}</strong>
                        <span className="text-[10px] text-slate-500 block leading-tight">{med.genericName}</span>
                        <span className="text-[9px] text-slate-400">{med.brand} • {med.dosage}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div 
                      onClick={() => onSelectRack(med.rackLocation.rackId)}
                      className="cursor-pointer group inline-block"
                    >
                      <span className="font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {med.rackLocation.rackId}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        Shelf {med.rackLocation.shelfNumber} {med.rackLocation.boxNumber ? `• ${med.rackLocation.boxNumber}` : ''}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className="font-extrabold text-slate-900 text-xs block">
                      ₹{med.unitPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Cost: ₹{med.costPrice.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                      {med.gstRate}%
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className={`font-black text-xs ${isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                      {med.stock}
                    </span>
                    {isLowStock && (
                      <span className="block text-[9px] font-bold text-amber-500">Low</span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-[10px] text-slate-600">
                    <span>{med.batchNumber}</span>
                    <span className="block text-slate-400">{med.expiryDate.slice(0, 7)}</span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(med)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Medicine"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(med.id, med.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Medicine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>{editingMedicine ? 'Edit Medicine & Storage Location' : 'Add New Medicine to Store'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dolo 650"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generic / Salt Formula</label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Paracetamol 650mg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MedicineCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Tablets">Tablets</option>
                    <option value="Syrups">Syrups</option>
                    <option value="Capsules">Capsules</option>
                    <option value="Injections">Injections</option>
                    <option value="Ointments">Ointments</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand / Mfr</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Micro Labs"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dosage / Unit</label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g. 650 mg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* RACK & STORAGE LOCATION (CRITICAL CORE REQUIREMENT) */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <span className="font-extrabold text-emerald-950 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Exact Storage Location in Pharmacy
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Rack ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.rackId}
                      onChange={(e) => setFormData({ ...formData, rackId: e.target.value })}
                      placeholder="e.g. Rack A / Cold Storage"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Shelf Number *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.shelfNumber}
                      onChange={(e) => setFormData({ ...formData, shelfNumber: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Box / Bin ID</label>
                    <input
                      type="text"
                      value={formData.boxNumber}
                      onChange={(e) => setFormData({ ...formData, boxNumber: e.target.value })}
                      placeholder="e.g. Box-04"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Temperature / Storage Instruction</label>
                  <input
                    type="text"
                    value={formData.temperatureNote}
                    onChange={(e) => setFormData({ ...formData, temperatureNote: e.target.value })}
                    placeholder="e.g. 2°C - 8°C Refrigerated / Store below 25°C"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Pricing, GST & Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Batch & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Medicine & Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
