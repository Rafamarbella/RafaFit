import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Importamos desde el mismo nivel porque App.tsx está en la carpeta components
import Dashboard from './Dashboard';
import NutritionView from './NutritionView';
import TrainingView from './TrainingView';
import ProfileView from './ProfileView';
import CalendarView from './CalendarView';
import StatsView from './StatsView';
import OnboardingWizard from './OnboardingWizard';
import ToastContainer from './ToastContainer';

import { 
  AppView, UserProfile, DayData, FoodLogItem, MealPhase, MacroGoals, BaseFood,
  FavoriteMeal, MacroSettings, TrainingSession 
} from './types';

// Usamos ../ para salir de la carpeta components y encontrar el resto
import { INITIAL_USER } from '../constants';
import { INITIAL_FOOD_DB } from '../data/initialFoodDb';
import { calculateAutoMacros } from '../utils/nutrition';
import { dayStore } from '../data/dayStore';
import { adjustmentService } from '../services/adjustmentService';
import { toast } from '../utils/toast';

const App: React.FC = () => {
  // --- ESTADOS DE NAVEGACIÓN ---
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- LÓGICA DE CARGA ---
  useEffect(() => {
    const savedUser = localStorage.getItem('rafafit_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoaded(true);
  }, []);

  // --- RENDERIZADO SEGÚN LA VISTA ---
  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard user={user} />;
      case AppView.NUTRITION:
        return <NutritionView user={user} />;
      case AppView.TRAINING:
        return <TrainingView user={user} />;
      case AppView.PROFILE:
        return <ProfileView user={user} setUser={setUser} />;
      case AppView.CALENDAR:
        return <CalendarView />;
      case AppView.STATS:
        return <StatsView />;
      default:
        return <Dashboard user={user} />;
    }
  };

  if (!isLoaded) return <div className="p-8 text-center">Cargando aplicación...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-20">
        {user.onboardingCompleted ? renderView() : <OnboardingWizard onComplete={(u) => setUser(u)} />}
      </main>
      
      {/* Navegación básica (ajusta según tus componentes) */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-2">
        <button onClick={() => setCurrentView(AppView.DASHBOARD)}>Inicio</button>
        <button onClick={() => setCurrentView(AppView.NUTRITION)}>Dieta</button>
        <button onClick={() => setCurrentView(AppView.TRAINING)}>Entreno</button>
      </nav>

      <ToastContainer />
    </div>
  );
};

export default App;
