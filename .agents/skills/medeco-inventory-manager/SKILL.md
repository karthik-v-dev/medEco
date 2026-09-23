---
name: medeco-inventory-manager
description: Operational guide for medEco Master Inventory Control, physical shelf/rack indexing, batch numbers, expiry dates, and low-stock replenishment alerts.
---

# medEco Master Inventory & Rack Indexing Skill

## Overview
The `InventoryManager` component (`src/components/InventoryManager.tsx`) manages master catalog entries, physical warehouse shelf locations, batch allocations, expiry dates, and minimum threshold alerts.

## Key Workflows
1. **Catalog Maintenance**:
   - Add new medicines with trade name, generic chemical composition, category (Tablets, Syrups, Capsules, etc.), dosage, strip packaging, MRP, and purchase cost.
   - Record batch numbers and expiration dates for regulatory compliance.
2. **Physical Storage Assignment**:
   - Assign each medicine to a specific warehouse rack (`Rack A`, `Rack B`, `Rack C`, `Cold Storage`), shelf tier (`1`, `2`, `3`, `4`), and bin/box number.
   - Include special storage instructions (e.g. `2°C - 8°C Refrigerated`).
3. **Low-Stock Alerting**:
   - Toggle to filter medicines where current stock $\le$ `minStockAlert`.
   - Visual red/amber indicators highlight depleted inventory.
4. **Modal Background Scroll Locking**:
   - Uses `useModalScrollLock(isModalOpen)` to prevent page background scrolling while editing medicines.
   - Backdrop click prevention ensures modal only closes via Cancel, Close ('✕'), or Save.

## Data Persistence
- Saves directly to Firebase Realtime Database at `/medicines/{medicineId}` and syncs client-side cache (`STORAGE_KEYS.MEDICINES`).
