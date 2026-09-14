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
  Download
} from 'lucide-react';
import { UserSession } from '../types';
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
  onOpenManual
}) => {
  const isOwner = session?.role === 'owner';
  const isCustomer = session?.role === 'customer';

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors no-print">
      {/* Top micro-bar: Firebase, Session & Quick Actions */}
      <div className="bg-emerald-900 dark:bg-slate-950 text-emerald-100 text-xs px-4 py-1.5 flex items-center justify-between border-b border-emerald-800/40 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium tracking-wide">
            Firebase RTDB: <span className="font-mono text-emerald-300">mediaclinfo-default-rtdb</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Online Order Button for customers/patients */}
          <button
            onClick={onOpenOnlineOrder}
            className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-md text-[11px] font-bold transition-all shadow-2xs"
          >
            <Camera className="w-3 h-3 text-emerald-300" />
            <span>Order Online / Upload Rx</span>
          </button>

          {/* User Manual Quick Link */}
          <button
            onClick={onOpenManual}
            className="hidden sm:flex items-center gap-1 text-emerald-300 hover:text-white text-[11px] font-semibold"
            title="Open Complete User Manual"
          >
            <BookOpen className="w-3 h-3" />
            <span>User Manual (PDF)</span>
          </button>

          {isOwner && (
            <span className="bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded text-[11px] font-bold border border-amber-400/30 flex items-center gap-1">
              👑 Owner Active
            </span>
          )}
          {isCustomer && session.customer && (
            <div className="flex items-center gap-1.5 bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-200 text-[11px]">
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>+91 {session.customer.mobileNumber}</span>
              <span className="opacity-70 hidden md:inline font-semibold">• {session.customer.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setCurrentTab('finder')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Pill className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  med<span className="text-emerald-600 dark:text-emerald-400">Eco</span>
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {isOwner ? 'Owner' : isCustomer ? 'Patient' : 'Pharmacy'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">Rack Locator & Customer Care</p>
            </div>
          </div>

          {/* Dynamic Navigation Tabs based on Role */}
          <nav className="hidden md:flex items-center gap-1">
            {/* 1. Everyone: "Where is Tablet?" locator */}
            <button
              onClick={() => setCurrentTab('finder')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'finder'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Where is Tablet?</span>
            </button>

            {/* 2. Racks Map (For Owner & Guest) */}
            {!isCustomer && (
              <button
                onClick={() => setCurrentTab('racks')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  currentTab === 'racks'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Rack Map</span>
              </button>
            )}

            {/* 3. OWNER EXCLUSIVE TABS */}
            {isOwner && (
              <>
                <button
                  onClick={() => setCurrentTab('pos')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'pos'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>POS Billing</span>
                </button>

                <button
                  onClick={() => setCurrentTab('inventory')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'inventory'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Inventory & Costs</span>
                </button>

                <button
                  onClick={() => setCurrentTab('customers_dir')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'customers_dir'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Check Customer Info</span>
                </button>

                <button
                  onClick={() => setCurrentTab('invoices')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'invoices'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>All Receipts</span>
                </button>
              </>
            )}

            {/* 4. CUSTOMER EXCLUSIVE TABS (STRICT DATA PRIVACY) */}
            {isCustomer && (
              <>
                <button
                  onClick={() => setCurrentTab('customer_history')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'customer_history'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>My Orders & History</span>
                </button>

                <button
                  onClick={() => setCurrentTab('customer_reminders')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'customer_reminders'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>My Dose Reminders</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button (Light / Dark / System) */}
            <ThemeToggle theme={theme} setTheme={setTheme} />

            {/* Online Orders Notification Bell (For Owner) */}
            {isOwner && (
              <button
                onClick={onOpenPendingOrders}
                className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-2xs"
                title="Online Orders Notification"
              >
                <Bell className={`w-5 h-5 ${pendingOrdersCount > 0 ? 'text-amber-500 animate-bounce' : ''}`} />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            )}

            {/* Cart Button (For Owner / Staff) */}
            {isOwner && (
              <button
                onClick={openCart}
                className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-2xs"
                title="View Current Bill / Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Session States */}
            {session ? (
              <div className="flex items-center gap-2">
                {isOwner ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold">
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="hidden sm:inline">Owner Portal</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold">
                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="max-w-[100px] truncate">{session.customer?.name}</span>
                  </div>
                )}

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('customer')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Customer Login</span>
                </button>

                <button
                  onClick={() => onOpenAuth('owner')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Owner</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
