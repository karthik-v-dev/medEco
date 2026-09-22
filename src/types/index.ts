export type UserRole = 'owner' | 'customer' | 'guest';

export interface UserAccount {
  id: string;
  role: 'owner' | 'customer';
  mobileNumber: string;
  name: string;
  email?: string;
  pin?: string;
  loyaltyPoints?: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserSession {
  role: 'owner' | 'customer';
  ownerName?: string;
  customer?: Customer;
  activeBranchId?: string; // e.g. "pharm-hanamkonda" or undefined for all
}


export type MedicineCategory = 
  | 'Tablets' 
  | 'Syrups' 
  | 'Capsules' 
  | 'Injections' 
  | 'Ointments' 
  | 'Drops' 
  | 'Inhalers' 
  | 'Supplements';

export interface RackLocation {
  rackId: string;       // e.g. "Rack A", "Rack B", "Rack C", "Cold Storage"
  shelfNumber: number;  // e.g. 1, 2, 3, 4
  boxNumber?: string;   // e.g. "Box-04", "Bin-12"
  description?: string; // e.g. "Top row, left compartment"
  temperatureNote?: string; // e.g. "2°C - 8°C Refrigerated" or "Store below 25°C"
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: MedicineCategory;
  dosage: string;         // e.g. "500 mg", "10 ml", "100 mcg"
  stripSize: string;      // e.g. "10 tablets/strip", "100 ml bottle"
  unitPrice: number;      // Selling Price (MRP) per unit/strip
  costPrice: number;      // Purchase cost
  stock: number;          // Available units
  minStockAlert: number;  // Threshold for low stock alert
  batchNumber: string;    // e.g. "BAT-2024-99"
  expiryDate: string;     // YYYY-MM-DD
  gstRate: number;        // e.g. 5, 12, 18 percent
  hsnCode?: string;       // e.g. "3004"
  rackLocation: RackLocation;
  requiresPrescription: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
  unitPrice: number;
  total: number;
  selectedDosageInstructions?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  area: string;
  pincode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  popularLandmarks: string;
}

export interface Customer {
  id: string;
  mobileNumber: string;   // Primary identifier: "One customer one account based on mobile number"
  name: string;
  email?: string;
  address?: string;
  doorNumber?: string;
  landmark?: string;
  zone?: string;
  pincode?: string;
  geoCoordinates?: {
    latitude: number;
    longitude: number;
  };
  allergies?: string[];
  loyaltyPoints?: number;
  createdAt: string;
  preferredBranchId?: string;
}

export interface InvoiceItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  rackInfo: string;      // Recorded so customer/staff knows where it came from
  quantity: number;
  unitPrice: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  dosageInstruction?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;  // e.g. "MED-2026-0042"
  date: string;           // ISO format
  customerMobile: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit';
  status: 'PAID' | 'REFUNDED' | 'CANCELLED';
  pharmacyGstin?: string;
  branchId?: string;
  doctorName?: string;
  notes?: string;
}

export interface PendingStockConsignment {
  id: string;
  consignmentNumber: string; // e.g. "CON-WGL-901"
  branchId: string;
  branchName: string;
  supplierName: string;
  items: {
    medicineId: string;
    medicineName: string;
    orderedQuantity: number;
    unitCost: number;
  }[];
  totalUnits: number;
  totalCost: number;
  expectedDate: string; // YYYY-MM-DD
  status: 'IN_TRANSIT' | 'DISPATCHED' | 'ARRIVED_AWAITING_CHECKIN' | 'CHECKED_IN';
  orderedDate: string;
  notes?: string;
}


export type DoseTiming = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
export type MealRelation = 'Before Food' | 'After Food' | 'With Food' | 'Empty Stomach';

export interface MedicineReminder {
  id: string;
  customerMobile: string; // Linked to customer phone
  medicineName: string;
  dosage: string;         // e.g. "1 tablet"
  timings: DoseTiming[];  // e.g. ['Morning', 'Night']
  customTime?: string;    // e.g. "08:00 AM"
  mealRelation: MealRelation;
  startDate: string;      // YYYY-MM-DD
  endDate?: string;       // YYYY-MM-DD or undefined for daily maintenance
  isActive: boolean;
  notes?: string;
  lastTakenDate?: string; // YYYY-MM-DD
  takenHistory?: { [dateString: string]: { [timing in DoseTiming]?: boolean } };
}

export interface PharmacyProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  drugLicenseNo: string;
  fssaiNo?: string;
}

export interface PharmacyBranch {
  id: string;              // e.g. "pharm-hanamkonda"
  name: string;            // e.g. "medEco Pharmacy - Hanamkonda Chowrasta"
  code: string;            // e.g. "HNMK-01"
  area: string;            // e.g. "Hanamkonda"
  address: string;         // e.g. "80 Feet Road, 5th Block"
  doorNumber: string;      // e.g. "Shop #14, Ground Floor"
  pincode: string;         // e.g. "560034"
  phone: string;           // e.g. "+91 98765 43210"
  email: string;
  managerName: string;     // e.g. "Dr. Ramesh Gupta (B.Pharm)"
  managerPhone: string;
  managerPin?: string;     // PIN to manage this specific store
  coordinates: {
    latitude: number;
    longitude: number;
  };
  deliveryRadiusKm: number;// e.g. 7.5 km
  estimatedDeliveryTime: string; // e.g. "25-35 mins"
  isOpen24x7: boolean;
  rating: number;          // e.g. 4.8
  isActive: boolean;
}

export interface BranchStockItem {
  branchId: string;
  medicineId: string;
  stock: number;
  minStockAlert: number;
  lastUpdated?: string;
}

export interface OnlineOrderItem {
  medicineId: string;
  medicineName: string;
  genericName?: string;
  dosage: string;
  quantity: number;
  unitPrice: number;
  rackInfo: string;
}

// Standard Online Pharmacy Order Status (Apollo 24|7 & Tata 1mg SOP)
export type OrderStatus = 
  | 'PENDING'          // Placed by customer, awaiting pharmacist review
  | 'VERIFIED'         // Pharmacist verified prescription & stock
  | 'PACKED'           // Medicines packed from rack/box & invoice generated
  | 'OUT_FOR_DELIVERY' // Dispatched with delivery agent
  | 'DELIVERED'        // Handed over to patient
  | 'CANCELLED'        // Order cancelled / invalid prescription
  | 'ACCEPTED'         // Legacy alias for VERIFIED
  | 'PREPARING'        // Legacy alias for PACKED
  | 'READY'            // Legacy alias for PACKED
  | 'REJECTED';        // Legacy alias for CANCELLED

export interface OnlineOrder {
  id: string;
  orderNumber: string;       // e.g. "ORD-2026-101"
  pharmacyId: string;        // Specific pharmacy branch fulfilling this order
  pharmacyName: string;      // Name of the selected pharmacy store
  customerName: string;
  customerMobile: string;
  address: string;
  doorNumber?: string;       // Door / Flat / House number
  landmark?: string;
  pincode?: string;
  geoCoordinates?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
  };
  prescriptionImageUrl?: string;
  prescriptionFileName?: string;
  items: OnlineOrderItem[];
  estimatedTotal: number;
  status: OrderStatus;
  createdAt: string;
  verifiedAt?: string;       // SOP verification timestamp
  packedAt?: string;         // SOP packing timestamp
  dispatchedAt?: string;     // SOP dispatch timestamp
  deliveredAt?: string;      // SOP delivery timestamp
  notes?: string;
}


