---
name: medeco-billing-pos
description: Operational guide for the medEco POS Billing system, cart management, GST taxation, discounts, physical rack recording, and printable invoice generation.
---

# medEco POS Billing & Invoicing Skill

## Overview
The `BillingPOS` component (`src/components/BillingPOS.tsx`) serves as the central retail dispensing desk for pharmacy owners and staff. It enables rapid item barcode search, cart calculations, prescription drug verification, statutory GST calculations, and official tax invoice generation.

## Key Workflows
1. **Medicine Search & Cart Insertion**:
   - Searches inventory by trade name, generic composition, barcode, or shelf/rack ID.
   - Shows available units in stock and physical shelf location (e.g. `Rack A > Shelf 2 > Box-04`).
   - Validates quantity against available inventory before adding to cart.
2. **Dynamic Tax & Financial Calculations**:
   - Calculates taxable value, CGST, and SGST per item based on statutory slabs (5%, 12%, 18%).
   - Applies discounts (percentage or fixed INR values).
   - Generates grand total and supports payment tenders: Cash, UPI, Card, and Credit.
3. **Prescription Traceability**:
   - Tags invoice items with physical shelf/box origins so dispensing staff can easily locate medicine packs.
   - Requires patient mobile number and optional prescribing doctor name for Schedule H drugs.
4. **GST Tax Invoice & Receipt Sharing**:
   - Triggers `ReceiptModal` upon completion with printable format and WhatsApp share link.
   - Synchronizes invoice into Firebase RTDB (`/invoices/{invoiceId}`) and decrements stock in master inventory and branch stocks.

## Props Interface
```typescript
interface BillingPOSProps {
  medicines: Medicine[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onInvoiceCreated: (invoice: Invoice) => void;
  onNavigateToRack: (rackId: string) => void;
  activeBranchId?: string;
}
```
