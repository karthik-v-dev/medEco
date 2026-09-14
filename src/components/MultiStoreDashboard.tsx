import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  MapPin, 
  TrendingUp, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Phone, 
  ShieldCheck, 
  Eye, 
  Layers, 
  Plus, 
  RefreshCw, 
  FileText, 
  Check,
  Clock,
  User,
  Filter,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { 
  PharmacyBranch, 
  Medicine, 
  OnlineOrder, 
  BranchStockItem, 
  OrderStatus 
} from '../types';
import { 
  getPharmacyBranches, 
  getBranchStocks, 
  updateBranchStock, 
  getOnlineOrders, 
  advanceOrderStatus,
  calculateDistanceKm
} from '../services/firebase';
import { GoogleMapViewer } from './GoogleMapViewer';

interface MultiStoreDashboardProps {
  medicines: Medicine[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onOpenOrderDetails: (order: OnlineOrder) => void;
}

export const MultiStoreDashboard: React.FC<MultiStoreDashboardProps> = ({
  medicines,
  activeBranchId,
  onSelectBranch,
  onOpenOrderDetails
}) => {
  const branches = getPharmacyBranches();
  const allOrders = getOnlineOrders();
  const allStocks = getBranchStocks();

  // Filters & Tabs inside the Multi-Store Dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'stocks' | 'bookings'>('overview');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [editingStockItem, setEditingStockItem] = useState<{ branchId: string; medicineId: string; currentStock: number } | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [mapViewingOrder, setMapViewingOrder] = useState<OnlineOrder | null>(null);

  // Filtered orders
  const filteredOrders = allOrders.filter(order => {
    const matchesBranch = selectedBranchFilter === 'ALL' || order.pharmacyId === selectedBranchFilter;
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch = !cleanSearch || 
      order.customerName.toLowerCase().includes(cleanSearch) ||
      order.customerMobile.includes(cleanSearch) ||
      order.orderNumber.toLowerCase().includes(cleanSearch) ||
      (order.pincode && order.pincode.includes(cleanSearch)) ||
      (order.doorNumber && order.doorNumber.toLowerCase().includes(cleanSearch));

    return matchesBranch && matchesStatus && matchesSearch;
  });

  // Calculate Metrics across all branches
  const totalRevenue = allOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + o.estimatedTotal, 0);

  const pendingOrdersCount = allOrders.filter(o => o.status === 'PENDING').length;
  const outForDeliveryCount = allOrders.filter(o => o.status === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = allOrders.filter(o => o.status === 'DELIVERED').length;

  const lowStockCount = allStocks.filter(s => s.stock <= s.minStockAlert).length;

  const handleStockUpdate = async () => {
    if (!editingStockItem) return;
    await updateBranchStock(editingStockItem.branchId, editingStockItem.medicineId, newStockInput);
    setEditingStockItem(null);
  };

  const handleQuickAdvance = async (orderId: string, nextStatus: OrderStatus, label: string) => {
    await advanceOrderStatus(orderId, nextStatus, `Updated via Multi-Store Dashboard: ${label}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              Owner Executive Console
            </span>
            <span className="text-xs text-slate-300">• 5 Connected Pharmacies in Bangalore</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Multi-Pharmacy Stores & Booking Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Consolidated oversight of all franchise pharmacy branches, location-wise inventory racks, customer delivery door numbers, and SOP booking fulfillment.
          </p>
        </div>

        {/* Global Branch Filter Selector */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex flex-col gap-1.5 shrink-0">
          <label className="text-[11px] font-bold text-emerald-200 flex items-center gap-1">
            <Store className="w-3.5 h-3.5" />
            <span>Active Store View:</span>
          </label>
          <select
            value={selectedBranchFilter}
            onChange={(e) => {
              setSelectedBranchFilter(e.target.value);
              if (e.target.value !== 'ALL') {
                onSelectBranch(e.target.value);
              }
            }}
            className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl border border-emerald-500/40 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Stores (Consolidated View)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name.replace('medEco Pharmacy - ', '')} ({b.area})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* High-Level KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Connected Stores</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {branches.length}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">100% Online & Synced</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Bookings</span>
            <PackageCheck className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {allOrders.length}
          </p>
          <span className="text-[10px] text-amber-500 font-bold">{pendingOrdersCount} Pending Review</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Gross Online Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{totalRevenue.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400">Across all branches</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {lowStockCount}
          </p>
          <span className="text-[10px] text-rose-500 font-bold">Branch Reorder Needed</span>
        </div>
      </div>

      {/* View Tabs: Stores Network | Branch Stocks | Customer Booking Tracker */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Stores Network ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stocks')}
          className={`pb-3 px-3 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === 'stocks'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Branch Stock Details</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 px-3 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === 'bookings'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Customer Booking Tracker ({filteredOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: PHARMACY STORES NETWORK */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(branch => {
              const branchOrders = allOrders.filter(o => o.pharmacyId === branch.id);
              const branchRevenue = branchOrders
                .filter(o => o.status !== 'CANCELLED')
                .reduce((acc, o) => acc + o.estimatedTotal, 0);
              const branchPending = branchOrders.filter(o => o.status === 'PENDING').length;
              const isSelected = activeBranchId === branch.id;

              return (
                <div
                  key={branch.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                            {branch.code}
                          </span>
                          {branch.isOpen24x7 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                              24x7 Open
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
                          {branch.name.replace('medEco Pharmacy - ', '')}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-amber-500">★ {branch.rating}</span>
                      </div>
                    </div>

                    {/* Address & Door details */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                      <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{branch.doorNumber},</span> {branch.address}
                          <span className="block font-mono text-[10px] text-slate-500">
                            PIN: {branch.pincode} • Area: {branch.area}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Manager: <strong>{branch.managerName}</strong></span>
                      </div>
                    </div>

                    {/* Performance numbers */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Orders</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {branchOrders.length}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Pending</span>
                        <span className={`font-extrabold ${branchPending > 0 ? 'text-amber-500 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                          {branchPending}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Revenue</span>
                        <span className="font-extrabold text-emerald-600">
                          ₹{branchRevenue.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${branch.phone}`}
                      className="text-slate-500 hover:text-emerald-600 font-semibold text-xs flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{branch.phone}</span>
                    </a>

                    <button
                      onClick={() => {
                        onSelectBranch(branch.id);
                        setSelectedBranchFilter(branch.id);
                        setActiveTab('bookings');
                      }}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Manage Store</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BRANCH STOCK DETAILS COMPARISON */}
      {activeTab === 'stocks' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900 dark:text-white">
                Multi-Branch Stock Inventory & Rack Levels
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medicine name..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Cross-Branch Stock Comparison Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Medicine & Dosage</th>
                  <th className="p-3">Rack Storage</th>
                  <th className="p-3">MRP (₹)</th>
                  {branches.map(b => (
                    <th key={b.id} className="p-3 text-center">
                      <span className="block">{b.area}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{b.code}</span>
                    </th>
                  ))}
                  <th className="p-3 text-right">Total Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {medicines
                  .filter(m => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.genericName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(med => {
                    let totalUnits = 0;

                    return (
                      <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3">
                          <span className="font-extrabold text-slate-900 dark:text-white block">
                            {med.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                            {med.dosage} • {med.genericName}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            {med.rackLocation.rackId} S{med.rackLocation.shelfNumber}
                          </span>
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                          ₹{med.unitPrice.toFixed(2)}
                        </td>

                        {branches.map(b => {
                          const stockItem = allStocks.find(s => s.branchId === b.id && s.medicineId === med.id);
                          const qty = stockItem ? stockItem.stock : 0;
                          totalUnits += qty;

                          const isLow = qty > 0 && qty <= (stockItem?.minStockAlert || 15);
                          const isOut = qty === 0;

                          return (
                            <td key={b.id} className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setEditingStockItem({ branchId: b.id, medicineId: med.id, currentStock: qty });
                                  setNewStockInput(qty);
                                }}
                                className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-xs transition-transform hover:scale-105 ${
                                  isOut
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}
                                title="Click to adjust branch stock"
                              >
                                <span>{qty}</span>
                                <Edit2 className="w-2.5 h-2.5 opacity-60" />
                              </button>
                            </td>
                          );
                        })}

                        <td className="p-3 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                          {totalUnits} units
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Quick Adjust Stock Modal */}
          {editingStockItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Adjust Branch Stock
                  </h4>
                  <button onClick={() => setEditingStockItem(null)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p>Branch: <strong>{branches.find(b => b.id === editingStockItem.branchId)?.name}</strong></p>
                  <p>Medicine: <strong>{medicines.find(m => m.id === editingStockItem.medicineId)?.name}</strong></p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Available Units:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newStockInput}
                    onChange={(e) => setNewStockInput(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-lg font-black font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setEditingStockItem(null)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStockUpdate}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
                  >
                    Save Stock
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMER BOOKING TRACKER (SOP WORKFLOW) */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer phone, door no, or order #..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-300 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">🟡 Pending Review</option>
                <option value="VERIFIED">🔵 Verified by Pharmacist</option>
                <option value="PACKED">🟣 Packed from Rack</option>
                <option value="OUT_FOR_DELIVERY">🟠 Out for Delivery</option>
                <option value="DELIVERED">🟢 Delivered</option>
                <option value="CANCELLED">🔴 Cancelled</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing {filteredOrders.length} Bookings
            </span>
          </div>

          {/* Bookings List Cards */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <PackageCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">No customer bookings found</h4>
              <p className="text-xs text-slate-400">Try changing your store or status filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => {
                const branch = branches.find(b => b.id === order.pharmacyId);

                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Store Badge */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                          <Building2 className="w-3 h-3 text-emerald-600" />
                          <span>{order.pharmacyName || branch?.name || 'Koramangala Branch'}</span>
                        </span>

                        {/* Status Pill */}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          order.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          order.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          order.status === 'PACKED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                          order.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                          order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section: Customer Details & Delivery Map */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                      {/* Customer Info */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {order.customerName}
                          </span>
                          <a
                            href={`tel:${order.customerMobile}`}
                            className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>+91 {order.customerMobile}</span>
                          </a>
                        </div>

                        <div className="text-slate-600 dark:text-slate-400 text-xs">
                          {order.doorNumber && (
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              Door: {order.doorNumber}
                            </span>
                          )}
                          <span>{order.address}</span>
                          {order.pincode && (
                            <span className="block font-mono text-[11px] text-slate-500 font-bold">
                              PIN: {order.pincode} {order.landmark ? `• Landmark: ${order.landmark}` : ''}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setMapViewingOrder(mapViewingOrder?.id === order.id ? null : order)}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 pt-1"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{mapViewingOrder?.id === order.id ? 'Close Google Map' : 'View Delivery Pin & Route ▾'}</span>
                        </button>
                      </div>

                      {/* Items & Rack Locations */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Medicines & Shelf Retrieval:
                        </span>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{item.medicineName}</span>
                                <span className="text-[10px] text-slate-400 block">{item.rackInfo}</span>
                              </div>
                              <span className="font-mono font-bold">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-xs">
                          <span>Total:</span>
                          <span className="text-emerald-600">₹{order.estimatedTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Prescription Preview */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center gap-3">
                        {order.prescriptionImageUrl ? (
                          <>
                            <img
                              src={order.prescriptionImageUrl}
                              alt="Doctor Rx"
                              className="w-16 h-16 object-cover rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer shadow-xs"
                              onClick={() => onOpenOrderDetails(order)}
                            />
                            <div className="space-y-1 text-xs">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                Doctor Prescription
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono truncate block max-w-[120px]">
                                {order.prescriptionFileName || 'prescription.jpg'}
                              </span>
                              <button
                                onClick={() => onOpenOrderDetails(order)}
                                className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect Rx</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-400 text-xs italic">
                            Direct tablet order (no image uploaded)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Delivery Map */}
                    {mapViewingOrder?.id === order.id && (
                      <div className="pt-2">
                        <GoogleMapViewer
                          latitude={order.geoCoordinates?.latitude || branch?.coordinates.latitude || 12.9352}
                          longitude={order.geoCoordinates?.longitude || branch?.coordinates.longitude || 77.6245}
                          doorNumber={order.doorNumber}
                          address={order.address}
                          landmark={order.landmark}
                          pincode={order.pincode}
                          title="Customer Delivery Pinpoint"
                        />
                      </div>
                    )}

                    {/* Standard Online Pharmacy SOP Action Stepper */}
                    <div className="p-3 bg-slate-100/80 dark:bg-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>SOP Progress:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {order.status === 'PENDING' ? '1. Pending Review' :
                           order.status === 'VERIFIED' ? '2. Pharmacist Verified' :
                           order.status === 'PACKED' ? '3. Packed from Rack' :
                           order.status === 'OUT_FOR_DELIVERY' ? '4. Out for Delivery' :
                           '5. Delivered to Customer'}
                        </span>
                      </div>

                      {/* Advance buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleQuickAdvance(order.id, 'VERIFIED', 'Verified')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verify Rx</span>
                          </button>
                        )}

                        {(order.status === 'PENDING' || order.status === 'VERIFIED') && (
                          <button
                            onClick={() => handleQuickAdvance(order.id, 'PACKED', 'Packed')}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1"
                          >
                            <PackageCheck className="w-3 h-3" />
                            <span>Pack from Rack</span>
                          </button>
                        )}

                        {order.status === 'PACKED' && (
                          <button
                            onClick={() => handleQuickAdvance(order.id, 'OUT_FOR_DELIVERY', 'Dispatched')}
                            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Dispatch Delivery</span>
                          </button>
                        )}

                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleQuickAdvance(order.id, 'DELIVERED', 'Delivered')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenOrderDetails(order)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50"
                        >
                          Full Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
