
import React, { useState, useEffect, useRef } from 'react';
import { 
    MacroGoals, DailyMealPlan, UserFoodItem, MealSlot, FoodLogItem, BaseFood, FoodCategory
} from '../types';
import { mealPlanService } from '../services/mealPlanService';
import { foodService } from '../services/foodService';
import { createLogItem } from '../utils/nutrition';
import { libraryStore } from '../data/libraryStore';
import { libraryImportService } from '../services/libraryImportService';

interface NutritionPlannerProps {
    date: string; 
    macroTargets: MacroGoals;
    hasExistingLogs: boolean;
    onApplyPlan: (items: FoodLogItem[], mode: 'REPLACE' | 'APPEND') => void;
}

const NutritionPlanner: React.FC<NutritionPlannerProps> = ({ date, macroTargets, hasExistingLogs, onApplyPlan }) => {
    const [activeTab, setActiveTab] = useState<'PLAN' | 'BIBLIOTECA'>('PLAN');
    const [dayPlan, setDayPlan] = useState<DailyMealPlan | null>(null);
    const [library, setLibrary] = useState<UserFoodItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // --- IMPORT STATE ---
    const [importText, setImportText] = useState('');
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- CONFLICT MODAL STATE ---
    const [showConflictModal, setShowConflictModal] = useState(false);

    // --- RESOLVE MODAL STATE ---
    const [resolveItem, setResolveItem] = useState<UserFoodItem | null>(null);
    const [resolveMode, setResolveMode] = useState<'SEARCH' | 'MANUAL'>('SEARCH');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<BaseFood[]>([]);
    const [manualMacros, setManualMacros] = useState({ kcal: '', p: '', c: '', f: '' });
    const [manualCategory, setManualCategory] = useState<FoodCategory>('OTRO');

    useEffect(() => {
        refreshData();
    }, [date, activeTab]);

    const refreshData = () => {
        setDayPlan(mealPlanService.getDailyPlan(date));
        setLibrary(libraryStore.getItems());
    };

    // --- GENERATION ACTIONS ---

    const handleGenerateToday = () => {
        const pendingCount = libraryStore.getPendingCount();
        if (pendingCount > 0) {
            if(!confirm(`Tienes ${pendingCount} alimentos pendientes en la biblioteca que NO se usarán. ¿Generar igual?`)) {
                setActiveTab('BIBLIOTECA');
                return;
            }
        }

        setIsGenerating(true);
        setTimeout(() => {
            const plan = mealPlanService.generateDayPlan(date, macroTargets);
            setDayPlan(plan);
            setIsGenerating(false);
        }, 600); 
    };

    const handleRegenerateMeal = (slot: MealSlot) => {
        if (!dayPlan) return;
        const newPlan = mealPlanService.regenerateMeal(dayPlan, slot, macroTargets);
        setDayPlan(newPlan);
    };

    const handleSwapItem = (slot: MealSlot, itemId: string) => {
        if (!dayPlan) return;
        const newPlan = mealPlanService.swapItem(dayPlan, slot, itemId);
        setDayPlan(newPlan);
    };

    // --- APPLY PLAN ACTIONS ---

    const handleApplyClick = () => {
        if (!dayPlan) return;
        if (hasExistingLogs) {
            setShowConflictModal(true);
        } else {
            finalizeApply('REPLACE');
        }
    };

    const finalizeApply = (mode: 'REPLACE' | 'APPEND') => {
        if (!dayPlan) return;
        
        // Convert to LogItems
        const logItems = mealPlanService.convertPlanToLogItems(dayPlan);
        
        // Update Plan Status
        const updatedPlan = mealPlanService.markPlanAsApplied(dayPlan);
        setDayPlan(updatedPlan);
        
        // Notify Parent
        onApplyPlan(logItems, mode);
        setShowConflictModal(false);
        alert("¡Plan aplicado al registro del día!");
    };

    // --- LIBRARY IMPORT ACTIONS ---

    const handleImportText = () => {
        if (!importText) return;
        const newItems = libraryImportService.processImport(importText, 'TEXT');
        newItems.forEach(item => libraryStore.addItem(item));
        setImportText('');
        setImportModalOpen(false);
        refreshData();
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            const text = await libraryImportService.readFile(file);
            const newItems = libraryImportService.processImport(text, 'FILE');
            newItems.forEach(item => libraryStore.addItem(item));
            alert(`${newItems.length} items procesados.`);
            refreshData();
        } catch (err) {
            alert("Error leyendo archivo.");
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteLibItem = (id: string) => {
        if (confirm("¿Borrar de biblioteca?")) {
            libraryStore.removeItem(id);
            refreshData();
        }
    };

    // --- RESOLVE LOGIC ---

    const openResolveModal = (item: UserFoodItem) => {
        setResolveItem(item);
        setResolveMode('SEARCH');
        setSearchTerm(item.name);
        // Pre-search
        const results = foodService.searchFoods(item.name, 5);
        setSearchResults(results.map(r => r.food));
    };

    const handleResolveSearch = (term: string) => {
        setSearchTerm(term);
        if (term.length > 1) {
            const results = foodService.searchFoods(term, 5);
            setSearchResults(results.map(r => r.food));
        }
    };

    const resolveWithMatch = (match: BaseFood) => {
        if (!resolveItem) return;
        
        libraryStore.updateItem(resolveItem.id, {
            status: 'VERIFIED',
            matchedDbId: match.id,
            macrosPer100: {
                kcal: match.kcal100g,
                protein: match.protein100g,
                carbs: match.carbs100g,
                fat: match.fats100g
            },
            category: match.category,
            notes: `Mapeado a: ${match.displayName}`
        });
        
        setResolveItem(null);
        refreshData();
    };

    const resolveWithManual = () => {
        if (!resolveItem) return;
        const kcal = parseFloat(manualMacros.kcal);
        const p = parseFloat(manualMacros.p);
        const c = parseFloat(manualMacros.c);
        const f = parseFloat(manualMacros.f);

        if (isNaN(kcal) || isNaN(p) || isNaN(c) || isNaN(f)) {
            alert("Introduce valores numéricos válidos.");
            return;
        }

        libraryStore.updateItem(resolveItem.id, {
            status: 'VERIFIED',
            source: 'MANUAL',
            macrosPer100: { kcal, protein: p, carbs: c, fat: f },
            category: manualCategory,
            notes: 'Macros manuales'
        });

        setResolveItem(null);
        setManualMacros({ kcal: '', p: '', c: '', f: '' });
        refreshData();
    };

    // --- RENDER HELPERS ---

    const renderMacroBadge = (label: string, val: number, target: number, color: string) => (
        <div className={`px-2 py-1 rounded text-xs font-bold ${color} bg-opacity-10 border border-current min-w-[60px] text-center`}>
            <div className="text-[10px] uppercase opacity-70">{label}</div>
            <div>{Math.round(val)}</div>
        </div>
    );

    const pendingItems = library.filter(i => i.status === 'PENDING');
    const verifiedItems = library.filter(i => i.status === 'VERIFIED');

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
            {/* Header Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50">
                <button onClick={() => setActiveTab('PLAN')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'PLAN' ? 'bg-white text-brand-600 border-t-2 border-brand-500' : 'text-gray-500'}`}>Plan del Día</button>
                <button onClick={() => setActiveTab('BIBLIOTECA')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'BIBLIOTECA' ? 'bg-white text-brand-600 border-t-2 border-brand-500' : 'text-gray-500'}`}>Biblioteca {pendingItems.length > 0 && <span className="text-red-500">({pendingItems.length})</span>}</button>
            </div>

            <div className="p-4">
                {/* --- TAB: PLAN --- */}
                {activeTab === 'PLAN' && (
                    <div className="space-y-4">
                        {!dayPlan ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400 text-sm mb-4">Sin plan activo para esta fecha.</p>
                                <button onClick={handleGenerateToday} disabled={isGenerating} className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-700 transition">
                                    {isGenerating ? 'Generando...' : '✨ Generar Menú'}
                                </button>
                                <p className="text-xs text-gray-400 mt-4">Usa alimentos verificados de tu biblioteca y base de datos.</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary */}
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-800 text-sm">Resumen Planificado</h3>
                                            {dayPlan.status === 'APPLIED' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">✅ Aplicado</span>}
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">Meta: {Math.round(macroTargets.calories)} kcal</span>
                                    </div>
                                    <div className="flex justify-between gap-1 mb-2">
                                         {renderMacroBadge('Kcal', dayPlan.dayTotals.kcal, macroTargets.calories, 'text-gray-700')}
                                         {renderMacroBadge('Prot', dayPlan.dayTotals.protein, macroTargets.protein, 'text-blue-600')}
                                         {renderMacroBadge('Carb', dayPlan.dayTotals.carbs, macroTargets.carbs, 'text-orange-600')}
                                         {renderMacroBadge('Grasa', dayPlan.dayTotals.fat, macroTargets.fats, 'text-yellow-600')}
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center">*Cálculo estricto: 1g P/C = 4kcal, 1g G = 9kcal.</p>
                                </div>

                                {/* Meals */}
                                <div className="space-y-6">
                                    {dayPlan.meals.map((meal, idx) => (
                                        <div key={idx} className="border-l-4 border-brand-200 pl-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-bold text-gray-800 text-sm uppercase">{meal.slot}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-500">{Math.round(meal.totals.kcal)} kcal</span>
                                                    <button onClick={() => handleRegenerateMeal(meal.slot)} className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-600 font-bold">↻ Regenerar</button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {meal.items.map((item) => (
                                                    <div key={item.id} className="bg-white p-2 rounded border border-gray-100 shadow-sm text-sm">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div className="font-bold text-gray-800">{item.name}</div>
                                                            <button onClick={() => handleSwapItem(meal.slot, item.id)} className="text-gray-400 hover:text-brand-600 px-2">⇄</button>
                                                        </div>
                                                        <div className="flex justify-between items-end text-xs text-gray-500">
                                                            <div>
                                                                <span className="font-bold text-gray-700 text-sm">{item.amount}g</span>
                                                                <span className="mx-1">•</span>
                                                                {Math.round(item.macros.kcal)} kcal 
                                                                <span className="text-gray-400 ml-1">({Math.round(item.macros.protein)}P {Math.round(item.macros.carbs)}C {Math.round(item.macros.fat)}G)</span>
                                                            </div>
                                                            <span className={`text-[9px] px-1.5 rounded border ${item.sourceType === 'VERIFIED_DB' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                                {item.sourceType === 'VERIFIED_DB' ? 'DB Verificada' : 'Tu Biblioteca'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleApplyClick} className="w-full mt-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-brand-700">
                                    {dayPlan.status === 'APPLIED' ? '↻ Re-aplicar Plan al Registro' : '✓ Aplicar al Registro del Día'}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* --- TAB: BIBLIOTECA --- */}
                {activeTab === 'BIBLIOTECA' && (
                    <div className="space-y-6">
                        {/* Actions */}
                        <div className="flex gap-2">
                            <button onClick={() => setImportModalOpen(true)} className="flex-1 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold shadow-sm">
                                📝 Importar Texto
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold shadow-sm">
                                📂 Subir Archivo
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.csv" onChange={handleImportFile} />
                        </div>

                        {/* Pending Section */}
                        {pendingItems.length > 0 && (
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                                <h4 className="font-bold text-orange-800 text-sm mb-2">Pendientes de Resolver ({pendingItems.length})</h4>
                                <p className="text-[10px] text-orange-700 mb-3">Estos alimentos NO se usan en el generador hasta que los verifiques.</p>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {pendingItems.map(item => (
                                        <div key={item.id} className="bg-white p-2 rounded border border-orange-200 flex justify-between items-center shadow-sm">
                                            <span className="text-sm font-medium text-gray-700 truncate flex-1">{item.name}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDeleteLibItem(item.id)} className="text-red-400 text-xs px-2">✕</button>
                                                <button onClick={() => openResolveModal(item)} className="bg-orange-500 text-white text-xs px-3 py-1 rounded font-bold">Resolver</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Verified Section */}
                        <div className="border border-gray-100 rounded-xl p-3">
                            <h4 className="font-bold text-gray-800 text-sm mb-2">Tu Biblioteca Verificada ({verifiedItems.length})</h4>
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                                {verifiedItems.length === 0 ? <p className="text-xs text-gray-400 italic">Vacío.</p> : verifiedItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-2 border-b border-gray-50 text-xs hover:bg-gray-50">
                                        <div>
                                            <span className="font-bold text-gray-700">{item.name}</span>
                                            <div className="text-[10px] text-gray-400">
                                                {item.matchedDbId ? 'Mapeado a DB' : 'Manual'} • {Math.round(item.macrosPer100?.kcal || 0)} kcal/100g
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteLibItem(item.id)} className="text-gray-300 hover:text-red-500 px-2">✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL IMPORT --- */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl">
                        <h3 className="font-bold text-lg mb-2">Importar Lista</h3>
                        <p className="text-xs text-gray-500 mb-4">Pega una lista de alimentos (uno por línea o separados por comas). Limpiaremos cantidades y símbolos.</p>
                        <textarea 
                            value={importText} 
                            onChange={e => setImportText(e.target.value)} 
                            className="w-full h-32 border rounded p-2 text-sm mb-4"
                            placeholder="Ej: - Pollo asado&#10;- Arroz blanco&#10;- Yogur"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setImportModalOpen(false)} className="flex-1 py-2 text-gray-500">Cancelar</button>
                            <button onClick={handleImportText} className="flex-1 py-2 bg-gray-800 text-white rounded font-bold">Procesar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CONFLICT --- */}
            {showConflictModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Ya hay comida registrada</h3>
                        <p className="text-gray-600 mb-6 text-sm">Este día ya tiene comidas registradas. ¿Cómo quieres aplicar el plan?</p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => finalizeApply('REPLACE')}
                                className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-lg font-bold text-sm"
                            >
                                Reemplazar (Borrar actual)
                            </button>
                            <button 
                                onClick={() => finalizeApply('APPEND')}
                                className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold text-sm shadow-md"
                            >
                                Añadir al final (Sumar)
                            </button>
                            <button 
                                onClick={() => setShowConflictModal(false)}
                                className="w-full py-3 text-gray-500 font-bold text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL RESOLVE --- */}
            {resolveItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl h-[80vh] flex flex-col">
                        <h3 className="font-bold text-lg mb-1">Resolver Alimento</h3>
                        <p className="text-sm font-bold text-orange-600 mb-4 bg-orange-50 p-2 rounded text-center">"{resolveItem.name}"</p>
                        
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-4 shrink-0">
                            <button onClick={() => setResolveMode('SEARCH')} className={`flex-1 py-1 text-xs font-bold rounded ${resolveMode === 'SEARCH' ? 'bg-white shadow' : 'text-gray-500'}`}>Buscar en DB</button>
                            <button onClick={() => setResolveMode('MANUAL')} className={`flex-1 py-1 text-xs font-bold rounded ${resolveMode === 'MANUAL' ? 'bg-white shadow' : 'text-gray-500'}`}>Manual</button>
                        </div>

                        {resolveMode === 'SEARCH' ? (
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <input 
                                    type="text" 
                                    value={searchTerm} 
                                    onChange={e => handleResolveSearch(e.target.value)} 
                                    placeholder="Buscar..." 
                                    className="w-full p-2 border rounded mb-2 text-sm"
                                    autoFocus
                                />
                                <div className="flex-1 overflow-y-auto space-y-1">
                                    {searchResults.map(res => (
                                        <button key={res.id} onClick={() => resolveWithMatch(res)} className="w-full text-left p-2 border border-gray-100 rounded hover:bg-brand-50 hover:border-brand-200 group">
                                            <div className="font-bold text-gray-800 text-sm group-hover:text-brand-700">{res.displayName}</div>
                                            <div className="text-[10px] text-gray-400">
                                                {Math.round(res.kcal100g)} kcal • P{Math.round(res.protein100g)} C{Math.round(res.carbs100g)} F{Math.round(res.fats100g)}
                                            </div>
                                        </button>
                                    ))}
                                    {searchResults.length === 0 && <p className="text-center text-xs text-gray-400 mt-4">Sin resultados.</p>}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div><label className="text-xs text-gray-500">Categoría</label>
                                <select value={manualCategory} onChange={e => setManualCategory(e.target.value as any)} className="w-full p-2 border rounded text-sm bg-white">
                                    <option value="PROTEINA">Proteína</option>
                                    <option value="CARBOHIDRATO">Carbohidrato</option>
                                    <option value="GRASA">Grasa</option>
                                    <option value="FRUTA">Fruta</option>
                                    <option value="VERDURA">Verdura</option>
                                    <option value="LACTEO">Lácteo</option>
                                    <option value="SNACK">Snack</option>
                                    <option value="OTRO">Otro</option>
                                </select></div>
                                <div className="flex gap-2">
                                    <div className="flex-1"><label className="text-xs text-gray-500">Kcal/100g</label><input type="number" value={manualMacros.kcal} onChange={e => setManualMacros({...manualMacros, kcal: e.target.value})} className="w-full p-2 border rounded" /></div>
                                    <div className="flex-1"><label className="text-xs text-gray-500">Prot</label><input type="number" value={manualMacros.p} onChange={e => setManualMacros({...manualMacros, p: e.target.value})} className="w-full p-2 border rounded" /></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1"><label className="text-xs text-gray-500">Carb</label><input type="number" value={manualMacros.c} onChange={e => setManualMacros({...manualMacros, c: e.target.value})} className="w-full p-2 border rounded" /></div>
                                    <div className="flex-1"><label className="text-xs text-gray-500">Grasa</label><input type="number" value={manualMacros.f} onChange={e => setManualMacros({...manualMacros, f: e.target.value})} className="w-full p-2 border rounded" /></div>
                                </div>
                                <button onClick={resolveWithManual} className="w-full py-3 bg-brand-600 text-white rounded font-bold mt-4">Guardar Manualmente</button>
                            </div>
                        )}

                        <button onClick={() => setResolveItem(null)} className="mt-4 text-center text-xs text-gray-400 underline">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NutritionPlanner;
