---
name: medeco-multistore-dashboard
description: Operational guide for medEco Multi-Store Dashboard, cross-branch inventory balancing, supplier stock consignments, and 5-stage online order SOP management.
---

# medEco Multi-Store Dashboard & Consignments Skill

## Overview
The `MultiStoreDashboard` component (`src/components/MultiStoreDashboard.tsx`) provides high-level operations for the 4 physical branches in Warangal & Hanamkonda.

## Key Workflows
1. **Network Inventory Grid**:
   - Displays consolidated and branch-by-branch stock levels for every medicine.
   - Quick stock adjustment dialog with background scroll locking (`useModalScrollLock`).
2. **Supplier Consignments**:
   - Manages incoming consignments from pharmaceutical distributors (e.g. *Hetero Healthcare*, *Sun Pharma Logistics*, *Cipla C&F*).
   - Stages: `ORDERED` > `IN_TRANSIT` > `ARRIVED_AWAITING_CHECKIN` > `CHECKED_IN`.
   - Check-in increments both branch-specific stock (`/branch_stocks`) and master inventory.
3. **Online Orders SOP Lifecycle Management**:
   - Displays incoming prescription orders dispatched to the active branch.
   - Advances order status through 5 standard stages:
     - `PENDING` -> `VERIFIED` -> `PACKED` -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
   - Prescription image zoom view with non-dismissible backdrop.
4. **Inter-Branch Stock Transfers**:
   - Enables pharmacists to rebalance inventory when one branch has a stockout and a sister branch has surplus.
