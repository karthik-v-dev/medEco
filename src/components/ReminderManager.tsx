import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Bell, 
  Calendar, 
  Sun, 
  Sunset, 
  Moon, 
  Coffee, 
  Pill, 
  Check, 
  Share2, 
  AlertCircle 
} from 'lucide-react';
import { MedicineReminder, DoseTiming, MealRelation } from '../types';
import { saveReminder, deleteReminder, toggleDoseTaken } from '../services/firebase';

interface ReminderManagerProps {
  customerMobile: string;
  reminders: MedicineReminder[];
}

export const ReminderManager: React.FC<ReminderManagerProps> = ({
  customerMobile,
  reminders
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [isAdding, setIsAdding] = useState(false);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [newDosage, setNewDosage] = useState('1 Tablet');
  const [newMealRelation, setNewMealRelation] = useState<MealRelation>('After Food');
  const [selectedTimings, setSelectedTimings] = useState<DoseTiming[]>(['Morning', 'Night']);
  const [customTime, setCustomTime] = useState('08:00 AM & 08:00 PM');
  const [notes, setNotes] = useState('');

  const timingIcons: Record<DoseTiming, React.ReactNode> = {
    Morning: <Sun className="w-4 h-4 text-amber-500" />,
    Afternoon: <Sun className="w-4 h-4 text-orange-500" />,
    Evening: <Sunset className="w-4 h-4 text-rose-500" />,
    Night: <Moon className="w-4 h-4 text-indigo-500" />
  };

  const handleToggleTaken = async (reminderId: string, timing: DoseTiming) => {
    await toggleDoseTaken(reminderId, todayStr, timing);
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedicineName.trim() || selectedTimings.length === 0) return;

    const newRem: MedicineReminder = {
      id: `rem-${Date.now()}`,
      customerMobile: customerMobile.replace(/\D/g, ''),
      medicineName: newMedicineName.trim(),
      dosage: newDosage.trim(),
      timings: selectedTimings,
      customTime: customTime.trim() || undefined,
      mealRelation: newMealRelation,
      startDate: todayStr,
      isActive: true,
      notes: notes.trim() || undefined,
      takenHistory: {}
    };

    await saveReminder(newRem);
    setIsAdding(false);
    setNewMedicineName('');
    setNotes('');
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this medicine reminder?")) {
      await deleteReminder(id);
    }
  };

  const handleShareWhatsAppReminder = (rem: MedicineReminder) => {
    const text = `*medEco Daily Medicine Reminder*\n` +
      `Medicine: ${rem.medicineName}\n` +
      `Dose: ${rem.dosage} (${rem.mealRelation})\n` +
      `Scheduled Times: ${rem.timings.join(', ')} (${rem.customTime || ''})\n` +
      (rem.notes ? `Instructions: ${rem.notes}\n` : '') +
      `Please remember to take your dose on time!`;

    const url = `https://wa.me/91${customerMobile.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Calculate today's adherence stats
  let totalDosesToday = 0;
  let takenDosesToday = 0;

  reminders.forEach(rem => {
    if (rem.isActive) {
      rem.timings.forEach(t => {
        totalDosesToday++;
        if (rem.takenHistory?.[todayStr]?.[t]) {
          takenDosesToday++;
        }
      });
    }
  });

  const adherencePercent = totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Adherence Header Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg">Today's Dose Adherence</h3>
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-bold">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              {takenDosesToday} of {totalDosesToday} scheduled doses taken today. Keep it up!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-center sm:text-right">
            <span className="text-2xl font-black">{adherencePercent}%</span>
            <span className="block text-[10px] text-emerald-200 uppercase font-bold">Adherence</span>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </button>
        </div>
      </div>

      {/* Add Reminder Form */}
      {isAdding && (
        <form onSubmit={handleCreateReminder} className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-lg space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              <span>Schedule New Medicine Reminder</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Medicine Name *</label>
              <input
                type="text"
                value={newMedicineName}
                onChange={(e) => setNewMedicineName(e.target.value)}
                placeholder="e.g. Telma 40 / Metformin"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Dosage</label>
              <input
                type="text"
                value={newDosage}
                onChange={(e) => setNewDosage(e.target.value)}
                placeholder="e.g. 1 Tablet, 5 ml, 1 Capsule"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Timings */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Scheduled Doses</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Morning', 'Afternoon', 'Evening', 'Night'] as DoseTiming[]).map(t => {
                const isChecked = selectedTimings.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      if (isChecked) {
                        setSelectedTimings(selectedTimings.filter(item => item !== t));
                      } else {
                        setSelectedTimings([...selectedTimings, t]);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                      isChecked
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {timingIcons[t]}
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Meal Relation</label>
              <select
                value={newMealRelation}
                onChange={(e) => setNewMealRelation(e.target.value as MealRelation)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="After Food">After Food (Post Meal)</option>
                <option value="Before Food">Before Food (Pre Meal)</option>
                <option value="With Food">With Food</option>
                <option value="Empty Stomach">Empty Stomach</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Time Label</label>
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="e.g. 08:30 AM & 08:30 PM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Doctor's Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Take with warm water. Complete 5 day course."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Reminder</span>
          </button>
        </form>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No active medicine reminders</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click "+ Add Reminder" or purchase medicines in POS to auto-schedule dosage alerts.
            </p>
          </div>
        ) : (
          reminders.map(rem => (
            <div
              key={rem.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-300 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <Pill className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">{rem.medicineName}</h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {rem.dosage}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {rem.mealRelation}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{rem.customTime || rem.timings.join(', ')}</span>
                  {rem.notes && (
                    <span className="text-[11px] text-slate-600 italic">
                      • "{rem.notes}"
                    </span>
                  )}
                </div>
              </div>

              {/* Dose checklist for today */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {rem.timings.map(timing => {
                    const isTaken = !!rem.takenHistory?.[todayStr]?.[timing];
                    return (
                      <button
                        key={timing}
                        onClick={() => handleToggleTaken(rem.id, timing)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isTaken
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                        title={isTaken ? 'Click to mark as not taken' : 'Click to mark as taken'}
                      >
                        {isTaken ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{timing}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                  <button
                    onClick={() => handleShareWhatsAppReminder(rem)}
                    title="Send WhatsApp Reminder"
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rem.id)}
                    title="Delete Reminder"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
