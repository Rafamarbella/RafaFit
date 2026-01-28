import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Importamos desde el mismo nivel porque App.tsx está DENTRO de la carpeta components
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

import { INITIAL_USER } from '../constants';
import { INITIAL_FOOD_DB } from '../data/initialFoodDb';
import { calculateAutoMacros } from '../utils/nutrition';
import { dayStore } from '../data/dayStore';
import { adjustmentService } from '../services/adjustmentService';
import { toast } from '../utils/toast';

const App: React.FC = () => {
  // Aquí sigue el resto de tu código de la función App...
