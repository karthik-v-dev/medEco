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
  BookOpen
} from 'lucide-react';
import { Medicine, CartItem, Customer, Invoice, UserSession, OnlineOrder } from './types';
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
  getPendingOnlineOrders
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

export const App: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const [currentTab, setCurrentTab] = useState<string>('finder');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);

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
      setSession(getActiveSession());
      setOnlineOrders(getOnlineOrders());
    });

    const unsubscribe = subscribeToDataChanges(() => {
      setMedicines(getMedicines());
      setInvoices(getInvoices());
      setSession(getActiveSession());
      setOnlineOrders(getOnlineOrders());
    });

    // Listen for realtime incoming online order events
    const handleNewOrder = (e: Event) => {
      const customEvent = e as CustomEvent<OnlineOrder>;
      const order = customEvent.detail;
      setSelectedNotificationOrder(order);
      setIsOrderNotificationOpen(true);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.3 } });
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

  const pendingOrders = onlineOrders.filter(o => o.status === 'PENDING');

  // Customer isolated data: ONLY their own invoices and reminders!
  const myInvoices = activeCustomer ? getCustomerInvoices(activeCustomer.mobileNumber) : [];
  const myReminders = activeCustomer ? getCustomerReminders(activeCustomer.mobileNumber) : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {/* App Navbar with role based controls & Theme Toggle */}
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
        pendingOrdersCount={pendingOrders.length}
        onOpenPendingOrders={() => {
          if (pendingOrders.length > 0) {
            setSelectedNotificationOrder(pendingOrders[0]);
            setIsOrderNotificationOpen(true);
          } else if (onlineOrders.length > 0) {
            setSelectedNotificationOrder(onlineOrders[0]);
            setIsOrderNotificationOpen(true);
          }
        }}
        onOpenManual={() => setIsManualModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {/* 1. Everyone: "Where is Tablet?" Quick Locator */}
        {currentTab === 'finder' && (
          <MedicineFinder
            medicines={medicines}
            onAddToCart={handleAddToCart}
            onNavigateToRack={handleNavigateToRack}
            onOpenPos={() => isOwner ? setCurrentTab('pos') : handleOpenAuth('owner')}
          />
        )}

        {/* 2. Visual Rack Map */}
        {currentTab === 'racks' && (
          <RackLayoutView
            medicines={medicines}
            initialRackId={selectedRackTarget}
            onAddToCart={(med) => isOwner ? handleAddToCart(med, 1) : handleOpenAuth('owner')}
          />
        )}

        {/* 3. OWNER ONLY: POS Billing */}
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Owner / Staff Authentication Required</h3>
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

        {/* 4. OWNER ONLY: Inventory & Costs Management */}
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

        {/* 5. OWNER ONLY: Check Customer Info & History */}
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

        {/* 6. OWNER ONLY: All Sales Receipts */}
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

        {/* 7. CUSTOMER EXCLUSIVE: "My Orders & History" (Strict Privacy) */}
        {currentTab === 'customer_history' && (
          isCustomer && activeCustomer ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">My Medicine Purchase History</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Orders linked to <span className="font-mono font-bold text-slate-700 dark:text-slate-300">+91 {activeCustomer.mobileNumber}</span> ({activeCustomer.name})
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-xl">
                  {myInvoices.length} Orders
                </span>
              </div>

              {myInvoices.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No past orders found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When medicines are billed to your phone number (+91 {activeCustomer.mobileNumber}), your official receipts will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myInvoices.map(inv => (
                    <div
                      key={inv.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(inv.date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {inv.items.map((item, idx) => (
                            <span 
                              key={idx}
                              className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium"
                            >
                              {item.medicineName} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0">
                        <div className="text-left md:text-right">
                          <span className="text-base font-black text-slate-900 dark:text-white block">
                            ₹{inv.grandTotal.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">
                            {inv.paymentMode} • {inv.status}
                          </span>
                        </div>

                        <button
                          onClick={() => setActiveReceipt(inv)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-3">
              <User className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Login Required</h3>
              <p className="text-xs text-slate-500">
                Log in with your mobile number to view your private purchase history and prescriptions.
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

        {/* 8. CUSTOMER EXCLUSIVE: "My Dose Reminders" */}
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
                reminders={myReminders}
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

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around no-print shadow-lg">
        <button
          onClick={() => setCurrentTab('finder')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'finder' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Search className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Find</span>
        </button>

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
              <span className="text-[10px] mt-0.5">Orders</span>
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

      {/* Customer Online Order & Prescription Upload Modal */}
      <OnlineOrderModal
        isOpen={isOnlineOrderModalOpen}
        onClose={() => setIsOnlineOrderModalOpen(false)}
        session={session}
        onOrderSubmitted={(order) => {
          setSelectedNotificationOrder(order);
          setIsOrderNotificationOpen(true);
        }}
      />

      {/* Realtime Order Notification Popup (Alerts owner & customer) */}
      <OrderNotificationPopup
        order={selectedNotificationOrder}
        isOpen={isOrderNotificationOpen}
        onClose={() => setIsOrderNotificationOpen(false)}
        onAcceptAndBill={handleAcceptAndBillOrder}
      />

      {/* Complete User Manual Modal (Printable / Save as PDF) */}
      <UserManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />

      {/* Unified Auth Modal (Customer Mobile Login & Owner Admin Login) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialRole={authModalRole}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          if (newSession.role === 'owner') {
            setCurrentTab('pos');
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
