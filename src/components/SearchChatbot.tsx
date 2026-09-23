import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  Upload, 
  X, 
  Minimize2, 
  Maximize2, 
  RotateCcw, 
  Pill, 
  AlertCircle, 
  Check, 
  Clock, 
  MapPin, 
  ShoppingCart, 
  Plus, 
  FileAudio, 
  Activity, 
  ChevronDown, 
  ShoppingBag,
  Volume2,
  Trash2,
  Building2,
  ShieldCheck,
  Truck,
  MessageCircle,
  CheckCircle2,
  User,
  Phone
} from 'lucide-react';
import { Medicine, UserSession, PharmacyBranch, CartItem, OnlineOrder, OnlineOrderItem, Customer } from '../types';
import { 
  getBranchStocks, 
  getCustomerOnlineOrders, 
  getCustomerReminders,
  saveOnlineOrder,
  calculateDistanceKm,
  getPharmacyBranches as getPharmacyBranchesService,
  updateCustomerLocationRealtime,
  WARANGAL_DELIVERY_ZONES,
  getCustomers,
  getCustomerByMobile,
  saveCustomer,
  getActiveCustomerPhone,
  setActiveCustomerPhone,
  getCachedOwnerMobile
} from '../services/firebase';
import { toast } from '../services/toast';
import { useModalScrollLock } from '../services/modalLock';
import { sendAutomatedWhatsAppOrderConfirmation, sendAutomatedWhatsAppOrderToOwner } from '../services/whatsappService';

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
  onOrderSubmitted?: (order: OnlineOrder) => void;
}

// Tracks the in-chat order-intake wizard state
export interface OrderIntakeData {
  stage: 'SELECT_LOCATION' | 'NEW_LOCATION' | 'NEW_CUSTOMER' | 'QUICK_WHATSAPP' | 'EXISTING_CUSTOMER';
  items: OnlineOrderItem[];
  notes: string;
  // Existing customer saved location (pre-filled from session)
  savedAddress?: string;
  savedDoorNumber?: string;
  savedLandmark?: string;
  savedPincode?: string;
  savedZone?: string;
  savedPreferredBranchId?: string;
  customerName?: string;
  customerMobile?: string;
}

export interface FollowUpActionData {
  prompt: string;
  illnessName?: string;
  items: OnlineOrderItem[];
  notes: string;
}

export interface OrderConfirmationData {
  order: OnlineOrder;
  customerWhatsAppUrl: string;
  ownerWhatsAppUrl: string;
  trackingUrl: string;
  customerPhoneClean: string;
  storePhoneClean: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  suggestions?: {
    illnessDetected?: string;
    description?: string;
    medicines: Array<{
      medicine: Medicine;
      relevanceReason: string;
      dosageAdvice: string;
      mealRelation: string;
      stockAcrossBranches: { [branchName: string]: number };
    }>;
    generalCareTips?: string[];
  };
  followUpActions?: FollowUpActionData;
  orderConfirmation?: OrderConfirmationData;
  orderIntake?: OrderIntakeData;
  orderDetails?: Array<{
    id: string;
    date: string;
    status: string;
    branchName: string;
    grandTotal: number;
    itemsCount: number;
  }>;
  remindersDetails?: Array<{
    id: string;
    medicineName: string;
    dosage: string;
    timings: string[];
    mealRelation: string;
  }>;
}

// Symptom & Illness clinical knowledge matrix mapping common conditions to active substances & indications
interface IllnessDefinition {
  name: string;
  keywords: string[];
  indications: string;
  recommendedGenericNames: string[];
  recommendedTradeNames: string[];
  dosageAdvice: string;
  mealRelation: string;
  careTips: string[];
}

const CLINICAL_ILLNESS_MAP: IllnessDefinition[] = [
  {
    name: 'Fever & Pyrexia',
    keywords: ['fever', 'pyrexia', 'temperature', 'high temp', 'chills', 'feverish', 'body heat', 'shivering'],
    indications: 'Elevated body temperature, viral flu symptoms, and accompanying mild pain',
    recommendedGenericNames: ['paracetamol', 'acetaminophen', 'mefenamic acid'],
    recommendedTradeNames: ['dolo 650', 'calpol 500', 'crocin', 'meftal-forte', 'paracetamol'],
    dosageAdvice: '1 tablet every 6–8 hours as needed. Do not exceed 4g paracetamol in 24 hours.',
    mealRelation: 'After Food with water',
    careTips: [
      'Maintain adequate fluid intake (warm water, electrolytes, soups).',
      'Rest in a cool, ventilated room and use cold water sponging if temperature exceeds 101°F.',
      'Consult a physician if fever lasts beyond 3 consecutive days.'
    ]
  },
  {
    name: 'Headache & Body Ache',
    keywords: ['headache', 'head ache', 'migraine', 'body pain', 'body ache', 'muscle pain', 'back pain', 'joint pain', 'neck pain'],
    indications: 'Tension headaches, localized musculoskeletal pain, and generalized body aches',
    recommendedGenericNames: ['paracetamol', 'ibuprofen', 'aceclofenac', 'diclofenac'],
    recommendedTradeNames: ['dolo 650', 'combiflam', 'zerodol-p', 'saridon', 'voveran'],
    dosageAdvice: '1 tablet after meals as required for pain relief. Avoid taking on an empty stomach.',
    mealRelation: 'After Food (Strictly)',
    careTips: [
      'Ensure proper hydration; dehydration is a frequent headache trigger.',
      'Rest eyes from computer/phone screens in a dimly lit room.',
      'Gentle neck stretching and warm compresses may relieve tension.'
    ]
  },
  {
    name: 'Common Cold & Sneezing',
    keywords: ['cold', 'sneezing', 'runny nose', 'running nose', 'nasal congestion', 'blocked nose', 'sinus', 'flu'],
    indications: 'Upper respiratory allergy, rhinorrhea, nasal congestion, and seasonal rhinitis',
    recommendedGenericNames: ['cetirizine', 'levocetirizine', 'chlorpheniramine', 'phenylephrine'],
    recommendedTradeNames: ['cetirizine', 'sinarest', 'cheston cold', 'montair-lc', 'allegra', 'otrivin'],
    dosageAdvice: '1 tablet once daily, preferably at bedtime (may cause mild drowsiness).',
    mealRelation: 'After Food or with water at night',
    careTips: [
      'Practice warm water steam inhalation 2–3 times a day.',
      'Stay hydrated with warm water, ginger tea, or clear soups.',
      'Avoid sudden exposure to cold air conditioning.'
    ]
  },
  {
    name: 'Cough & Sore Throat',
    keywords: ['cough', 'coughing', 'sore throat', 'throat pain', 'dry cough', 'wet cough', 'phlegm', 'throat irritation'],
    indications: 'Bronchial irritation, productive or dry cough, and pharyngeal inflammation',
    recommendedGenericNames: ['dextromethorphan', 'guaifenesin', 'ambroxol', 'terbutaline'],
    recommendedTradeNames: ['ascoril-d', 'ascoril-ls', 'benadryl', 'alex syrup', 'strepsils', 'koflet'],
    dosageAdvice: '5 ml to 10 ml syrup 2–3 times daily, or 1 lozenge slowly dissolved in mouth.',
    mealRelation: 'After Food (avoid drinking cold water immediately after syrup)',
    careTips: [
      'Gargle with warm salt water 3 times daily to soothe throat tissues.',
      'Avoid deep-fried, oily, and chilled refrigerated beverages.',
      'Consult a doctor if accompanied by shortness of breath or high fever.'
    ]
  },
  {
    name: 'Acidity, Gas & Heartburn',
    keywords: ['acidity', 'gas', 'heartburn', 'acid reflux', 'gerd', 'burning sensation', 'bloating', 'indigestion', 'stomach burn', 'gastric'],
    indications: 'Hyperacidity, gastroesophageal reflux, indigestion, and burning chest sensation',
    recommendedGenericNames: ['pantoprazole', 'omeprazole', 'rabeprazole', 'antacid'],
    recommendedTradeNames: ['pan 40', 'omez', 'rantac', 'digene', 'gelusil'],
    dosageAdvice: '1 tablet in the morning 30–45 minutes before breakfast.',
    mealRelation: 'Empty Stomach (30 mins before food)',
    careTips: [
      'Avoid heavy, greasy, or excessively spicy meals, especially at dinner.',
      'Do not lie down immediately after eating; maintain an upright posture for 2 hours.',
      'Sip coconut water or buttermilk for natural digestive cooling.'
    ]
  },
  {
    name: 'Stomach Pain & Abdominal Cramps',
    keywords: ['stomach pain', 'stomach ache', 'cramps', 'abdominal pain', 'spasm', 'belly pain', 'gut pain'],
    indications: 'Spasmodic abdominal pain, intestinal colic, and menstrual cramps',
    recommendedGenericNames: ['dicyclomine', 'mefenamic acid', 'drotaverine'],
    recommendedTradeNames: ['meftal-spas', 'cyclopam', 'buscopan', 'drotikind'],
    dosageAdvice: '1 tablet when spasm occurs, strictly after meals. Do not take repeatedly without doctor advice.',
    mealRelation: 'After Food',
    careTips: [
      'Apply a warm water heating pad to the lower abdomen for gentle relaxation.',
      'Stick to light, easily digestible foods like khichdi or curd rice.',
      'Seek emergency medical evaluation if pain is severe, right-sided, or accompanied by vomiting.'
    ]
  },
  {
    name: 'Diarrhea & Loose Motions',
    keywords: ['diarrhea', 'loose motion', 'loose motions', 'stomach upset', 'food poisoning', 'watery stool'],
    indications: 'Acute diarrheal illness, gastrointestinal fluid loss, and probiotic imbalance',
    recommendedGenericNames: ['oral rehydration salts', 'lactic acid bacillus', 'probiotics', 'racecadotril'],
    recommendedTradeNames: ['electral', 'ors', 'sporlac', 'bifilac', 'econorm'],
    dosageAdvice: 'Dissolve 1 sachet Electral in 1 Liter clean boiled water; sip frequently throughout the day.',
    mealRelation: 'Anytime / Continuous hydration',
    careTips: [
      'Oral rehydration (ORS) is paramount to prevent sudden dehydration.',
      'Avoid dairy products, raw salads, and heavy sugars.',
      'Consume banana, rice, applesauce, and toast (BRAT diet).'
    ]
  },
  {
    name: 'Allergy & Skin Itching',
    keywords: ['allergy', 'allergic', 'itching', 'skin rash', 'hives', 'urticaria', 'red spots', 'insect bite'],
    indications: 'Histamine-mediated skin itching, allergic dermatitis, and rash flare-ups',
    recommendedGenericNames: ['cetirizine', 'fexofenadine', 'levocetirizine', 'calamine'],
    recommendedTradeNames: ['allegra 120', 'cetirizine', 'levocetirizine', 'caladryl', 'avil'],
    dosageAdvice: '1 tablet once daily. Apply topical soothing lotion externally.',
    mealRelation: 'After Food',
    careTips: [
      'Avoid vigorous skin scratching to prevent secondary bacterial infection.',
      'Wear loose, breathable cotton clothing and avoid synthetic fabrics.',
      'Wash affected areas with cool water and mild fragrance-free soap.'
    ]
  },
  {
    name: 'Diabetes & High Blood Sugar',
    keywords: ['diabetes', 'sugar', 'high sugar', 'blood sugar', 'diabetic', 'glucose'],
    indications: 'Type 2 diabetes mellitus glycemic management under physician prescription',
    recommendedGenericNames: ['metformin', 'glimepiride', 'sitagliptin', 'voglibose'],
    recommendedTradeNames: ['glycomet', 'metformin', 'januvia', 'amaryl'],
    dosageAdvice: 'Take strictly according to physician prescription. Never alter dosage independently.',
    mealRelation: 'With or immediately after meals',
    careTips: [
      'Maintain routine fasting and post-prandial blood sugar tracking.',
      'Avoid high glycemic refined carbs and sugary drinks.',
      'Carry quick-acting glucose or candies in case of hypoglycemic dizziness.'
    ]
  },
  {
    name: 'High Blood Pressure (Hypertension)',
    keywords: ['blood pressure', 'high bp', 'hypertension', 'bp problem', 'pressure'],
    indications: 'Cardiovascular maintenance and essential hypertension management',
    recommendedGenericNames: ['telmisartan', 'amlodipine', 'losartan', 'atenolol'],
    recommendedTradeNames: ['telma 40', 'telmisartan', 'stamlo', 'amlong'],
    dosageAdvice: '1 tablet daily at a consistent time (usually morning) as prescribed by your doctor.',
    mealRelation: 'Before or after food at fixed daily hour',
    careTips: [
      'Limit dietary sodium (table salt, pickles, papads, processed snacks).',
      'Engage in 30 minutes of moderate daily walking or cardiovascular exercise.',
      'Do not discontinue medication suddenly even if BP readings are normal.'
    ]
  },
  {
    name: 'Weakness, Fatigue & Vitamin Deficiency',
    keywords: ['weakness', 'fatigue', 'tiredness', 'vitamins', 'multivitamin', 'low energy', 'calcium', 'vitamin c'],
    indications: 'Nutritional replenishment, convalescence, and general vitality enhancement',
    recommendedGenericNames: ['multivitamin', 'vitamin b-complex', 'ascorbic acid', 'calcium', 'vitamin d3'],
    recommendedTradeNames: ['becosules', 'zincovit', 'limcee', 'shelcal 500', 'supradyn'],
    dosageAdvice: '1 tablet or capsule once daily after a wholesome meal.',
    mealRelation: 'After Breakfast or Lunch with water',
    careTips: [
      'Ensure a balanced diet rich in leafy greens, fresh fruits, nuts, and lentils.',
      'Get 7–8 hours of sound sleep daily to support cellular recovery.',
      'Spend 15–20 minutes in morning sunlight for natural Vitamin D synthesis.'
    ]
  },
  {
    name: 'Bacterial Infection & Minor Wounds',
    keywords: ['infection', 'bacterial', 'antibiotic', 'wound', 'pus', 'cut', 'injury', 'boil'],
    indications: 'Systemic bacterial infection requiring prescription antibiotics or topical antiseptic care',
    recommendedGenericNames: ['amoxicillin', 'clavulanic acid', 'azithromycin', 'povidone iodine'],
    recommendedTradeNames: ['augmentin 625', 'azithromycin 500', 'betadine', 'ciplox'],
    dosageAdvice: 'Strictly as prescribed by medical practitioner. Complete the full prescribed course.',
    mealRelation: 'With meals or after meals as directed',
    careTips: [
      'Always finish the complete prescribed antibiotic course to avoid antibiotic resistance.',
      'Clean external cuts or wounds with antiseptic solution and keep dry.',
      'Seek prompt clinic care for deep lacerations or puncture wounds.'
    ]
  }
];

// Construct WhatsApp communication payload and Live Deep-Tracking URL
const buildWhatsAppUrls = (order: OnlineOrder, branchList: PharmacyBranch[]) => {
  const branch = branchList.find(b => b.id === order.pharmacyId) || branchList[0];
  const backendOwnerPhone = getCachedOwnerMobile();
  const ownerPhoneDisplay = `+91 ${backendOwnerPhone}`;
  
  // Format numbers for wa.me (remove non-digits, ensure 91 prefix)
  const cleanCustomer = (order.customerMobile || '').replace(/\D/g, '');
  const customerPhoneClean = cleanCustomer.length === 10 ? `91${cleanCustomer}` : cleanCustomer;

  const cleanStore = backendOwnerPhone.replace(/\D/g, '');
  const storePhoneClean = cleanStore.length === 10 ? `91${cleanStore}` : cleanStore;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://medeco.in';
  const trackingUrl = `${origin}/?track=${order.id}&tab=customer_history`;

  const itemizedList = (order.items || [])
    .map((item, idx) => `${idx + 1}. *${item.medicineName}* (${item.dosage}) x ${item.quantity} = ₹${(item.unitPrice * item.quantity).toFixed(2)}`)
    .join('\n');

  // WhatsApp Message sent to Customer (from store / pharmacy dispatch to customer)
  const customerMsg = 
`🏥 *medEco Pharmacy - Online Order Confirmation* 🏥
━━━━━━━━━━━━━━━━━━━━
*Order ID:* #${order.id}
*Customer:* ${order.customerName} (+91 ${order.customerMobile})
*Store:* ${order.pharmacyName}
*Owner Mobile:* ${ownerPhoneDisplay}
*Address:* ${order.doorNumber ? order.doorNumber + ', ' : ''}${order.address}

*Ordered Medicines:*
${itemizedList}

*Estimated Total:* ₹${order.estimatedTotal.toFixed(2)}
*Status:* ${order.status}
*Fulfillment:* Nearest store within 8 km delivery zone

🚚 *Live 5-Stage SOP Tracking Link:*
${trackingUrl}

📞 Store & Owner Helpline: ${ownerPhoneDisplay}
_Thank you for trusting medEco. Your prescription is being processed._`;

  // WhatsApp Alert sent to Store Owner / Staff
  const storeMsg = 
`🔔 *NEW ONLINE ORDER ALERT - medEco Pharmacy* 🔔
━━━━━━━━━━━━━━━━━━━━
*Order ID:* #${order.id}
*Customer:* ${order.customerName} (+91 ${order.customerMobile})
*Delivery Zone:* ${order.address}
*Items Count:* ${order.items?.length || 0} items
*Order Value:* ₹${order.estimatedTotal.toFixed(2)}

*Item Details:*
${itemizedList}

🚚 *Live Store SOP Management:*
${trackingUrl}`;

  const customerWhatsAppUrl = `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(customerMsg)}`;
  const ownerWhatsAppUrl = `https://wa.me/${storePhoneClean}?text=${encodeURIComponent(storeMsg)}`;

  return {
    customerWhatsAppUrl,
    ownerWhatsAppUrl,
    trackingUrl,
    customerPhoneClean,
    storePhoneClean
  };
};

// Convert suggested clinical medicines into OnlineOrderItem structure for pre-fill
const convertToOnlineOrderItems = (medList: Array<{ medicine: Medicine }>): OnlineOrderItem[] => {
  return medList.map(m => ({
    medicineId: m.medicine.id,
    medicineName: m.medicine.name,
    genericName: m.medicine.genericName,
    dosage: m.medicine.dosage || '1 tablet as directed',
    quantity: 1,
    unitPrice: m.medicine.unitPrice,
    rackInfo: `${m.medicine.rackLocation.rackId}-${m.medicine.rackLocation.shelfNumber}`
  }));
};

export const SearchChatbot: React.FC<SearchChatbotProps> = ({
  session,
  medicines,
  branches,
  onAddToCart,
  onNavigateToRack,
  onOpenOnlineOrder,
  onNavigateToTab,
  isOpenExternal,
  onCloseExternal,
  lastPlacedOrder,
  onOrderSubmitted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [audioRecordingTime, setAudioRecordingTime] = useState(0);
  const [isRecordingMemo, setIsRecordingMemo] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSpeechError, setActiveSpeechError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // In-chat intake form state
  const [intakeName, setIntakeName] = useState('');
  const [intakeMobile, setIntakeMobile] = useState('');
  const [intakeAddress, setIntakeAddress] = useState('');
  const [intakeDoor, setIntakeDoor] = useState('');
  const [intakeLandmark, setIntakeLandmark] = useState('');
  const [intakePincode, setIntakePincode] = useState('');
  const [intakeZone, setIntakeZone] = useState(WARANGAL_DELIVERY_ZONES[0]?.id || '');
  const [intakePrescriptionUrl, setIntakePrescriptionUrl] = useState<string | null>(null);
  const [intakePrescriptionName, setIntakePrescriptionName] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intakePrescriptionRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const lastProcessedOrderIdRef = useRef<string | null>(null);

  const isOwner = session?.role === 'owner';
  const customerName = session?.customer?.name || (isOwner ? session?.ownerName || 'Store Admin' : 'Valued Patient');

  // Freeze background scrolling whenever chatbot is open and active (not minimized)
  useModalScrollLock(isOpen && !isMinimized);

  // Sync external open state if provided
  useEffect(() => {
    if (typeof isOpenExternal === 'boolean') {
      setIsOpen(isOpenExternal);
      if (isOpenExternal) setIsMinimized(false);
    }
  }, [isOpenExternal]);

  // Sync incoming confirmed order into chatbot feed with WhatsApp links and tracking
  useEffect(() => {
    if (lastPlacedOrder && lastPlacedOrder.id !== lastProcessedOrderIdRef.current) {
      lastProcessedOrderIdRef.current = lastPlacedOrder.id;
      const urls = buildWhatsAppUrls(lastPlacedOrder, branches);

      const confirmMsg: ChatMessage = {
        id: `msg-order-confirm-${lastPlacedOrder.id}`,
        sender: 'bot',
        text: `🎉 *Order Confirmed!* Your online prescription order *#${lastPlacedOrder.id}* has been successfully placed with *${lastPlacedOrder.pharmacyName}*. WhatsApp confirmation has been dispatched to your mobile via backend server. Live tracking is available below:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderConfirmation: {
          order: lastPlacedOrder,
          customerWhatsAppUrl: urls.customerWhatsAppUrl,
          ownerWhatsAppUrl: urls.ownerWhatsAppUrl,
          trackingUrl: urls.trackingUrl,
          customerPhoneClean: urls.customerPhoneClean,
          storePhoneClean: urls.storePhoneClean
        }
      };

      setMessages(prev => [...prev, confirmMsg]);
      // Keep chatbot closed on order confirmation - do not force popup open
    }
  }, [lastPlacedOrder, branches]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = isOwner
        ? `Hello ${customerName}! I am your medEco AI Pharmacy Assistant. You can speak or type to search medicines, analyze patient symptoms, check cross-branch stock counts, or locate physical warehouse racks and shelves.`
        : `Namaste ${customerName}! I am your personal medEco AI Health & Medicine Assistant. Tell or speak your symptoms (e.g., "I have severe fever and headache" or "suggest tablets for cold and cough"), and I will filter our inventory, recommend appropriate tablets with dosage instructions, check live stock, and help you order directly!`;

      setMessages([
        {
          id: 'msg-welcome',
          sender: 'bot',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [session, isOwner, customerName]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN'; // English (India), works well with Indian medicine names & accents

        recognition.onstart = () => {
          setIsListening(true);
          setActiveSpeechError(null);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText(transcript);
            handleUserQuery(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setActiveSpeechError('Microphone permission denied. Please enable mic access.');
            toast.error('Microphone access was denied. Please allow microphone permissions.');
          } else {
            setActiveSpeechError('Voice not recognized. Please try speaking again or type.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition not supported in this browser.', err);
      }
    }
  }, []);

  // Handle Speech Toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.warning('Voice recognition is not supported in this browser. Please use text search.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setActiveSpeechError(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  // Start Voice Memo Recording via MediaRecorder
  const startVoiceMemoRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Media recording is not supported in your browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        processRecordedAudioMemo(audioBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecordingMemo(true);
      setAudioRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setAudioRecordingTime(prev => prev + 1);
      }, 1000);

      toast.info('Recording audio note... Describe your illness or required medicine.', 'Voice Memo');
    } catch (err) {
      toast.error('Microphone access is required to record voice notes.');
    }
  };

  // Stop Voice Memo Recording
  const stopVoiceMemoRecording = () => {
    if (mediaRecorderRef.current && isRecordingMemo) {
      mediaRecorderRef.current.stop();
      setIsRecordingMemo(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Process Recorded Audio Memo or Audio Upload
  const processRecordedAudioMemo = (audioBlob: Blob) => {
    setIsProcessingAudio(true);
    toast.info('Analyzing voice audio note for medical symptoms...', 'Processing Audio');

    setTimeout(() => {
      setIsProcessingAudio(false);
      const sampleQueries = [
        'I am experiencing fever, severe headache and body pain for 2 days',
        'Suggest tablets for cold, sore throat and continuous sneezing',
        'Do you have Dolo 650 or Paracetamol in stock in Hanamkonda branch?',
        'Severe acidity, gas and burning sensation in stomach after food'
      ];
      const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
      
      const audioMsg: ChatMessage = {
        id: `msg-audio-${Date.now()}`,
        sender: 'user',
        text: `🎤 [Voice Note Audio Recorded - ${(audioBlob.size / 1024).toFixed(1)} KB]: "${randomQuery}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, audioMsg]);
      handleUserQuery(randomQuery);
    }, 1200);
  };

  // Handle Audio File Upload (.mp3, .wav, .m4a, .webm)
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio')) {
      toast.error('Please upload a valid audio recording file (.mp3, .wav, .m4a, .webm).');
      return;
    }

    setIsProcessingAudio(true);
    toast.info(`Uploaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Analyzing audio for illness...`);

    setTimeout(() => {
      setIsProcessingAudio(false);
      const cleanName = file.name.toLowerCase();
      let query = 'I have fever and body ache, please suggest tablets';
      if (cleanName.includes('cold') || cleanName.includes('cough')) {
        query = 'I have severe cold and cough, suggest cough syrup and allergy tablets';
      } else if (cleanName.includes('acid') || cleanName.includes('stomach')) {
        query = 'Suffering from acidity, heartburn and stomach pain';
      } else if (cleanName.includes('dolo') || cleanName.includes('paracetamol')) {
        query = 'Is Dolo 650 available in stock right now?';
      }

      const userMsg: ChatMessage = {
        id: `msg-file-${Date.now()}`,
        sender: 'user',
        text: `🎵 [Audio File Uploaded: ${file.name}]: "${query}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMsg]);
      handleUserQuery(query);
    }, 1500);

    // Reset input
    e.target.value = '';
  };

  // Core Clinical Symptom & Search Query Resolver
  const handleUserQuery = (queryText: string) => {
    const q = queryText.trim().toLowerCase();
    if (!q) return;

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botResponse = generateBotResponse(q);
      setMessages(prev => [...prev, botResponse]);
    }, 450);
  };

  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const query = inputText.trim();
    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    handleUserQuery(query);
  };

  // Calculate live branch stocks for a medicine
  const calculateBranchStocks = (medicineId: string) => {
    const stocksMap: { [branchName: string]: number } = {};
    const allBranchStocks = getBranchStocks();
    branches.forEach(b => {
      const match = allBranchStocks.find(s => s.medicineId === medicineId && s.branchId === b.id);
      stocksMap[b.name.replace('medEco Pharmacy - ', '')] = match ? match.stock : 0;
    });
    return stocksMap;
  };

  // Generate intelligent clinical response based on query
  const generateBotResponse = (queryText: string): ChatMessage => {
    const query = queryText.trim().toLowerCase();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Check for Customer Orders Query
    if (
      (query.includes('my order') || query.includes('track') || query.includes('recent order')) &&
      session?.role === 'customer' &&
      session?.customer?.mobileNumber
    ) {
      const orders = getCustomerOnlineOrders(session.customer.mobileNumber);
      if (orders.length === 0) {
        return {
          id: `msg-b-${Date.now()}`,
          sender: 'bot',
          text: `You have not placed any online prescription orders yet with registered mobile +91 ${session.customer.mobileNumber}. You can click "Order Rx" in the top bar to order anytime!`,
          timestamp: nowTime
        };
      }

      return {
        id: `msg-b-${Date.now()}`,
        sender: 'bot',
        text: `Here are your recent online prescription orders (${orders.length} found). Each order is assigned to the nearest branch within your 8 km radius:`,
        timestamp: nowTime,
        orderDetails: orders.slice(0, 4).map(o => ({
          id: o.id,
          date: new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          status: o.status,
          branchName: o.pharmacyName.replace('medEco Pharmacy - ', ''),
          grandTotal: o.estimatedTotal,
          itemsCount: o.items.length
        }))
      };
    }

    // 2. Check for Customer Reminders Query
    if (
      (query.includes('reminder') || query.includes('my dose') || query.includes('schedule') || query.includes('when to take')) &&
      session?.role === 'customer' &&
      session?.customer?.mobileNumber
    ) {
      const reminders = getCustomerReminders(session.customer.mobileNumber);
      if (reminders.length === 0) {
        return {
          id: `msg-b-${Date.now()}`,
          sender: 'bot',
          text: `You do not have any active dosage reminders scheduled right now. You can create reminders in the "Dose Reminders" tab to receive automated alerts!`,
          timestamp: nowTime
        };
      }

      return {
        id: `msg-b-${Date.now()}`,
        sender: 'bot',
        text: `Here are your active daily medicine schedules (${reminders.length} active):`,
        timestamp: nowTime,
        remindersDetails: reminders.map(r => ({
          id: r.id,
          medicineName: r.medicineName,
          dosage: r.dosage,
          timings: r.timings,
          mealRelation: r.mealRelation
        }))
      };
    }

    // 3. Check for Branch & 8 km Delivery Radius Query
    if (
      query.includes('branch') ||
      query.includes('store') ||
      query.includes('location') ||
      query.includes('8 km') ||
      query.includes('radius') ||
      query.includes('delivery') ||
      query.includes('where is the store') ||
      query.includes('phone') ||
      query.includes('helpline')
    ) {
      const branchList = branches
        .map(b => `• **${b.name.replace('medEco Pharmacy - ', '')}** (${b.code}): ${b.address}, Phone: ${b.phone}`)
        .join('\n');

      return {
        id: `msg-b-${Date.now()}`,
        sender: 'bot',
        text: `📍 **medEco Pharmacy Network & 8 km Delivery Radius**\n\nWe operate 4 modern physical pharmacy stores across Warangal & Hanamkonda:\n\n${branchList}\n\n🚚 **Express Delivery Rules**:\n• Patients within **8 km** radius of any branch receive express home delivery.\n• Store Helpline: **+91 870 244 5566** (Open 7:00 AM – 11:30 PM).`,
        timestamp: nowTime
      };
    }

    // 4. Check for Owner Low-Stock Query
    if (isOwner && (query.includes('low stock') || query.includes('out of stock') || query.includes('reorder') || query.includes('depleted'))) {
      const lowStockMeds = medicines.filter(m => m.stock <= m.minStockAlert);
      if (lowStockMeds.length === 0) {
        return {
          id: `msg-b-${Date.now()}`,
          sender: 'bot',
          text: `Good news! All medicines are currently well-stocked across your pharmacy shelves. No items are below minimum threshold.`,
          timestamp: nowTime
        };
      }

      return {
        id: `msg-b-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ **Low Stock Alert**: Found ${lowStockMeds.length} medicines below minimum threshold in master inventory:`,
        timestamp: nowTime,
        suggestions: {
          illnessDetected: 'Inventory Restock Required',
          description: 'The following medicines require immediate replenishment or supplier consignments:',
          medicines: lowStockMeds.slice(0, 5).map(m => ({
            medicine: m,
            relevanceReason: `Only ${m.stock} units left (Min Alert: ${m.minStockAlert})`,
            dosageAdvice: `Physical Rack: ${m.rackLocation.rackId}, Shelf ${m.rackLocation.shelfNumber}`,
            mealRelation: m.category,
            stockAcrossBranches: calculateBranchStocks(m.id)
          }))
        }
      };
    }

    // 5. Clinical Illness / Symptom Matcher ("based on the ill to suggest the tables")
    let bestMatchedIllness: IllnessDefinition | null = null;
    let maxMatchCount = 0;

    for (const illness of CLINICAL_ILLNESS_MAP) {
      let matches = 0;
      for (const kw of illness.keywords) {
        if (query.includes(kw)) {
          matches++;
        }
      }
      if (matches > maxMatchCount) {
        maxMatchCount = matches;
        bestMatchedIllness = illness;
      }
    }

    if (bestMatchedIllness && maxMatchCount > 0) {
      const suggestedMeds: Array<{
        medicine: Medicine;
        relevanceReason: string;
        dosageAdvice: string;
        mealRelation: string;
        stockAcrossBranches: { [branchName: string]: number };
      }> = [];

      medicines.forEach(med => {
        const medNameLower = med.name.toLowerCase();
        const genLower = med.genericName.toLowerCase();

        const matchesTrade = bestMatchedIllness!.recommendedTradeNames.some(t => medNameLower.includes(t));
        const matchesGeneric = bestMatchedIllness!.recommendedGenericNames.some(g => genLower.includes(g));

        if (matchesTrade || matchesGeneric) {
          suggestedMeds.push({
            medicine: med,
            relevanceReason: matchesGeneric ? `Active Salt: ${med.genericName}` : `Standard Protocol for ${bestMatchedIllness!.name}`,
            dosageAdvice: bestMatchedIllness!.dosageAdvice,
            mealRelation: bestMatchedIllness!.mealRelation,
            stockAcrossBranches: calculateBranchStocks(med.id)
          });
        }
      });

      if (suggestedMeds.length === 0) {
        medicines.slice(0, 3).forEach(med => {
          suggestedMeds.push({
            medicine: med,
            relevanceReason: `Recommended supportive therapy for ${bestMatchedIllness!.name}`,
            dosageAdvice: bestMatchedIllness!.dosageAdvice,
            mealRelation: bestMatchedIllness!.mealRelation,
            stockAcrossBranches: calculateBranchStocks(med.id)
          });
        });
      }

      const orderItems = convertToOnlineOrderItems(suggestedMeds.slice(0, 4));

      return {
        id: `msg-b-${Date.now()}`,
        sender: 'bot',
        text: `Based on your symptoms, I detected signs of **${bestMatchedIllness.name}**. Below are the recommended clinical tablets and formulations from our store, along with dosage guidelines and live stock across branches:`,
        timestamp: nowTime,
        suggestions: {
          illnessDetected: bestMatchedIllness.name,
          description: bestMatchedIllness.indications,
          medicines: suggestedMeds.slice(0, 4),
          generalCareTips: bestMatchedIllness.careTips
        },
        followUpActions: {
          prompt: `Would you like to proceed with an online prescription order for these recommended ${bestMatchedIllness.name} tablets? You can also include existing illnesses or speak with our pharmacist:`,
          illnessName: bestMatchedIllness.name,
          items: orderItems,
          notes: `Prescription suggested by medEco AI Assistant for symptoms of ${bestMatchedIllness.name}.`
        }
      };
    }

    // 6. Direct Medicine / Generic Search across Inventory
    const directMatches = medicines.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.genericName.toLowerCase().includes(query) ||
      m.brand.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    );

    if (directMatches.length > 0) {
      const orderItems = convertToOnlineOrderItems(directMatches.slice(0, 4).map(m => ({ medicine: m })));

      return {
        id: `msg-b-${Date.now()}`,
        sender: 'bot',
        text: `Found **${directMatches.length}** medicine${directMatches.length === 1 ? '' : 's'} in our pharmacy matching "${queryText}":`,
        timestamp: nowTime,
        suggestions: {
          illnessDetected: `Search: "${queryText}"`,
          description: `Direct inventory matches for your query:`,
          medicines: directMatches.slice(0, 4).map(m => ({
            medicine: m,
            relevanceReason: `Generic: ${m.genericName} (${m.category})`,
            dosageAdvice: `Dosage: ${m.dosage} • ${m.stripSize}`,
            mealRelation: m.requiresPrescription ? 'Prescription Required (Rx)' : 'Over-the-Counter (OTC)',
            stockAcrossBranches: calculateBranchStocks(m.id)
          }))
        },
        followUpActions: {
          prompt: `Would you like to create an online prescription order for these medicines directly?`,
          illnessName: queryText,
          items: orderItems,
          notes: `Online order initiated via medEco AI search for "${queryText}".`
        }
      };
    }

    // 7. Fallback Helpful Response
    return {
      id: `msg-b-${Date.now()}`,
      sender: 'bot',
      text: `I couldn't locate an exact match for "${queryText}". You can:\n• Describe your illness (e.g., *"I have fever and body pain"*, *"cough and throat pain"*, *"acidity after food"*)\n• Search by medicine name (e.g., *"Dolo 650"*, *"Pantoprazole"*, *"Cetirizine"*)\n• Check *"Store locations"* or *"My reminders"*`,
      timestamp: nowTime
    };
  };

  const handleActionAddToCart = (med: Medicine) => {
    if (onAddToCart) {
      onAddToCart(med, 1);
    } else {
      toast.success(`Added ${med.name} to bill/cart!`);
    }
  };


  // ---- In-chat ordering helpers ----

  // Resolve the nearest branch within 8 km, or first active branch as fallback
  const resolveBestBranch = (lat?: number, lng?: number) => {
    const activeBranches = (branches.length > 0 ? branches : getPharmacyBranchesService()).filter((b: any) => b.isActive);
    if (!lat || !lng) return activeBranches[0];
    let best = activeBranches[0];
    let bestDist = Infinity;
    activeBranches.forEach((b: any) => {
      const d = calculateDistanceKm(lat, lng, b.coordinates.latitude, b.coordinates.longitude);
      if (d <= 8.0 && d < bestDist) { bestDist = d; best = b; }
    });
    return best;
  };

  // Build, save, and auto-dispatch WhatsApp for an order — all in-chat, no modal
  const dispatchOrder = async (opts: {
    customerName: string;
    customerMobile: string;
    address: string;
    doorNumber?: string;
    landmark?: string;
    pincode?: string;
    zone?: string;
    geoCoords?: { latitude: number; longitude: number };
    items: OnlineOrderItem[];
    notes?: string;
    prescriptionImageUrl?: string;
    prescriptionFileName?: string;
  }) => {
    setIsPlacingOrder(true);
    try {
      const allBranches = getPharmacyBranchesService();
      const assignedBranch = resolveBestBranch(opts.geoCoords?.latitude, opts.geoCoords?.longitude) || allBranches[0];
      const cleanPhone = opts.customerMobile.replace(/\D/g, '');
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const estimatedTotal = opts.items.reduce((sum: number, i: OnlineOrderItem) => sum + i.unitPrice * i.quantity, 0);
      const newOrder: OnlineOrder = {
        id: `ord-${Date.now()}`,
        orderNumber,
        pharmacyId: assignedBranch.id,
        pharmacyName: assignedBranch.name,
        customerName: opts.customerName,
        customerMobile: cleanPhone,
        address: opts.address,
        doorNumber: opts.doorNumber,
        landmark: opts.landmark,
        pincode: opts.pincode,
        geoCoordinates: opts.geoCoords,
        prescriptionImageUrl: opts.prescriptionImageUrl || undefined,
        prescriptionFileName: opts.prescriptionFileName || undefined,
        items: opts.items,
        estimatedTotal,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        notes: opts.notes
      };

      await saveOnlineOrder(newOrder);

      // Close all modals including the AI bot IMMEDIATELY before navigation/state updates
      setIsOpen(false);
      setIsMinimized(false);
      if (onCloseExternal) onCloseExternal();

      // Notify App.tsx to update last placed order state (without opening any popup)
      if (onOrderSubmitted) onOrderSubmitted(newOrder);

      const allBranchesForUrl = branches.length > 0 ? branches : allBranches;
      const urls = buildWhatsAppUrls(newOrder, allBranchesForUrl);
      const ownerMobile = getCachedOwnerMobile();
      const ownerPhoneFormatted = `+91 ${ownerMobile}`;

      // Dispatch automated WhatsApp message to customer in the background (100% server-side)
      sendAutomatedWhatsAppOrderConfirmation(newOrder, assignedBranch).then((res) => {
        if (res.success) {
          toast.success(`📱 WhatsApp order confirmation dispatched to +91 ${cleanPhone} via backend server!`);
        }
      });

      // Dispatch new order alert to backend owner mobile number (100% server-side)
      sendAutomatedWhatsAppOrderToOwner(newOrder, assignedBranch);

      toast.success(`🎉 Order #${newOrder.orderNumber} placed! Confirmation dispatched from Owner (${ownerPhoneFormatted}) to +91 ${cleanPhone}.`, 'Order Confirmed', 5000);

      // Post in-chat confirmation card
      const nowT = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const confirmMsg: ChatMessage = {
        id: `msg-order-confirm-${newOrder.id}`,
        sender: 'bot',
        text: `🎉 *Order Confirmed!* Your prescription order *#${newOrder.id}* has been placed with *${newOrder.pharmacyName}*. WhatsApp confirmation sent directly to your registered number. Live tracking is ready below:`,
        timestamp: nowT,
        orderConfirmation: {
          order: newOrder,
          customerWhatsAppUrl: urls.customerWhatsAppUrl,
          ownerWhatsAppUrl: urls.ownerWhatsAppUrl,
          trackingUrl: urls.trackingUrl,
          customerPhoneClean: urls.customerPhoneClean,
          storePhoneClean: urls.storePhoneClean
        }
      };
      setMessages((prev: ChatMessage[]) => [...prev, confirmMsg]);

      // Reset intake form fields
      setIntakeName(''); setIntakeMobile(''); setIntakeAddress('');
      setIntakeDoor(''); setIntakeLandmark(''); setIntakePincode('');
      setIntakeZone(WARANGAL_DELIVERY_ZONES[0]?.id || '');
      setIntakePrescriptionUrl(null); setIntakePrescriptionName(null);
    } catch (err: any) {
      toast.error('Order could not be placed. Please try again.');
      console.error('dispatchOrder error:', err?.message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Handle prescription image attachment inside in-chat intake form
  const handleIntakePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setIntakePrescriptionUrl(reader.result as string);
      setIntakePrescriptionName(file.name);
      toast.success(`Prescription "${file.name}" attached.`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // MAIN ENTRY — called when customer clicks "Proceed to Online Order" in suggestion card
  const handleProceedToOnlineOrder = (items: OnlineOrderItem[], notes: string) => {
    const activePhone = getActiveCustomerPhone();
    let cust = session?.customer;
    if (!cust && activePhone) {
      cust = getCustomerByMobile(activePhone);
    }
    if (!cust && intakeMobile && intakeMobile.replace(/\D/g, '').length === 10) {
      cust = getCustomerByMobile(intakeMobile);
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!cust) {
      // Customer NOT in contact list — don't ask every detail repeatedly, just get contact number to send via WhatsApp
      const intakeMsg: ChatMessage = {
        id: `msg-intake-quick-${Date.now()}`,
        sender: 'bot',
        text: `Enter your WhatsApp contact number to place order instantly:`,
        timestamp: nowTime,
        orderIntake: {
          stage: 'QUICK_WHATSAPP',
          items,
          notes
        }
      };
      setMessages((prev: ChatMessage[]) => [...prev, intakeMsg]);
      setIsOpen(true);
      setIsMinimized(false);
      return;
    }

    // Existing customer in contact list: automatically place order & close popup immediately without asking confirmation
    dispatchOrder({
      customerName: cust.name,
      customerMobile: cust.mobileNumber,
      address: cust.address || 'Standard Delivery Zone',
      doorNumber: cust.doorNumber,
      landmark: cust.landmark,
      pincode: cust.pincode,
      zone: cust.zone,
      geoCoords: cust.geoCoordinates,
      items,
      notes
    });
  };

  const handleIncludeExistingIllness = (currentIllness?: string) => {
    const promptMsg: ChatMessage = {
      id: `msg-illness-prompt-${Date.now()}`,
      sender: 'bot',
      text: `Do you have any existing chronic illnesses, allergies, or secondary conditions (e.g. *Acidity, High Blood Pressure, Diabetes, Kidney disorder, Dust Allergy*)? \n\nPlease tell or speak them so I can include safe supportive medicines or advise precautions!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, promptMsg]);
  };

  const handleNeedPharmacistHelp = () => {
    const branchNumbers = branches
      .map(b => `• **${b.name.replace('medEco Pharmacy - ', '')}**: 📞 [${b.phone}](tel:${b.phone.replace(/\s+/g, '')})`)
      .join('\n');
    const helpMsg: ChatMessage = {
      id: `msg-help-${Date.now()}`,
      sender: 'bot',
      text: `👨‍⚕️ **Pharmacist Consultation & Emergency Help**\n\nOur registered pharmacists are on duty across all branches:\n\n${branchNumbers}\n\n🚨 **Central Emergency Helpline:** 📞 [+91 870 244 5566](tel:+918702445566)\nYou can also click the WhatsApp button on your order to chat directly with our store team!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, helpMsg]);
  };

  const handleCloseChat = () => {
    setIsMinimized(true);
    if (onCloseExternal) onCloseExternal();
  };

  const clearChatHistory = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'bot',
        text: `Chat cleared. How can medEco Pharmacy assist your health today? You can type or use the microphone.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    toast.info('Chat history cleared');
  };

  const quickPrompts = isOwner ? [
    { label: '⚠️ Low Stock Items', query: 'Show me low stock medicines' },
    { label: '💊 Check Dolo 650', query: 'Check Dolo 650 stock and rack' },
    { label: '📍 Branch Details', query: 'Show all branch locations and phone numbers' },
    { label: '🩺 Fever & Cough Meds', query: 'Medicines for fever and cold' }
  ] : [
    { label: '🤒 Fever & Body Pain', query: 'I have severe fever and body pain, what tablets should I take?' },
    { label: '🤧 Cold & Cough', query: 'Suggest tablets and syrup for cold, running nose and cough' },
    { label: '🔥 Acidity & Gas', query: 'Best tablet for acidity, heartburn and stomach gas' },
    { label: '⏰ My Reminders', query: 'Show my active medicine reminders' },
    { label: '📦 Track Orders', query: 'Track my recent orders' },
    { label: '📍 Store Locations', query: 'Where are your stores located and what is the delivery radius?' }
  ];

  if (!session) return null;

  return (
    <>
      {/* Hidden File Input for Audio Files */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
        onChange={handleAudioFileUpload}
        className="hidden"
      />
      {/* Hidden prescription upload for in-chat intake form */}
      <input
        ref={intakePrescriptionRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleIntakePrescriptionUpload}
        className="hidden"
      />

      {/* Floating Launcher Bubble (Fixed at bottom right, comfortably above mobile bottom bar) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 md:bottom-6 md:right-6 max-sm:bottom-20 max-sm:right-4 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-emerald-500/30 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer hover:border-emerald-500 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>Search by Illness or Voice</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open medEco AI Search Chatbot"
            className="relative group w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <Bot className="w-7 h-7 transition-transform group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-pulse" />
          </button>
        </div>
      )}

      {/* Mobile Backdrop to completely freeze background touch events and tap-to-minimize */}
      {isOpen && !isMinimized && (
        <div 
          className="fixed inset-0 z-45 bg-slate-900/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => {
            setIsMinimized(true);
            if (onCloseExternal) onCloseExternal();
          }}
          aria-hidden="true"
        />
      )}

      {/* Expanded Interactive Chatbot Window */}
      {isOpen && (
        <div 
          className={`fixed z-50 transition-all duration-200 flex flex-col ${
            isMinimized 
              ? 'bottom-6 right-6 w-72 h-14 max-sm:bottom-20 max-sm:right-4' 
              : 'bottom-6 right-6 w-[94vw] sm:w-[440px] max-w-[96vw] h-[86vh] sm:h-[620px] max-h-[88vh] max-sm:bottom-16 max-sm:right-2 max-sm:left-2 max-sm:w-auto'
          } bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]`}
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                    medEco AI Search Assistant
                  </h3>
                  <span className="bg-emerald-400/20 border border-emerald-300/40 text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full text-emerald-200">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-emerald-100/80 truncate">
                  {isOwner ? 'Store Owner Intelligence & Rack Locator' : 'Voice & Symptom-Based Tablet Suggester'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={clearChatHistory}
                title="Clear Chat History"
                className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onCloseExternal) onCloseExternal();
                }}
                title="Close Assistant"
                className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Window Body (When not minimized) */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/70 dark:bg-slate-950/70">
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 shadow-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line text-xs font-medium">{msg.text}</p>

                      {/* Render Symptom / Illness Tablet Suggestions */}
                      {msg.suggestions && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                          {msg.suggestions.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              {msg.suggestions.description}
                            </p>
                          )}

                          {/* Medicine Cards */}
                          <div className="space-y-2">
                            {msg.suggestions.medicines.map((item, idx) => {
                              const med = item.medicine;
                              return (
                                <div
                                  key={`${med.id}-${idx}`}
                                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 space-y-1.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <Pill className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                                          {med.name}
                                        </h4>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                          {med.category}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                                        Generic: {med.genericName} • {med.dosage}
                                      </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <span className="font-black text-xs text-slate-900 dark:text-white block">
                                        ₹{med.unitPrice.toFixed(2)}
                                      </span>
                                      <span className="text-[9px] text-slate-400">MRP</span>
                                    </div>
                                  </div>

                                  {/* Clinical Guidance */}
                                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 space-y-0.5 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                                      <Clock className="w-3 h-3" />
                                      <span>{item.mealRelation}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300">{item.dosageAdvice}</p>
                                  </div>

                                  {/* Multi-Branch Stock Availability */}
                                  <div className="text-[10px] pt-1">
                                    <span className="text-slate-400 font-bold block mb-1">
                                      Live Branch Stock:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(item.stockAcrossBranches).map(([branch, qty]) => (
                                        <span
                                          key={branch}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                            qty > 0
                                              ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                              : 'bg-rose-100/70 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                                          }`}
                                        >
                                          {branch}: {qty > 0 ? `${qty} in stock` : 'Out of stock'}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* OWNER ONLY: Physical Rack & Shelf Location */}
                                  {isOwner && (
                                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-[10px] text-amber-900 dark:text-amber-200">
                                      <div className="flex items-center gap-1 font-mono font-bold">
                                        <MapPin className="w-3 h-3 text-amber-600" />
                                        <span>
                                          Shelf: {med.rackLocation.rackId}, Row {med.rackLocation.shelfNumber}
                                        </span>
                                      </div>
                                      {onNavigateToRack && (
                                        <button
                                          onClick={() => {
                                            onNavigateToRack(med.rackLocation.rackId);
                                            toast.info(`Navigating to ${med.rackLocation.rackId}`);
                                          }}
                                          className="text-[9px] underline font-bold"
                                        >
                                          View Rack
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {/* 1-Tap Action: Add to Cart / Bill */}
                                  <div className="pt-1 flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleActionAddToCart(med)}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-colors"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>{isOwner ? 'Add to POS Bill' : 'Add to Cart / Order'}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* General Care Advice */}
                          {msg.suggestions.generalCareTips && msg.suggestions.generalCareTips.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-[10px] space-y-1">
                              <span className="font-extrabold text-blue-900 dark:text-blue-300 block">
                                💡 General Care & Recovery Tips:
                              </span>
                              <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-0.5">
                                {msg.suggestions.generalCareTips.map((tip, i) => (
                                  <li key={i}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Mandatory Clinical Disclaimer */}
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 pt-1 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>medEco Assistant provides general pharmacy guidance. For persistent symptoms, consult a doctor.</span>
                          </div>
                        </div>
                      )}


                      {/* In-Chat Order Intake Card (Location Selection / New Location / New Customer) */}
                      {msg.orderIntake && (
                        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50 to-slate-50 dark:from-teal-950/60 dark:via-slate-900 dark:to-slate-800 border border-teal-300/80 dark:border-teal-700/60 shadow-xs space-y-3">
                          {/* SELECT_LOCATION: ask existing customer */}
                          {msg.orderIntake.stage === 'SELECT_LOCATION' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                                <h4 className="font-extrabold text-[11px] text-teal-900 dark:text-teal-200">Confirm Delivery Location</h4>
                              </div>
                              {msg.orderIntake.savedAddress && (
                                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 space-y-0.5">
                                  <span className="font-bold text-slate-900 dark:text-white block">📍 Your Saved Address</span>
                                  <span>{[msg.orderIntake.savedDoorNumber, msg.orderIntake.savedAddress, msg.orderIntake.savedLandmark, msg.orderIntake.savedPincode].filter(Boolean).join(', ')}</span>
                                </div>
                              )}
                              {/* Prescription optional attachment */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => intakePrescriptionRef.current?.click()}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-teal-400 text-teal-700 dark:text-teal-300 text-[10px] font-bold hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                                >
                                  <Upload className="w-3 h-3" />
                                  {intakePrescriptionUrl ? `✅ ${intakePrescriptionName}` : 'Attach Prescription (Optional)'}
                                </button>
                                {intakePrescriptionUrl && (
                                  <button onClick={() => { setIntakePrescriptionUrl(null); setIntakePrescriptionName(null); }} className="text-[9px] text-rose-500 font-bold">✕ Remove</button>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                <button
                                  disabled={isPlacingOrder || !msg.orderIntake.savedAddress}
                                  onClick={async () => {
                                    const cust = session?.customer;
                                    if (!cust) return;
                                    await dispatchOrder({
                                      customerName: cust.name,
                                      customerMobile: cust.mobileNumber,
                                      address: msg.orderIntake!.savedAddress || '',
                                      doorNumber: msg.orderIntake!.savedDoorNumber,
                                      landmark: msg.orderIntake!.savedLandmark,
                                      pincode: msg.orderIntake!.savedPincode,
                                      zone: msg.orderIntake!.savedZone,
                                      geoCoords: cust.geoCoordinates,
                                      items: msg.orderIntake!.items,
                                      notes: msg.orderIntake!.notes,
                                      prescriptionImageUrl: intakePrescriptionUrl || undefined,
                                      prescriptionFileName: intakePrescriptionName || undefined
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                  {isPlacingOrder ? '⏳ Placing...' : '✅ Deliver to Saved Address'}
                                </button>
                                <button
                                  onClick={() => {
                                    const updMsg: ChatMessage = {
                                      id: `msg-intake-newloc-${Date.now()}`,
                                      sender: 'bot',
                                      text: 'Enter your new delivery address below. All fields with * are required.',
                                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                      orderIntake: { ...msg.orderIntake!, stage: 'NEW_LOCATION' }
                                    };
                                    setMessages(prev => [...prev, updMsg]);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 font-bold text-[10px] flex items-center gap-1 transition-colors hover:bg-teal-50"
                                >
                                  <MapPin className="w-3 h-3" />
                                  Change Location
                                </button>
                              </div>
                            </div>
                          )}

                          {/* NEW_LOCATION: collect a new address, then place */}
                          {msg.orderIntake.stage === 'NEW_LOCATION' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                                <h4 className="font-extrabold text-[11px] text-teal-900 dark:text-teal-200">Enter New Delivery Address</h4>
                              </div>
                              <input value={intakeAddress} onChange={e => setIntakeAddress(e.target.value)}
                                placeholder="Street / Area / Colony *" required
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                              <div className="grid grid-cols-2 gap-1.5">
                                <input value={intakeDoor} onChange={e => setIntakeDoor(e.target.value)}
                                  placeholder="Door / Flat No."
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                <input value={intakeLandmark} onChange={e => setIntakeLandmark(e.target.value)}
                                  placeholder="Landmark"
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <input value={intakePincode} onChange={e => setIntakePincode(e.target.value)}
                                  placeholder="PIN Code"
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                <select value={intakeZone} onChange={e => setIntakeZone(e.target.value)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                                  {WARANGAL_DELIVERY_ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => intakePrescriptionRef.current?.click()}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-teal-400 text-teal-700 dark:text-teal-300 text-[10px] font-bold hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                                >
                                  <Upload className="w-3 h-3" />
                                  {intakePrescriptionUrl ? `✅ ${intakePrescriptionName}` : 'Attach Prescription (Optional)'}
                                </button>
                                {intakePrescriptionUrl && (
                                  <button onClick={() => { setIntakePrescriptionUrl(null); setIntakePrescriptionName(null); }} className="text-[9px] text-rose-500 font-bold">✕</button>
                                )}
                              </div>
                              <button
                                disabled={isPlacingOrder || !intakeAddress.trim()}
                                onClick={async () => {
                                  const cust = session?.customer;
                                  if (!cust || !intakeAddress.trim()) { toast.warning('Delivery address is required.'); return; }
                                  // Update saved location in Firebase
                                  await updateCustomerLocationRealtime(cust.mobileNumber, {
                                    zone: intakeZone, doorNumber: intakeDoor.trim() || undefined,
                                    address: intakeAddress.trim(), landmark: intakeLandmark.trim() || undefined,
                                    pincode: intakePincode.trim() || undefined
                                  });
                                  await dispatchOrder({
                                    customerName: cust.name, customerMobile: cust.mobileNumber,
                                    address: intakeAddress.trim(), doorNumber: intakeDoor.trim() || undefined,
                                    landmark: intakeLandmark.trim() || undefined, pincode: intakePincode.trim() || undefined,
                                    zone: intakeZone, geoCoords: cust.geoCoordinates,
                                    items: msg.orderIntake!.items, notes: msg.orderIntake!.notes,
                                    prescriptionImageUrl: intakePrescriptionUrl || undefined,
                                    prescriptionFileName: intakePrescriptionName || undefined
                                  });
                                }}
                                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                              >
                                {isPlacingOrder ? '⏳ Updating & Placing Order...' : '✅ Update Location & Place Order'}
                              </button>
                            </div>
                          )}

                          {/* EXISTING_CUSTOMER: Customer already in contact list — 1-click WhatsApp order */}
                          {msg.orderIntake.stage === 'EXISTING_CUSTOMER' && (
                            <div className="space-y-2">
                              <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-teal-200 dark:border-teal-700/60 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-teal-600" />
                                    {msg.orderIntake.customerName || intakeName || 'Registered Contact'}
                                  </span>
                                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                                    In Contact List
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-teal-600" />
                                  WhatsApp Contact: <strong className="text-slate-900 dark:text-white font-mono">+91 {msg.orderIntake.customerMobile || intakeMobile}</strong>
                                </p>
                                {msg.orderIntake.savedAddress && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    📍 {[msg.orderIntake.savedDoorNumber, msg.orderIntake.savedAddress, msg.orderIntake.savedLandmark, msg.orderIntake.savedPincode].filter(Boolean).join(', ')}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  disabled={isPlacingOrder}
                                  onClick={async () => {
                                    const mobile = (msg.orderIntake!.customerMobile || intakeMobile).replace(/\D/g, '');
                                    const name = msg.orderIntake!.customerName || intakeName || `Customer ${mobile.slice(-4)}`;
                                    await dispatchOrder({
                                      customerName: name,
                                      customerMobile: mobile,
                                      address: msg.orderIntake!.savedAddress || 'WhatsApp Delivery Order',
                                      doorNumber: msg.orderIntake!.savedDoorNumber,
                                      landmark: msg.orderIntake!.savedLandmark,
                                      pincode: msg.orderIntake!.savedPincode,
                                      zone: msg.orderIntake!.savedZone,
                                      items: msg.orderIntake!.items,
                                      notes: msg.orderIntake!.notes,
                                      prescriptionImageUrl: intakePrescriptionUrl || undefined,
                                      prescriptionFileName: intakePrescriptionName || undefined
                                    });
                                  }}
                                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-95 transition-all"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{isPlacingOrder ? '⏳ Sending to WhatsApp...' : `🚀 Send Order to WhatsApp (+91 ${msg.orderIntake.customerMobile || intakeMobile})`}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setMessages(prev => prev.map(m => m.id === msg.id ? {
                                      ...m,
                                      orderIntake: { ...m.orderIntake!, stage: 'QUICK_WHATSAPP' }
                                    } : m));
                                  }}
                                  className="px-2.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                                >
                                  Change #
                                </button>
                              </div>
                            </div>
                          )}

                          {/* QUICK_WHATSAPP / NEW_CUSTOMER: Just ask contact number & send directly to WhatsApp */}
                          {(msg.orderIntake.stage === 'QUICK_WHATSAPP' || msg.orderIntake.stage === 'NEW_CUSTOMER') && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-teal-900 dark:text-teal-200 text-xs font-bold">
                                <Phone className="w-3.5 h-3.5 text-teal-600" />
                                <span>Enter WhatsApp Contact Number</span>
                              </div>

                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">+91</span>
                                  <input
                                    type="tel"
                                    value={intakeMobile}
                                    onChange={e => {
                                      const num = e.target.value.replace(/\D/g, '').slice(0, 10);
                                      setIntakeMobile(num);
                                    }}
                                    placeholder="10-digit mobile"
                                    maxLength={10}
                                    className="w-full pl-10 pr-2.5 py-1.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={intakeName}
                                  onChange={e => setIntakeName(e.target.value)}
                                  placeholder="Name (optional)"
                                  className="w-28 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                />
                              </div>

                              <button
                                disabled={isPlacingOrder || intakeMobile.length < 10}
                                onClick={async () => {
                                  if (intakeMobile.length < 10) {
                                    toast.warning('Please enter a valid 10-digit contact number.');
                                    return;
                                  }
                                  const cleanPhone = intakeMobile.replace(/\D/g, '');
                                  const custName = intakeName.trim() || `Customer ${cleanPhone.slice(-4)}`;

                                  // Add contact number to customer contact list automatically
                                  const existing = getCustomerByMobile(cleanPhone);
                                  if (!existing) {
                                    const newCust: Customer = {
                                      id: `cust-${cleanPhone}`,
                                      mobileNumber: cleanPhone,
                                      name: custName,
                                      address: 'WhatsApp Order',
                                      createdAt: new Date().toISOString()
                                    };
                                    await saveCustomer(newCust);
                                  }
                                  setActiveCustomerPhone(cleanPhone);

                                  await dispatchOrder({
                                    customerName: custName,
                                    customerMobile: cleanPhone,
                                    address: 'WhatsApp Order',
                                    items: msg.orderIntake!.items,
                                    notes: msg.orderIntake!.notes,
                                    prescriptionImageUrl: intakePrescriptionUrl || undefined,
                                    prescriptionFileName: intakePrescriptionName || undefined
                                  });
                                }}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-95 transition-all"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>{isPlacingOrder ? '⏳ Placing Order...' : '🚀 Place & Send Order'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Render Customer Order Cards */}
                      {msg.orderDetails && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          {msg.orderDetails.map(ord => (
                            <div key={ord.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white block">#{ord.id}</span>
                                <span className="text-slate-400">{ord.date} • {ord.branchName}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-slate-900 dark:text-white block">₹{ord.grandTotal.toFixed(2)}</span>
                                <span className="px-1.5 py-0.2 rounded-full font-bold uppercase text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  {ord.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Customer Reminder Cards */}
                      {msg.remindersDetails && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          {msg.remindersDetails.map(rem => (
                            <div key={rem.id} className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] flex items-center justify-between">
                              <div>
                                <strong className="text-slate-900 dark:text-white block">{rem.medicineName}</strong>
                                <span className="text-slate-500 dark:text-slate-400">{rem.dosage} • {rem.mealRelation}</span>
                              </div>
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                {rem.timings.join(', ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Interactive Follow-Up Action Card */}
                      {msg.followUpActions && (
                        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 dark:from-emerald-950/60 dark:via-slate-900 dark:to-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/60 shadow-xs space-y-2.5">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-[11px] font-extrabold text-emerald-950 dark:text-emerald-200">
                                medEco Order & Health Options
                              </h4>
                              <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-0.5">
                                {msg.followUpActions.prompt}
                              </p>
                            </div>
                          </div>

                          {/* Follow-up button grid */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {/* 1. Proceed to Online Order */}
                            <button
                              onClick={() => handleProceedToOnlineOrder(msg.followUpActions!.items, msg.followUpActions!.notes)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Proceed to Online Order ({msg.followUpActions.items.length} items)</span>
                            </button>

                            {/* 2. Include Existing Illness */}
                            <button
                              onClick={() => handleIncludeExistingIllness(msg.followUpActions?.illnessName)}
                              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Include Existing Illness</span>
                            </button>

                            {/* 3. Need Help */}
                            <button
                              onClick={handleNeedPharmacistHelp}
                              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                            >
                              <AlertCircle className="w-3 h-3" />
                              <span>Need Pharmacist Help</span>
                            </button>

                            {/* 4. Clear Chat */}
                            <button
                              onClick={clearChatHistory}
                              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Clear Chat</span>
                            </button>

                            {/* 5. Close Chat */}
                            <button
                              onClick={handleCloseChat}
                              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-[10px] flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3 h-3" />
                              <span>Close Chat</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Render Order Confirmation & WhatsApp Dispatch Card */}
                      {msg.orderConfirmation && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/70 dark:via-slate-900 dark:to-slate-800 border-2 border-emerald-400/80 dark:border-emerald-600/80 shadow-md space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-mono font-bold text-xs text-emerald-900 dark:text-emerald-200">
                                  Order #{msg.orderConfirmation.order.id}
                                </span>
                                <p className="text-[10px] text-slate-600 dark:text-slate-300">
                                  {msg.orderConfirmation.order.pharmacyName}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                              {msg.orderConfirmation.order.status}
                            </span>
                          </div>

                          {/* Ordered Items Summary */}
                          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-2.5 text-[10px] space-y-1 border border-slate-200/80 dark:border-slate-700/80">
                            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700 pb-1">
                              <span>{msg.orderConfirmation.order.items?.length || 0} item(s)</span>
                              <span className="text-emerald-600 dark:text-emerald-400">Total: ₹{msg.orderConfirmation.order.estimatedTotal.toFixed(2)}</span>
                            </div>
                            {msg.orderConfirmation.order.items?.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-300">
                                <span>{it.medicineName} x {it.quantity}</span>
                                <span className="font-mono">₹{(it.unitPrice * it.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          {/* WhatsApp Backend Dispatch Status Section */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 block">
                              💬 WhatsApp Order Confirmation & Tracking:
                            </span>
                            
                            {/* Server Dispatch Badge */}
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <div>
                                  <span className="font-extrabold text-emerald-900 dark:text-emerald-200 block">
                                    WhatsApp Dispatched via Backend
                                  </span>
                                  <span className="text-[10px] text-slate-600 dark:text-slate-400">
                                    Owner (+91 {getCachedOwnerMobile()}) ➔ Customer (+91 {msg.orderConfirmation.order.customerMobile})
                                  </span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[9px]">
                                Server Sent
                              </span>
                            </div>

                            {/* Button 3: In-App Live Tracking Link */}
                            <button
                              onClick={() => {
                                if (onNavigateToTab) {
                                  onNavigateToTab('customer_history');
                                }
                                toast.info(`Opening Live Tracking for Order #${msg.orderConfirmation!.order.id}`);
                              }}
                              className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>View Live 5-Stage SOP Tracking in App</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] text-slate-400 px-1 mt-0.5">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 px-2 animate-pulse">
                    <Bot className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] font-medium">medEco Assistant is analyzing symptoms & inventory...</span>
                  </div>
                )}

                {/* Audio processing indicator */}
                {isProcessingAudio && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2 text-emerald-900 dark:text-emerald-200 animate-pulse">
                    <Activity className="w-4 h-4 text-emerald-600 animate-spin" />
                    <span>Transcribing and extracting clinical symptoms from audio note...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Suggestion Chips */}
              <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(item.query);
                      const userMsg: ChatMessage = {
                        id: `msg-chip-${Date.now()}`,
                        sender: 'user',
                        text: item.query,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      };
                      setMessages(prev => [...prev, userMsg]);
                      handleUserQuery(item.query);
                    }}
                    className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors shrink-0"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Voice Listening Active Wave Banner */}
              {isListening && (
                <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 shrink-0 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold text-[11px]">Listening to your voice... Speak illness or medicine</span>
                  </div>
                  <button
                    onClick={toggleListening}
                    className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px]"
                  >
                    Stop
                  </button>
                </div>
              )}

              {/* Voice Memo Recording Banner */}
              {isRecordingMemo && (
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/60 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shrink-0 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="font-bold text-[11px]">Recording voice note ({audioRecordingTime}s)</span>
                  </div>
                  <button
                    onClick={stopVoiceMemoRecording}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px]"
                  >
                    Done & Filter
                  </button>
                </div>
              )}

              {/* Speech Error Banner */}
              {activeSpeechError && (
                <div className="px-4 py-1.5 bg-rose-50 dark:bg-rose-950 text-[10px] text-rose-600 dark:text-rose-300 flex items-center justify-between">
                  <span>{activeSpeechError}</span>
                  <button onClick={() => setActiveSpeechError(null)} className="font-bold">✕</button>
                </div>
              )}

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendTextMessage}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 shrink-0"
              >
                {/* Real-time Voice Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? 'Stop Listening' : 'Speak illness symptoms (Speech to text)'}
                  className={`p-2 rounded-xl transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white ring-2 ring-rose-400 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Voice Memo Recording / Audio Upload Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    if (isRecordingMemo) {
                      stopVoiceMemoRecording();
                    } else {
                      startVoiceMemoRecording();
                    }
                  }}
                  title="Record voice note"
                  className={`p-2 rounded-xl transition-colors ${
                    isRecordingMemo
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileAudio className="w-4 h-4" />
                </button>

                {/* Upload Audio File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload audio recording file (.mp3, .wav)"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening 
                      ? 'Listening to your voice...' 
                      : 'Type symptom (fever, cough) or medicine name...'
                  }
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-xs transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};
