import { Medicine, Customer, Invoice, MedicineReminder, PharmacyProfile, OnlineOrder, PharmacyBranch, BranchStockItem } from '../types';

export const DEFAULT_PHARMACY_PROFILE: PharmacyProfile = {
  name: "medEco Pharmacy & Healthcare",
  tagline: "Smart Medicine Rack Management & Patient Wellness",
  address: "Shop #14, Ground Floor, Green Avenue MedZone, Bangalore, Karnataka - 560034",
  phone: "+91 98765 43210",
  email: "care@medeco-pharmacy.com",
  gstin: "29AABCM1234F1Z8",
  drugLicenseNo: "KA-BLR-2024-DL-88912",
  fssaiNo: "11223344000192"
};

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: "med-01",
    name: "Dolo 650",
    genericName: "Paracetamol 650mg",
    brand: "Micro Labs",
    category: "Tablets",
    dosage: "650 mg",
    stripSize: "15 tablets/strip",
    unitPrice: 34.50,
    costPrice: 24.00,
    stock: 120,
    minStockAlert: 20,
    batchNumber: "DL-6502",
    expiryDate: "2027-05-31",
    gstRate: 12,
    hsnCode: "30049060",
    rackLocation: {
      rackId: "Rack A",
      shelfNumber: 1,
      boxNumber: "Box-01",
      description: "Eye-level shelf, Fast Moving Row",
      temperatureNote: "Store below 25°C"
    },
    requiresPrescription: false,
    notes: "Analgesic & Antipyretic for fever and body ache"
  },
  {
    id: "med-02",
    name: "Augmentin 625 Duo",
    genericName: "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
    brand: "GSK",
    category: "Tablets",
    dosage: "625 mg",
    stripSize: "10 tablets/strip",
    unitPrice: 201.20,
    costPrice: 155.00,
    stock: 45,
    minStockAlert: 10,
    batchNumber: "AUG-9910",
    expiryDate: "2026-11-30",
    gstRate: 12,
    hsnCode: "30041000",
    rackLocation: {
      rackId: "Rack A",
      shelfNumber: 2,
      boxNumber: "Box-04",
      description: "Antibiotics Section, Top Shelf",
      temperatureNote: "Store in cool, dry place"
    },
    requiresPrescription: true,
    notes: "Broad spectrum antibiotic. Prescription mandatory."
  },
  {
    id: "med-03",
    name: "Pan 40",
    genericName: "Pantoprazole Gastro-resistant 40mg",
    brand: "Alkem",
    category: "Tablets",
    dosage: "40 mg",
    stripSize: "15 tablets/strip",
    unitPrice: 165.00,
    costPrice: 110.00,
    stock: 80,
    minStockAlert: 15,
    batchNumber: "PAN-8812",
    expiryDate: "2027-08-31",
    gstRate: 12,
    hsnCode: "30049099",
    rackLocation: {
      rackId: "Rack A",
      shelfNumber: 3,
      boxNumber: "Box-08",
      description: "Antacids & Gastric Care",
      temperatureNote: "Store protected from moisture"
    },
    requiresPrescription: false,
    notes: "Take 30 minutes before breakfast"
  },
  {
    id: "med-04",
    name: "Cetzine 10",
    genericName: "Cetirizine Hydrochloride 10mg",
    brand: "Dr. Reddy's",
    category: "Tablets",
    dosage: "10 mg",
    stripSize: "10 tablets/strip",
    unitPrice: 21.00,
    costPrice: 12.50,
    stock: 150,
    minStockAlert: 25,
    batchNumber: "CTZ-204",
    expiryDate: "2027-03-31",
    gstRate: 12,
    hsnCode: "30049099",
    rackLocation: {
      rackId: "Rack B",
      shelfNumber: 1,
      boxNumber: "Box-02",
      description: "Anti-Allergy & Respiratory Care",
      temperatureNote: "Store below 30°C"
    },
    requiresPrescription: false,
    notes: "Antihistamine for sneezing, cold and skin rash"
  },
  {
    id: "med-05",
    name: "Glycomet-GP 1",
    genericName: "Metformin (500mg) + Glimepiride (1mg)",
    brand: "USV Ltd",
    category: "Tablets",
    dosage: "500mg/1mg",
    stripSize: "15 tablets/strip",
    unitPrice: 115.00,
    costPrice: 85.00,
    stock: 95,
    minStockAlert: 20,
    batchNumber: "GLY-3312",
    expiryDate: "2027-01-31",
    gstRate: 12,
    hsnCode: "30049099",
    rackLocation: {
      rackId: "Rack B",
      shelfNumber: 2,
      boxNumber: "Box-06",
      description: "Diabetes Care Section, Middle shelf",
      temperatureNote: "Store protected from light & moisture"
    },
    requiresPrescription: true,
    notes: "Oral anti-diabetic for Type 2 Diabetes"
  },
  {
    id: "med-06",
    name: "Telma 40",
    genericName: "Telmisartan 40mg",
    brand: "Glenmark",
    category: "Tablets",
    dosage: "40 mg",
    stripSize: "15 tablets/strip",
    unitPrice: 142.50,
    costPrice: 98.00,
    stock: 65,
    minStockAlert: 15,
    batchNumber: "TLM-4019",
    expiryDate: "2027-06-30",
    gstRate: 12,
    hsnCode: "30049099",
    rackLocation: {
      rackId: "Rack B",
      shelfNumber: 3,
      boxNumber: "Box-11",
      description: "Cardiology & Blood Pressure Section",
      temperatureNote: "Store below 25°C"
    },
    requiresPrescription: true,
    notes: "Antihypertensive medication. Take once daily."
  },
  {
    id: "med-07",
    name: "Benadryl Cough Syrup",
    genericName: "Diphenhydramine + Ammonium Chloride + Sodium Citrate",
    brand: "Johnson & Johnson",
    category: "Syrups",
    dosage: "100 ml",
    stripSize: "100 ml bottle",
    unitPrice: 145.00,
    costPrice: 108.00,
    stock: 35,
    minStockAlert: 8,
    batchNumber: "BEN-7741",
    expiryDate: "2026-10-31",
    gstRate: 12,
    hsnCode: "30049099",
    rackLocation: {
      rackId: "Rack C",
      shelfNumber: 1,
      boxNumber: "Shelf-1-Left",
      description: "Cough Syrups & Liquids, Sturdy Low Shelf",
      temperatureNote: "Do not freeze"
    },
    requiresPrescription: false,
    notes: "For relief from cough and sore throat"
  },
  {
    id: "med-08",
    name: "Lantus Solostar Insulin Pen",
    genericName: "Insulin Glargine 100 IU/ml",
    brand: "Sanofi",
    category: "Injections",
    dosage: "3 ml prefilled pen",
    stripSize: "1 pen (3 ml)",
    unitPrice: 710.00,
    costPrice: 590.00,
    stock: 18,
    minStockAlert: 5,
    batchNumber: "LAN-9942",
    expiryDate: "2026-09-30",
    gstRate: 5,
    hsnCode: "30043110",
    rackLocation: {
      rackId: "Cold Storage",
      shelfNumber: 1,
      boxNumber: "Refrigerator Drawer-1",
      description: "Medical Refrigerator, Temperature Monitored",
      temperatureNote: "CRITICAL: Keep 2°C to 8°C. Do not freeze."
    },
    requiresPrescription: true,
    notes: "Long-acting insulin analogue. Maintain cold chain."
  },
  {
    id: "med-09",
    name: "Volini Pain Relief Gel",
    genericName: "Diclofenac Diethylamine + Linseed Oil + Methyl Salicylate",
    brand: "Sun Pharma",
    category: "Ointments",
    dosage: "50 g tube",
    stripSize: "50 g tube",
    unitPrice: 160.00,
    costPrice: 118.00,
    stock: 50,
    minStockAlert: 10,
    batchNumber: "VOL-3341",
    expiryDate: "2027-12-31",
    gstRate: 12,
    hsnCode: "30049099",
    rackLocation: {
      rackId: "Rack C",
      shelfNumber: 2,
      boxNumber: "Box-03",
      description: "Topical Ointments & Pain Sprays",
      temperatureNote: "Store below 30°C"
    },
    requiresPrescription: false,
    notes: "Fast joint and muscle pain relief ointment"
  },
  {
    id: "med-10",
    name: "Azithral 500",
    genericName: "Azithromycin 500mg",
    brand: "Alembic",
    category: "Tablets",
    dosage: "500 mg",
    stripSize: "5 tablets/strip",
    unitPrice: 128.50,
    costPrice: 94.00,
    stock: 60,
    minStockAlert: 12,
    batchNumber: "AZI-501",
    expiryDate: "2027-04-30",
    gstRate: 12,
    hsnCode: "30042000",
    rackLocation: {
      rackId: "Rack A",
      shelfNumber: 2,
      boxNumber: "Box-05",
      description: "Antibiotics Section, Top Shelf",
      temperatureNote: "Store in a dry place"
    },
    requiresPrescription: true,
    notes: "3-5 day antibiotic course. Complete full course."
  },
  {
    id: "med-11",
    name: "Becosules Z Capsules",
    genericName: "B-Complex Forte with Vitamin C and Zinc",
    brand: "Pfizer",
    category: "Capsules",
    dosage: "Multivitamin",
    stripSize: "20 capsules/strip",
    unitPrice: 52.00,
    costPrice: 38.00,
    stock: 140,
    minStockAlert: 20,
    batchNumber: "BEC-882",
    expiryDate: "2027-10-31",
    gstRate: 12,
    hsnCode: "30045000",
    rackLocation: {
      rackId: "Rack D",
      shelfNumber: 1,
      boxNumber: "Box-01",
      description: "Nutritional Supplements & Immunity Boosters",
      temperatureNote: "Protect from direct heat"
    },
    requiresPrescription: false,
    notes: "Daily nutritional support & mouth ulcer recovery"
  },
  {
    id: "med-12",
    name: "Refresh Tears Eye Drops",
    genericName: "Carboxymethylcellulose Sodium 0.5%",
    brand: "Allergan",
    category: "Drops",
    dosage: "10 ml",
    stripSize: "10 ml dropper bottle",
    unitPrice: 185.00,
    costPrice: 135.00,
    stock: 40,
    minStockAlert: 8,
    batchNumber: "REF-110",
    expiryDate: "2026-12-31",
    gstRate: 12,
    hsnCode: "30049099",
    rackLocation: {
      rackId: "Rack D",
      shelfNumber: 2,
      boxNumber: "Box-07",
      description: "Ophthalmic & ENT Drops",
      temperatureNote: "Discard 30 days after opening"
    },
    requiresPrescription: false,
    notes: "Lubricating eye drops for dry and irritated eyes"
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-01",
    mobileNumber: "9876543210",
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    address: "Flat 402, Sunshine Heights, Bangalore",
    allergies: ["Penicillin"],
    loyaltyPoints: 140,
    createdAt: "2026-01-10T10:00:00.000Z"
  },
  {
    id: "cust-02",
    mobileNumber: "9123456780",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    address: "12/A 4th Main, Indiranagar, Bangalore",
    allergies: [],
    loyaltyPoints: 65,
    createdAt: "2026-02-14T14:30:00.000Z"
  },
  {
    id: "cust-03",
    mobileNumber: "9988776655",
    name: "Anand Sundaram",
    email: "anand.sundaram@example.com",
    address: "77 Orchid Enclave, Koramangala, Bangalore",
    allergies: ["Sulfa drugs"],
    loyaltyPoints: 210,
    createdAt: "2025-11-20T11:15:00.000Z"
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "MED-2026-1001",
    date: "2026-09-12T14:20:00.000Z",
    customerMobile: "9876543210",
    customerName: "Rahul Sharma",
    items: [
      {
        medicineId: "med-05",
        medicineName: "Glycomet-GP 1",
        genericName: "Metformin (500mg) + Glimepiride (1mg)",
        batchNumber: "GLY-3312",
        expiryDate: "2027-01-31",
        rackInfo: "Rack B > Shelf 2 > Box-06",
        quantity: 2,
        unitPrice: 115.00,
        gstRate: 12,
        gstAmount: 24.64,
        total: 230.00,
        dosageInstruction: "1 tablet after breakfast"
      },
      {
        medicineId: "med-06",
        medicineName: "Telma 40",
        genericName: "Telmisartan 40mg",
        batchNumber: "TLM-4019",
        expiryDate: "2027-06-30",
        rackInfo: "Rack B > Shelf 3 > Box-11",
        quantity: 2,
        unitPrice: 142.50,
        gstRate: 12,
        gstAmount: 30.54,
        total: 285.00,
        dosageInstruction: "1 tablet morning after food"
      }
    ],
    subtotal: 515.00,
    discountType: "percentage",
    discountValue: 10,
    discountAmount: 51.50,
    taxableAmount: 413.84,
    cgstAmount: 24.83,
    sgstAmount: 24.83,
    totalGst: 49.66,
    grandTotal: 463.50,
    paymentMode: "UPI",
    status: "PAID",
    doctorName: "Dr. K. S. Rao (Cardiologist)",
    notes: "Monthly regular prescription"
  },
  {
    id: "inv-002",
    invoiceNumber: "MED-2026-1002",
    date: "2026-09-13T11:05:00.000Z",
    customerMobile: "9123456780",
    customerName: "Priya Patel",
    items: [
      {
        medicineId: "med-01",
        medicineName: "Dolo 650",
        genericName: "Paracetamol 650mg",
        batchNumber: "DL-6502",
        expiryDate: "2027-05-31",
        rackInfo: "Rack A > Shelf 1 > Box-01",
        quantity: 1,
        unitPrice: 34.50,
        gstRate: 12,
        gstAmount: 3.70,
        total: 34.50,
        dosageInstruction: "SOS if fever > 100°F"
      },
      {
        medicineId: "med-07",
        medicineName: "Benadryl Cough Syrup",
        genericName: "Diphenhydramine + Ammonium Chloride",
        batchNumber: "BEN-7741",
        expiryDate: "2026-10-31",
        rackInfo: "Rack C > Shelf 1 > Shelf-1-Left",
        quantity: 1,
        unitPrice: 145.00,
        gstRate: 12,
        gstAmount: 15.54,
        total: 145.00,
        dosageInstruction: "10 ml twice daily after food"
      }
    ],
    subtotal: 179.50,
    discountType: "fixed",
    discountValue: 10,
    discountAmount: 10.00,
    taxableAmount: 151.34,
    cgstAmount: 9.08,
    sgstAmount: 9.08,
    totalGst: 18.16,
    grandTotal: 169.50,
    paymentMode: "Cash",
    status: "PAID"
  }
];

export const INITIAL_REMINDERS: MedicineReminder[] = [
  {
    id: "rem-01",
    customerMobile: "9876543210",
    medicineName: "Glycomet-GP 1",
    dosage: "1 Tablet",
    timings: ["Morning"],
    customTime: "08:30 AM",
    mealRelation: "After Food",
    startDate: "2026-09-01",
    isActive: true,
    notes: "Take after breakfast with water. For blood sugar control.",
    lastTakenDate: "2026-09-14",
    takenHistory: {
      "2026-09-14": { "Morning": true }
    }
  },
  {
    id: "rem-02",
    customerMobile: "9876543210",
    medicineName: "Telma 40",
    dosage: "1 Tablet",
    timings: ["Morning"],
    customTime: "09:00 AM",
    mealRelation: "After Food",
    startDate: "2026-09-01",
    isActive: true,
    notes: "Take daily for blood pressure control.",
    lastTakenDate: "2026-09-14",
    takenHistory: {
      "2026-09-14": { "Morning": true }
    }
  },
  {
    id: "rem-03",
    customerMobile: "9876543210",
    medicineName: "Becosules Z Capsules",
    dosage: "1 Capsule",
    timings: ["Night"],
    customTime: "09:30 PM",
    mealRelation: "After Food",
    startDate: "2026-09-10",
    endDate: "2026-09-25",
    isActive: true,
    notes: "Daily multivitamin after dinner.",
    lastTakenDate: undefined,
    takenHistory: {}
  }
];

export const INITIAL_BRANCHES: PharmacyBranch[] = [
  {
    id: "pharm-koramangala",
    name: "medEco Pharmacy - Koramangala 5th Block",
    code: "ECO-KOR-01",
    area: "Koramangala",
    address: "80 Feet Road, Near Sony World Signal, 5th Block",
    doorNumber: "Shop #14, Ground Floor",
    pincode: "560034",
    phone: "+91 98765 43210",
    email: "koramangala@medeco-pharmacy.com",
    managerName: "Dr. Ramesh Gupta (B.Pharm)",
    managerPhone: "9876543210",
    managerPin: "9999",
    coordinates: {
      latitude: 12.9352,
      longitude: 77.6245
    },
    deliveryRadiusKm: 7.5,
    estimatedDeliveryTime: "25-35 mins",
    isOpen24x7: true,
    rating: 4.9,
    isActive: true
  },
  {
    id: "pharm-indiranagar",
    name: "medEco Pharmacy - Indiranagar 100ft Hub",
    code: "ECO-IND-02",
    area: "Indiranagar",
    address: "100 Feet Road, HAL 2nd Stage, Near CMH Hospital",
    doorNumber: "Building #88, Ground Floor",
    pincode: "560038",
    phone: "+91 98765 43211",
    email: "indiranagar@medeco-pharmacy.com",
    managerName: "Ms. Shalini Murthy (M.Pharm)",
    managerPhone: "9876543211",
    managerPin: "8888",
    coordinates: {
      latitude: 12.9784,
      longitude: 77.6408
    },
    deliveryRadiusKm: 6.5,
    estimatedDeliveryTime: "20-30 mins",
    isOpen24x7: false,
    rating: 4.8,
    isActive: true
  },
  {
    id: "pharm-whitefield",
    name: "medEco Pharmacy - Whitefield MedPark",
    code: "ECO-WFD-03",
    area: "Whitefield",
    address: "ITPL Main Road, Beside Prestige Ozone",
    doorNumber: "Unit #04, Ozone Arcade",
    pincode: "560066",
    phone: "+91 98765 43212",
    email: "whitefield@medeco-pharmacy.com",
    managerName: "Mr. Anand Varma (B.Pharm)",
    managerPhone: "9876543212",
    managerPin: "7777",
    coordinates: {
      latitude: 12.9698,
      longitude: 77.7499
    },
    deliveryRadiusKm: 8.5,
    estimatedDeliveryTime: "30-45 mins",
    isOpen24x7: true,
    rating: 4.7,
    isActive: true
  },
  {
    id: "pharm-jayanagar",
    name: "medEco Pharmacy - Jayanagar 4th Block",
    code: "ECO-JAY-04",
    area: "Jayanagar",
    address: "11th Main Road, Near Jayanagar Shopping Complex",
    doorNumber: "Door #22, Metro Pillar 42",
    pincode: "560011",
    phone: "+91 98765 43213",
    email: "jayanagar@medeco-pharmacy.com",
    managerName: "Dr. Geeta Nair (Pharm.D)",
    managerPhone: "9876543213",
    managerPin: "6666",
    coordinates: {
      latitude: 12.9299,
      longitude: 77.5824
    },
    deliveryRadiusKm: 6.0,
    estimatedDeliveryTime: "20-30 mins",
    isOpen24x7: false,
    rating: 4.9,
    isActive: true
  },
  {
    id: "pharm-hsr",
    name: "medEco Pharmacy - HSR Layout Sector 2",
    code: "ECO-HSR-05",
    area: "HSR Layout",
    address: "27th Main Road, Sector 2, Near NIFT College",
    doorNumber: "Shop #5, Ground Floor",
    pincode: "560102",
    phone: "+91 98765 43214",
    email: "hsr@medeco-pharmacy.com",
    managerName: "Mr. Vikram Rao (B.Pharm)",
    managerPhone: "9876543214",
    managerPin: "5555",
    coordinates: {
      latitude: 12.9116,
      longitude: 77.6389
    },
    deliveryRadiusKm: 7.0,
    estimatedDeliveryTime: "25-35 mins",
    isOpen24x7: true,
    rating: 4.8,
    isActive: true
  }
];

export const INITIAL_BRANCH_STOCKS: BranchStockItem[] = [
  // Koramangala
  { branchId: "pharm-koramangala", medicineId: "med-01", stock: 120, minStockAlert: 20 },
  { branchId: "pharm-koramangala", medicineId: "med-02", stock: 45, minStockAlert: 10 },
  { branchId: "pharm-koramangala", medicineId: "med-03", stock: 80, minStockAlert: 15 },
  { branchId: "pharm-koramangala", medicineId: "med-04", stock: 150, minStockAlert: 25 },
  { branchId: "pharm-koramangala", medicineId: "med-05", stock: 25, minStockAlert: 8 },
  { branchId: "pharm-koramangala", medicineId: "med-06", stock: 18, minStockAlert: 6 },
  { branchId: "pharm-koramangala", medicineId: "med-07", stock: 65, minStockAlert: 12 },
  { branchId: "pharm-koramangala", medicineId: "med-08", stock: 90, minStockAlert: 15 },
  { branchId: "pharm-koramangala", medicineId: "med-09", stock: 40, minStockAlert: 10 },
  { branchId: "pharm-koramangala", medicineId: "med-10", stock: 55, minStockAlert: 10 },

  // Indiranagar
  { branchId: "pharm-indiranagar", medicineId: "med-01", stock: 95, minStockAlert: 20 },
  { branchId: "pharm-indiranagar", medicineId: "med-02", stock: 30, minStockAlert: 10 },
  { branchId: "pharm-indiranagar", medicineId: "med-03", stock: 60, minStockAlert: 15 },
  { branchId: "pharm-indiranagar", medicineId: "med-04", stock: 110, minStockAlert: 25 },
  { branchId: "pharm-indiranagar", medicineId: "med-05", stock: 15, minStockAlert: 8 },
  { branchId: "pharm-indiranagar", medicineId: "med-06", stock: 22, minStockAlert: 6 },
  { branchId: "pharm-indiranagar", medicineId: "med-07", stock: 40, minStockAlert: 12 },
  { branchId: "pharm-indiranagar", medicineId: "med-08", stock: 75, minStockAlert: 15 },
  { branchId: "pharm-indiranagar", medicineId: "med-09", stock: 25, minStockAlert: 10 },
  { branchId: "pharm-indiranagar", medicineId: "med-10", stock: 35, minStockAlert: 10 },

  // Whitefield
  { branchId: "pharm-whitefield", medicineId: "med-01", stock: 65, minStockAlert: 20 },
  { branchId: "pharm-whitefield", medicineId: "med-02", stock: 12, minStockAlert: 10 }, // Low stock
  { branchId: "pharm-whitefield", medicineId: "med-03", stock: 45, minStockAlert: 15 },
  { branchId: "pharm-whitefield", medicineId: "med-04", stock: 80, minStockAlert: 25 },
  { branchId: "pharm-whitefield", medicineId: "med-05", stock: 0, minStockAlert: 8 },   // Out of stock
  { branchId: "pharm-whitefield", medicineId: "med-06", stock: 14, minStockAlert: 6 },
  { branchId: "pharm-whitefield", medicineId: "med-07", stock: 50, minStockAlert: 12 },
  { branchId: "pharm-whitefield", medicineId: "med-08", stock: 60, minStockAlert: 15 },
  { branchId: "pharm-whitefield", medicineId: "med-09", stock: 18, minStockAlert: 10 },
  { branchId: "pharm-whitefield", medicineId: "med-10", stock: 42, minStockAlert: 10 },

  // Jayanagar
  { branchId: "pharm-jayanagar", medicineId: "med-01", stock: 140, minStockAlert: 20 },
  { branchId: "pharm-jayanagar", medicineId: "med-02", stock: 50, minStockAlert: 10 },
  { branchId: "pharm-jayanagar", medicineId: "med-03", stock: 95, minStockAlert: 15 },
  { branchId: "pharm-jayanagar", medicineId: "med-04", stock: 130, minStockAlert: 25 },
  { branchId: "pharm-jayanagar", medicineId: "med-05", stock: 30, minStockAlert: 8 },
  { branchId: "pharm-jayanagar", medicineId: "med-06", stock: 25, minStockAlert: 6 },
  { branchId: "pharm-jayanagar", medicineId: "med-07", stock: 70, minStockAlert: 12 },
  { branchId: "pharm-jayanagar", medicineId: "med-08", stock: 100, minStockAlert: 15 },
  { branchId: "pharm-jayanagar", medicineId: "med-09", stock: 48, minStockAlert: 10 },
  { branchId: "pharm-jayanagar", medicineId: "med-10", stock: 60, minStockAlert: 10 },

  // HSR Layout
  { branchId: "pharm-hsr", medicineId: "med-01", stock: 85, minStockAlert: 20 },
  { branchId: "pharm-hsr", medicineId: "med-02", stock: 28, minStockAlert: 10 },
  { branchId: "pharm-hsr", medicineId: "med-03", stock: 55, minStockAlert: 15 },
  { branchId: "pharm-hsr", medicineId: "med-04", stock: 90, minStockAlert: 25 },
  { branchId: "pharm-hsr", medicineId: "med-05", stock: 20, minStockAlert: 8 },
  { branchId: "pharm-hsr", medicineId: "med-06", stock: 16, minStockAlert: 6 },
  { branchId: "pharm-hsr", medicineId: "med-07", stock: 45, minStockAlert: 12 },
  { branchId: "pharm-hsr", medicineId: "med-08", stock: 80, minStockAlert: 15 },
  { branchId: "pharm-hsr", medicineId: "med-09", stock: 32, minStockAlert: 10 },
  { branchId: "pharm-hsr", medicineId: "med-10", stock: 40, minStockAlert: 10 }
];

export const INITIAL_ONLINE_ORDERS: OnlineOrder[] = [
  {
    id: "ord-101",
    orderNumber: "ORD-2026-101",
    pharmacyId: "pharm-koramangala",
    pharmacyName: "medEco Pharmacy - Koramangala 5th Block",
    customerName: "Rahul Sharma",
    customerMobile: "9876543210",
    doorNumber: "Flat #402, 4th Floor",
    address: "Sunshine Heights, 4th Cross Road, Koramangala",
    landmark: "Opposite Green Park Metro Station",
    pincode: "560034",
    geoCoordinates: {
      latitude: 12.9352,
      longitude: 77.6245,
      accuracyMeters: 12
    },
    prescriptionFileName: "dr_prescription_rahul_sharma.jpg",
    prescriptionImageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600",
    items: [
      {
        medicineId: "med-01",
        medicineName: "Dolo 650",
        genericName: "Paracetamol 650mg",
        dosage: "650 mg (15 tabs)",
        quantity: 2,
        unitPrice: 34.50,
        rackInfo: "Rack A > Shelf 1 > Box-01"
      },
      {
        medicineId: "med-03",
        medicineName: "Pan 40",
        genericName: "Pantoprazole Gastro-resistant 40mg",
        dosage: "40 mg (15 tabs)",
        quantity: 1,
        unitPrice: 165.00,
        rackInfo: "Rack A > Shelf 3 > Box-08"
      }
    ],
    estimatedTotal: 234.00,
    status: "VERIFIED",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    verifiedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    notes: "Patient requested urgent delivery for high fever"
  },
  {
    id: "ord-102",
    orderNumber: "ORD-2026-102",
    pharmacyId: "pharm-indiranagar",
    pharmacyName: "medEco Pharmacy - Indiranagar 100ft Hub",
    customerName: "Priya Patel",
    customerMobile: "9123456780",
    doorNumber: "Villa #18, Lotus Court",
    address: "12th Main Road, HAL 2nd Stage, Indiranagar",
    landmark: "Near Corner House Ice Cream",
    pincode: "560038",
    geoCoordinates: {
      latitude: 12.9784,
      longitude: 77.6408,
      accuracyMeters: 8
    },
    prescriptionFileName: "dr_rx_priya_chronic.png",
    prescriptionImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600",
    items: [
      {
        medicineId: "med-05",
        medicineName: "Glycomet-GP 1",
        genericName: "Glimepiride (1mg) + Metformin (500mg)",
        dosage: "1 tab daily with food",
        quantity: 3,
        unitPrice: 128.00,
        rackInfo: "Rack B > Shelf 1 > Box-02"
      },
      {
        medicineId: "med-06",
        medicineName: "Telma 40",
        genericName: "Telmisartan 40mg",
        dosage: "1 tab morning after food",
        quantity: 2,
        unitPrice: 142.50,
        rackInfo: "Rack B > Shelf 2 > Box-05"
      }
    ],
    estimatedTotal: 669.00,
    status: "OUT_FOR_DELIVERY",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    verifiedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    packedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    notes: "Regular monthly refill. Fragile packaging."
  }
];


