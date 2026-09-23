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
  Edit2,
  Printer,
  Package,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  BarChart3,
  Calendar
} from 'lucide-react';
import { 
  PharmacyBranch, 
  Medicine, 
  OnlineOrder, 
  BranchStockItem, 
  OrderStatus,
  Invoice,
  PendingStockConsignment
} from '../types';
import { 
  getPharmacyBranches, 
  getBranchStocks, 
  updateBranchStock, 
  getOnlineOrders, 
  advanceOrderStatus,
  calculateDistanceKm,
  getInvoices,
  getPendingStockConsignments,
  checkInPendingStock,
  restockBranchMedicine
} from '../services/firebase';
import { GoogleMapViewer } from './GoogleMapViewer';
import { useModalScrollLock } from '../services/modalLock';
import { toast } from '../services/toast';

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
  const allInvoices = getInvoices();
  const allConsignments = getPendingStockConsignments();

  // Primary Dashboard Tabs: 'report' (User's primary request), 'overview', 'stocks', 'bookings'
  const [activeTab, setActiveTab] = useState<'report' | 'overview' | 'stocks' | 'bookings'>('report');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(activeBranchId || 'pharm-hanamkonda');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [editingStockItem, setEditingStockItem] = useState<{ branchId: string; medicineId: string; currentStock: number } | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [mapViewingOrder, setMapViewingOrder] = useState<OnlineOrder | null>(null);
  const [restockSuccessMessage, setRestockSuccessMessage] = useState<string | null>(null);

  // Selected Branch Context for Location Report
  const currentBranch = branches.find(b => b.id === selectedBranchFilter) || branches[0];
  const isConsolidated = selectedBranchFilter === 'ALL';

  // 1. FILTERED ORDERS FOR THIS LOCATION
  const branchOrders = allOrders.filter(order => {
    return isConsolidated || order.pharmacyId === selectedBranchFilter;
  });

  const filteredOrders = branchOrders.filter(order => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch = !cleanSearch || 
      order.customerName.toLowerCase().includes(cleanSearch) ||
      order.customerMobile.includes(cleanSearch) ||
      order.orderNumber.toLowerCase().includes(cleanSearch) ||
      (order.pincode && order.pincode.includes(cleanSearch)) ||
      (order.doorNumber && order.doorNumber.toLowerCase().includes(cleanSearch));

    return matchesStatus && matchesSearch;
  });

  // 2. BRANCH SALES REPORT CALCULATION
  const branchInvoices = allInvoices.filter(inv => {
    return isConsolidated || (inv.branchId ? inv.branchId === selectedBranchFilter : true);
  });

  const posRevenue = branchInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const onlineRevenue = branchOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + o.estimatedTotal, 0);
  const totalBranchSales = posRevenue + onlineRevenue;

  // Payment Breakdown
  const paymentBreakdown = {
    UPI: branchInvoices.filter(i => i.paymentMode === 'UPI').reduce((acc, i) => acc + i.grandTotal, 0) + 
         branchOrders.reduce((acc, o) => acc + o.estimatedTotal * 0.7, 0),
    Cash: branchInvoices.filter(i => i.paymentMode === 'Cash').reduce((acc, i) => acc + i.grandTotal, 0) +
          branchOrders.reduce((acc, o) => acc + o.estimatedTotal * 0.2, 0),
    Card: branchInvoices.filter(i => i.paymentMode === 'Card').reduce((acc, i) => acc + i.grandTotal, 0) +
          branchOrders.reduce((acc, o) => acc + o.estimatedTotal * 0.1, 0)
  };

  const avgOrderValue = (branchInvoices.length + branchOrders.length) > 0 
    ? totalBranchSales / (branchInvoices.length + branchOrders.length) 
    : 0;

  // 3. PENDING STOCK REPORT CALCULATION
  const branchPendingConsignments = allConsignments.filter(c => {
    return (isConsolidated || c.branchId === selectedBranchFilter) && c.status !== 'CHECKED_IN';
  });

  const totalPendingUnitsInbound = branchPendingConsignments.reduce((acc, c) => acc + c.totalUnits, 0);
  const totalPendingCostInbound = branchPendingConsignments.reduce((acc, c) => acc + c.totalCost, 0);

  // Units committed in unfulfilled active orders
  const activeUnfulfilledOrders = branchOrders.filter(o => o.status === 'PENDING' || o.status === 'VERIFIED' || o.status === 'PACKED');
  const committedUnitsInOrders = activeUnfulfilledOrders.reduce((acc, o) => {
    return acc + o.items.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  // 4. REQUIRED STOCK (DEFICIT & LOW STOCK) CALCULATION
  const branchStockItems = allStocks.filter(s => isConsolidated || s.branchId === selectedBranchFilter);

  // Analyze medicines against stock items
  const requiredStockAlerts = medicines.map(med => {
    const matchingStocks = branchStockItems.filter(s => s.medicineId === med.id);
    const totalCurrentStock = matchingStocks.reduce((sum, s) => sum + s.stock, 0);
    const avgMinAlert = matchingStocks.length > 0 ? matchingStocks[0].minStockAlert : med.minStockAlert;
    const isOutOfStock = totalCurrentStock === 0;
    const isLowStock = totalCurrentStock <= avgMinAlert && !isOutOfStock;
    const deficitUnits = Math.max(0, (avgMinAlert * 2) - totalCurrentStock);
    const estimatedReorderCost = deficitUnits * (med.costPrice || med.unitPrice * 0.7);

    return {
      medicine: med,
      currentStock: totalCurrentStock,
      minAlert: avgMinAlert,
      isOutOfStock,
      isLowStock,
      deficitUnits,
      estimatedReorderCost,
      rackLocation: med.rackLocation
    };
  }).filter(item => item.isOutOfStock || item.isLowStock);

  const totalRequiredDeficitUnits = requiredStockAlerts.reduce((acc, item) => acc + item.deficitUnits, 0);
  const totalRequiredExpenditure = requiredStockAlerts.reduce((acc, item) => acc + item.estimatedReorderCost, 0);

  // 5. ONLINE ORDER PROGRESS STEPS
  const orderProgressCounts = {
    PENDING: branchOrders.filter(o => o.status === 'PENDING').length,
    VERIFIED: branchOrders.filter(o => o.status === 'VERIFIED' || o.status === 'ACCEPTED').length,
    PACKED: branchOrders.filter(o => o.status === 'PACKED' || o.status === 'PREPARING' || o.status === 'READY').length,
    OUT_FOR_DELIVERY: branchOrders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
    DELIVERED: branchOrders.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: branchOrders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED').length,
  };

  const completedOrdersCount = orderProgressCounts.DELIVERED;
  const progressPercentage = branchOrders.length > 0
    ? Math.round((completedOrdersCount / branchOrders.length) * 100)
    : 100;

  // Lock background scroll when stock adjustment modal is open
  useModalScrollLock(!!editingStockItem);

  // Handlers
  const handleStockUpdate = async () => {
    if (!editingStockItem) return;
    await updateBranchStock(editingStockItem.branchId, editingStockItem.medicineId, newStockInput);
    toast.success('Updated stock units in Firebase RTDB', 'Stock Updated');
    setEditingStockItem(null);
  };

  const handleQuickAdvance = async (orderId: string, nextStatus: OrderStatus, label: string) => {
    await advanceOrderStatus(orderId, nextStatus, `Updated via Multi-Store Dashboard: ${label}`);
    toast.success(`Order status updated: ${label}`, 'Order Status');
  };

  const handleQuickRestock = async (medicineId: string, medicineName: string) => {
    const targetBranch = isConsolidated ? 'pharm-hanamkonda' : selectedBranchFilter;
    await restockBranchMedicine(targetBranch, medicineId, 50);
    toast.success(`Restocked +50 units of ${medicineName}!`, 'Branch Restock');
    setRestockSuccessMessage(`Restocked +50 units of ${medicineName} into ${currentBranch?.name || 'Store'}!`);
    setTimeout(() => setRestockSuccessMessage(null), 3000);
  };

  const handleCheckInConsignment = async (consignmentId: string, consignmentNum: string) => {
    await checkInPendingStock(consignmentId);
    toast.success(`Checked in Consignment #${consignmentNum}! Stock added to branch inventory.`, 'Consignment Inward');
    setRestockSuccessMessage(`Checked in Consignment #${consignmentNum}! Stock added to branch inventory.`);
    setTimeout(() => setRestockSuccessMessage(null), 3500);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleQuickRestock = async (medicineId: string, medicineName: string) => {
    const targetBranch = isConsolidated ? 'pharm-hanamkonda' : selectedBranchFilter;
    await restockBranchMedicine(targetBranch, medicineId, 50);
    setRestockSuccessMessage(`Restocked +50 units of ${medicineName} into ${currentBranch?.name || 'Store'}!`);
    setTimeout(() => setRestockSuccessMessage(null), 3000);
  };

  const handleCheckInConsignment = async (consignmentId: string, consignmentNum: string) => {
    await checkInPendingStock(consignmentId);
    setRestockSuccessMessage(`Checked in Consignment #${consignmentNum}! Stock added to branch inventory.`);
    setTimeout(() => setRestockSuccessMessage(null), 3500);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {restockSuccessMessage && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">{restockSuccessMessage}</span>
        </div>
      )}

      {/* Top Header Banner with Location Selector */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              Owner Executive Console
            </span>
            <span className="text-xs text-slate-300">• 5 Connected Pharmacies in Warangal, Telangana</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Branch Reports & Multi-Store Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time branch reports for sales, pending shipments, required stock deficits, and customer online order fulfillment across Warangal, Telangana.
          </p>
        </div>

        {/* Global Branch Location Selector */}
        <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/20 flex flex-col gap-1.5 shrink-0 min-w-[260px]">
          <label className="text-[11px] font-bold text-emerald-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select Branch Location:</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-mono">Live Sync</span>
          </label>
          <select
            value={selectedBranchFilter}
            onChange={(e) => {
              setSelectedBranchFilter(e.target.value);
              if (e.target.value !== 'ALL') {
                onSelectBranch(e.target.value);
              }
            }}
            className="bg-slate-900 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-emerald-500/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            <option value="ALL">🌐 All Branches (Consolidated Warangal)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                📍 {b.name.replace('medEco Pharmacy - ', '')} ({b.area})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('report')}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border-b-2 shrink-0 ${
            activeTab === 'report'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Location Operational Report</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border-b-2 shrink-0 ${
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
          className={`pb-3 px-4 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border-b-2 shrink-0 ${
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
          className={`pb-3 px-4 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border-b-2 shrink-0 ${
            activeTab === 'bookings'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Customer Booking Tracker ({filteredOrders.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LOCATION OPERATIONAL REPORT (BRANCH SALES, PENDING STOCK, REQUIRED STOCK, ONLINE ORDER PROGRESS) */}
      {/* ========================================================================= */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Location Report Banner Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-md">
                  {isConsolidated ? 'WARANGAL DISTRICT' : currentBranch?.code}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isConsolidated ? 'Consolidated 5 Branches' : `${currentBranch?.doorNumber}, ${currentBranch?.address}`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {isConsolidated ? 'Warangal Region: Consolidated Branch Report' : currentBranch?.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Location: <strong>{isConsolidated ? 'Warangal, Telangana' : `${currentBranch?.area}, Warangal, Telangana - ${currentBranch?.pincode}`}</strong>
                {!isConsolidated && currentBranch?.managerName && (
                  <span> • Store Manager: <strong>{currentBranch.managerName}</strong></span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handlePrintReport}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors no-print"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
            </div>
          </div>

          {/* 4 CORE KPI METRIC CARDS BASED ON SELECTED LOCATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Branch Sales Card */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Branch Sales</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                  ₹{totalBranchSales.toFixed(2)}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{branchInvoices.length} POS Invoices</span>
                  <span>•</span>
                  <span>{branchOrders.length} Online Orders</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between">
                <span>Avg Value: ₹{avgOrderValue.toFixed(0)}</span>
                <span className="font-mono text-slate-400">GST Active</span>
              </div>
            </div>

            {/* 2. Pending Stock Card */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Stock</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                  {totalPendingUnitsInbound} <span className="text-sm font-semibold text-slate-400">units</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                  <span>{branchPendingConsignments.length} Inbound Shipments</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>In-transit Value: ₹{totalPendingCostInbound.toFixed(0)}</span>
                <span className="font-bold text-amber-600">Reserved: {committedUnitsInOrders}u</span>
              </div>
            </div>

            {/* 3. Required Stock Card */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Required Stock</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
                  {requiredStockAlerts.length} <span className="text-sm font-semibold text-slate-500">items</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold mt-1">
                  <span>Deficit: {totalRequiredDeficitUnits} units needed</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Reorder Cost: ₹{totalRequiredExpenditure.toFixed(0)}</span>
                <span className="font-bold text-rose-500">Immediate Action</span>
              </div>
            </div>

            {/* 4. Online Order Progress Card */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Online Order Progress</span>
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                  {progressPercentage}% <span className="text-sm font-semibold text-slate-400">Fulfilled</span>
                </p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Active: {orderProgressCounts.PENDING + orderProgressCounts.VERIFIED + orderProgressCounts.PACKED + orderProgressCounts.OUT_FOR_DELIVERY}</span>
                <span className="font-bold text-emerald-600">Delivered: {completedOrdersCount}</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: DETAILED BRANCH SALES REPORT */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Branch Sales & Payment Revenue Report</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Total revenue recorded for {isConsolidated ? 'all branches in Warangal' : currentBranch?.name}
                </p>
              </div>
              <div className="font-mono text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-xl">
                Gross: ₹{totalBranchSales.toFixed(2)}
              </div>
            </div>

            {/* Payment Modes Split */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-600" /> UPI Payments
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {totalBranchSales > 0 ? ((paymentBreakdown.UPI / totalBranchSales) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  ₹{paymentBreakdown.UPI.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-400">PhonePe, Google Pay & Paytm</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" /> Cash at Counter
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {totalBranchSales > 0 ? ((paymentBreakdown.Cash / totalBranchSales) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  ₹{paymentBreakdown.Cash.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-400">In-store Cashier receipts</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-600" /> Card / POS Terminal
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {totalBranchSales > 0 ? ((paymentBreakdown.Card / totalBranchSales) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  ₹{paymentBreakdown.Card.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-400">Debit / Credit card swipe</span>
              </div>
            </div>

            {/* Recent Sales Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Invoice #</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Customer</th>
                    <th className="p-2.5">Items Purchased</th>
                    <th className="p-2.5">Payment</th>
                    <th className="p-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {branchInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">No invoices recorded yet for this location.</td>
                    </tr>
                  ) : (
                    branchInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                        <td className="p-2.5 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                        <td className="p-2.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{inv.customerName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{inv.customerMobile}</span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">
                          {inv.items.map(i => `${i.medicineName} (${i.quantity})`).join(', ')}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {inv.paymentMode}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-emerald-600">
                          ₹{inv.grandTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: PENDING STOCK CONSIGNMENTS REPORT */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Pending Stock & Inbound Consignments</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Shipments and supplier deliveries in-flight to this branch
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-xl">
                {branchPendingConsignments.length} Pending Inbound
              </span>
            </div>

            {branchPendingConsignments.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No pending inbound stock consignments for this branch. All shipments are checked in!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {branchPendingConsignments.map(con => (
                  <div
                    key={con.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                            {con.consignmentNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            con.status === 'ARRIVED_AWAITING_CHECKIN' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {con.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                          Supplier: <strong>{con.supplierName}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-600 block">
                          ₹{con.totalCost.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {con.totalUnits} Units
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Items in Consignment:</span>
                      {con.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-slate-800 dark:text-slate-200">{item.medicineName}</span>
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-400">+{item.orderedQuantity} units</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-slate-500">
                        Expected: <strong>{con.expectedDate}</strong>
                      </span>

                      <button
                        onClick={() => handleCheckInConsignment(con.id, con.consignmentNumber)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Check In & Stock</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: REQUIRED STOCK & CRITICAL REORDER ALERTS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Required Stock & Inventory Deficit Alerts</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Medicines requiring immediate replenishment to prevent stockouts
                </p>
              </div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-xl">
                {requiredStockAlerts.length} Deficit Items
              </span>
            </div>

            {requiredStockAlerts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                🎉 All medicines for this branch are healthy and above minimum safety thresholds!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Medicine & Dosage</th>
                      <th className="p-3">Current Stock</th>
                      <th className="p-3">Safety Threshold</th>
                      <th className="p-3">Deficit Required</th>
                      <th className="p-3">Estimated Cost</th>
                      <th className="p-3 text-right">Quick Restock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {requiredStockAlerts.map(({ medicine, currentStock, minAlert, isOutOfStock, deficitUnits, estimatedReorderCost }) => (
                      <tr key={medicine.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-rose-600 animate-ping' : 'bg-amber-500'}`}></span>
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-white block">{medicine.name}</span>
                              <span className="text-[10px] text-slate-400">{medicine.genericName} • {medicine.rackLocation.rackId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-mono font-bold">
                          {isOutOfStock ? (
                            <span className="text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded font-black">
                              0 Units (OUT)
                            </span>
                          ) : (
                            <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                              {currentStock} Units (Low)
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono text-slate-500">{minAlert} Units</td>

                        <td className="p-3 font-mono font-black text-rose-600">
                          +{deficitUnits} Units
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          ₹{estimatedReorderCost.toFixed(2)}
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleQuickRestock(medicine.id, medicine.name)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Restock (+50)</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 4: ONLINE ORDER PROGRESS TRACKER */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Online Order Progress & Fulfillment Pipeline</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Standard SOP progression: Pending → Verified → Packed → Out for Delivery → Delivered
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl">
                {branchOrders.length} Total Bookings
              </span>
            </div>

            {/* Stepper Pipeline Stage Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">1. Pending Review</span>
                <span className="text-xl font-black text-amber-800 dark:text-amber-200 mt-1 block">
                  {orderProgressCounts.PENDING}
                </span>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block">2. Verified Rx</span>
                <span className="text-xl font-black text-blue-800 dark:text-blue-200 mt-1 block">
                  {orderProgressCounts.VERIFIED}
                </span>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200/60 dark:border-purple-900/40">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">3. Packed from Rack</span>
                <span className="text-xl font-black text-purple-800 dark:text-purple-200 mt-1 block">
                  {orderProgressCounts.PACKED}
                </span>
              </div>

              <div className="p-3 bg-orange-50 dark:bg-orange-950/40 rounded-2xl border border-orange-200/60 dark:border-orange-900/40">
                <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 block">4. Out for Delivery</span>
                <span className="text-xl font-black text-orange-800 dark:text-orange-200 mt-1 block">
                  {orderProgressCounts.OUT_FOR_DELIVERY}
                </span>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">5. Delivered</span>
                <span className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-1 block">
                  {orderProgressCounts.DELIVERED}
                </span>
              </div>
            </div>

            {/* List of Orders in this Branch */}
            <div className="space-y-3 pt-2">
              {branchOrders.map(order => (
                <div
                  key={order.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{order.orderNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        order.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                        order.status === 'PACKED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                        order.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {order.customerName} (+91 {order.customerMobile})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Destination: {order.doorNumber ? `${order.doorNumber}, ` : ''}{order.address} ({order.pincode})
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      ₹{order.estimatedTotal.toFixed(2)}
                    </span>

                    <button
                      onClick={() => onOpenOrderDetails(order)}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs"
                    >
                      Process Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PHARMACY STORES NETWORK (OVERVIEW) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(branch => {
              const bOrders = allOrders.filter(o => o.pharmacyId === branch.id);
              const bRevenue = bOrders
                .filter(o => o.status !== 'CANCELLED')
                .reduce((acc, o) => acc + o.estimatedTotal, 0);
              const bPending = bOrders.filter(o => o.status === 'PENDING').length;
              const isSelected = selectedBranchFilter === branch.id;

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

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                      <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{branch.doorNumber},</span> {branch.address}
                          <span className="block font-mono text-[10px] text-slate-500">
                            PIN: {branch.pincode} • Area: {branch.area} (Warangal)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Manager: <strong>{branch.managerName}</strong></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Orders</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{bOrders.length}</span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Pending</span>
                        <span className={`font-extrabold ${bPending > 0 ? 'text-amber-500 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                          {bPending}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Revenue</span>
                        <span className="font-extrabold text-emerald-600">₹{bRevenue.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>

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
                        setSelectedBranchFilter(branch.id);
                        onSelectBranch(branch.id);
                        setActiveTab('report');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>View Location Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BRANCH STOCK INVENTORY */}
      {/* ========================================================================= */}
      {activeTab === 'stocks' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900 dark:text-white">
                Multi-Branch Stock Inventory & Rack Levels (Warangal)
              </span>
            </div>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine name..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Rack Storage</th>
                  <th className="p-3">MRP (₹)</th>
                  {branches.map(b => (
                    <th key={b.id} className="p-3 text-center">
                      <span className="block">{b.area}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{b.code}</span>
                    </th>
                  ))}
                  <th className="p-3 text-right">Total Units</th>
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
                          <span className="font-extrabold text-slate-900 dark:text-white block">{med.name}</span>
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
                                title="Click to adjust branch stock in Firebase"
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
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Update Branch Stock in Firebase RTDB
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
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-lg font-black font-mono text-slate-900 dark:text-white"
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
                    Save to Firebase
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CUSTOMER BOOKING TRACKER */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
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

          <div className="space-y-3">
            {filteredOrders.map(order => {
              const branch = branches.find(b => b.id === order.pharmacyId);

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                        <Building2 className="w-3 h-3 text-emerald-600" />
                        <span>{order.pharmacyName || branch?.name || 'Hanamkonda Branch'}</span>
                      </span>

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

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
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
                            PIN: {order.pincode} (Warangal) {order.landmark ? `• ${order.landmark}` : ''}
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

                  {mapViewingOrder?.id === order.id && (
                    <div className="pt-2">
                      <GoogleMapViewer
                        latitude={order.geoCoordinates?.latitude || branch?.coordinates.latitude || 18.0125}
                        longitude={order.geoCoordinates?.longitude || branch?.coordinates.longitude || 79.5539}
                        doorNumber={order.doorNumber}
                        address={order.address}
                        landmark={order.landmark}
                        pincode={order.pincode}
                        title="Customer Delivery Pinpoint (Warangal)"
                      />
                    </div>
                  )}

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
        </div>
      )}
    </div>
  );
};
