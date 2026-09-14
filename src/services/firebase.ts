import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, remove, onValue, Database } from 'firebase/database';
import { Medicine, Customer, Invoice, MedicineReminder, PharmacyProfile, UserSession, OnlineOrder, OrderStatus } from '../types';
import {
  DEFAULT_PHARMACY_PROFILE,
  INITIAL_MEDICINES,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_REMINDERS,
  INITIAL_ONLINE_ORDERS
} from './mockData';

// User specified Firebase Realtime Database URL
export const FIREBASE_DB_URL = "https://mediaclinfo-default-rtdb.firebaseio.com/";

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForRTDBAccessOnly12345678",
  authDomain: "mediaclinfo-default-rtdb.firebaseapp.com",
  databaseURL: FIREBASE_DB_URL,
  projectId: "mediaclinfo",
  storageBucket: "mediaclinfo.appspot.com",
  messagingSenderId: "100000000000",
  appId: "1:100000000000:web:abcdef1234567890"
};

// Initialize Firebase App singleton
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export let database: Database | null = null;
try {
  database = getDatabase(firebaseApp, FIREBASE_DB_URL);
} catch (err) {
  console.warn("Firebase Realtime Database init warning:", err);
}

// LocalStorage cache keys
const STORAGE_KEYS = {
  MEDICINES: 'medeco_medicines_v1',
  CUSTOMERS: 'medeco_customers_v1',
  INVOICES: 'medeco_invoices_v1',
  REMINDERS: 'medeco_reminders_v1',
  PROFILE: 'medeco_profile_v1',
  ACTIVE_CUSTOMER: 'medeco_active_customer_phone',
  ONLINE_ORDERS: 'medeco_online_orders_v1'
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

// Initialize local defaults if empty
export const initializeDataLayer = async () => {
  if (!localStorage.getItem(STORAGE_KEYS.MEDICINES)) {
    setLocal(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    setLocal(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
    setLocal(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.REMINDERS)) {
    setLocal(STORAGE_KEYS.REMINDERS, INITIAL_REMINDERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
    setLocal(STORAGE_KEYS.PROFILE, DEFAULT_PHARMACY_PROFILE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ONLINE_ORDERS)) {
    setLocal(STORAGE_KEYS.ONLINE_ORDERS, INITIAL_ONLINE_ORDERS);
  }

  // Attempt initial sync with Firebase Realtime Database
  if (database) {
    try {
      const medRef = ref(database, 'medicines');
      const snapshot = await get(medRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        const firebaseMeds = Array.isArray(val) ? val : Object.values(val);
        if (firebaseMeds && firebaseMeds.length > 0) {
          setLocal(STORAGE_KEYS.MEDICINES, firebaseMeds);
        }
      } else {
        // Seed Firebase with initial inventory if remote is empty
        const initialMap: Record<string, Medicine> = {};
        INITIAL_MEDICINES.forEach(m => { initialMap[m.id] = m; });
        set(medRef, initialMap).catch(e => console.log("Firebase seed note:", e.message));
      }
    } catch (e: any) {
      console.log("Firebase remote sync note (local fallback active):", e?.message || e);
    }
  }
};

// ==================== MEDICINES ====================
export const getMedicines = (): Medicine[] => {
  return getLocal<Medicine[]>(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
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
  return getLocal<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
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
  return getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
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
const SESSION_KEY = 'medeco_user_session_v2';

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

export const loginOwner = (passwordOrPin: string): boolean => {
  // Support owner password 'admin123' or owner PIN '9999' or 'owner'
  const validSecrets = ['admin123', '9999', 'owner', 'admin'];
  if (validSecrets.includes(passwordOrPin.trim())) {
    setActiveSession({
      role: 'owner',
      ownerName: 'Pharmacy Owner / Manager'
    });
    return true;
  }
  return false;
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

// Customer metrics for owner view
export interface CustomerWithMetrics extends Customer {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  activeRemindersCount: number;
}

export const getAllCustomersWithMetrics = (): CustomerWithMetrics[] => {
  const customers = getCustomers();
  const invoices = getInvoices();
  const reminders = getReminders();

  return customers.map(cust => {
    const cleanPhone = cust.mobileNumber.replace(/\D/g, '');
    const custInvoices = invoices.filter(inv => inv.customerMobile.replace(/\D/g, '') === cleanPhone);
    const custReminders = reminders.filter(r => r.customerMobile.replace(/\D/g, '') === cleanPhone);

    const totalSpent = custInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
    const lastOrder = custInvoices.length > 0 ? custInvoices[0].date : undefined;

    return {
      ...cust,
      totalOrders: custInvoices.length,
      totalSpent,
      lastOrderDate: lastOrder,
      activeRemindersCount: custReminders.filter(r => r.isActive).length
    };
  });
};

// ==================== MEDICINE REMINDERS ====================
export const getReminders = (): MedicineReminder[] => {
  return getLocal<MedicineReminder[]>(STORAGE_KEYS.REMINDERS, INITIAL_REMINDERS);
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

export const savePharmacyProfile = (profile: PharmacyProfile) => {
  setLocal(STORAGE_KEYS.PROFILE, profile);
};

// ==================== ONLINE ORDERS & PRESCRIPTIONS ====================
export const getOnlineOrders = (): OnlineOrder[] => {
  return getLocal<OnlineOrder[]>(STORAGE_KEYS.ONLINE_ORDERS, INITIAL_ONLINE_ORDERS);
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
    window.dispatchEvent(new CustomEvent('medeco:new-online-order', { detail: order }));
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  const current = getOnlineOrders();
  const index = current.findIndex(o => o.id === orderId);
  if (index >= 0) {
    current[index] = { ...current[index], status };
    setLocal(STORAGE_KEYS.ONLINE_ORDERS, [...current]);

    if (database) {
      try {
        const statusRef = ref(database, `online_orders/${orderId}/status`);
        await set(statusRef, status);
      } catch (e) {
        // ignore
      }
    }
  }
};

export const getPendingOnlineOrders = (): OnlineOrder[] => {
  return getOnlineOrders().filter(o => o.status === 'PENDING');
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
    // browser audio policy might block autoplay until user gesture
  }
};

