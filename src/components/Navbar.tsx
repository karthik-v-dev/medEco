import React from 'react';
import { 
  Pill, 
  Search, 
  ShoppingCart, 
  User, 
  LogOut, 
  Store, 
  Layers, 
  FileText, 
  Clock, 
  Database, 
  Phone, 
  Lock, 
  Users, 
  Bell, 
  BookOpen, 
  Camera, 
  Building2, 
  MapPin,
  ChevronDown,
  Bot,
  MessageCircle
} from 'lucide-react';
import { UserSession, PharmacyBranch } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { ThemeMode } from '../services/theme';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  session: UserSession | null;
  onOpenAuth: (role?: 'customer' | 'owner') => void;
  onLogout: () => void;
  cartCount: number;
  openCart: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  onOpenOnlineOrder: () => void;
  pendingOrdersCount: number;
  onOpenPendingOrders: () => void;
  onOpenManual: () => void;
  onOpenChatbot?: () => void;
  onOpenWhatsAppGateway?: () => void;
  activeBranchId?: string;
  onSelectBranch?: (branchId: string) => void;
  branches?: PharmacyBranch[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  session,
  onOpenAuth,
  onLogout,
  cartCount,
  openCart,
  theme,
  setTheme,
  onOpenOnlineOrder,
  pendingOrdersCount,
  onOpenPendingOrders,
  onOpenManual,
  onOpenChatbot,
  onOpenWhatsAppGateway,
  activeBranchId = 'pharm-hanamkonda',
  onSelectBranch,
  branches = []
}) => {
  const isOwner = session?.role === 'owner';
  const isCustomer = session?.role === 'customer';

  const currentBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors no-print w-full">
      {/* 1. TOP MICRO-BAR: Status, Quick Rx button & User Manual */}
      <div className="bg-emerald-900 dark:bg-slate-950 text-emerald-100 text-xs px-3 sm:px-6 py-1 flex flex-wrap items-center justify-between gap-y-1 gap-x-2 border-b border-emerald-800/40 dark:border-slate-800">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium tracking-wide text-[11px]">
            Firebase RTDB: <span className="font-mono text-emerald-300 font-semibold">mediaclinfo-default-rtdb</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <button
            onClick={onOpenOnlineOrder}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md font-bold transition-all shadow-2xs"
          >
            <Camera className="w-3 h-3 text-emerald-300" />
            <span>Order Rx</span>
          </button>

          {/* USER MANUAL: Separated for Patient vs Owner, Hidden before login */}
          {isCustomer && (
            <button
              onClick={onOpenManual}
              className="hidden sm:inline-flex items-center gap-1 text-emerald-300 hover:text-white font-semibold transition-colors px-2 py-0.5 rounded-md hover:bg-emerald-800/50"
              title="Open Patient User Guide & Ordering Manual"
            >
              <BookOpen className="w-3 h-3" />
              <span>Patient Guide</span>
            </button>
          )}

          {isOwner && (
            <button
              onClick={onOpenManual}
              className="hidden sm:inline-flex items-center gap-1 text-amber-300 hover:text-white font-semibold transition-colors px-2 py-0.5 rounded-md hover:bg-amber-900/50"
              title="Open Pharmacy Operations & POS Owner Manual"
            >
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>Owner Operations Manual</span>
            </button>
          )}

          {isOwner && onOpenWhatsAppGateway && (
            <button
              onClick={onOpenWhatsAppGateway}
              className="inline-flex items-center gap-1 text-emerald-300 hover:text-white font-bold transition-colors px-2 py-0.5 rounded-md bg-emerald-950/60 hover:bg-emerald-800/80 border border-emerald-500/40 text-[11px]"
              title="WhatsApp Gateway (Device Link & QR Code)"
            >
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              <span>WhatsApp Gateway</span>
            </button>
          )}

          {isOwner && (
            <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded font-bold border border-amber-400/30">
              👑 Owner Active
            </span>
          )}

          {isCustomer && session.customer && (
            <div className="inline-flex items-center gap-1 bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-200">
              <Phone className="w-2.5 h-2.5 text-emerald-400" />
              <span>+91 {session.customer.mobileNumber}</span>
              <span className="opacity-70 hidden md:inline font-semibold">• {session.customer.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. TIER 1: BRANDING & UTILITY CONTROLS (Logo on Left, Utilities on Right) */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Side: Brand Logo + Connected Store Dropdown (Desktop) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div 
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none shrink-0"
            onClick={() => setCurrentTab(isCustomer ? 'customer_history' : 'finder')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Pill className="w-4 h-4 sm:w-5 sm:h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  med<span className="text-emerald-600 dark:text-emerald-400">Eco</span>
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {isOwner ? 'Owner' : isCustomer ? 'Patient' : 'Pharmacy'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Multi-Store Racks & Patient Wellness
              </p>
            </div>
          </div>

          {/* Active Store Selector (Desktop: hidden on mobile so header never overflows) */}
          {branches.length > 0 && onSelectBranch && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                value={activeBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
              >
                <option value="ALL">All Stores (Consolidated)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">
                    {b.name.replace('medEco Pharmacy - ', '')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Theme, Bell, Cart, Session Status & Logout (Never overflows on mobile) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Theme Toggle Button */}
          <ThemeToggle theme={theme} setTheme={setTheme} />

          {/* Online Orders Notification Bell (For Owner) */}
          {isOwner && (
            <button
              onClick={onOpenPendingOrders}
              className="relative p-1.5 sm:p-2 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
              title="Online Orders Notification"
            >
              <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${pendingOrdersCount > 0 ? 'text-amber-500 animate-bounce' : ''}`} />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-bold text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          )}

          {/* Cart Button (For Owner) */}
          {isOwner && (
            <button
              onClick={openCart}
              className="relative p-1.5 sm:p-2 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
              title="View Current Bill / Cart"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white font-bold text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* User Session Profile & Mobile-Ready Logout */}
          {session ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              {isOwner ? (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold">
                  <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Owner</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold">
                  <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="max-w-[70px] sm:max-w-[110px] truncate">{session.customer?.name}</span>
                </div>
              )}

              {/* Dedicated Desktop Logout Button (Hidden on mobile; mobile uses sticky bottom nav logout) */}
              <button
                onClick={onLogout}
                className="hidden md:flex px-2 sm:px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl transition-all shrink-0 items-center gap-1 font-bold text-xs shadow-2xs"
                title="Logout from Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onOpenAuth('customer')}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
              >
                <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span><span className="hidden sm:inline">Customer </span>Login</span>
              </button>

              <button
                onClick={() => onOpenAuth('owner')}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
              >
                <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                <span>Owner</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. TIER 2: SECONDARY NAVIGATION ROW (Clean horizontal single-line scroll on mobile; wrapped on desktop) */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 px-2.5 sm:px-6 lg:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar md:flex-wrap py-0.5">
          {/* Mobile Active Store Selector (Visible on small screens only) */}
          {branches.length > 0 && onSelectBranch && (
            <div className="md:hidden flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 shadow-2xs">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              <select
                value={activeBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer max-w-[120px] truncate"
              >
                <option value="ALL">All Stores</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">
                    {b.name.replace('medEco Pharmacy - ', '')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Universal Finder - Hidden for customers to restrict internal tablet & rack details */}
          {!isCustomer ? (
            <button
              onClick={() => setCurrentTab('finder')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                currentTab === 'finder'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span>Where is Tablet?</span>
            </button>
          ) : (
            <button
              onClick={onOpenOnlineOrder}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs whitespace-nowrap shrink-0"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span>Order Rx<span className="hidden sm:inline"> Online</span></span>
            </button>
          )}

          {/* Rack Map */}
          {!isCustomer && (
            <button
              onClick={() => setCurrentTab('racks')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                currentTab === 'racks'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Rack Map</span>
            </button>
          )}

          {/* Owner Tabs (Wrapped cleanly as inline-block pills with whitespace-nowrap) */}
          {isOwner && (
            <>
              <button
                onClick={() => setCurrentTab('stores_dash')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  currentTab === 'stores_dash'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="All Stores Franchise & Booking Dashboard"
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>All Stores Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentTab('pos')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  currentTab === 'pos'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span>POS Billing</span>
              </button>

              <button
                onClick={() => setCurrentTab('inventory')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  currentTab === 'inventory'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span>Inventory & Costs</span>
              </button>

              <button
                onClick={() => setCurrentTab('customers_dir')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  currentTab === 'customers_dir'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Customer Directory</span>
              </button>

              <button
                onClick={() => setCurrentTab('invoices')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  currentTab === 'invoices'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>All Receipts</span>
              </button>
            </>
          )}

          {/* Customer Tabs (Clean horizontal pills with whitespace-nowrap) */}
          {isCustomer && (
            <>
              <button
                onClick={() => setCurrentTab('customer_history')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  currentTab === 'customer_history'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span><span className="hidden sm:inline">My </span>Orders & Live Tracking</span>
              </button>

              <button
                onClick={() => setCurrentTab('customer_reminders')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  currentTab === 'customer_reminders'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span><span className="hidden sm:inline">My </span>Dose Reminders</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
