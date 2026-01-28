
import React, { useState } from 'react';
import { DayData, MacroGoals, MealPhase, WeightEntry, FoodLogItem, MacroSettings } from '../types';
import ProgressBar from './ui/ProgressBar';
import NutritionPlanner from './NutritionPlanner';

interface DashboardProps {
  data: DayData; // Centralized Data
  goals: MacroGoals;
  macroSettings: MacroSettings; // To show status
  phase: MealPhase;
  userWeight: number;
  weightHistory: WeightEntry[];
  
  isDirty: boolean;
  onSave: () => void;
  onCloseDay: () => void;
  onReopenDay: () => void;
  onDateChange: (date: string) => void;
  
  onUpdateWeight: (kg: number) => void;
}

const WeightTracker: React.FC<{ currentWeight: number; history: WeightEntry[]; onUpdate: (k: number) => void; isOpen: boolean; dateLabel: string }> = ({ currentWeight, history, onUpdate, isOpen, dateLabel }) => {
  const [showModal, setShowModal] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const previous = history.length > 1 ? history[history.length - 2] : null;
  const delta = previous ? currentWeight - previous.weight : 0;
  
  // Advanced Chart Logic (Last 12 entries or 12 weeks)
  const chartData = history.slice(-12); 
  const maxW = Math.max(...chartData.map(e => e.weight)) + 1;
  const minW = Math.min(...chartData.map(e => e.weight)) - 1;
  const range = maxW - minW || 1;
  
  const getY = (w: number) => 100 - ((w - minW) / range) * 100;
  const points = chartData.map((e, i) => {
    const x = (i / (chartData.length - 1 || 1)) * 100;
    const y = getY(e.weight);
    return `${x},${y}`;
  }).join(' ');

  const handleSubmit = () => {
    const val = parseFloat(inputWeight);
    if (!isNaN(val) && val > 40 && val < 250) {
      onUpdate(val);
      setShowModal(false);
      setInputWeight('');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-800">Peso ({dateLabel})</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{currentWeight || '--'} <span className="text-sm font-normal text-gray-500">kg</span></span>
            {previous && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${delta <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                {showHistory ? 'Ocultar' : 'Histórico'}
            </button>
            {isOpen && (
            <button onClick={() => setShowModal(true)} className="text-sm text-brand-600 font-bold bg-brand-50 px-3 py-1 rounded-lg">
                + Pesar
            </button>
            )}
        </div>
      </div>

      {/* Chart */}
      {(showHistory || chartData.length > 1) && (
        <div className="h-24 w-full mt-2 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="100" x2="100" y2="100" stroke="#f3f4f6" strokeWidth="1" />
            
            <polyline
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
             {chartData.map((e, i) => {
                const x = (i / (chartData.length - 1 || 1)) * 100;
                const y = getY(e.weight);
                return (
                    <g key={i}>
                        <circle cx={x} cy={y} r="3" fill="white" stroke="#22c55e" strokeWidth="2" />
                    </g>
                )
             })}
          </svg>
          <div className="absolute top-0 right-0 text-[10px] text-gray-400 bg-white px-1">{maxW.toFixed(0)}</div>
          <div className="absolute bottom-0 right-0 text-[10px] text-gray-400 bg-white px-1">{minW.toFixed(0)}</div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-xs shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Registrar Peso</h3>
            <div className="flex gap-2 mb-4">
                <input 
                    type="number" 
                    step="0.1"
                    placeholder="kg"
                    value={inputWeight}
                    onChange={e => setInputWeight(e.target.value)}
                    className="flex-1 p-2 border rounded text-lg font-bold text-center"
                    autoFocus
                />
                <span className="flex items-center text-gray-500 font-bold">kg</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-gray-600 font-bold">Cancelar</button>
              <button onClick={handleSubmit} className="flex-1 py-2 bg-brand-600 text-white rounded-lg font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MacroStat: React.FC<{ label: string; current: number; target: number; color: string }> = ({ label, current, target, color }) => {
  const remaining = target - current;
  const pct = Math.min((current / target) * 100, 100);
  
  return (
    <div className={`p-3 rounded-xl border ${color} bg-opacity-10`}>
      <div className="flex justify-between items-end mb-1">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</span>
        <span className="text-xs font-medium text-gray-400">/ {target}g</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-gray-800">{Math.round(current)}</span>
        <span className="text-xs text-gray-500">g</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: 'currentColor' }} />
      </div>

      <div className="text-right mt-1">
         <span className={`text-[10px] font-bold ${remaining < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {remaining < 0 ? `+${Math.abs(Math.round(remaining))} extra` : `${Math.round(remaining)} restantes`}
         </span>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  data, goals, macroSettings, phase, userWeight, weightHistory, 
  isDirty, onSave, onCloseDay, onReopenDay, onUpdateWeight, onDateChange
}) => {
  const { meals } = data.nutrition;
  const currentWeight = data.weight || userWeight; 

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalFats = meals.reduce((sum, m) => sum + m.fats, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  
  const workoutCompleted = data.training.sessions.some(s => s.completed);
  const workoutPlanned = data.training.sessions.some(s => !s.completed);
  
  const dateObj = new Date(data.date);
  const todayISO = new Date().toISOString().split('T')[0];
  const isToday = data.date === todayISO;
  const isFuture = data.date > todayISO;

  const getDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const handlePrevDay = () => {
      const prev = new Date(data.date);
      prev.setDate(prev.getDate() - 1);
      onDateChange(prev.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
      const next = new Date(data.date);
      next.setDate(next.getDate() + 1);
      onDateChange(next.toISOString().split('T')[0]);
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur shadow-sm p-4 -mx-4 mb-4 border-b border-gray-100 flex justify-between items-center">
         <div>
            <h1 className="text-xl font-bold text-gray-900">
                {isToday ? getDayGreeting() + ', Rafa' : isFuture ? 'Planificación' : 'Histórico'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <button onClick={handlePrevDay} className="p-1 hover:bg-gray-100 rounded text-gray-500 font-bold text-xs">◀</button>
                <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">
                    {dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
                <button onClick={handleNextDay} className="p-1 hover:bg-gray-100 rounded text-gray-500 font-bold text-xs">▶</button>
            </div>
         </div>
         <div className="flex gap-2">
            {isDirty && (
                <button 
                  onClick={onSave}
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md animate-pulse"
                >
                  Guardar
                </button>
            )}
            {/* Close Day only available for Past or Today */}
            {!isFuture && (
                data.isOpen ? (
                    <button 
                      onClick={onCloseDay}
                      className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-bold text-xs border border-gray-200"
                    >
                      Cerrar Día
                    </button>
                ) : (
                    <button 
                      onClick={onReopenDay}
                      className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg font-bold text-xs border border-blue-100"
                    >
                      Reabrir
                    </button>
                )
            )}
         </div>
      </div>

      {!data.isOpen && !isFuture && (
          <div className="bg-gray-100 p-3 rounded-lg text-center text-xs text-gray-500 font-bold border border-gray-200">
              🔒 Este día está cerrado. Reábrelo para editar.
          </div>
      )}
    
      {/* Weight only relevant for Today/Past */}
      {!isFuture && (
          <WeightTracker 
            currentWeight={currentWeight} 
            history={weightHistory} 
            onUpdate={onUpdateWeight} 
            isOpen={data.isOpen}
            dateLabel={isToday ? 'Hoy' : dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          />
      )}

      {/* Quick Macros */}
      <div className={`rounded-2xl p-5 shadow-sm border transition-colors ${data.isOpen || isFuture ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-90'}`}>
        <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
                 <h3 className="text-lg font-bold text-gray-800">Objetivos Diarios</h3>
                 {macroSettings.source === 'AUTO_ADJUST' && (
                     <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-bold" title="Ajustado por evolución de peso">Auto ⚡</span>
                 )}
             </div>
             {!data.isOpen && !isFuture && <span className="text-xs font-bold text-gray-400">LECTURA</span>}
        </div>
        
        {/* Main Goal: Calories */}
        <div className="mb-6">
            <ProgressBar current={totalCalories} max={goals.calories} label="Calorías" unit="kcal" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{Math.round(totalCalories)} consumidas</span>
                <span>{Math.max(0, Math.round(goals.calories - totalCalories))} restantes</span>
            </div>
        </div>
        
        {/* Secondary Goals Grid */}
        <div className="grid grid-cols-3 gap-3">
           <div className="text-blue-600">
                <MacroStat label="Proteína" current={totalProtein} target={goals.protein} color="border-blue-100 bg-blue-50" />
           </div>
           <div className="text-yellow-600">
                <MacroStat label="Grasas" current={totalFats} target={goals.fats} color="border-yellow-100 bg-yellow-50" />
           </div>
           <div className="text-orange-600">
                <MacroStat label="Carbos" current={totalCarbs} target={goals.carbs} color="border-orange-100 bg-orange-50" />
           </div>
        </div>
      </div>

      {/* NUTRITION PLANNER MODULE (Always visible to allow planning) */}
      {(data.isOpen || isFuture) && (
        <NutritionPlanner 
            date={data.date} 
            macroTargets={goals}
            hasExistingLogs={data.nutrition.meals.length > 0}
            onApplyPlan={(items, mode) => {
                const event = new CustomEvent('applyMealPlan', { detail: { items, mode } });
                window.dispatchEvent(event);
            }} 
        />
      )}
      
      {/* Workout Status */}
      <div className={`rounded-2xl p-5 shadow-sm border flex items-center justify-between ${workoutCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
        <div>
          <h3 className="font-bold text-gray-800">Entrenamiento</h3>
          <p className="text-sm text-gray-500">
            {workoutCompleted 
                ? '¡Cumplido! Buen trabajo.' 
                : workoutPlanned 
                    ? '📅 Tienes un entreno planificado'
                    : 'Sin entreno planificado'
            }
          </p>
        </div>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${workoutCompleted ? 'bg-green-200 text-green-700' : workoutPlanned ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
           {workoutCompleted 
             ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
           }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
