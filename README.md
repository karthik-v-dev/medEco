# medEco - Smart Pharmacy Rack Locator, POS Billing & Customer Healthcare Portal

**medEco** is a high-performance, mobile-responsive web application built with **React, Vite, TypeScript, and Tailwind CSS**, connected to **Firebase Realtime Database** (`https://mediaclinfo-default-rtdb.firebaseio.com/`).

It fulfills two core missions:
1. **Pharmacy Operations**: Instantly tells pharmacy staff where any requested medicine or tablet is stored (**Rack, Shelf, Box/Bin**, temperature conditions), along with unit MRP cost and live stock. Generates itemized sales receipts with **GST tax breakdowns** and **discounts**.
2. **Patient Wellness**: **"One customer, one account based on mobile number"**. Customers log in with their phone number to view their full purchase history and manage daily **Medicine Reminders** with adherence checklists and WhatsApp alerts.

---

## 🌟 Key Features

### 1. 🔍 Instant "Where is Tablet?" Quick Locator
- Instant search by medicine name (e.g. *Dolo 650*, *Augmentin*, *Pan 40*), generic formula, or rack ID.
- High-visibility store location card displaying the exact:
  - **Rack Identifier** (e.g., `Rack A`, `Rack B`, `Cold Storage`)
  - **Shelf Number** (e.g., `Shelf 1`, `Shelf 2`)
  - **Box / Bin ID** (e.g., `Box-01`, `Box-04`)
  - **Storage condition** (e.g., *2°C - 8°C Refrigerated*, *Store below 25°C*)
- Live stock status (`In Stock`, `Low Stock`, `Out of Stock`) and MRP price.
- One-click **Add to Bill** directly from search results.

### 2. 🗺️ Interactive Pharmacy Rack Map
- Visual store map representing the physical shelves of the pharmacy (`Rack A`, `Rack B`, `Rack C`, `Rack D`, `Cold Storage`).
- Tap any shelf to view every medicine placed in that bay with capacity and stock counters.

### 3. 🧾 POS Billing with GST & Discounts
- Real-time cart calculation.
- Fast customer mobile phone lookup (automatically retrieves customer record).
- Flexible discount engine (**Percentage %** or **Flat ₹ off**).
- **GST Tax Engine**:
  - Automatically calculates Subtotal (Gross MRP), Discount deduction, Taxable Value, **CGST (e.g. 6%)**, and **SGST (e.g. 6%)**.
  - Computes rounded Grand Total with savings indicator.
  - Decrements live inventory stock upon bill completion.

### 4. 🖨️ Printable GST Tax Receipts & WhatsApp Sharing
- Professional pharmacy tax receipt formatted for thermal printers, standard A4 paper, and PDF export (`window.print()` with custom `@media print` CSS).
- Complete invoice details: Pharmacy GSTIN, Drug License, Invoice #, Date/Time, Customer Mobile, itemized list with rack storage origin, tax breakup, and total savings.
- One-click **WhatsApp share** to send the invoice summary directly to the customer's phone.

### 5. 📱 Customer Mobile Login ("One Customer, One Account")
- Frictionless mobile number verification.
- Stores customer profile, wellness loyalty points, and allergies.
- **Purchase History**: Complete timeline of all medicines bought under that phone number with direct receipt reprint.

### 6. ⏰ Daily Medicine Reminders & Dose Tracker
- Auto-schedules daily dose reminders when medicines are billed.
- Timings supported: **Morning, Afternoon, Evening, Night** with specific clock times.
- Meal relations: *Before Food*, *After Food*, *With Food*, *Empty Stomach*.
- Interactive daily checklist to mark doses as **Taken** or **Pending**, tracking patient adherence.
- 1-click WhatsApp dose reminder share.

### 7. 🔥 Firebase Realtime Database Integration
- Connected to `https://mediaclinfo-default-rtdb.firebaseio.com/`.
- Resilient offline-first synchronization: Works seamlessly both online and offline with automated local storage caching and instant real-time broadcasts.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation & Run

```bash
# Clone or navigate to the repository
cd medEco

# Install dependencies (React, Vite, TypeScript, TailwindCSS, Firebase, Lucide)
npm install

# Start the local development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will run locally at `http://localhost:5173/`.

---

## 📂 Project Structure

```
medEco/
├── index.html                  # HTML entry point with mobile viewport & Google Fonts
├── package.json                # Project dependencies & build scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration with vendor chunking
├── tailwind.config.js          # Tailwind CSS design system with medical emerald palette
├── postcss.config.js           # PostCSS configuration
├── src/
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces (Medicine, Rack, Invoice, Reminder, Customer)
│   ├── services/
│   │   ├── firebase.ts         # Firebase RTDB client & resilient data persistence layer
│   │   └── mockData.ts         # Preloaded starter medicines across Racks A-D & demo accounts
│   ├── components/
│   │   ├── Navbar.tsx          # Brand header, Firebase status, tabs, customer login, cart
│   │   ├── MedicineFinder.tsx  # "Where is Tablet?" instant locator with rack & shelf cards
│   │   ├── RackLayoutView.tsx  # Interactive visual pharmacy shelf map
│   │   ├── BillingPOS.tsx      # Point of Sale billing, customer phone lookup, GST, discounts
│   │   ├── ReceiptModal.tsx    # Official printable GST tax receipt & WhatsApp share
│   │   ├── CustomerAuthModal.tsx # Mobile login modal ("One customer, one account")
│   │   ├── CustomerPortal.tsx  # Customer account, purchase history, and reminders
│   │   ├── ReminderManager.tsx # Daily dose checklist, adherence tracking, reminder scheduler
│   │   ├── InventoryManager.tsx# Add/edit medicine, rack coordinates, prices, stock
│   │   └── InvoiceHistory.tsx  # Searchable archive of all past store receipts
│   ├── App.tsx                 # Root component with mobile bottom navigation bar
│   ├── index.css               # Tailwind CSS rules & thermal printer styles
│   └── main.tsx                # React DOM mounting
```

---

## 👥 Demo Customer Credentials

For instant demonstration:
- **Phone**: `9876543210` (Rahul Sharma - Has past regular prescriptions and active reminders)
- **Phone**: `9123456780` (Priya Patel - Cough & cold medications)
- Any new 10-digit mobile number will instantly create a new unified customer health account.
