---
name: medeco-search-chatbot
description: Operational guide and architecture for the medEco AI Voice & Audio Search Chatbot, including speech recognition, voice memo recording, clinical symptom-to-tablet matching, conversational ordering, and WhatsApp order confirmation with live tracking.
---

# medEco AI Search Chatbot Skill

## Overview
The `SearchChatbot` component (`src/components/SearchChatbot.tsx`) provides an intelligent, conversational search, clinical tablet recommendation, and order fulfillment interface. It is exclusively rendered after a user authenticates (`session !== null`).

## Capabilities
1. **Multi-Modal Input Processing**:
   - **Speech Recognition**: Uses browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with `lang: 'en-IN'` to capture real-time spoken symptoms.
   - **Voice Memo Recording**: Uses `navigator.mediaDevices.getUserMedia` and `MediaRecorder` to capture audio notes (WebM) with audio playback and duration timers.
   - **Audio File Upload**: Accepts pre-recorded audio files (`.mp3`, `.wav`, `.m4a`, `.webm`, `.ogg`) via file input and extracts symptoms.
   - **Text Query Filtering**: Natural language parsing of common symptoms and medicine names with interactive suggestion chips.
2. **Clinical Symptom-to-Medicine Matching Engine**:
   - Matches clinical keywords against a predefined illness definition dictionary (`CLINICAL_ILLNESS_MAP`) covering fever, headaches, cold/flu, cough, acidity/GERD, abdominal spasms, diarrhea, allergies, diabetes, hypertension, vitamin deficiencies, and bacterial infections.
   - Cross-references matching medicines in `getMedicines()` and retrieves live stock across all 4 pharmacy stores via `getBranchStocks()`.
3. **Conversational Ordering & Follow-Up Flow**:
   - Following tablet recommendations, the AI directly asks the customer if they wish to proceed with an online prescription order.
   - Interactive Action Chips:
     - **"Proceed to Online Order"**: Pre-fills suggested tablets and clinical notes into `OnlineOrderModal` and opens it.
     - **"Include Existing Illness"**: Prompts the customer for chronic conditions or secondary symptoms to ensure safe supportive therapy.
     - **"Need Pharmacist Help"**: Instant helpline numbers and direct phone lines to all 4 nearest branches.
     - **"Clear Chat"** / **"Close Chat"** buttons for quick conversation lifecycle control.
4. **WhatsApp Order Confirmation & Deep-Link Live Tracking**:
   - Listens to `lastPlacedOrder` and automatically generates WhatsApp dispatch links:
     - **Send to Customer Mobile** (`wa.me/91${customerMobile}?text=...`): itemized receipt, order total, delivery hub, and live tracking deep-link.
     - **Alert Store Pharmacist** (`wa.me/91${branchPhone}?text=...`): instantly notifies dispensary staff with item breakdown and link to active SOP manager.
     - **In-App Live Tracking**: Direct navigation button to view the active order on the 5-stage SOP timeline (`/?track=${order.id}&tab=customer_history`).
5. **Role-Based Privacy Boundary**:
   - **Patient View**: Internal warehouse physical rack locations and box numbers are **strictly hidden**. Shows price (MRP), dosage advice, meal relation, stock availability, and a 1-tap "Add to Cart / Order" button.
   - **Owner View**: Exposes exact physical shelf location (e.g. `Rack A, Shelf 2 [Box-04]`), cost price, batch number, and a direct "View on Rack" shortcut button.
6. **Patient Account Shortcuts**:
   - Allows patients to ask *"My orders"* or *"Track order"* to review recent prescription orders.
   - Allows patients to ask *"My reminders"* or *"My schedule"* to view active dosage reminders.
7. **Background Scroll Lock & Mobile Viewport Protection**:
   - Calls `useModalScrollLock(isOpen && !isMinimized)` to freeze `<html>` and `<body>` background scrolling on both desktop and mobile whenever the chatbot is expanded.
   - Employs mobile backdrop overlay (`fixed inset-0 z-45 bg-slate-900/60 md:hidden`) that absorbs background touches and permits tap-to-minimize.
   - Floating launcher is placed comfortably at `bottom-20 right-4` on mobile to avoid overlapping the mobile bottom navigation bar.

## Props Interface
```typescript
interface SearchChatbotProps {
  session: UserSession | null;
  medicines: Medicine[];
  branches: PharmacyBranch[];
  onAddToCart?: (medicine: Medicine, quantity?: number) => void;
  onNavigateToRack?: (rackId: string) => void;
  onOpenOnlineOrder?: (prefillItems?: OnlineOrderItem[], notes?: string) => void;
  onNavigateToTab?: (tab: string) => void;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
  lastPlacedOrder?: OnlineOrder | null;
}
```

## Testing & Verification
- Verify that the floating chatbot button appears only when logged in.
- Test speech recognition in Google Chrome or Microsoft Edge by clicking the microphone button.
- Test audio file upload with sample `.mp3` or `.wav` voice recording.
- Verify that warehouse rack numbers do not appear when logged in as a customer.
- Verify that opening the chatbot freezes background page scroll, and closing/minimizing restores scrolling.
- Verify that after tablet suggestion, follow-up actions ("Proceed to Online Order", "Include Existing Illness", "Need Help") appear.
- Verify that submitting an online order generates the WhatsApp dispatch card with customer and owner WhatsApp buttons and live tracking link.
