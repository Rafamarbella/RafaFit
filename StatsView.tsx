
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, RangeStats, WeightEntry } from '../types';
import { statsService } from '../services/statsService';
import { pdfService } from '../services/pdfService';

interface StatsViewProps {
  user: UserProfile;
}

type RangeType = 'WEEK' | 'MONTH' | 'YEAR';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const StatsView: React.FC<StatsViewProps> = ({ user }) => {
  const [rangeType, setRangeType] = useState<RangeType>('WEEK');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<RangeStats | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- LOADING DATA ---
  useEffect(() => {
    let from = '', to = '';
    
    if (rangeType === 'WEEK') {
        const w = statsService.getWeekDates(currentDate);
        from = w.from; to = w.to;
    } else if (rangeType === 'MONTH') {
        const m = statsService.getMonthDates(currentDate.getFullYear(), currentDate.getMonth());
        from = m.from; to = m.to;
    } else if (rangeType === 'YEAR') {
        const y = statsService.getYearDates(currentDate.getFullYear());
        from = y.from; to = y.to;
    }

    const data = statsService.calculateStats(from, to, user);
    setStats(data);
  }, [rangeType, currentDate, user]);

  // --- NAVIGATION HANDLERS ---
  const handlePrev = () => {
      const newDate = new Date(currentDate);
      if (rangeType === 'WEEK') newDate.setDate(newDate.getDate() - 7);
      else if (rangeType === 'MONTH') newDate.setMonth(newDate.getMonth() - 1);
      else newDate.setFullYear(newDate.getFullYear() - 1);
      setCurrentDate(newDate);
  };

  const handleNext = () => {
      const newDate = new Date(currentDate);
      if (rangeType === 'WEEK') newDate.setDate(newDate.getDate() + 7);
      else if (rangeType === 'MONTH') newDate.setMonth(newDate.getMonth() + 1);
      else newDate.setFullYear(newDate.getFullYear() + 1);
      setCurrentDate(newDate);
  };

  const handleExportPdf = async () => {
      if (!stats) return;
      setIsExporting(true);
      try {
          await pdfService.generateReport(stats, user);
      } catch (e) {
          console.error("PDF Error", e);
          alert("Error generando PDF");
      } finally {
          setIsExporting(false);
      }
  };

  const getLabel = () => {
      if (rangeType === 'WEEK') {
          // Calculate week number or display date range
          const w = statsService.getWeekDates(currentDate);
          const d1 = new Date(w.from).getDate();
          const d2 = new Date(w.to).getDate();
          const m = MONTHS[new Date(w.to).getMonth()];
          return `${d1} - ${d2} ${m}`;
      }
      if (rangeType === 'MONTH') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      return `${currentDate.getFullYear()}`;
  };

  if (!stats) return <div className="p-10 text-center">Cargando estadísticas...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* HEADER */}
      <div className="bg-white p-4 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Progreso</h2>
              <button 
                onClick={handleExportPdf} 
                disabled={isExporting}
                className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-brand-100"
              >
                  {isExporting ? '...' : '📄 PDF'}
              </button>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              {(['WEEK', 'MONTH', 'YEAR'] as RangeType[]).map(t => (
                  <button 
                    key={t}
                    onClick={() => setRangeType(t)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${rangeType === t ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}
                  >
                      {t === 'WEEK' ? 'Semana' : t === 'MONTH' ? 'Mes' : 'Año'}
                  </button>
              ))}
          </div>

          <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2">
              <button onClick={handlePrev} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">◀</button>
              <span className="font-bold text-gray-800">{getLabel()}</span>
              <button onClick={handleNext} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">▶</button>
          </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
          
          {/* 1. SUMMARY CARDS */}
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">Peso</div>
                  <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">{stats.weight.end}</span>
                      <span className="text-xs text-gray-400">kg</span>
                  </div>
                  <div className={`text-xs font-bold mt-1 ${stats.weight.change <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {stats.weight.change > 0 ? '+' : ''}{stats.weight.change} kg
                  </div>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">Calorías Medias</div>
                  <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">{stats.nutrition.avgCalories}</span>
                      <span className="text-xs text-gray-400">kcal</span>
                  </div>
                  <div className="text-xs text-blue-500 font-bold mt-1">
                      {stats.nutrition.adherenceRate}% Adherencia
                  </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">Entrenos</div>
                  <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">{stats.training.completedSessions}</span>
                      <span className="text-xs text-gray-400">sesiones</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                      {Math.round(stats.training.totalMinutes / 60)}h totales
                  </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">Días Cerrados</div>
                  <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">{stats.daysClosed}</span>
                      <span className="text-xs text-gray-400">días</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                      {Math.round((stats.daysClosed / (stats.dailyData.length || 1)) * 100)}% Completado
                  </div>
              </div>
          </div>

          {/* 2. WEIGHT CHART */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-sm">Evolución Peso</h3>
              <WeightChart history={stats.weight.history} rangeType={rangeType} />
          </div>

          {/* 3. NUTRITION & TRAINING CHART */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-sm">Calorías y Entreno</h3>
              <NutritionTrainingChart dailyData={stats.dailyData} goalKcal={user.macroSettings.targets.calories} />
          </div>

      </div>
    </div>
  );
};

// --- SUBCOMPONENTS FOR CHARTS ---

const WeightChart: React.FC<{ history: WeightEntry[], rangeType: RangeType }> = ({ history, rangeType }) => {
    if (history.length < 2) return <div className="h-32 flex items-center justify-center text-xs text-gray-400">Faltan datos de peso para graficar</div>;

    const weights = history.map(h => h.weight);
    const min = Math.min(...weights) - 0.5;
    const max = Math.max(...weights) + 0.5;
    const range = max - min;

    // SVG Config
    const H = 150;
    const W = 300;
    
    // Generate Points
    const points = history.map((h, i) => {
        const x = (i / (history.length - 1)) * W;
        const y = H - ((h.weight - min) / range) * H;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-40 relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="0" x2={W} y2="0" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                <line x1="0" y1={H/2} x2={W} y2={H/2} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                <line x1="0" y1={H} x2={W} y2={H} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />

                {/* Line */}
                <polyline 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="3" 
                    points={points} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />
                
                {/* Dots */}
                {history.map((h, i) => {
                    const x = (i / (history.length - 1)) * W;
                    const y = H - ((h.weight - min) / range) * H;
                    return <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#3b82f6" strokeWidth="2" />;
                })}
            </svg>
            <div className="absolute top-0 right-0 text-[10px] text-gray-400 bg-white px-1">{max.toFixed(1)}</div>
            <div className="absolute bottom-0 right-0 text-[10px] text-gray-400 bg-white px-1">{min.toFixed(1)}</div>
        </div>
    );
};

const NutritionTrainingChart: React.FC<{ dailyData: RangeStats['dailyData'], goalKcal: number }> = ({ dailyData, goalKcal }) => {
    // If too many days (Year view), group by week or sample? 
    // Simple approach: if > 31 days, just average every 7 days? 
    // For simplicity, let's just show standard bar chart, it will squeeze.
    // SVG handles scaling well.

    const maxKcal = Math.max(goalKcal * 1.2, ...dailyData.map(d => d.calories));
    const H = 100; // Height of bars area
    const W = 100; // Percent width

    return (
        <div className="w-full h-40 relative flex items-end justify-between gap-1">
            {/* Goal Line */}
            <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-gray-300 z-0 opacity-50"
                style={{ bottom: `${(goalKcal / maxKcal) * 100}%` }}
            ></div>

            {dailyData.map((d, i) => {
                const heightPct = Math.min((d.calories / maxKcal) * 100, 100);
                const isTraining = d.completedWorkouts > 0;
                
                // Color logic: Near goal = Green, Over/Under = Orange/Red
                let color = 'bg-gray-300';
                if (d.calories > 0) {
                    const ratio = d.calories / goalKcal;
                    if (ratio > 1.15) color = 'bg-red-400';
                    else if (ratio < 0.85) color = 'bg-yellow-400';
                    else color = 'bg-green-400';
                }

                return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] p-1 rounded z-20 whitespace-nowrap">
                            {new Date(d.date).getDate()}: {Math.round(d.calories)} kcal
                        </div>

                        {/* Bar */}
                        <div 
                            className={`w-full max-w-[8px] rounded-t-sm transition-all ${color}`} 
                            style={{ height: `${heightPct}%` }}
                        ></div>

                        {/* Training Dot */}
                        <div className="h-3 mt-1 flex items-center justify-center">
                            {isTraining && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatsView;
