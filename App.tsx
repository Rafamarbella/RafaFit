
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Eliminamos "/components/" de la ruta porque los archivos están al mismo nivel
import Dashboard from './Dashboard.tsx';
import NutritionView from './NutritionView.tsx';
import TrainingView from './TrainingView.tsx';
import ProfileView from './ProfileView.tsx';
import CalendarView from './CalendarView.tsx';
import StatsView from './StatsView.tsx';
import OnboardingWizard from './OnboardingWizard.tsx';
import ToastContainer from './ToastContainer.tsx';

import { 
  AppView, UserProfile, DayData, FoodLogItem, MealPhase, MacroGoals, BaseFood,
  FavoriteMeal, MacroSettings, TrainingSession 
} from './types';
import StatsView from './components/StatsView.tsx';
import OnboardingWizard from './components/OnboardingWizard.tsx';
import ToastContainer from './components/ui/ToastContainer.tsx';

import { 
  AppView, UserProfile, DayData, FoodLogItem, MealPhase, MacroGoals, BaseFood,
  FavoriteMeal, MacroSettings, TrainingSession 
} from './types'; // Las carpetas de tipos suelen resolver bien sin extensión

import { INITIAL_USER } from './constants';
import { INITIAL_FOOD_DB } from './data/initialFoodDb';
import { calculateAutoMacros } from './utils/nutrition';
import { dayStore } from './data/dayStore';
import { adjustmentService } from './services/adjustmentService';
import { toast } from './utils/toast';
import { 
  AppView, UserProfile, DayData, FoodLogItem, MealPhase, MacroGoals, BaseFood, 
  FavoriteMeal, MacroSettings, TrainingSession 
} from './types';
import { INITIAL_USER } from './constants';
import { INITIAL_FOOD_DB } from './data/initialFoodDb';
import { calculateAutoMacros } from './utils/nutrition';
import { dayStore } from './data/dayStore';
import { adjustmentService } from './services/adjustmentService';
import { toast } from './utils/toast';

const App: React.FC = () => {
  // --- NAVIGATION STATE ---
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // --- USER & GLOBAL DATA ---
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [customFoodDb, setCustomFoodDb] = useState<Record<string, BaseFood>>({});
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // --- DAY STATE (DRAFT vs SAVED) ---
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savedData, setSavedData] = useState<DayData | null>(null);
  const [draftData, setDraftData] = useState<DayData | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // --- NAVIGATION GUARD ---
  const [pendingView, setPendingView] = useState<AppView | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [showNavModal, setShowNavModal] = useState(false);

  // 1. INITIAL LOAD (User, Food, Favorites)
  useEffect(() => {
    // User
    const savedUser = localStorage.getItem('rafa_user_profile');
    if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Check Onboarding
        if (!parsedUser.hasOnboarded) {
            setShowOnboarding(true);
        }
    } else {
        // First run
        setShowOnboarding(true);
    }

    // Food DB
    const savedDb = localStorage.getItem('rafa_food_db');
    if (savedDb) setCustomFoodDb(JSON.parse(savedDb));

    // Favorites
    const savedFavs = localStorage.getItem('rafa_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);

  // 2. LOAD DAY DATA WHEN DATE CHANGES
  useEffect(() => {
    const data = dayStore.loadDay(selectedDate);
    setSavedData(data);
    setDraftData(data);
    setIsDirty(false);
  }, [selectedDate]);

  // Derived Food DB
  const foodDb = useMemo(() => {
    const staticDb = INITIAL_FOOD_DB.reduce((acc, item) => ({ ...acc, [item.id]: item }), {});
    return { ...staticDb, ...customFoodDb };
  }, [customFoodDb]);

  // --- EVENT LISTENER FOR MEAL PLANNER ---
  useEffect(() => {
    const handleApplyPlan = (e: Event) => {
        const customEvent = e as CustomEvent<{ items: FoodLogItem[], mode: 'REPLACE' | 'APPEND' }>;
        if (customEvent.detail && draftData) {
            const { items, mode } = customEvent.detail;
            updateNutrition(n => {
                const existingMeals = mode === 'REPLACE' ? [] : n.meals;
                return {
                    ...n,
                    meals: [...existingMeals, ...items]
                };
            });
        }
    };
    
    window.addEventListener('applyMealPlan', handleApplyPlan);
    return () => window.removeEventListener('applyMealPlan', handleApplyPlan);
  }, [draftData]); 

  // --- ACTIONS ---

  const handleDayChange = (newData: DayData) => {
    setDraftData(newData);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!draftData) return;
    dayStore.saveDay(draftData);
    setSavedData(draftData);
    setIsDirty(false);
    toast.success("Cambios guardados");
    
    // Sync Weight to History if changed in the dashboard input
    if (draftData.weight && draftData.weight !== user.weight) {
        handleRegisterWeightHistory(draftData.weight, draftData.date);
    }
  };

  const handleDiscard = () => {
    if (savedData) {
      setDraftData(savedData);
      setIsDirty(false);
    }
    setShowNavModal(false);
    
    if (pendingDate) {
        setSelectedDate(pendingDate);
        setPendingDate(null);
    } else if (pendingView) {
        setCurrentView(pendingView);
        setPendingView(null);
    }
  };

  const handleCloseDay = () => {
    if (!draftData) return;
    const closedData: DayData = {
      ...draftData,
      isOpen: false,
      closedAt: new Date().toISOString()
    };
    // Auto-save when closing
    dayStore.saveDay(closedData);
    setSavedData(closedData);
    setDraftData(closedData);
    setIsDirty(false);
    toast.info("Día cerrado");
  };

  const handleReopenDay = () => {
    if (!draftData) return;
    const openedData: DayData = {
      ...draftData,
      isOpen: true,
      closedAt: undefined
    };
    setDraftData(openedData);
    setIsDirty(true); 
    toast.info("Día reabierto");
  };

  // --- NAVIGATION & DATE HANDLERS ---

  const navigateTo = (view: AppView) => {
    if (isDirty) {
      setPendingView(view);
      setPendingDate(null);
      setShowNavModal(true);
    } else {
      setCurrentView(view);
    }
  };

  const changeDate = (newDate: string) => {
    if (newDate === selectedDate) return;
    
    if (isDirty) {
      setPendingDate(newDate);
      setPendingView(null);
      setShowNavModal(true);
    } else {
      setSelectedDate(newDate);
    }
  };
  
  const handleCalendarSelect = (date: string) => {
      changeDate(date);
      setCurrentView(AppView.DASHBOARD);
  };

  // --- DATA UPDATERS (Passed to children) ---

  const updateNutrition = (updater: (n: DayData['nutrition']) => DayData['nutrition']) => {
    if (!draftData || !draftData.isOpen) return;
    const newNutrition = updater(draftData.nutrition);
    handleDayChange({ ...draftData, nutrition: newNutrition });
  };

  const updateTraining = (sessions: TrainingSession[]) => {
    if (!draftData || !draftData.isOpen) return;
    handleDayChange({ 
      ...draftData, 
      training: { ...draftData.training, sessions } 
    });
  };

  const updateWeight = (kg: number) => {
    if (!draftData || !draftData.isOpen) return;
    handleDayChange({ ...draftData, weight: kg });
  };

  // --- CORE: User Profile & Macro Logic ---

  const handleRegisterWeightHistory = (kg: number, date: string) => {
    // 1. Update History
    const newHistory = [...user.weightHistory, { weight: kg, date }]
        .filter((v,i,a)=>a.findIndex(t=>(t.date===v.date))===i) // dedup by date
        .sort((a, b) => a.date.localeCompare(b.date));
    
    // 2. Evaluate Adjustment
    const adjustment = adjustmentService.evaluateProgress(kg, newHistory, user.macroSettings);
    
    let newSettings = { ...user.macroSettings };
    
    // 3. Apply Adjustment if needed
    if (adjustment.shouldUpdate && adjustment.newMacros) {
        newSettings = {
            mode: 'AUTO',
            targets: adjustment.newMacros,
            lastUpdated: Date.now(),
            source: 'AUTO_ADJUST'
        };
        toast.info(`Progreso detectado: ${adjustment.reason}`);
    }

    // 4. Save User
    const newUser = { ...user, weight: kg, weightHistory: newHistory, macroSettings: newSettings };
    setUser(newUser);
    localStorage.setItem('rafa_user_profile', JSON.stringify(newUser));
  };

  const handleUpdateMacroSettings = (newSettings: MacroSettings) => {
      const newUser = { ...user, macroSettings: newSettings };
      setUser(newUser);
      localStorage.setItem('rafa_user_profile', JSON.stringify(newUser));
  };

  const handleAddBaseFood = (food: BaseFood) => {
    const newDb = { ...customFoodDb, [food.id]: food };
    setCustomFoodDb(newDb);
    localStorage.setItem('rafa_food_db', JSON.stringify(newDb));
    toast.success("Alimento guardado");
  };

  const handleAddFavorite = (name: string, items: FoodLogItem[]) => {
      const newFav: FavoriteMeal = {
          id: crypto.randomUUID(),
          name,
          ingredients: items.map(i => ({ foodId: i.foodId, grams: i.grams }))
      };
      const updatedFavs = [...favorites, newFav];
      setFavorites(updatedFavs);
      localStorage.setItem('rafa_favorites', JSON.stringify(updatedFavs));
      toast.success("Comida favorita guardada");
  };

  const handleSaveAndProceed = () => {
      handleSave();
      if (pendingDate) {
          setSelectedDate(pendingDate);
          setPendingDate(null);
      } else if (pendingView) {
          setCurrentView(pendingView);
          setPendingView(null);
      }
      setShowNavModal(false);
  };

  const handleOnboardingComplete = (newUser: UserProfile) => {
      setUser(newUser);
      localStorage.setItem('rafa_user_profile', JSON.stringify(newUser));
      setShowOnboarding(false);
      toast.success("¡Perfil configurado! Bienvenido.");
  };

  // --- RENDER ---

  if (!draftData) return <div className="p-10 text-center">Cargando...</div>;

  const currentMacros = user.macroSettings.targets;

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
            <Dashboard 
                data={draftData}
                goals={currentMacros} 
                macroSettings={user.macroSettings}
                phase={user.phase} 
                userWeight={user.weight} 
                weightHistory={user.weightHistory}
                isDirty={isDirty}
                onSave={handleSave}
                onCloseDay={handleCloseDay}
                onReopenDay={handleReopenDay}
                onUpdateWeight={(kg) => updateWeight(kg)}
                onDateChange={changeDate}
            />
        );
      case AppView.CALENDAR:
        return (
            <CalendarView 
                selectedDate={selectedDate}
                onDateSelect={handleCalendarSelect}
            />
        );
      case AppView.NUTRITION:
        return (
          <NutritionView 
            data={draftData}
            isDirty={isDirty}
            goals={currentMacros} 
            phase={user.phase} 
            foodDb={foodDb}
            favorites={favorites}
            onSave={handleSave}
            onUpdateMeals={(meals) => updateNutrition(n => ({ ...n, meals }))}
            onAddBaseFood={handleAddBaseFood}
            onAddFavorite={handleAddFavorite}
          />
        );
      case AppView.TRAINING:
        return (
          <TrainingView 
            user={user} 
            dayData={draftData}
            isDirty={isDirty}
            onSave={handleSave}
            onUpdateSessions={updateTraining}
            onDateChange={changeDate}
          />
        );
      case AppView.PROFILE:
        return (
            <ProfileView 
                user={user} 
                onUpdateMacroSettings={handleUpdateMacroSettings}
            />
        );
      case AppView.STATS:
        return (
            <StatsView user={user} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ToastContainer />
      
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      {!showOnboarding && (
          <Layout currentView={currentView} onNavigate={navigateTo}>
            {renderView()}
          </Layout>
      )}

      {/* NAVIGATION GUARD MODAL */}
      {showNavModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cambios sin guardar</h3>
            <p className="text-gray-600 mb-6">Tienes cambios pendientes. ¿Qué quieres hacer?</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSaveAndProceed}
                className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold"
              >
                Guardar y Continuar
              </button>
              <button 
                onClick={handleDiscard}
                className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-bold"
              >
                Descartar cambios
              </button>
              <button 
                onClick={() => { setShowNavModal(false); setPendingView(null); setPendingDate(null); }}
                className="w-full py-3 text-gray-500 font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
