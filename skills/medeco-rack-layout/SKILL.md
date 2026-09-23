---
name: medeco-rack-layout
description: Operational guide for medEco Visual Pharmacy Shelf & Rack Organizer, temperature zones, and physical warehouse bin storage.
---

# medEco Visual Pharmacy Shelf & Rack Organizer Skill

## Overview
The `RackLayoutView` component (`src/components/RackLayoutView.tsx`) provides an interactive 2D/3D map of the pharmacy's physical shelving bays, temperature zones, and box arrangements.

## Key Workflows
1. **Physical Shelving Layout**:
   - Displays physical bays: Rack A, Rack B, Rack C, and Cold Storage.
   - Organizes shelves hierarchically: Shelves 1 to 4 with individual bin/box numbers.
2. **Temperature Control Zones**:
   - Highlights refrigerated units (`2°C - 8°C`) for vaccines and insulin.
   - Monitors room-temperature zones (`Below 25°C`).
3. **Medicine Item Display**:
   - Shows medicines physically placed on each shelf with quick navigation from POS or Inventory Manager.
