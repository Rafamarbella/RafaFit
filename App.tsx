import React, { useState, useEffect } from 'react';

// 1. COMPONENTES (Están en la misma carpeta raíz según tu captura)
import Dashboard from './Dashboard';
import NutritionView from './NutritionView';
import TrainingView from './TrainingView';
import ProfileView from './ProfileView';
import CalendarView from './CalendarView';
import StatsView from './StatsView';
import OnboardingWizard from './OnboardingWizard';
import ToastContainer from './ToastContainer';
import { AppView, UserProfile } from './types';

// 2. DATOS Y UTILS (También están en la raíz, no hace falta salir con ../)
import { INITIAL_USER } from './constants';
import { INITIAL_FOOD_DB } from './data/initialFoodDb';
import { calculateAutoMacros } from './utils/nutrition';
import { dayStore } from './data/dayStore';
import { adjustmentService } from './services/adjustmentService';
import { toast } from './utils/toast';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('rafafit_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoaded(true);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard user={user} />;
      case AppView.NUTRITION: return <NutritionView user={user} />;
      case AppView.TRAINING: return <TrainingView user={user} />;
      case AppView.PROFILE: return <ProfileView user={user} setUser={setUser} />;
      case AppView.CALENDAR: return <CalendarView />;
      case AppView.STATS: return <StatsView />;
      default: return <Dashboard user={user} />;
    }
  };

  if (!isLoaded) return <div className="p-8 text-center font-sans">Cargando aplicación...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="pb-20">
        {user.onboardingCompleted ? renderView() : <OnboardingWizard onComplete={(u) => setUser(u)} />}
      </main>
      
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-4 shadow-lg z-50">
        <button className="font-bold text-blue-600" onClick={() => setCurrentView(AppView.DASHBOARD)}>Inicio</button>
        <button className="font-bold text-blue-600" onClick={() => setCurrentView(AppView.NUTRITION)}>Dieta</button>
        <button className="font-bold text-blue-600" onClick={() => setCurrentView(AppView.TRAINING)}>Entreno</button>
      </nav>

      <ToastContainer />
    </div>
  );
};

export default App;
