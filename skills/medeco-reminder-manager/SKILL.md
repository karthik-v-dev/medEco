---
name: medeco-reminder-manager
description: Operational guide for medEco Medicine Reminders, daily dosage timing schedules, meal relations, and automated reminder alerts.
---

# medEco Medicine Dose Reminders Skill

## Overview
The `ReminderManager` component (`src/components/ReminderManager.tsx`) allows patients to schedule personalized medicine timings, configure dose relations (Before Food, After Food, Empty Stomach), and mark daily doses as taken.

## Key Workflows
1. **Dose Scheduling**:
   - Select medicine name, dosage strength, and frequency.
   - Choose multi-slot timings (Morning, Afternoon, Evening, Night) or custom hours.
   - Configure meal relation: *Before Food*, *After Food*, *With Food*, *Empty Stomach*.
2. **Patient Data Binding**:
   - Linked directly to the patient's registered mobile number in Firebase RTDB (`/reminders/{reminderId}`).
3. **Daily Tracking**:
   - Interactive checkboxes allow patients to mark each slot as taken for the day.
   - Visual progress indicators and streaks motivate consistent compliance.
