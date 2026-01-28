
import React, { useState, useRef, useEffect } from 'react';
import { DayData, FoodLogItem, MealPhase, MacroGoals, BaseFood, AISuggestion, MealSlot, FavoriteMeal } from '../types';
import { getFoodData100g } from '../services/geminiService';
import { foodService } from '../services/foodService';
import { normalizeFoodName, createLogItem, calculateMacros, MEAL_SLOTS, parseSmartInput } from '../utils/nutrition';
import { UNIT_CONVERSIONS } from '../data/unitConversions';

interface NutritionViewProps {
  data: DayData;
  isDirty: boolean;
  goals: MacroGoals;
  phase: MealPhase;
  foodDb: Record<string, BaseFood>;
  favorites: FavoriteMeal[];
  
  onSave: () => void;
  onUpdateMeals: (meals: FoodLogItem[]) => void;
  
  onAddBaseFood: (food: BaseFood) => void;
  onAddFavorite: (name: string, items: FoodLogItem[]) => void;
}

const NutritionView: React.FC<NutritionViewProps> = ({ 
  data, isDirty, goals, phase, favorites,
  onSave, onUpdateMeals, onAddBaseFood, onAddFavorite 
}) => {
  const [activeSlot, setActiveSlot] = useState<MealSlot>('COMIDA');
  const [viewMode, setViewMode] = useState<'LOG' | 'FAVORITES'>('LOG');
  
  // Input & Autocomplete
  const [inputText, setInputText] = useState('');
  const [suggestionsList, setSuggestionsList] = useState<BaseFood[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  
  // Ambiguity Modal State
  const [quantityModal, setQuantityModal] = useState<{ isOpen: boolean; foodId: string; foodName: string } | null>(null);
  const [manualQty, setManualQty] = useState('');
  const [manualMode, setManualMode] = useState<'GRAMS' | 'UNITS'>('GRAMS');
  const [selectedUnit, setSelectedUnit] = useState('');

  // Custom Food Modal
  const [customFoodModal, setCustomFoodModal] = useState(false);
  const [newFood, setNewFood] = useState({ name: '', kcal: '', p: '', c: '', f: '' });
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>(''); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { meals } = data.nutrition;
  const isOpen = data.isOpen;

  // --- AUTOCOMPLETE LOGIC ---
  useEffect(() => {
    if (inputText.length > 1) {
      const results = foodService.searchFoods(inputText, 5);
      setSuggestionsList(results.map(r => r.food));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [inputText]);

  const selectSuggestion = (food: BaseFood) => {
    setInputText(food.displayName);
    setShowSuggestions(false);
    handleProcessInput(food.displayName, false);
  };

  // --- ACTIONS ---

  const handleProcessInput = async (input: string | string[], isImage: boolean) => {
    if (!isOpen) return;
    setIsProcessing(true);
    setShowSuggestions(false);
    try {
      if (isImage) {
          alert("Por favor usa texto para mayor precisión en modo mixto.");
          setIsProcessing(false);
          return;
      }

      const text = input as string;
      const parsed = parseSmartInput(text);

      if (parsed.foodId) {
          if (parsed.quantity.type === 'UNKNOWN') {
              const base = foodService.getFoodById(parsed.foodId);
              if (base) {
                setQuantityModal({ isOpen: true, foodId: parsed.foodId, foodName: base.displayName });
                const relevantConv = UNIT_CONVERSIONS.find(c => 
                    c.aliases.some(a => base.displayName.toLowerCase().includes(a))
                );
                if (relevantConv) {
                    setManualMode('UNITS');
                    setSelectedUnit(relevantConv.label);
                } else {
                    setManualMode('GRAMS');
                }
              }
          } else {
              const base = foodService.getFoodById(parsed.foodId);
              if (base) {
                  const newItem = createLogItem(
                      base, 
                      parsed.quantity.grams, 
                      activeSlot, 
                      Date.now(), 
                      undefined,
                      { 
                          isEstimated: parsed.quantity.type === 'ESTIMATED',
                          unitCount: parsed.quantity.unitCount,
                      unitLabel: parsed.quantity.unitLabel
                      }
                  );
                  onUpdateMeals([newItem, ...meals]);
                  setInputText('');
              }
          }
      } else {
          const data100g = await getFoodData100g(text);
          const newId = normalizeFoodName(data100g.displayName);
          const newBaseFood: BaseFood = { 
              ...data100g, 
              id: newId, 
              aliases: [data100g.displayName.toLowerCase()],
              category: 'OTRO',
              version: 1,
              source: 'API'
          };
          foodService.saveCustomFood(newBaseFood);
          onAddBaseFood(newBaseFood);
          
          setQuantityModal({ isOpen: true, foodId: newId, foodName: data100g.displayName });
          setManualMode('GRAMS');
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitManualQuantity = () => {
      if (!quantityModal || !manualQty) return;
      const qty = parseFloat(manualQty);
      if (isNaN(qty) || qty <= 0) return;

      const base = foodService.getFoodById(quantityModal.foodId);
      if (!base) return;

      let grams = qty;
      let extra = {};

      if (manualMode === 'UNITS') {
          const conv = UNIT_CONVERSIONS.find(c => c.label === selectedUnit);
          if (conv) {
              grams = qty * conv.grams;
              extra = { isEstimated: true, unitCount: qty, unitLabel: conv.label };
          }
      }

      onUpdateMeals([createLogItem(base, grams, activeSlot, Date.now(), undefined, extra), ...meals]);
      setQuantityModal(null);
      setManualQty('');
      setInputText('');
  };

  const handleSaveCustomFood = () => {
      if (!newFood.name || !newFood.kcal) return;
      const id = normalizeFoodName(newFood.name);
      const food: BaseFood = {
          id,
          displayName: newFood.name,
          aliases: [newFood.name.toLowerCase()],
          category: 'OTRO',
          kcal100g: parseFloat(newFood.kcal),
          protein100g: parseFloat(newFood.p) || 0,
          carbs100g: parseFloat(newFood.c) || 0,
          fats100g: parseFloat(newFood.f) || 0,
          source: 'CUSTOM',
          version: 1
      };
      foodService.saveCustomFood(food);
      setCustomFoodModal(false);
      setNewFood({ name: '', kcal: '', p: '', c: '', f: '' });
      setInputText(food.displayName);
      handleProcessInput(food.displayName, false);
  };

  const startEditing = (meal: FoodLogItem) => {
      if (!isOpen) return;
      setEditingId(meal.id);
      if (meal.isEstimated && meal.unitCount) {
          setEditValue(meal.unitCount.toString());
      } else {
          setEditValue(meal.grams.toString());
      }
  };

  const saveEdit = () => {
    if (!editingId) return;
    const meal = meals.find(m => m.id === editingId);
    const base = meal ? foodService.getFoodById(meal.foodId) : null;
    const val = parseFloat(editValue);

    if (meal && base && !isNaN(val) && val > 0) {
        let grams = val;
        let extra = {};
        
        if (meal.isEstimated && meal.unitLabel) {
             const conv = UNIT_CONVERSIONS.find(c => c.label === meal.unitLabel);
             if (conv) {
                 grams = val * conv.grams;
                 extra = { unitCount: val }; 
             }
        } else {
             if (meal.isEstimated) {
                 extra = { isEstimated: false, unitCount: undefined, unitLabel: undefined };
             }
        }
        const updatedMacros = calculateMacros(base, grams);
        const updatedMeal = { ...meal, grams, ...updatedMacros, ...extra };
        onUpdateMeals(meals.map(m => m.id === meal.id ? updatedMeal : m));
    }
    setEditingId(null);
  };

  const handleDeleteMeal = (id: string) => {
      if (!isOpen) return;
      onUpdateMeals(meals.filter(m => m.id !== id));
  };

  const handleAddFavToLog = (items: FoodLogItem[]) => {
      // Re-create items with new IDs
      const newItems = items.map(i => {
          const base = foodService.getFoodById(i.foodId);
          if (!base) return null;
          return createLogItem(base, i.grams, activeSlot);
      }).filter(Boolean) as FoodLogItem[];
      onUpdateMeals([...newItems, ...meals]);
  };

  const slotMeals = meals.filter(m => m.slot === activeSlot);
  const slotCalories = slotMeals.reduce((sum, m) => sum + m.calories, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* HEADER TABS & STICKY SAVE */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200">
            {MEAL_SLOTS.map(slot => (
                <button
                    key={slot}
                    onClick={() => { setActiveSlot(slot); setViewMode('LOG'); }}
                    className={`flex-1 py-3 text-sm font-bold whitespace-nowrap px-4 border-b-2 transition-colors ${
                        activeSlot === slot 
                        ? 'border-brand-600 text-brand-700' 
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                    {slot}
                </button>
            ))}
        </div>
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 text-xs">
             <div className="flex items-center gap-2">
                 <span>Total: <strong className="text-gray-800">{slotCalories} kcal</strong></span>
                 {isDirty && (
                     <button onClick={onSave} className="bg-brand-600 text-white px-2 py-0.5 rounded font-bold animate-pulse">
                         Guardar
                     </button>
                 )}
             </div>
             <button onClick={() => setViewMode(viewMode === 'LOG' ? 'FAVORITES' : 'LOG')} className="text-brand-600 font-bold">
                {viewMode === 'LOG' ? '❤️ Ver Favoritos' : '📋 Ver Registro'}
            </button>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {!isOpen && (
            <div className="bg-gray-100 p-3 rounded-xl border border-gray-200 text-center text-xs font-bold text-gray-500">
                🔒 Día cerrado. Modo lectura.
            </div>
        )}

        {/* --- VIEW: LOGGING --- */}
        {viewMode === 'LOG' && (
            <>
                {/* INPUT AREA */}
                {isOpen && (
                    <div className="relative bg-white p-3 rounded-xl shadow-sm border border-gray-100 z-20">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={`"2 huevos", "pollo 200g"...`}
                                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleProcessInput(inputText, false)}
                                autoComplete="off"
                            />
                             <button onClick={() => fileInputRef.current?.click()} className="bg-gray-100 px-3 rounded-lg text-gray-600">
                                📷
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {}} />
                        </div>

                        {/* AUTOCOMPLETE DROPDOWN */}
                        {showSuggestions && suggestionsList.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-b-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
                                {suggestionsList.map(food => (
                                    <button
                                        key={food.id}
                                        onClick={() => selectSuggestion(food)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 flex justify-between items-center"
                                    >
                                        <span className="font-medium text-gray-800">{food.displayName}</span>
                                        <span className="text-xs text-gray-400">{Math.round(food.kcal100g)} kcal/100g</span>
                                    </button>
                                ))}
                                <button 
                                    onClick={() => { setShowSuggestions(false); setCustomFoodModal(true); }}
                                    className="w-full text-left px-4 py-3 bg-brand-50 text-brand-700 font-bold text-sm hover:bg-brand-100"
                                >
                                    + Crear Nuevo Alimento
                                </button>
                            </div>
                        )}
                        
                        {inputText && !showSuggestions && (
                             <button 
                                onClick={() => handleProcessInput(inputText, false)}
                                disabled={isProcessing}
                                className="w-full mt-2 py-2 bg-brand-600 text-white rounded-lg font-bold text-sm"
                            >
                                {isProcessing ? 'Procesando...' : 'Añadir Registro'}
                            </button>
                        )}
                    </div>
                )}

                {/* MEALS LIST */}
                <div className="space-y-3">
                    {slotMeals.length === 0 ? (
                        <div className="text-center py-10 text-gray-300">
                            <p>Nada registrado en {activeSlot.toLowerCase()}</p>
                        </div>
                    ) : (
                        slotMeals.map(meal => {
                             const isEditing = editingId === meal.id;
                             return (
                                <div key={meal.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800 capitalize">{meal.name}</h4>
                                            <span className="text-xs font-bold text-gray-500">{Math.round(meal.calories)} kcal</span>
                                        </div>
                                        
                                        {isEditing ? (
                                            <div className="flex items-center gap-2 mt-2">
                                                <input 
                                                    type="number" 
                                                    value={editValue} 
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-20 p-1 border rounded text-center font-bold"
                                                    autoFocus
                                                />
                                                <span className="text-xs text-gray-500">
                                                    {meal.isEstimated && meal.unitLabel ? meal.unitLabel : 'g'}
                                                </span>
                                                <button onClick={saveEdit} className="text-green-600 font-bold text-xs">OK</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-end mt-1">
                                                    <div className="text-sm text-gray-600">
                                                        {meal.isEstimated ? (
                                                            <span>~{meal.grams}g <span className="text-gray-400">({meal.unitCount} {meal.unitLabel})</span></span>
                                                        ) : (
                                                            <span>{meal.grams}g</span>
                                                        )}
                                                    </div>
                                                    {isOpen && (
                                                        <div className="flex gap-3">
                                                            <button onClick={() => startEditing(meal)} className="text-xs text-blue-500 font-medium">Editar</button>
                                                            <button onClick={() => handleDeleteMeal(meal.id)} className="text-xs text-red-500 font-medium">Borrar</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-3 mt-2 text-xs text-gray-400 font-medium bg-gray-50 p-1 rounded">
                                                    <span><span className="text-blue-600">P:</span> {meal.protein}g</span>
                                                    <span><span className="text-orange-600">C:</span> {meal.carbs}g</span>
                                                    <span><span className="text-yellow-600">G:</span> {meal.fats}g</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                             )
                        })
                    )}
                </div>
            </>
        )}

        {/* --- CUSTOM FOOD MODAL --- */}
        {customFoodModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                    <h3 className="font-bold text-lg mb-4 text-gray-900">Crear Alimento (100g)</h3>
                    <div className="space-y-3 mb-6">
                        <input type="text" placeholder="Nombre (ej. Pan de Centeno)" className="w-full p-2 border rounded" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} />
                        <div className="flex gap-2">
                             <input type="number" placeholder="Kcal" className="flex-1 p-2 border rounded" value={newFood.kcal} onChange={e => setNewFood({...newFood, kcal: e.target.value})} />
                             <input type="number" placeholder="Prot" className="flex-1 p-2 border rounded" value={newFood.p} onChange={e => setNewFood({...newFood, p: e.target.value})} />
                        </div>
                        <div className="flex gap-2">
                             <input type="number" placeholder="Carb" className="flex-1 p-2 border rounded" value={newFood.c} onChange={e => setNewFood({...newFood, c: e.target.value})} />
                             <input type="number" placeholder="Grasa" className="flex-1 p-2 border rounded" value={newFood.f} onChange={e => setNewFood({...newFood, f: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setCustomFoodModal(false)} className="flex-1 py-2 text-gray-500 font-bold">Cancelar</button>
                        <button onClick={handleSaveCustomFood} className="flex-1 py-2 bg-brand-600 text-white font-bold rounded-lg">Guardar</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- AMBIGUITY MODAL --- */}
        {quantityModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                    <h3 className="font-bold text-lg mb-2 text-gray-900">¿Cuánto {quantityModal.foodName}?</h3>
                    <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                        <button 
                           onClick={() => setManualMode('GRAMS')}
                           className={`flex-1 py-1 text-sm font-bold rounded ${manualMode === 'GRAMS' ? 'bg-white shadow' : 'text-gray-500'}`}
                        >
                           Gramos
                        </button>
                        <button 
                           onClick={() => setManualMode('UNITS')}
                           className={`flex-1 py-1 text-sm font-bold rounded ${manualMode === 'UNITS' ? 'bg-white shadow' : 'text-gray-500'}`}
                        >
                           Unidades
                        </button>
                    </div>

                    <div className="flex gap-2 items-center mb-6">
                        <input 
                            type="number"
                            value={manualQty}
                            onChange={(e) => setManualQty(e.target.value)}
                            className="flex-1 p-2 text-xl font-bold border rounded-lg text-center"
                            placeholder="0"
                            autoFocus
                        />
                        {manualMode === 'UNITS' ? (
                            <select 
                                value={selectedUnit} 
                                onChange={(e) => setSelectedUnit(e.target.value)}
                                className="p-2 border rounded-lg bg-white text-sm max-w-[120px]"
                            >
                                <option value="">Elige...</option>
                                {UNIT_CONVERSIONS.map(u => (
                                    <option key={u.id} value={u.label}>{u.label}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="font-bold text-gray-500">g</span>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setQuantityModal(null)} className="flex-1 py-3 text-gray-500 font-bold text-sm">Cancelar</button>
                        <button onClick={submitManualQuantity} className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-lg text-sm shadow-md">
                            Añadir
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- VIEW: FAVORITES --- */}
        {viewMode === 'FAVORITES' && (
            <div className="space-y-4">
                {favorites.map(fav => (
                    <div key={fav.id} className="bg-white p-4 rounded-xl shadow-sm border border-brand-100">
                        <h4 className="font-bold text-brand-800 mb-2">{fav.name}</h4>
                        {isOpen && (
                            <button 
                                onClick={() => handleAddFavToLog(fav.ingredients.map(i => ({ foodId: i.foodId, grams: i.grams } as FoodLogItem)))}
                                className="w-full py-2 bg-brand-50 text-brand-700 rounded-lg text-sm font-bold"
                            >
                                + Añadir a {activeSlot}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
};

export default NutritionView;
