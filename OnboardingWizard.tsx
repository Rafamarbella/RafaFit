
import React, { useState, useEffect } from 'react';
import { UserProfile, MacroGoals } from '../types';
import { INITIAL_USER } from '../constants';
import { injuryService } from '../services/injuryService';
import { calculateTDEE, calculateTargetMacros, ActivityLevel } from '../utils/nutrition';

interface OnboardingWizardProps {
    onComplete: (profile: UserProfile) => void;
}

type Step = 'GOAL' | 'DATA' | 'TARGETS' | 'INJURIES';

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
    const [step, setStep] = useState<Step>('GOAL');
    const [user, setUser] = useState<UserProfile>(INITIAL_USER);
    const [goalType, setGoalType] = useState<'LOSE' | 'MAINTAIN' | 'GAIN'>('LOSE');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('LIGHT');
    
    // Calculation State
    const [tdee, setTdee] = useState(0);
    const [deficitPct, setDeficitPct] = useState(0);
    const [manualDeficitInput, setManualDeficitInput] = useState<number>(20);
    
    // Injury State
    const [selectedInjuries, setSelectedInjuries] = useState<string[]>(INITIAL_USER.injuries);
    const [customInjuryName, setCustomInjuryName] = useState('');

    const nextStep = () => {
        if (step === 'GOAL') {
            // Set default manual input based on goal
            setManualDeficitInput(goalType === 'LOSE' ? 20 : goalType === 'GAIN' ? 10 : 0);
            setStep('DATA');
        }
        else if (step === 'DATA') {
            runCalculations(); // Run initial calc with default logic
            setStep('TARGETS');
        }
        else if (step === 'TARGETS') setStep('INJURIES');
        else if (step === 'INJURIES') finish();
    };

    const runCalculations = (overrideDeficitPct?: number) => {
        // 1. Calculate TDEE
        const calculatedTdee = calculateTDEE(user.weight, user.height, user.age, activityLevel, 'M');
        setTdee(calculatedTdee);

        // 2. Prepare deficit decimal
        // If override provided (from slider), use it. Convert 20 -> 0.20
        // If goal is GAIN, slider 10 means surplus 10% (-0.10)
        let deficitDecimal: number | undefined = undefined;
        
        if (overrideDeficitPct !== undefined) {
            if (goalType === 'GAIN') deficitDecimal = -(overrideDeficitPct / 100);
            else if (goalType === 'MAINTAIN') deficitDecimal = 0;
            else deficitDecimal = overrideDeficitPct / 100;
        }

        // 3. Calculate Targets with strict rules
        const result = calculateTargetMacros(calculatedTdee, user.weight, goalType, deficitDecimal);
        
        setUser(prev => ({
            ...prev,
            macroSettings: {
                ...prev.macroSettings,
                mode: 'MANUAL',
                targets: result.targets
            }
        }));
        setDeficitPct(result.deficitPct);
    };

    const handleDeficitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setManualDeficitInput(val);
        runCalculations(val);
    };

    const updateMacros = (field: keyof MacroGoals, val: string) => {
        const num = parseInt(val) || 0;
        setUser(prev => ({
            ...prev,
            macroSettings: {
                ...prev.macroSettings,
                targets: {
                    ...prev.macroSettings.targets,
                    [field]: num
                }
            }
        }));
    };

    const toggleInjury = (inj: string) => {
        if (selectedInjuries.includes(inj)) {
            setSelectedInjuries(prev => prev.filter(i => i !== inj));
        } else {
            setSelectedInjuries(prev => [...prev, inj]);
        }
    };

    const addCustomInjury = () => {
        if (customInjuryName) {
            injuryService.add({
                title: customInjuryName,
                bodyArea: 'OTRO',
                severity: 3,
                isActive: true
            });
            setCustomInjuryName('');
        }
    };

    const finish = () => {
        const finalUser = {
            ...user,
            injuries: selectedInjuries,
            hasOnboarded: true
        };
        onComplete(finalUser);
    };

    // Warnings for Step 3
    const currentKcal = user.macroSettings.targets.calories;
    const isOverMaintenance = currentKcal >= tdee;
    const isTooLow = currentKcal < 1600;

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* Header */}
            <div className="p-6 bg-brand-600 text-white shadow-md">
                <h1 className="text-2xl font-bold">Bienvenido a RafaFit</h1>
                <p className="text-brand-100 text-sm">Configuremos tu plan personal.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                
                {/* STEP 1: GOAL */}
                {step === 'GOAL' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">¿Cuál es tu objetivo principal?</h2>
                        <div className="space-y-3">
                            <button onClick={() => setGoalType('LOSE')} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${goalType === 'LOSE' ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-gray-100'}`}>
                                <div className="font-bold text-brand-900 text-lg">🔥 Perder Grasa</div>
                                <p className="text-sm text-gray-500">Déficit calórico (20%) para reducir peso manteniendo músculo.</p>
                            </button>
                            <button onClick={() => setGoalType('MAINTAIN')} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${goalType === 'MAINTAIN' ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-gray-100'}`}>
                                <div className="font-bold text-brand-900 text-lg">⚖️ Mantener</div>
                                <p className="text-sm text-gray-500">Mejorar rendimiento y composición corporal sin variar peso.</p>
                            </button>
                            <button onClick={() => setGoalType('GAIN')} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${goalType === 'GAIN' ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-gray-100'}`}>
                                <div className="font-bold text-brand-900 text-lg">💪 Ganar Músculo</div>
                                <p className="text-sm text-gray-500">Superávit controlado para hipertrofia.</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: DATA */}
                {step === 'DATA' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">Tus Datos</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                                <input type="text" value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full p-3 border rounded-xl" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Peso (kg)</label>
                                    <input type="number" value={user.weight} onChange={e => setUser({...user, weight: parseFloat(e.target.value) || 0})} className="w-full p-3 border rounded-xl" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Altura (cm)</label>
                                    <input type="number" value={user.height} onChange={e => setUser({...user, height: parseFloat(e.target.value) || 0})} className="w-full p-3 border rounded-xl" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Edad</label>
                                <input type="number" value={user.age} onChange={e => setUser({...user, age: parseFloat(e.target.value) || 0})} className="w-full p-3 border rounded-xl" />
                            </div>
                            
                            {/* ACTIVITY LEVEL SELECTOR */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nivel de Actividad</label>
                                <select 
                                    value={activityLevel} 
                                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                                    className="w-full p-3 border rounded-xl bg-white text-gray-700 font-medium"
                                >
                                    <option value="SEDENTARY">Sedentario (Oficina, poco ejercicio)</option>
                                    <option value="LIGHT">Ligero (1-3 días entreno/semana)</option>
                                    <option value="MODERATE">Moderado (3-5 días entreno/semana)</option>
                                    <option value="ACTIVE">Activo (6-7 días entreno/semana)</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-1 ml-1">Importante para calcular tu gasto calórico real.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: TARGETS (REVISED UI) */}
                {step === 'TARGETS' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">Objetivos Calculados</h2>
                        
                        {/* CALCULATION BREAKDOWN */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mantenimiento (TDEE):</span>
                                <span className="font-bold text-gray-800">{tdee} kcal</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">
                                    {goalType === 'LOSE' ? 'Déficit aplicado:' : goalType === 'GAIN' ? 'Superávit aplicado:' : 'Ajuste:'}
                                </span>
                                <span className={`font-bold px-2 py-0.5 rounded text-xs ${goalType === 'LOSE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {goalType === 'LOSE' ? '-' : '+'}{Math.abs(deficitPct)}%
                                </span>
                            </div>
                            
                            {/* MANUAL SLIDER */}
                            {goalType !== 'MAINTAIN' && (
                                <div className="py-2">
                                    <div className="flex justify-between text-xs text-gray-400 font-bold mb-1">
                                        <span>Suave ({goalType === 'LOSE' ? '10%' : '5%'})</span>
                                        <span>Intenso ({goalType === 'LOSE' ? '30%' : '20%'})</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min={goalType === 'LOSE' ? 10 : 5} 
                                        max={goalType === 'LOSE' ? 30 : 20} 
                                        step="1"
                                        value={manualDeficitInput}
                                        onChange={handleDeficitChange}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                    />
                                    <div className="text-center text-xs font-bold text-brand-600 mt-1">
                                        Ajuste manual: {manualDeficitInput}%
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-2 mt-2 flex justify-between items-center">
                                <span className="font-bold text-brand-700 text-lg">Objetivo Diario:</span>
                                <span className="font-bold text-brand-700 text-2xl">{user.macroSettings.targets.calories} kcal</span>
                            </div>
                        </div>

                        {/* WARNINGS */}
                        {isOverMaintenance && goalType === 'LOSE' && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-bold border border-red-200">
                                ⚠️ Atención: Estás por encima de tu mantenimiento. No perderás grasa.
                            </div>
                        )}
                        {isTooLow && (
                            <div className="bg-orange-50 text-orange-700 p-3 rounded-lg text-xs font-bold border border-orange-200">
                                ⚠️ Atención: Calorías muy bajas ({'<'}1600). Riesgo de pérdida muscular.
                            </div>
                        )}

                        <p className="text-sm text-gray-500">Ajuste de Macros (Automático):</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 relative group">
                                <label className="block text-xs font-bold text-blue-700 mb-1">Proteína</label>
                                <input type="number" value={user.macroSettings.targets.protein} onChange={e => updateMacros('protein', e.target.value)} className="w-full p-1 bg-white border rounded text-center font-bold" />
                                <div className="text-[10px] text-center text-blue-400 mt-1">{Math.round(user.macroSettings.targets.protein * 4)} kcal</div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 relative group">
                                <label className="block text-xs font-bold text-orange-700 mb-1">Carbos</label>
                                <input type="number" value={user.macroSettings.targets.carbs} onChange={e => updateMacros('carbs', e.target.value)} className="w-full p-1 bg-white border rounded text-center font-bold" />
                                <div className="text-[10px] text-center text-orange-400 mt-1">{Math.round(user.macroSettings.targets.carbs * 4)} kcal</div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 relative group">
                                <label className="block text-xs font-bold text-yellow-700 mb-1">Grasas</label>
                                <input type="number" value={user.macroSettings.targets.fats} onChange={e => updateMacros('fats', e.target.value)} className="w-full p-1 bg-white border rounded text-center font-bold" />
                                <div className="text-[10px] text-center text-yellow-400 mt-1">{Math.round(user.macroSettings.targets.fats * 9)} kcal</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: INJURIES */}
                {step === 'INJURIES' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">Lesiones y Molestias</h2>
                        <p className="text-sm text-gray-500">El entrenador adaptará los ejercicios para evitar estas zonas.</p>
                        
                        <div className="space-y-2">
                            {['Rodilla (Menisco/Ligamento)', 'Hombro Inestable', 'Lumbar (L5-S1)', 'Cadera', 'Muñeca', 'Cervical'].map(inj => (
                                <button 
                                    key={inj} 
                                    onClick={() => toggleInjury(inj)}
                                    className={`w-full p-3 rounded-lg border text-left flex justify-between items-center ${selectedInjuries.includes(inj) ? 'bg-red-50 border-red-500 text-red-700 font-bold' : 'bg-white border-gray-200 text-gray-600'}`}
                                >
                                    {inj}
                                    {selectedInjuries.includes(inj) && <span>✓</span>}
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 border-t">
                            <label className="text-xs font-bold text-gray-500 block mb-2">Otra molestia:</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Ej: Tobillo derecho" 
                                    value={customInjuryName}
                                    onChange={e => setCustomInjuryName(e.target.value)}
                                    className="flex-1 p-2 border rounded-lg text-sm"
                                />
                                <button onClick={addCustomInjury} className="bg-gray-800 text-white px-4 rounded-lg font-bold text-sm">Añadir</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Nav */}
            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                {step !== 'GOAL' && (
                    <button onClick={() => setStep(step === 'DATA' ? 'GOAL' : step === 'TARGETS' ? 'DATA' : 'TARGETS')} className="px-6 py-3 text-gray-500 font-bold">Atrás</button>
                )}
                <button onClick={nextStep} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-700 flex-1">
                    {step === 'INJURIES' ? 'Finalizar' : 'Continuar'}
                </button>
            </div>
        </div>
    );
};

export default OnboardingWizard;
