---
name: medeco-customer-directory
description: Operational guide for medEco Customer Directory, branch-level patient management, mobile number registration lookup, and real-time security PIN resets.
---

# medEco Customer Directory & Security PIN Management Skill

## Overview
The `CustomerDirectory` component (`src/components/CustomerDirectory.tsx`) allows store owners and pharmacists to inspect patient accounts, review historical bill receipts, check active dosage reminders, and assist patients who forgot their 4-digit security PIN.

## Key Workflows
1. **Branch-Level & All-Branch Customer Filtering**:
   - Filter customers by specific pharmacy branch (Hanamkonda, Warangal Main, Kazipet, Subedari) or view consolidated network accounts.
   - Search by mobile number, patient name, address, or email.
2. **Patient Profile & Metric Analysis**:
   - Total spent (INR), total order frequency, and last order date.
   - Complete itemized bill history with inspection of past tax receipts.
3. **Security PIN Inspection & Real-Time Reset**:
   - Pharmacists can toggle the eye icon to view a customer's current PIN and read it to them over the phone.
   - Pharmacists can enter a new 4-digit PIN and click "Update in Firebase RTDB".
   - Commits immediately to `/users/{customerMobile}/pin` and `/customers` in Firebase Realtime Database.
4. **Primary Branch Reassignment**:
   - Allows store owners to update a customer's assigned home branch.
