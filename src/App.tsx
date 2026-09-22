import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Layers, 
  Store, 
  Database, 
  Clock, 
  FileText, 
  ShoppingCart,
  Phone,
  Pill,
  Users,
  Lock,
  User,
  LogIn,
  Camera,
  Bell,
  BookOpen,
  Building2
} from 'lucide-react';
import { 
  Medicine, 
  CartItem, 
  Customer, 
  Invoice, 
  UserSession, 
  OnlineOrder, 
  PharmacyBranch 
} from './types';
import { 
  initializeDataLayer, 
  getMedicines, 
  getInvoices, 
  subscribeToDataChanges,
  getActiveSession,
  setActiveSession,
  getCustomerInvoices,
  getCustomerReminders,
  getOnlineOrders,
  getPendingOnlineOrders,
  getPharmacyBranches,
  getActiveBranchId,
  setActiveBranchId
} from './services/firebase';
import { useTheme } from './services/theme';

import { Navbar } from './components/Navbar';
import { MedicineFinder } from './components/MedicineFinder';
import { RackLayoutView } from './components/RackLayoutView';
import { BillingPOS } from './components/BillingPOS';
import { InventoryManager } from './components/InventoryManager';
import { ReminderManager } from './components/ReminderManager';
import { CustomerDirectory } from './components/CustomerDirectory';
import { InvoiceHistory } from './components/InvoiceHistory';
import { AuthModal } from './components/AuthModal';
import { ReceiptModal } from './components/ReceiptModal';
import { OnlineOrderModal } from './components/OnlineOrderModal';
import { OrderNotificationPopup } from './components/OrderNotificationPopup';
import { UserManualModal } from './components/UserManualModal';
import { MultiStoreDashboard } from './components/MultiStoreDashboard';
import { CustomerPortal } from './components/CustomerPortal';

export const App: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const [currentTab, setCurrentTab] = useState<string>('finder');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
  const [branches, setBranches] = useState<PharmacyBranch[]>([]);
  const [activeBranchId, setActiveBranchIdState] = useState<string>('pharm-hanamkonda');

  // Modals State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<'customer' | 'owner'>('customer');
  const [activeReceipt, setActiveReceipt] = useState<Invoice | null>(null);
  const [selectedRackTarget, setSelectedRackTarget] = useState<string>('Rack A');

  // Online Orders & Rx Modals
  const [isOnlineOrderModalOpen, setIsOnlineOrderModalOpen] = useState(false);
  const [isOrderNotificationOpen, setIsOrderNotificationOpen] = useState(false);
  const [selectedNotificationOrder, setSelectedNotificationOrder] = useState<OnlineOrder | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Load data & subscribe to changes
  useEffect(() => {
    initializeDataLayer().then(() => {
      setMedicines(getMedicines());
      setInvoices(getInvoices());
      const curSession = getActiveSession();
      setSession(curSession);
      if (curSession?.role === 'customer') {
        setCurrentTab('customer_history');
      }
      setOnlineOrders(getOnlineOrders());
      setBranches(getPharmacyBranches());
      setActiveBranchIdState(getActiveBranchId());
    });

    const unsubscribe = subscribeToDataChanges(() => {
      setMedicines(getMedicines());
      setInvoices(getInvoices());
      setSession(getActiveSession());
      setOnlineOrders(getOnlineOrders());
      setBranches(getPharmacyBranches());
      setActiveBranchIdState(getActiveBranchId());
    });

    // Listen for realtime incoming online order events
    const handleNewOrder = (e: Event) => {
      const customEvent = e as CustomEvent<OnlineOrder & { assignedPharmacyId?: string }>;
      const order = customEvent.detail;
      
      // Store Routing Check:
      // An owner will receive notifications if they have selected "ALL" or if the order was assigned to their store
      const curBranch = localStorage.getItem('medeco_active_branch_id') || 'pharm-hanamkonda';
      if (curBranch === 'ALL' || !order.pharmacyId || order.pharmacyId === curBranch) {
        setSelectedNotificationOrder(order);
        setIsOrderNotificationOpen(true);
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.3 } });
      }
    };

    window.addEventListener('medeco:new-online-order', handleNewOrder);

    return () => {
      unsubscribe();
      window.removeEventListener('medeco:new-online-order', handleNewOrder);
    };
  }, []);

  const handleOpenAuth = (role: 'customer' | 'owner' = 'customer') => {
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    setActiveSession(null);
    setSession(null);
    setCurrentTab('finder');
    setIsAuthModalOpen(false);
    setIsManualModalOpen(false);
    setAuthModalRole('customer');
  };

  const handleBranchSwitch = (branchId: string) => {
    setActiveBranchIdState(branchId);
    setActiveBranchId(branchId);
  };

  const handleAddToCart = (medicine: Medicine, quantity: number = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.medicine.id === medicine.id);
      if (idx >= 0) {
        const next = [...prev];
        const newQty = next[idx].quantity + quantity;
        next[idx] = {
          ...next[idx],
          quantity: newQty,
          total: newQty * next[idx].unitPrice
        };
        return next;
      } else {
        return [
          ...prev,
          {
            medicine,
            quantity,
            unitPrice: medicine.unitPrice,
            total: medicine.unitPrice * quantity,
            selectedDosageInstructions: medicine.category === 'Tablets' ? '1 tablet after food' : 'As prescribed'
          }
        ];
      }
    });
  };

  const handleNavigateToRack = (rackId: string) => {
    setSelectedRackTarget(rackId);
    setCurrentTab('racks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInvoiceCreated = (invoice: Invoice) => {
    setActiveReceipt(invoice);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  // Handler when Owner clicks "Accept & Load into POS" from notification popup
  const handleAcceptAndBillOrder = (order: OnlineOrder) => {
    const newItems: CartItem[] = order.items.map(item => {
      const originalMed = medicines.find(m => m.id === item.medicineId) || {
        id: item.medicineId,
        name: item.medicineName,
        genericName: item.genericName || item.medicineName,
        brand: 'Prescribed',
        category: 'Tablets',
        dosage: item.dosage,
        stripSize: '1 strip',
        unitPrice: item.unitPrice,
        costPrice: item.unitPrice * 0.7,
        stock: 50,
        minStockAlert: 10,
        batchNumber: 'BAT-ONLINE',
        expiryDate: '2027-12-31',
        gstRate: 12,
        rackLocation: {
          rackId: item.rackInfo.split('>')[0]?.trim() || 'Rack A',
          shelfNumber: 1
        },
        requiresPrescription: true
      };

      return {
        medicine: originalMed,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        selectedDosageInstructions: item.dosage
      };
    });

    setCart(newItems);
    setCurrentTab('pos');
  };

  const totalCartCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const isOwner = session?.role === 'owner';
  const isCustomer = session?.role === 'customer';
  const activeCustomer = session?.customer || null;

  // Pending orders filtered by active store context
  const storePendingOrders = onlineOrders.filter(o => 
    o.status === 'PENDING' && (activeBranchId === 'ALL' || o.pharmacyId === activeBranchId)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {/* App Navbar with responsive wrap, branch selector, and Theme Toggle */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        session={session}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        cartCount={totalCartCount}
        openCart={() => isOwner ? setCurrentTab('pos') : handleOpenAuth('owner')}
        theme={theme}
        setTheme={setTheme}
        onOpenOnlineOrder={() => setIsOnlineOrderModalOpen(true)}
        pendingOrdersCount={storePendingOrders.length}
        onOpenPendingOrders={() => {
          if (storePendingOrders.length > 0) {
            setSelectedNotificationOrder(storePendingOrders[0]);
            setIsOrderNotificationOpen(true);
          } else if (onlineOrders.length > 0) {
            setSelectedNotificationOrder(onlineOrders[0]);
            setIsOrderNotificationOpen(true);
          }
        }}
        onOpenManual={() => setIsManualModalOpen(true)}
        activeBranchId={activeBranchId}
        onSelectBranch={handleBranchSwitch}
        branches={branches}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 md:pb-12">
        {/* 1. Everyone: "Where is Tablet?" Quick Locator - Restricted for Customers */}
        {currentTab === 'finder' && (
          isCustomer ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto space-y-4 my-8">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pharmacy Staff Access Only</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tablet storage rack locator and physical store layouts are restricted to authorized pharmacy staff. Customers can view active orders or submit new prescriptions directly.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsOnlineOrderModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Camera className="w-4 h-4" />
                  <span>Order Prescriptions (Rx)</span>
                </button>
                <button
                  onClick={() => setCurrentTab('customer_history')}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  View My Orders
                </button>
              </div>
            </div>
          ) : (
            <MedicineFinder
              medicines={medicines}
              onAddToCart={handleAddToCart}
              onNavigateToRack={handleNavigateToRack}
              onOpenPos={() => isOwner ? setCurrentTab('pos') : handleOpenAuth('owner')}
            />
          )
        )}

        {/* 2. Visual Rack Map */}
        {currentTab === 'racks' && (
          <RackLayoutView
            medicines={medicines}
            initialRackId={selectedRackTarget}
            onAddToCart={(med) => isOwner ? handleAddToCart(med, 1) : handleOpenAuth('owner')}
          />
        )}

        {/* 3. OWNER ONLY: Multi-Store Franchise & Booking Dashboard */}
        {currentTab === 'stores_dash' && (
          isOwner ? (
            <MultiStoreDashboard
              medicines={medicines}
              activeBranchId={activeBranchId}
              onSelectBranch={handleBranchSwitch}
              onOpenOrderDetails={(order) => {
                setSelectedNotificationOrder(order);
                setIsOrderNotificationOpen(true);
              }}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-3">
              <Lock className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Owner Access Required</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Only authenticated pharmacy owners can view the consolidated Multi-Store Dashboard and manage branch bookings.
              </p>
              <button
                onClick={() => handleOpenAuth('owner')}
                className="w-full py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Sign in as Owner
              </button>
            </div>
          )
        )}

        {/* 4. OWNER ONLY: POS Billing */}
        {currentTab === 'pos' && (
          isOwner ? (
            <BillingPOS
              medicines={medicines}
              cart={cart}
              setCart={setCart}
              activeCustomer={null}
              onInvoiceCreated={handleInvoiceCreated}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-3">
              <Lock className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Owner Authentication Required</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please log in as the Pharmacy Owner to access the Point of Sale billing terminal.
              </p>
              <button
                onClick={() => handleOpenAuth('owner')}
                className="w-full py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Sign in as Owner
              </button>
            </div>
          )
        )}

        {/* 5. OWNER ONLY: Inventory & Costs Management */}
        {currentTab === 'inventory' && (
          isOwner ? (
            <InventoryManager
              medicines={medicines}
              onSelectRack={handleNavigateToRack}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-3">
              <Lock className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Owner Access Required</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Medicine inventory costs, wholesale pricing, and rack assignments can only be managed by the store owner.
              </p>
              <button
                onClick={() => handleOpenAuth('owner')}
                className="w-full py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Sign in as Owner
              </button>
            </div>
          )
        )}

        {/* 6. OWNER ONLY: Check Customer Info & History */}
        {currentTab === 'customers_dir' && (
          isOwner ? (
            <CustomerDirectory
              onViewInvoice={(inv) => setActiveReceipt(inv)}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-3">
              <Lock className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Directory Restricted</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Only the Pharmacy Owner can view the complete directory of patient accounts and histories.
              </p>
              <button
                onClick={() => handleOpenAuth('owner')}
                className="w-full py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Sign in as Owner
              </button>
            </div>
          )
        )}

        {/* 7. OWNER ONLY: All Sales Receipts */}
        {currentTab === 'invoices' && (
          isOwner ? (
            <InvoiceHistory
              invoices={invoices}
              onViewInvoice={(inv) => setActiveReceipt(inv)}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-3">
              <Lock className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Audit Receipts Restricted</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Store-wide sales invoices and tax records are accessible to the store owner only.
              </p>
              <button
                onClick={() => handleOpenAuth('owner')}
                className="w-full py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Sign in as Owner
              </button>
            </div>
          )
        )}

        {/* 8. CUSTOMER EXCLUSIVE: "My Orders & History" with Live Booking Tracker */}
        {currentTab === 'customer_history' && (
          <CustomerPortal
            customer={activeCustomer}
            onOpenAuth={() => handleOpenAuth('customer')}
            onViewInvoice={(inv) => setActiveReceipt(inv)}
            onGoToShop={() => setCurrentTab('finder')}
            onOpenOnlineOrder={() => setIsOnlineOrderModalOpen(true)}
          />
        )}

        {/* 9. CUSTOMER EXCLUSIVE: "My Dose Reminders" */}
        {currentTab === 'customer_reminders' && (
          isCustomer && activeCustomer ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">My Medicine Reminders</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily dose schedule and adherence for <span className="font-bold text-slate-800 dark:text-slate-200">{activeCustomer.name}</span>
                  </p>
                </div>
              </div>

              <ReminderManager
                customerMobile={activeCustomer.mobileNumber}
                reminders={getCustomerReminders(activeCustomer.mobileNumber)}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-3">
              <Clock className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Login Required</h3>
              <p className="text-xs text-slate-500">
                Log in with your mobile number to view and manage your daily medicine dose checklist.
              </p>
              <button
                onClick={() => handleOpenAuth('customer')}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Login with Phone
              </button>
            </div>
          )
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar (Clean & Responsive) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around no-print shadow-lg">
        {!isCustomer && (
          <button
            onClick={() => setCurrentTab('finder')}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
              currentTab === 'finder' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Find</span>
          </button>
        )}

        <button
          onClick={() => setIsOnlineOrderModalOpen(true)}
          className="flex flex-col items-center py-1 px-2 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold"
        >
          <Camera className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Order Rx</span>
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => setCurrentTab('stores_dash')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                currentTab === 'stores_dash' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Stores</span>
            </button>

            <button
              onClick={() => setCurrentTab('pos')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl relative transition-all ${
                currentTab === 'pos' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'
              }`}
            >
              <Store className="w-4 h-4" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 right-2 bg-emerald-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
              <span className="text-[10px] mt-0.5">Bill</span>
            </button>

            <button
              onClick={() => setCurrentTab('customers_dir')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                currentTab === 'customers_dir' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Patients</span>
            </button>
          </>
        )}

        {isCustomer && (
          <>
            <button
              onClick={() => setCurrentTab('customer_history')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                currentTab === 'customer_history' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Track</span>
            </button>

            <button
              onClick={() => setCurrentTab('customer_reminders')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                currentTab === 'customer_reminders' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Reminders</span>
            </button>
          </>
        )}

        {!session && (
          <button
            onClick={() => handleOpenAuth('customer')}
            className="flex flex-col items-center py-1 px-2 rounded-xl text-slate-500 hover:text-emerald-700"
          >
            <LogIn className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Login</span>
          </button>
        )}
      </nav>

      {/* Customer Online Order & Prescription Upload Modal (With Nearest Branch & Login gate) */}
      <OnlineOrderModal
        isOpen={isOnlineOrderModalOpen}
        onClose={() => setIsOnlineOrderModalOpen(false)}
        session={session}
        onRequireLogin={() => handleOpenAuth('customer')}
        onOrderSubmitted={(order) => {
          setSelectedNotificationOrder(order);
          setIsOrderNotificationOpen(true);
        }}
      />

      {/* Realtime Order Notification Popup (Filtered to assigned pharmacy branch) */}
      <OrderNotificationPopup
        order={selectedNotificationOrder}
        isOpen={isOrderNotificationOpen}
        onClose={() => setIsOrderNotificationOpen(false)}
        onAcceptAndBill={handleAcceptAndBillOrder}
      />

      {/* Separated User Manual Modal (Patient User Guide vs Owner Operations Manual) */}
      <UserManualModal
        isOpen={isManualModalOpen && !!session}
        onClose={() => setIsManualModalOpen(false)}
        role={session?.role}
      />

      {/* Unified Auth Modal (Customer Mobile Login & Owner Admin Login) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialRole={authModalRole}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          if (newSession.role === 'owner') {
            setCurrentTab('stores_dash');
          } else {
            setCurrentTab('customer_history');
          }
        }}
      />

      {/* Official Tax Invoice / Receipt Modal */}
      <ReceiptModal
        isOpen={!!activeReceipt}
        invoice={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        onViewReminders={() => {
          setActiveReceipt(null);
          if (isCustomer) {
            setCurrentTab('customer_reminders');
          } else if (isOwner) {
            setCurrentTab('customers_dir');
          }
        }}
      />
    </div>
  );
};

export default App;
