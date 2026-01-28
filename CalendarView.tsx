
import React, { useState, useEffect } from 'react';
import { dayStore } from '../data/dayStore';
import { DaySummary } from '../types';

interface CalendarViewProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CalendarView: React.FC<CalendarViewProps> = ({ selectedDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));
  const [index, setIndex] = useState<Record<string, DaySummary>>({});
  
  // Load Index on Mount or Focus
  useEffect(() => {
    const idx = dayStore.getDayIndex();
    setIndex(idx);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    // 0 = Sun, 1 = Mon ... 6 = Sat
    // We want Mon = 0 ... Sun = 6
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  const todayISO = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setCurrentDate(new Date(parseInt(e.target.value), month, 1));
  };

  const handleDayClick = (day: number) => {
    const mStr = (month + 1).toString().padStart(2, '0');
    const dStr = day.toString().padStart(2, '0');
    const dateISO = `${year}-${mStr}-${dStr}`;
    onDateSelect(dateISO);
  };

  // Generate Year Options
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      years.push(y);
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Calendario</h2>
          <button 
             onClick={() => {
                 const now = new Date();
                 setCurrentDate(now);
                 onDateSelect(now.toISOString().split('T')[0]);
             }}
             className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full"
          >
             Hoy
          </button>
        </div>

        <div className="flex justify-between items-center">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-800 w-24 text-center">{MONTHS[month]}</span>
                <select 
                    value={year} 
                    onChange={handleYearChange} 
                    className="font-bold text-lg text-gray-500 bg-transparent border-none focus:ring-0 cursor-pointer"
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
      </div>

      {/* LEGEND */}
      <div className="px-4 py-3 bg-gray-50 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-gray-500 justify-center border-b border-gray-100">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-orange-400"></span>Menu Plan</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>Menu Log</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-green-500"></span>Entreno Plan</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Entreno OK</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Peso</div>
      </div>

      {/* GRID */}
      <div className="p-2 flex-1 overflow-y-auto">
          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">
                      {d}
                  </div>
              ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
              {/* Empty slots */}
              {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const mStr = (month + 1).toString().padStart(2, '0');
                  const dStr = day.toString().padStart(2, '0');
                  const dateISO = `${year}-${mStr}-${dStr}`;
                  
                  const isSelected = dateISO === selectedDate;
                  const isToday = dateISO === todayISO;
                  const data = index[dateISO];

                  return (
                      <button
                          key={day}
                          onClick={() => handleDayClick(day)}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-start pt-2 relative transition-all ${
                              isSelected ? 'bg-brand-50 border-2 border-brand-500 shadow-sm' : 
                              'bg-white border border-gray-100 hover:border-brand-200'
                          }`}
                      >
                          <span className={`text-sm font-bold ${
                              isToday ? 'text-white bg-brand-600 w-6 h-6 rounded-full flex items-center justify-center -mt-1 shadow-sm' : 
                              isSelected ? 'text-brand-700' : 'text-gray-700'
                          }`}>
                              {day}
                          </span>

                          {/* Indicators */}
                          <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                              {/* Training */}
                              {data?.hasTraining ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              ) : data?.hasPlannedTraining ? (
                                  <span className="w-1.5 h-1.5 rounded-full border border-green-500"></span>
                              ) : null}

                              {/* Nutrition */}
                              {data?.hasNutrition ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                              ) : data?.hasPlannedMeals ? (
                                  <span className="w-1.5 h-1.5 rounded-full border border-orange-400"></span>
                              ) : null}

                              {/* Weight */}
                              {data?.hasWeight && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                          </div>

                          {data?.isOpen === false && (
                              <div className="absolute bottom-1 right-1 opacity-30">
                                  <svg className="w-3 h-3 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                              </div>
                          )}
                      </button>
                  );
              })}
          </div>
      </div>
    </div>
  );
};

export default CalendarView;
