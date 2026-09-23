---
name: medeco-medicine-finder
description: Operational guide for the medEco Medicine Finder, multi-criteria search, substitute recommendation, category filtering, and direct cart actions.
---

# medEco Medicine Finder Skill

## Overview
The `MedicineFinder` component (`src/components/MedicineFinder.tsx`) provides high-speed, multi-criteria search for medicines, generic equivalents, dosage formats, and physical rack locations.

## Key Workflows
1. **Multi-Parameter Search**:
   - Matches against medicine brand names (e.g. *Dolo 650*, *Augmentin 625*), generic active ingredients (e.g. *Paracetamol*, *Amoxicillin*), categories, and physical shelf IDs.
2. **Category & Rack Filtering**:
   - Filter chips allow instant sorting by Tablets, Syrups, Capsules, Injections, Ointments, Drops, and Inhalers.
   - Rack dropdown isolates medicines located in specific physical shelving bays.
3. **Role-Based Presentation**:
   - **For Patients**: Shows price, availability, generic name, dosage, and 1-tap cart button. Warehouse rack rows are omitted.
   - **For Owners**: Shows rack IDs, shelf numbers, box labels, storage temperatures, and quick navigation buttons.
4. **Action Integration**:
   - Direct button to add medicine to active POS bill or cart.
   - Quick navigation to visual rack shelf view.
