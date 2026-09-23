---
name: medeco-online-order-modal
description: Operational guide for medEco Online Order Modal, prescription image upload, 8 km radius geofencing validation, and nearest branch auto-allocation.
---

# medEco Online Order & 8 km Geofenced Dispatch Skill

## Overview
The `OnlineOrderModal` component (`src/components/OnlineOrderModal.tsx`) allows patients to place online prescription orders with express home delivery.

## Key Workflows
1. **Authentication Requirement**:
   - Strictly requires customer authentication before placing an order. If guest attempts to order, triggers `onRequireLogin`.
2. **Delivery Location & 8 km Geofencing**:
   - Captures delivery address, door number, landmark, and delivery zone.
   - Calculates geodesic distance from patient coordinates to each of the 4 pharmacy stores using the Haversine equation.
   - Evaluates each store: if distance $\le 8.0\text{ km}$, store is enabled; if $> 8.0\text{ km}$, store is marked ineligible.
   - Automatically pre-selects the nearest qualified store.
3. **Prescription Image Upload**:
   - Supports camera capture and image upload (JPEG, PNG, WebP) with instant preview.
4. **Order Dispatch & Notification**:
   - Writes order record to Firebase RTDB (`/online_orders/{orderId}`) with initial status `PENDING`.
   - Triggers realtime toast and notification popup for the assigned branch.
5. **Mobile Viewport Width Constraints & Background Scroll Lock**:
   - Invokes `useModalScrollLock(isOpen)` unconditionally at the top of the component to freeze background scrolling on mobile and desktop.
   - Constrains outer modal dialog to `max-w-[calc(100vw-16px)] sm:max-w-2xl min-w-0` with `p-2 sm:p-4` backdrop padding to prevent horizontal clipping on narrow mobile viewports.
   - Employs `w-full min-w-0 max-w-full truncate` on the "Add medicine manually" select dropdown and item cards to guarantee that long pharmaceutical names do not exceed the screen width.
