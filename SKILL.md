---
name: medeco-pharmacy-app
description: Comprehensive development, architecture, and upgrade guide for medEco - the smart pharmacy medicine rack locator, POS billing with GST & discounts, customer mobile accounts, dose reminders, and online prescription orders.
---

# medEco Architecture & Upgrade Skill

This skill documents the complete technical design, data schemas, access rules, and future upgrade playbooks for the **medEco** pharmacy management and patient wellness platform.

---

## 1. System Overview & Technology Stack

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend Framework** | React 18 + Vite 6 | Fast HMR, optimized chunk splitting (`vendor`, `firebase`, `icons`) |
| **Language** | TypeScript 5 (Strict Mode) | Full type safety for all domain models |
| **Styling & UI** | Tailwind CSS 3 | `darkMode: 'class'` (Light, Dark, System), custom medical emerald palette |
| **Iconography** | Lucide React | Medical icons (`Pill`, `MapPin`, `Store`, `Clock`, `Receipt`, `Camera`) |
| **Database & Sync** | Firebase Realtime Database | `https://mediaclinfo-default-rtdb.firebaseio.com/` + LocalStorage resilient cache |
| **Audio & Events** | Web Audio API + Custom Events | Audio chime notifications on order reception, `medeco:new-online-order` event |
| **Printing & PDF** | CSS `@media print` + Headless Edge | Native thermal and A4 print layout, offline PDF manual export |

---

## 2. Core Domain Data Schemas (`src/types/index.ts`)

### `Medicine`
```typescript
interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: MedicineCategory; // 'Tablets' | 'Syrups' | 'Capsules' | 'Injections' | 'Ointments' | 'Drops'
  dosage: string;
  stripSize: string;
  unitPrice: number;     // Selling Price (MRP)
  costPrice: number;     // Purchase Cost
  stock: number;         // Current units in stock
  minStockAlert: number; // Low stock threshold
  batchNumber: string;
  expiryDate: string;    // YYYY-MM-DD
  gstRate: number;       // 5, 12, or 18%
  rackLocation: RackLocation;
  requiresPrescription: boolean;
}
```

### `RackLocation`
```typescript
interface RackLocation {
  rackId: string;        // e.g. "Rack A", "Rack B", "Cold Storage"
  shelfNumber: number;   // 1, 2, 3, 4 (vertical shelf level)
  boxNumber?: string;    // e.g. "Box-01", "Bin-04"
  description?: string;  // e.g. "Fast moving antibiotic row"
  temperatureNote?: string; // e.g. "2°C - 8°C Refrigerated"
}
```

### `Invoice` & `InvoiceItem`
```typescript
interface Invoice {
  id: string;
  invoiceNumber: string; // "MED-2026-XXXX"
  date: string;          // ISO Timestamp
  customerMobile: string;// Primary identifier
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
  paymentMode: 'Cash' | 'UPI' | 'Card';
  status: 'PAID' | 'REFUNDED';
}
```

### `OnlineOrder`
```typescript
interface OnlineOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  address: string;
  landmark?: string;
  pincode?: string;
  geoCoordinates?: { latitude: number; longitude: number };
  prescriptionImageUrl?: string;
  items: OnlineOrderItem[];
  estimatedTotal: number;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'REJECTED';
  createdAt: string;
}
```

---

## 3. Role-Based Access & Privacy Rules

The platform strictly enforces the **"One Customer, One Account based on Mobile Number"** principle and privacy boundaries:

1. **Owner (`role: 'owner'`)**:
   - Authenticated with owner password (`admin123`) or PIN (`9999`).
   - Access to: POS Billing, Inventory wholesale costs, Rack locations, All Receipts audit, and **Customer Directory** (to inspect any customer's purchase history and reminders).
2. **Customer (`role: 'customer'`)**:
   - Authenticated via 10-digit mobile number + OTP verification.
   - **Strict Data Isolation**: Customers can **ONLY** view their own past receipts, previous prescriptions, and personal dose reminders. Store wholesale prices, POS terminals, and other customer accounts are completely hidden.
3. **Guest (`role: 'guest'`)**:
   - Can search where tablets are stored in the shop, view the visual rack layout, or log in as customer/owner.

---

## 4. Theme System (Dark / Light / System)

Theme state is managed through `src/services/theme.ts`:
- Storage key: `medeco_theme_preference_v1`
- `applyTheme(mode)`:
  - Toggles the `dark` class on `document.documentElement` (`<html class="dark">`).
  - When mode is `'system'`, dynamically listens to `window.matchMedia('(prefers-color-scheme: dark)')`.
- All UI elements must include `dark:` variant classes (e.g. `bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800`).

---

## 5. Future Upgrade Playbooks

### Playbook A: Integrating Real SMS/WhatsApp OTP Gateway
1. In `src/components/AuthModal.tsx`, replace the mock OTP verification with:
   - **Twilio Verify API** or **MSG91 / Fast2SMS** or **Firebase Authentication Phone Provider**.
2. Call backend endpoint `/api/send-otp` with `{ phone }`, receive session token, and verify the user's 6-digit code.

### Playbook B: Real Gemini AI / Cloud Vision Prescription OCR
1. In `src/components/OnlineOrderModal.tsx`:
   - Send `prescriptionImage` base64 data to Google Cloud Vision API or Gemini 1.5 Flash (`generateContent` with image part).
   - Prompt:
     ```text
     Extract medicine names, dosages, frequencies, and durations from this doctor's prescription.
     Format response as JSON: [{ name: string, dosage: string, quantity: number }]
     ```
   - Match extracted names against `getMedicines()` using fuzzy string matching (Levenshtein distance) and populate `orderItems`.

### Playbook C: Thermal Bluetooth / USB ESC/POS Printer Direct Print
1. Use the Web Bluetooth API (`navigator.bluetooth.requestDevice`) or Web Serial API.
2. Format receipt lines using ESC/POS byte commands (`0x1B 0x40` initialize, `0x1B 0x21` bold, `0x1D 0x56` paper cut).
3. Connect `ReceiptModal.tsx` directly to the wireless thermal printer.

### Playbook D: Camera Barcode & QR Code Scanner
1. Install `html5-qrcode` or `@zxing/library`.
2. In `BillingPOS.tsx` and `InventoryManager.tsx`, add a barcode scan trigger.
3. Matching barcode or batch number automatically pushes the item into the active cart without manual typing.

---

## 6. Build & Maintenance Commands

```powershell
# Start local development server
npm run dev

# Run TypeScript check and production build
npm run build

# Preview production build locally
npm run preview

# Generate fresh PDF User Manual via Edge Headless
Start-Process -FilePath "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" -ArgumentList "--headless=new", "--disable-gpu", "--print-to-pdf=`"C:\Users\Karthik\medEco\USER_MANUAL.pdf`"", "`"file:///C:/Users/Karthik/medEco/manual.html`"" -Wait
```
