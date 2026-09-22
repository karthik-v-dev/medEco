import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, remove, onValue, Database } from 'firebase/database';
import { 
  Medicine, 
  Customer, 
  Invoice, 
  MedicineReminder, 
  PharmacyProfile, 
  UserSession, 
  OnlineOrder, 
  OrderStatus,
  PharmacyBranch,
  BranchStockItem,
  PendingStockConsignment,
  UserAccount,
  DeliveryZone
} from '../types';
// Real Pharmacy Profile fallback if database not yet initialized
export const DEFAULT_PHARMACY_PROFILE: PharmacyProfile = {
  name: "medEco Pharmacy & Wellness Hub",
  tagline: "Retail & Online Healthcare Solutions",
  address: "Shop #14, Chowrasta Circle, Main Road, Hanamkonda, Warangal, Telangana - 506001",
  phone: "+91 870 244 5566",
  email: "care@medeco-pharmacy.com",
  gstin: "36AABCM1234F1Z8",
  drugLicenseNo: "TS-WAR-2024-88741",
  fssaiNo: "13624005000214"
};

// User specified Firebase Realtime Database URL
export const FIREBASE_DB_URL = "https://mediaclinfo-default-rtdb.firebaseio.com";

// Real Firebase web configuration from MediaclInfo project
const firebaseConfig = {
  projectId: "mediaclinfo",
  appId: "1:379113395226:web:6beb02cffa45609a2a2da3",
  databaseURL: FIREBASE_DB_URL,
  storageBucket: "mediaclinfo.firebasestorage.app",
  apiKey: "AIzaSyBYpBnUbufkDuzYKk2BBffVhgxcdjD3J_I",
  authDomain: "mediaclinfo.firebaseapp.com",
  messagingSenderId: "379113395226",
  measurementId: "G-92S988XHCX",
  projectNumber: "379113395226"
};

// Initialize Firebase App singleton
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export let database: Database | null = null;
try {
  database = getDatabase(firebaseApp, FIREBASE_DB_URL);
} catch (err) {
  console.warn("Firebase Realtime Database init warning:", err);
}

// LocalStorage cache keys (v3 for pure Firebase Realtime Database live sync)
const STORAGE_KEYS = {
  MEDICINES: 'medeco_medicines_v3',
  CUSTOMERS: 'medeco_customers_v3',
  INVOICES: 'medeco_invoices_v3',
  REMINDERS: 'medeco_reminders_v3',
  PROFILE: 'medeco_profile_v3',
  ACTIVE_CUSTOMER: 'medeco_active_customer_phone_v3',
  ONLINE_ORDERS: 'medeco_online_orders_v3',
  BRANCHES: 'medeco_branches_v3',
  BRANCH_STOCKS: 'medeco_branch_stocks_v3',
  PENDING_CONSIGNMENTS: 'medeco_pending_consignments_v3',
  ACTIVE_BRANCH: 'medeco_active_branch_id_v3',
  USERS: 'medeco_users_v3'
};

// State listeners
type Listener = () => void;
const listeners: Set<Listener> = new Set();
export const subscribeToDataChanges = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const notifyListeners = () => {
  listeners.forEach(cb => cb());
};

// Local storage helpers
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading localStorage", e);
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error("Error writing localStorage", e);
  }
}

// Convert Firebase object map or array to array
function toArray<T>(val: any): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return Object.values(val);
}

// Initialize and sync directly with Firebase Realtime Database
export const initializeDataLayer = async () => {
  // Query all live real data directly from Firebase Realtime Database
  if (database) {
    try {
      const [
        profileSnap,
        branchesSnap,
        stocksSnap,
        medsSnap,
        custsSnap,
        invsSnap,
        ordersSnap,
        consignSnap,
        remsSnap,
        usersSnap
      ] = await Promise.all([
        get(ref(database, 'profile')),
        get(ref(database, 'branches')),
        get(ref(database, 'branch_stocks')),
        get(ref(database, 'medicines')),
        get(ref(database, 'customers')),
        get(ref(database, 'invoices')),
        get(ref(database, 'online_orders')),
        get(ref(database, 'pending_consignments')),
        get(ref(database, 'reminders')),
        get(ref(database, 'users'))
      ]);

      if (profileSnap.exists()) {
        setLocal(STORAGE_KEYS.PROFILE, profileSnap.val());
      } else if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
        setLocal(STORAGE_KEYS.PROFILE, DEFAULT_PHARMACY_PROFILE);
      }

      if (branchesSnap.exists()) {
        setLocal(STORAGE_KEYS.BRANCHES, toArray<PharmacyBranch>(branchesSnap.val()));
      }
      if (stocksSnap.exists()) {
        setLocal(STORAGE_KEYS.BRANCH_STOCKS, toArray<BranchStockItem>(stocksSnap.val()));
      }
      if (medsSnap.exists()) {
        setLocal(STORAGE_KEYS.MEDICINES, toArray<Medicine>(medsSnap.val()));
      }
      if (custsSnap.exists()) {
        setLocal(STORAGE_KEYS.CUSTOMERS, toArray<Customer>(custsSnap.val()));
      }
      if (invsSnap.exists()) {
        setLocal(STORAGE_KEYS.INVOICES, toArray<Invoice>(invsSnap.val()));
      }
      if (ordersSnap.exists()) {
        setLocal(STORAGE_KEYS.ONLINE_ORDERS, toArray<OnlineOrder>(ordersSnap.val()));
      }
      if (consignSnap.exists()) {
        setLocal(STORAGE_KEYS.PENDING_CONSIGNMENTS, toArray<PendingStockConsignment>(consignSnap.val()));
      }
      if (remsSnap.exists()) {
        setLocal(STORAGE_KEYS.REMINDERS, toArray<MedicineReminder>(remsSnap.val()));
      }
      if (usersSnap.exists()) {
        setLocal(STORAGE_KEYS.USERS, usersSnap.val());
      }
    } catch (e: any) {
      console.warn("Direct Firebase RTDB fetch note:", e?.message || e);
    }
  }

  // Setup Realtime Database synchronization listeners
  if (database) {
    try {
      // 1. Profile listener
      onValue(ref(database, 'profile'), (snapshot) => {
        if (snapshot.exists()) {
          setLocal(STORAGE_KEYS.PROFILE, snapshot.val());
        }
      });

      // 2. Branches listener
      onValue(ref(database, 'branches'), (snapshot) => {
        if (snapshot.exists()) {
          const branches = toArray<PharmacyBranch>(snapshot.val());
          if (branches.length > 0) {
            setLocal(STORAGE_KEYS.BRANCHES, branches);
          }
        }
      });

      // 3. Branch Stocks listener
      onValue(ref(database, 'branch_stocks'), (snapshot) => {
        if (snapshot.exists()) {
          const stocks = toArray<BranchStockItem>(snapshot.val());
          if (stocks.length > 0) {
            setLocal(STORAGE_KEYS.BRANCH_STOCKS, stocks);
          }
        }
      });

      // 4. Medicines listener
      onValue(ref(database, 'medicines'), (snapshot) => {
        if (snapshot.exists()) {
          const meds = toArray<Medicine>(snapshot.val());
          if (meds.length > 0) {
            setLocal(STORAGE_KEYS.MEDICINES, meds);
          }
        }
      });

      // 5. Customers listener
      onValue(ref(database, 'customers'), (snapshot) => {
        if (snapshot.exists()) {
          const custs = toArray<Customer>(snapshot.val());
          if (custs.length > 0) {
            setLocal(STORAGE_KEYS.CUSTOMERS, custs);
          }
        }
      });

      // 6. Invoices listener
      onValue(ref(database, 'invoices'), (snapshot) => {
        if (snapshot.exists()) {
          const invs = toArray<Invoice>(snapshot.val());
          if (invs.length > 0) {
            setLocal(STORAGE_KEYS.INVOICES, invs);
          }
        }
      });

      // 7. Online Orders listener
      onValue(ref(database, 'online_orders'), (snapshot) => {
        if (snapshot.exists()) {
          const orders = toArray<OnlineOrder>(snapshot.val());
          if (orders.length > 0) {
            setLocal(STORAGE_KEYS.ONLINE_ORDERS, orders);
          }
        }
      });

      // 8. Pending Consignments listener
      onValue(ref(database, 'pending_consignments'), (snapshot) => {
        if (snapshot.exists()) {
          const consignments = toArray<PendingStockConsignment>(snapshot.val());
          if (consignments.length > 0) {
            setLocal(STORAGE_KEYS.PENDING_CONSIGNMENTS, consignments);
          }
        }
      });

      // 9. Reminders listener
      onValue(ref(database, 'reminders'), (snapshot) => {
        if (snapshot.exists()) {
          const rems = toArray<MedicineReminder>(snapshot.val());
          if (rems.length > 0) {
            setLocal(STORAGE_KEYS.REMINDERS, rems);
          }
        }
      });

      // 10. Users accounts & PINs listener
      onValue(ref(database, 'users'), (snapshot) => {
        if (snapshot.exists()) {
          setLocal(STORAGE_KEYS.USERS, snapshot.val());
        }
      });

    } catch (e: any) {
      console.warn("Realtime Database listener setup note:", e?.message || e);
    }
  }
};

// ==================== REALTIME LOGIN & AUTHENTICATION (FIREBASE RTDB) ====================
export const loginCustomerRealtime = async (
  mobileNumber: string, 
  pin: string
): Promise<{ success: boolean; session?: UserSession; message?: string }> => {
  const clean = mobileNumber.replace(/\D/g, '');
  if (!clean || clean.length < 10) {
    return { success: false, message: 'Please enter a valid 10-digit mobile number' };
  }
  const enteredPin = pin.trim();
  if (!enteredPin) {
    return { success: false, message: 'Please enter your account security PIN' };
  }

  if (database) {
    try {
      const userRef = ref(database, `users/${clean}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const user = snap.val();
        if (!user.pin || String(user.pin).trim() !== enteredPin) {
          return { success: false, message: 'Incorrect PIN. Access denied.' };
        }

        // Fetch customer profile
        const custRef = ref(database, `customers/${clean}`);
        const custSnap = await get(custRef);
        const customer: Customer = custSnap.exists() ? custSnap.val() : {
          id: user.id || `cust-${clean}`,
          mobileNumber: clean,
          name: user.name || 'Patient',
          loyaltyPoints: user.loyaltyPoints || 50,
          createdAt: user.createdAt || new Date().toISOString()
        };

        // Update last login in RTDB
        await update(userRef, { lastLoginAt: new Date().toISOString() });

        const session: UserSession = { role: 'customer', customer };
        setActiveSession(session);
        setActiveCustomerPhone(clean);
        return { success: true, session };
      } else {
        return { success: false, message: 'Customer account not found. Please register first.' };
      }
    } catch (err: any) {
      console.warn("RTDB login error:", err?.message);
      return { success: false, message: 'Database connection error. Please try again.' };
    }
  }

  return { success: false, message: 'Database service unavailable. Access denied.' };
};

export const registerCustomerRealtime = async (
  name: string, 
  mobileNumber: string, 
  pin: string, 
  address?: string
): Promise<{ success: boolean; session?: UserSession; message?: string }> => {
  const clean = mobileNumber.replace(/\D/g, '');
  if (!name.trim()) {
    return { success: false, message: 'Please enter your name' };
  }
  if (!clean || clean.length < 10) {
    return { success: false, message: 'Please enter a valid 10-digit mobile number' };
  }
  const cleanPin = pin.trim();
  if (!cleanPin || cleanPin.length < 4) {
    return { success: false, message: 'Please set a secure 4-digit PIN for your account' };
  }

  const customerId = `cust-${Date.now()}`;
  const newCustomer: Customer = {
    id: customerId,
    mobileNumber: clean,
    name: name.trim(),
    address: address || 'Warangal, Telangana',
    loyaltyPoints: 50,
    createdAt: new Date().toISOString()
  };

  const userAccount: UserAccount = {
    id: customerId,
    role: 'customer',
    name: name.trim(),
    mobileNumber: clean,
    pin: cleanPin,
    loyaltyPoints: 50,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  await saveCustomer(newCustomer);

  if (database) {
    try {
      await set(ref(database, `users/${clean}`), userAccount);
      await set(ref(database, `customers/${clean}`), newCustomer);
    } catch (e: any) {
      console.warn("Realtime user account write note:", e?.message);
    }
  }

  const session: UserSession = { role: 'customer', customer: newCustomer };
  setActiveSession(session);
  setActiveCustomerPhone(clean);
  return { success: true, session };
};

export const loginOwnerRealtime = async (
  pin: string
): Promise<{ success: boolean; session?: UserSession; message?: string }> => {
  const enteredPin = pin.trim();
  if (!enteredPin) {
    return { success: false, message: 'Please enter your owner security PIN' };
  }

  if (database) {
    try {
      const ownerRef = ref(database, 'users/owner');
      const snap = await get(ownerRef);
      if (!snap.exists()) {
        return { success: false, message: 'Owner account is not configured in the Firebase database.' };
      }

      const ownerData = snap.val();
      // Strict authentication against database record only - no hardcoded values or bypasses
      if (!ownerData || !ownerData.pin || String(ownerData.pin).trim() !== enteredPin) {
        return { success: false, message: 'Invalid owner security PIN. Access denied.' };
      }

      await update(ownerRef, { lastLoginAt: new Date().toISOString() });
      const session: UserSession = { 
        role: 'owner', 
        ownerName: ownerData.name || 'Pharmacy Owner' 
      };
      setActiveSession(session);
      return { success: true, session };
    } catch (e: any) {
      console.warn("RTDB owner login error:", e?.message);
      return { success: false, message: 'Database communication error. Please check network connection.' };
    }
  }

  return { success: false, message: 'Database service unavailable. Access denied.' };
};

// ==================== MEDICINES ====================
export const getMedicines = (): Medicine[] => {
  return getLocal<Medicine[]>(STORAGE_KEYS.MEDICINES, []);
};

export const saveMedicine = async (med: Medicine): Promise<void> => {
  const current = getMedicines();
  const existingIdx = current.findIndex(m => m.id === med.id);
  let updated: Medicine[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...med, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...med, createdAt: new Date().toISOString() }, ...current];
  }
  setLocal(STORAGE_KEYS.MEDICINES, updated);

  // Sync to Firebase RTDB
  if (database) {
    try {
      const medRef = ref(database, `medicines/${med.id}`);
      await set(medRef, med);
    } catch (err: any) {
      console.warn("RTDB sync error (saved locally):", err?.message);
    }
  }
};

export const deleteMedicine = async (id: string): Promise<void> => {
  const current = getMedicines();
  const updated = current.filter(m => m.id !== id);
  setLocal(STORAGE_KEYS.MEDICINES, updated);

  if (database) {
    try {
      const medRef = ref(database, `medicines/${id}`);
      await remove(medRef);
    } catch (err: any) {
      console.warn("RTDB remove error:", err?.message);
    }
  }
};

export const updateStock = async (medicineId: string, quantityDeducted: number): Promise<void> => {
  const current = getMedicines();
  const index = current.findIndex(m => m.id === medicineId);
  if (index >= 0) {
    const med = current[index];
    const newStock = Math.max(0, med.stock - quantityDeducted);
    const updatedMed = { ...med, stock: newStock, updatedAt: new Date().toISOString() };
    current[index] = updatedMed;
    setLocal(STORAGE_KEYS.MEDICINES, current);

    if (database) {
      try {
        const medRef = ref(database, `medicines/${medicineId}/stock`);
        await set(medRef, newStock);
      } catch (e) {
        // ignore
      }
    }
  }
};

// ==================== INVOICES ====================
export const getInvoices = (): Invoice[] => {
  return getLocal<Invoice[]>(STORAGE_KEYS.INVOICES, []);
};

export const saveInvoice = async (invoice: Invoice): Promise<void> => {
  const current = getInvoices();
  const updated = [invoice, ...current];
  setLocal(STORAGE_KEYS.INVOICES, updated);

  // Deduct medicine stock for all purchased items
  for (const item of invoice.items) {
    await updateStock(item.medicineId, item.quantity);
  }

  // Update or register customer record based on mobile
  await upsertCustomerFromInvoice(invoice);

  // Sync to Firebase RTDB
  if (database) {
    try {
      const invRef = ref(database, `invoices/${invoice.id}`);
      await set(invRef, invoice);
    } catch (err: any) {
      console.warn("RTDB invoice sync note:", err?.message);
    }
  }
};

export const getCustomerInvoices = (mobileNumber: string): Invoice[] => {
  const cleanPhone = mobileNumber.replace(/\D/g, '');
  const invoices = getInvoices();
  return invoices.filter(inv => inv.customerMobile.replace(/\D/g, '') === cleanPhone);
};

// ==================== CUSTOMERS ("One Customer, One Account") ====================
export const getCustomers = (): Customer[] => {
  return getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
};

export const getCustomerByMobile = (mobile: string): Customer | undefined => {
  const clean = mobile.replace(/\D/g, '');
  const customers = getCustomers();
  return customers.find(c => c.mobileNumber.replace(/\D/g, '') === clean);
};

export const saveCustomer = async (cust: Customer): Promise<void> => {
  const current = getCustomers();
  const clean = cust.mobileNumber.replace(/\D/g, '');
  const idx = current.findIndex(c => c.mobileNumber.replace(/\D/g, '') === clean);
  let updated: Customer[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = cust;
  } else {
    updated = [cust, ...current];
  }
  setLocal(STORAGE_KEYS.CUSTOMERS, updated);

  if (database) {
    try {
      const custRef = ref(database, `customers/${clean}`);
      await set(custRef, cust);
    } catch (e: any) {
      console.warn("RTDB customer sync note:", e?.message);
    }
  }
};

const upsertCustomerFromInvoice = async (invoice: Invoice) => {
  const clean = invoice.customerMobile.replace(/\D/g, '');
  if (!clean) return;
  const existing = getCustomerByMobile(clean);
  const earnedPoints = Math.floor(invoice.grandTotal / 10);
  if (existing) {
    const updated: Customer = {
      ...existing,
      name: invoice.customerName || existing.name,
      loyaltyPoints: (existing.loyaltyPoints || 0) + earnedPoints
    };
    await saveCustomer(updated);
  } else {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      mobileNumber: clean,
      name: invoice.customerName || `Customer ${clean.slice(-4)}`,
      loyaltyPoints: earnedPoints,
      createdAt: new Date().toISOString()
    };
    await saveCustomer(newCustomer);
  }
};

// Session state for owner & customer
const SESSION_KEY = 'medeco_user_session_v3';

export const getActiveSession = (): UserSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const setActiveSession = (session: UserSession | null) => {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (session.customer) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CUSTOMER, session.customer.mobileNumber);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CUSTOMER);
    }
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CUSTOMER);
  }
  notifyListeners();
};

export const getActiveCustomerPhone = (): string | null => {
  const session = getActiveSession();
  if (session?.role === 'customer' && session.customer) {
    return session.customer.mobileNumber;
  }
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CUSTOMER);
};

export const setActiveCustomerPhone = (phone: string | null) => {
  if (phone) {
    const clean = phone.replace(/\D/g, '');
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CUSTOMER, clean);
    const cust = getCustomerByMobile(clean);
    if (cust) {
      setActiveSession({
        role: 'customer',
        customer: cust
      });
    }
  } else {
    setActiveSession(null);
  }
  notifyListeners();
};

// Customer metrics for owner view with branch & PIN access
export interface CustomerWithMetrics extends Customer {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  activeRemindersCount: number;
  pin?: string;
  primaryBranchId?: string;
  primaryBranchName?: string;
  primaryBranchPhone?: string;
}

export const getUserAccounts = (): Record<string, any> => {
  return getLocal<Record<string, any>>(STORAGE_KEYS.USERS, {});
};

export const getCustomerPin = (mobileNumber: string): string | null => {
  const clean = mobileNumber.replace(/\D/g, '');
  const users = getUserAccounts();
  if (users[clean] && users[clean].pin) {
    return users[clean].pin;
  }
  return null;
};

export const updateCustomerPinRealtime = async (
  mobileNumber: string, 
  newPin: string
): Promise<{ success: boolean; message?: string }> => {
  const clean = mobileNumber.replace(/\D/g, '');
  if (!clean || clean.length < 10) {
    return { success: false, message: 'Invalid mobile number' };
  }
  const cleanPin = newPin.trim();
  if (!cleanPin || cleanPin.length < 4) {
    return { success: false, message: 'Security PIN must be at least 4 digits' };
  }

  const users = getUserAccounts();
  const existingUser = users[clean] || {};
  const updatedUser = {
    ...existingUser,
    mobileNumber: clean,
    pin: cleanPin,
    role: 'customer',
    pinUpdatedAt: new Date().toISOString()
  };

  users[clean] = updatedUser;
  setLocal(STORAGE_KEYS.USERS, users);

  if (database) {
    try {
      const userRef = ref(database, `users/${clean}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        await update(userRef, { pin: cleanPin, pinUpdatedAt: new Date().toISOString() });
      } else {
        await set(userRef, updatedUser);
      }
    } catch (e: any) {
      console.warn("RTDB update customer PIN note:", e);
    }
  }

  notifyListeners();
  return { success: true, message: `PIN updated successfully to ${cleanPin} for patient +91 ${clean}` };
};

export const updateCustomerBranchRealtime = async (
  mobileNumber: string, 
  branchId: string
): Promise<{ success: boolean; message?: string }> => {
  const clean = mobileNumber.replace(/\D/g, '');
  const customers = getCustomers();
  const idx = customers.findIndex(c => c.mobileNumber.replace(/\D/g, '') === clean);
  if (idx >= 0) {
    customers[idx] = { ...customers[idx], preferredBranchId: branchId };
    setLocal(STORAGE_KEYS.CUSTOMERS, customers);
  }
  if (database) {
    try {
      await update(ref(database, `customers/${clean}`), { preferredBranchId: branchId });
    } catch (e: any) {
      console.warn("RTDB update customer branch note:", e?.message);
    }
  }
  notifyListeners();
  return { success: true, message: 'Customer primary store branch updated successfully' };
};

export const getAllCustomersWithMetrics = (): CustomerWithMetrics[] => {
  const customers = getCustomers();
  const invoices = getInvoices();
  const reminders = getReminders();
  const users = getUserAccounts();
  const orders = getOnlineOrders();
  const branches = getPharmacyBranches();

  return customers.map(cust => {
    const cleanPhone = cust.mobileNumber.replace(/\D/g, '');
    const custInvoices = invoices.filter(inv => inv.customerMobile.replace(/\D/g, '') === cleanPhone);
    const custReminders = reminders.filter(r => r.customerMobile.replace(/\D/g, '') === cleanPhone);
    const custOrders = orders.filter(o => o.customerMobile.replace(/\D/g, '') === cleanPhone);

    const totalSpent = custInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
    const lastOrder = custInvoices.length > 0 ? custInvoices[0].date : undefined;

    // Associated branch from preferredBranchId, order, invoice, or default
    const primaryBranchId = cust.preferredBranchId || custOrders[0]?.pharmacyId || custInvoices[0]?.branchId || 'pharm-hanamkonda';
    const branchObj = branches.find(b => b.id === primaryBranchId) || branches[0];
    const primaryBranchName = branchObj ? branchObj.name : 'medEco Pharmacy - Hanamkonda Chowrasta';
    const primaryBranchPhone = branchObj ? branchObj.phone : '+91 870 244 5566';
    const pin = users[cleanPhone]?.pin;

    return {
      ...cust,
      totalOrders: custInvoices.length,
      totalSpent,
      lastOrderDate: lastOrder,
      activeRemindersCount: custReminders.filter(r => r.isActive).length,
      pin,
      primaryBranchId,
      primaryBranchName,
      primaryBranchPhone
    };
  });
};

// ==================== MEDICINE REMINDERS ====================
export const getReminders = (): MedicineReminder[] => {
  return getLocal<MedicineReminder[]>(STORAGE_KEYS.REMINDERS, []);
};

export const getCustomerReminders = (mobile: string): MedicineReminder[] => {
  const clean = mobile.replace(/\D/g, '');
  const all = getReminders();
  return all.filter(r => r.customerMobile.replace(/\D/g, '') === clean);
};

export const saveReminder = async (reminder: MedicineReminder): Promise<void> => {
  const current = getReminders();
  const idx = current.findIndex(r => r.id === reminder.id);
  let updated: MedicineReminder[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = reminder;
  } else {
    updated = [reminder, ...current];
  }
  setLocal(STORAGE_KEYS.REMINDERS, updated);

  if (database) {
    try {
      const remRef = ref(database, `reminders/${reminder.id}`);
      await set(remRef, reminder);
    } catch (e: any) {
      console.warn("RTDB reminder sync note:", e?.message);
    }
  }
};

export const deleteReminder = async (id: string): Promise<void> => {
  const current = getReminders();
  const updated = current.filter(r => r.id !== id);
  setLocal(STORAGE_KEYS.REMINDERS, updated);

  if (database) {
    try {
      const remRef = ref(database, `reminders/${id}`);
      await remove(remRef);
    } catch (e: any) {
      console.warn("RTDB reminder remove error:", e?.message);
    }
  }
};

export const toggleDoseTaken = async (
  reminderId: string, 
  dateStr: string, 
  timing: 'Morning' | 'Afternoon' | 'Evening' | 'Night'
): Promise<void> => {
  const current = getReminders();
  const reminder = current.find(r => r.id === reminderId);
  if (!reminder) return;

  const history = reminder.takenHistory || {};
  const dayRecord = history[dateStr] || {};
  const currentStatus = !!dayRecord[timing];
  const newStatus = !currentStatus;

  const updatedReminder: MedicineReminder = {
    ...reminder,
    lastTakenDate: newStatus ? dateStr : reminder.lastTakenDate,
    takenHistory: {
      ...history,
      [dateStr]: {
        ...dayRecord,
        [timing]: newStatus
      }
    }
  };

  await saveReminder(updatedReminder);
};

// ==================== PHARMACY PROFILE ====================
export const getPharmacyProfile = (): PharmacyProfile => {
  return getLocal<PharmacyProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PHARMACY_PROFILE);
};

export const savePharmacyProfile = async (profile: PharmacyProfile): Promise<void> => {
  setLocal(STORAGE_KEYS.PROFILE, profile);
  if (database) {
    try {
      await set(ref(database, 'profile'), profile);
    } catch (e) {}
  }
};

// ==================== MULTI-STORE PHARMACY BRANCHES ====================
export const getPharmacyBranches = (): PharmacyBranch[] => {
  return getLocal<PharmacyBranch[]>(STORAGE_KEYS.BRANCHES, []);
};

export const getBranchById = (branchId: string): PharmacyBranch | undefined => {
  const branches = getPharmacyBranches();
  return branches.find(b => b.id === branchId);
};

export const savePharmacyBranch = async (branch: PharmacyBranch): Promise<void> => {
  const current = getPharmacyBranches();
  const idx = current.findIndex(b => b.id === branch.id);
  let updated: PharmacyBranch[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = branch;
  } else {
    updated = [...current, branch];
  }
  setLocal(STORAGE_KEYS.BRANCHES, updated);

  if (database) {
    try {
      const branchRef = ref(database, `branches/${branch.id}`);
      await set(branchRef, branch);
    } catch (e) {
      console.warn("RTDB branch save note:", e);
    }
  }
};

export const getActiveBranchId = (): string => {
  const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_BRANCH);
  return saved || 'pharm-hanamkonda';
};

export const setActiveBranchId = (branchId: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_BRANCH, branchId);
  notifyListeners();
};

// ==================== BRANCH STOCK INVENTORY ====================
export const getBranchStocks = (branchId?: string): BranchStockItem[] => {
  const all = getLocal<BranchStockItem[]>(STORAGE_KEYS.BRANCH_STOCKS, []);
  if (branchId && branchId !== 'ALL') {
    return all.filter(s => s.branchId === branchId);
  }
  return all;
};

export const updateBranchStock = async (branchId: string, medicineId: string, newStock: number): Promise<void> => {
  const all = getLocal<BranchStockItem[]>(STORAGE_KEYS.BRANCH_STOCKS, []);
  const idx = all.findIndex(s => s.branchId === branchId && s.medicineId === medicineId);
  let updated: BranchStockItem[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = { ...updated[idx], stock: Math.max(0, newStock), lastUpdated: new Date().toISOString() };
  } else {
    updated = [...all, { branchId, medicineId, stock: Math.max(0, newStock), minStockAlert: 10, lastUpdated: new Date().toISOString() }];
  }
  setLocal(STORAGE_KEYS.BRANCH_STOCKS, updated);

  if (database) {
    try {
      const stockRef = ref(database, `branch_stocks/${branchId}_${medicineId}`);
      await set(stockRef, { branchId, medicineId, stock: Math.max(0, newStock), minStockAlert: 10, lastUpdated: new Date().toISOString() });
    } catch (e) {
      // ignore
    }
  }
};

export const restockBranchMedicine = async (branchId: string, medicineId: string, addedUnits: number): Promise<void> => {
  const allStocks = getBranchStocks();
  const stockItem = allStocks.find(s => s.branchId === branchId && s.medicineId === medicineId);
  const currentStock = stockItem ? stockItem.stock : 0;
  const newStock = currentStock + addedUnits;
  await updateBranchStock(branchId, medicineId, newStock);
};

// ==================== PENDING STOCK CONSIGNMENTS ====================
export const getPendingStockConsignments = (branchId?: string): PendingStockConsignment[] => {
  const all = getLocal<PendingStockConsignment[]>(STORAGE_KEYS.PENDING_CONSIGNMENTS, []);
  if (!branchId || branchId === 'ALL') return all;
  return all.filter(c => c.branchId === branchId);
};

export const addPendingStockConsignment = async (consignment: PendingStockConsignment): Promise<void> => {
  const current = getLocal<PendingStockConsignment[]>(STORAGE_KEYS.PENDING_CONSIGNMENTS, []);
  const updated = [consignment, ...current];
  setLocal(STORAGE_KEYS.PENDING_CONSIGNMENTS, updated);

  if (database) {
    try {
      await set(ref(database, `pending_consignments/${consignment.id}`), consignment);
    } catch (e) {}
  }
};

export const checkInPendingStock = async (consignmentId: string): Promise<void> => {
  const consignments = getLocal<PendingStockConsignment[]>(STORAGE_KEYS.PENDING_CONSIGNMENTS, []);
  const idx = consignments.findIndex(c => c.id === consignmentId);
  if (idx >= 0) {
    const consignment = { ...consignments[idx], status: 'CHECKED_IN' as const };
    consignments[idx] = consignment;
    setLocal(STORAGE_KEYS.PENDING_CONSIGNMENTS, [...consignments]);

    // Automatically add incoming items to the corresponding branch stock in RTDB
    for (const item of consignment.items) {
      await restockBranchMedicine(consignment.branchId, item.medicineId, item.orderedQuantity);
    }

    if (database) {
      try {
        await update(ref(database, `pending_consignments/${consignmentId}`), { status: 'CHECKED_IN' });
      } catch (e) {}
    }
  }
};

// Haversine formula to compute great-circle distance in kilometers
export const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
};

export interface NearestBranch extends PharmacyBranch {
  distanceKm: number;
}

export const getNearestBranches = (userLat: number, userLng: number): NearestBranch[] => {
  const branches = getPharmacyBranches().filter(b => b.isActive);
  const withDist = branches.map(b => ({
    ...b,
    distanceKm: calculateDistanceKm(userLat, userLng, b.coordinates.latitude, b.coordinates.longitude)
  }));
  return withDist.sort((a, b) => a.distanceKm - b.distanceKm);
};

// ==================== WARANGAL DELIVERY ZONES & 8 KM RADIUS ENABLING ====================
export const WARANGAL_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "zone-hanamkonda",
    name: "Hanamkonda Central / Chowrasta",
    area: "Hanamkonda",
    pincode: "506001",
    coordinates: { latitude: 18.0125, longitude: 79.5539 },
    popularLandmarks: "Public Gardens, Kakatiya University X Road, Bus Station"
  },
  {
    id: "zone-nayeemnagar",
    name: "Nayeemnagar / Kakatiya University",
    area: "Nayeemnagar",
    pincode: "506009",
    coordinates: { latitude: 18.0267, longitude: 79.5582 },
    popularLandmarks: "100 Feet Road, Chaitanya Junction, KU Campus Gate"
  },
  {
    id: "zone-subedari",
    name: "Subedari / Collector Office",
    area: "Subedari",
    pincode: "506001",
    coordinates: { latitude: 18.0052, longitude: 79.5694 },
    popularLandmarks: "District Court, Collectorate Complex, University Road"
  },
  {
    id: "zone-kazipet",
    name: "Kazipet / Railway Junction & Colony",
    area: "Kazipet",
    pincode: "506003",
    coordinates: { latitude: 17.9814, longitude: 79.5165 },
    popularLandmarks: "Railway Junction, Diesel Colony, Overbridge"
  },
  {
    id: "zone-mgm",
    name: "MGM Hospital / Warangal Station Road",
    area: "Warangal City",
    pincode: "506002",
    coordinates: { latitude: 17.9942, longitude: 79.5960 },
    popularLandmarks: "Kakatiya Medical College, MGM Circle, Railway Station"
  },
  {
    id: "zone-nakkalagutta",
    name: "Nakkalagutta / Balasamudram",
    area: "Hanamkonda",
    pincode: "506001",
    coordinates: { latitude: 18.0080, longitude: 79.5620 },
    popularLandmarks: "Kakatiya Degree College, Balasamudram Temple, Petrol Bunk"
  },
  {
    id: "zone-hunter",
    name: "Hunter Road / Waddepally",
    area: "Hunter Road",
    pincode: "506001",
    coordinates: { latitude: 17.9890, longitude: 79.5480 },
    popularLandmarks: "Waddepally Lake, Arts College Road, Shyampet"
  },
  {
    id: "zone-madikonda",
    name: "Madikonda / Kazipet Outskirts",
    area: "Kazipet Outskirts",
    pincode: "506142",
    coordinates: { latitude: 17.9420, longitude: 79.4680 },
    popularLandmarks: "Madikonda Temple, Hyderabad Highway Toll Plaza"
  },
  {
    id: "zone-fort",
    name: "Warangal Fort / Ursu Gutta",
    area: "South Warangal",
    pincode: "506005",
    coordinates: { latitude: 17.9550, longitude: 79.6250 },
    popularLandmarks: "Warangal Fort Gates, Ursu Gutta, Rangampet"
  },
  {
    id: "zone-bollikunta",
    name: "Bollikunta / Hasanparthy Outskirts",
    area: "North Warangal",
    pincode: "506371",
    coordinates: { latitude: 18.0750, longitude: 79.5450 },
    popularLandmarks: "Vagdevi Colleges, Hasanparthy Lake, Bheemaram X Road"
  }
];

export interface StoreRadiusEvaluation extends PharmacyBranch {
  distanceKm: number;
  isEligible: boolean; // true if distanceKm <= maxRadiusKm (standard 8 km)
}

export const getStoresWithRadiusEvaluation = (lat: number, lng: number, maxRadiusKm = 8.0): StoreRadiusEvaluation[] => {
  const branches = getPharmacyBranches().filter(b => b.isActive);
  return branches.map(b => {
    const dist = calculateDistanceKm(lat, lng, b.coordinates.latitude, b.coordinates.longitude);
    return {
      ...b,
      distanceKm: dist,
      isEligible: dist <= maxRadiusKm
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
};

export const updateCustomerLocationRealtime = async (
  mobileNumber: string,
  locationData: {
    zone?: string;
    doorNumber?: string;
    address?: string;
    landmark?: string;
    pincode?: string;
    geoCoordinates?: {
      latitude: number;
      longitude: number;
    };
    preferredBranchId?: string;
  }
): Promise<Customer | null> => {
  const clean = mobileNumber.replace(/\D/g, '');
  const customers = getCustomers();
  const idx = customers.findIndex(c => c.mobileNumber.replace(/\D/g, '') === clean);
  if (idx < 0) return null;

  const updated: Customer = {
    ...customers[idx],
    ...locationData,
    address: locationData.address || customers[idx].address
  };
  customers[idx] = updated;
  setLocal(STORAGE_KEYS.CUSTOMERS, customers);

  // Update session customer if currently logged in
  const currentSession = getActiveSession();
  if (currentSession && currentSession.customer && currentSession.customer.mobileNumber.replace(/\D/g, '') === clean) {
    setActiveSession({
      ...currentSession,
      customer: updated
    });
  }

  if (database) {
    try {
      await update(ref(database, `customers/${clean}`), {
        ...locationData,
        updatedAt: new Date().toISOString()
      });
      await update(ref(database, `users/${clean}`), {
        address: updated.address || '',
        zone: updated.zone || '',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("RTDB location update note:", e);
    }
  }

  notifyListeners();
  return updated;
};

// ==================== ONLINE ORDERS & PRESCRIPTIONS (BRANCH ROUTED) ====================
export const getOnlineOrders = (): OnlineOrder[] => {
  return getLocal<OnlineOrder[]>(STORAGE_KEYS.ONLINE_ORDERS, []);
};

export const getOrdersForBranch = (branchId?: string): OnlineOrder[] => {
  const orders = getOnlineOrders();
  if (!branchId || branchId === 'ALL') {
    return orders;
  }
  return orders.filter(o => o.pharmacyId === branchId);
};

export const getCustomerOnlineOrders = (customerMobile: string): OnlineOrder[] => {
  const clean = customerMobile.replace(/\D/g, '');
  const orders = getOnlineOrders();
  return orders.filter(o => o.customerMobile.replace(/\D/g, '') === clean);
};

export const saveOnlineOrder = async (order: OnlineOrder): Promise<void> => {
  const current = getOnlineOrders();
  const updated = [order, ...current];
  setLocal(STORAGE_KEYS.ONLINE_ORDERS, updated);

  // Sync to Firebase RTDB
  if (database) {
    try {
      const orderRef = ref(database, `online_orders/${order.id}`);
      await set(orderRef, order);
    } catch (e: any) {
      console.warn("RTDB online order sync note:", e?.message);
    }
  }

  // Play audible notification chime for pharmacy staff
  playNotificationChime();

  // Dispatch custom browser event for live order popup notification
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('medeco:new-online-order', { 
      detail: { ...order, assignedPharmacyId: order.pharmacyId } 
    }));
  }
};

// Standard Online Pharmacy Order Status Advancement
export const advanceOrderStatus = async (
  orderId: string, 
  nextStatus: OrderStatus, 
  note?: string
): Promise<void> => {
  const current = getOnlineOrders();
  const index = current.findIndex(o => o.id === orderId);
  if (index >= 0) {
    const order = current[index];
    const now = new Date().toISOString();
    const updatedOrder: OnlineOrder = {
      ...order,
      status: nextStatus,
      notes: note ? (order.notes ? `${order.notes} | ${note}` : note) : order.notes,
      verifiedAt: nextStatus === 'VERIFIED' ? now : order.verifiedAt,
      packedAt: nextStatus === 'PACKED' ? now : order.packedAt,
      dispatchedAt: nextStatus === 'OUT_FOR_DELIVERY' ? now : order.dispatchedAt,
      deliveredAt: nextStatus === 'DELIVERED' ? now : order.deliveredAt,
    };

    current[index] = updatedOrder;
    setLocal(STORAGE_KEYS.ONLINE_ORDERS, [...current]);

    if (database) {
      try {
        const orderRef = ref(database, `online_orders/${orderId}`);
        await set(orderRef, updatedOrder);
      } catch (e) {
        // ignore
      }
    }
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  await advanceOrderStatus(orderId, status);
};

export const getPendingOnlineOrders = (branchId?: string): OnlineOrder[] => {
  const orders = getOrdersForBranch(branchId);
  return orders.filter(o => o.status === 'PENDING');
};

// Notification Sound using Web Audio API
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone bell melody (880Hz -> 1320Hz)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.55);
  } catch (e) {
    // ignore
  }
};
