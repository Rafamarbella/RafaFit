
import React, { useState } from 'react';
import { UserProfile, TrainingSession, StrengthSubtype, TrainingType, MuscleGroup, ExerciseBase, DayData } from '../types';
import { trainingService } from '../services/trainingService';
import { injuryService } from '../services/injuryService';
import { openYouTubeSearch, SearchKind } from '../utils/youtubeSearch';

interface TrainingViewProps {
  user: UserProfile; 
  dayData: DayData; // Source of Truth for SELECTED DATE
  isDirty: boolean;
  onSave: () => void;
  onUpdateSessions: (sessions: TrainingSession[]) => void;
  onDateChange: (date: string) => void;
}

const CARDIO_ACTIVITIES = [
    'Caminar', 'Bicicleta', 'Cinta', 'Elíptica', 'Remo', 'Natación', 
    'Pádel', 'Tenis', 'Fútbol', 'Baloncesto', 'Senderismo', 'Boxeo', 'Otro'
];

const TrainingView: React.FC<TrainingViewProps> = ({ user, dayData, isDirty, onSave, onUpdateSessions }) => {
  // Modals
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [viewSession, setViewSession] = useState<TrainingSession | null>(null);

  // Delete State
  const [sessionToDelete, setSessionToDelete] = useState<TrainingSession | null>(null);

  // Swap State
  const [swapModalData, setSwapModalData] = useState<{ isOpen: boolean; slotId: string; candidates: ExerciseBase[]; loading: boolean } | null>(null);

  // Creation State
  const [newSessionType, setNewSessionType] = useState<TrainingType>('STRENGTH');
  const [newStrengthSubtype, setNewStrengthSubtype] = useState<StrengthSubtype>('GYM_MACHINES');
  
  // Unified Cardio/Activity State
  const [selectedActivity, setSelectedActivity] = useState('Caminar');
  const [customActivityName, setCustomActivityName] = useState('');
  const [activityDuration, setActivityDuration] = useState('45');

  // Editing State
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editActivityName, setEditActivityName] = useState('');
  const [editDuration, setEditDuration] = useState('');

  const isOpen = dayData.isOpen;
  const sessions = dayData.training.sessions;

  // Check for Constraints Mismatch
  const currentConstraintsHash = injuryService.getConstraintsHash(user);
  
  // --- HANDLERS ---

  const handleCreateOrUpdateSession = () => {
    let session: TrainingSession;
    
    if (newSessionType === 'STRENGTH') {
      session = trainingService.generateStrengthSession(newStrengthSubtype, user, dayData.date, sessions);
    } else {
      const finalName = selectedActivity === 'Otro' ? (customActivityName || 'Actividad') : selectedActivity;
      const finalDuration = parseInt(activityDuration) || 45;
      session = trainingService.generateCardioSession(finalName, dayData.date, finalDuration);
    }
    
    onUpdateSessions([...sessions, session]);
    
    setEditModalOpen(false);
    setCustomActivityName('');
    setActivityDuration('45');
    setSelectedActivity('Caminar');
  };

  const handleRegenerateSession = (session: TrainingSession) => {
      if (!confirm("Esto reemplazará la sesión actual adaptándola a tus lesiones activas. ¿Continuar?")) return;
      
      let newSession = session;
      if (session.type === 'STRENGTH' && session.subtype) {
          // Regenerate completely
          newSession = trainingService.generateStrengthSession(session.subtype as StrengthSubtype, user, dayData.date, sessions.filter(s => s.id !== session.id));
      } 
      
      const newSessions = sessions.map(s => s.id === session.id ? newSession : s);
      onUpdateSessions(newSessions);
      if (viewSession?.id === session.id) setViewSession(null);
  };

  const handleFinishSession = () => {
    if (!viewSession || !isOpen) return;
    
    const updatedExercises = viewSession.type === 'STRENGTH' 
        ? viewSession.exercises.map(ex => ({ ...ex, completed: true }))
        : viewSession.exercises;

    const updatedSession: TrainingSession = { 
        ...viewSession, 
        exercises: updatedExercises, 
        completed: true,
        completedAt: Date.now()
    };

    updateSessionInList(updatedSession);
    setViewSession(updatedSession);
  };

  const handleReopenSession = () => {
      if (!viewSession || !isOpen) return;
      if (!confirm("¿Seguro que quieres reabrir la sesión? Podrás editarla de nuevo.")) return;

      const updatedSession = trainingService.reopenSession(viewSession);
      updateSessionInList(updatedSession);
      setViewSession(updatedSession);
  };

  const handleDeleteSession = () => {
      if (!sessionToDelete) return;
      
      const newSessions = sessions.filter(s => s.id !== sessionToDelete.id);
      onUpdateSessions(newSessions);
      
      // Close all modals
      setSessionToDelete(null);
      if (viewSession?.id === sessionToDelete.id) setViewSession(null);
  };

  const toggleExercise = (idx: number) => {
    if (!viewSession || !isOpen) return;
    const newExercises = [...viewSession.exercises];
    // Safety check for keys
    if (!newExercises[idx].slotId) newExercises[idx].slotId = crypto.randomUUID();
    
    newExercises[idx] = { ...newExercises[idx], completed: !newExercises[idx].completed };
    const updatedSession = { ...viewSession, exercises: newExercises };
    updateSessionInList(updatedSession);
    setViewSession(updatedSession);
  };

  // --- SWAP LOGIC ---

  const handleOpenSwapModal = (e: React.MouseEvent, exercise: ExerciseBase) => {
      e.stopPropagation();
      if (!viewSession || !isOpen) return;

      // Ensure slotId exists (polyfill for old data)
      const targetSlotId = exercise.slotId || crypto.randomUUID();
      if (!exercise.slotId) exercise.slotId = targetSlotId; // mutate locally to fix

      setSwapModalData({ isOpen: true, slotId: targetSlotId, candidates: [], loading: true });

      // Async fetch candidates
      setTimeout(() => {
          const candidates = trainingService.getExerciseAlternatives(exercise, viewSession, user);
          setSwapModalData(prev => prev ? { ...prev, candidates, loading: false } : null);
          
          if (candidates.length === 0) {
              // Now less likely to happen thanks to fallback tiers
              alert("No se encontraron alternativas seguras para este ejercicio con tus restricciones.");
              setSwapModalData(null);
          }
      }, 500);
  };

  const handleSelectAlternative = (newExercise: ExerciseBase) => {
      if (!viewSession || !swapModalData) return;

      const updatedSession = trainingService.executeSwap(viewSession, swapModalData.slotId, newExercise);
      
      updateSessionInList(updatedSession);
      setViewSession(updatedSession);
      setSwapModalData(null);
  };

  const updateSessionInList = (updated: TrainingSession) => {
      const newSessions = sessions.map(s => s.id === updated.id ? updated : s);
      onUpdateSessions(newSessions);
  };

  const handleSaveEditDetails = () => {
      if (!viewSession || !isOpen) return;
      
      const updatedSession = { 
          ...viewSession,
          subtype: editActivityName || viewSession.subtype,
          durationMin: parseInt(editDuration) || viewSession.durationMin
      };

      updateSessionInList(updatedSession);
      setViewSession(updatedSession);
      setIsEditingDetails(false);
  };

  const openSessionDetails = (session: TrainingSession) => {
      // Polyfill IDs just in case
      if (session.type === 'STRENGTH') {
          session.exercises.forEach(ex => {
              if (!ex.slotId) ex.slotId = crypto.randomUUID();
          });
      }
      setViewSession(session);
      setIsEditingDetails(false); 
      setEditActivityName((session.subtype as string) || '');
      setEditDuration(session.durationMin.toString());
  };

  const handleSearchVideo = (title: string, type: 'STRENGTH' | 'CARDIO' | 'SPORT', subtype?: string) => {
      let kind: SearchKind = 'exercise';
      if (type === 'STRENGTH') {
          if (subtype === 'CIRCUIT_BW') kind = 'circuit';
          else kind = 'exercise';
      } else if (type === 'CARDIO' || type === 'SPORT') {
          const lowerName = title.toLowerCase();
          if (['padel', 'tenis', 'futbol', 'baloncesto', 'boxeo'].some(s => lowerName.includes(s))) {
              kind = 'sport';
          } else {
              kind = 'cardio';
          }
      }
      openYouTubeSearch(title, kind);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* --- DAILY VIEW HEADER --- */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
              {new Date(dayData.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <div className="flex gap-2">
             {isDirty && (
                 <button onClick={onSave} className="bg-brand-600 text-white px-3 py-1.5 rounded font-bold text-xs animate-pulse shadow-sm">
                     Guardar
                 </button>
             )}
             {(isOpen || new Date(dayData.date) > new Date()) && (
                  <button 
                    onClick={() => setEditModalOpen(true)}
                    className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100"
                  >
                      + Añadir
                  </button>
              )}
          </div>
      </div>

      {/* --- SESSIONS LIST --- */}
      <div className="p-4 flex-1 space-y-4 overflow-y-auto">
          {sessions.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                  <p>Sin sesiones registradas</p>
                  <p className="text-xs mt-1">Planifica tu fuerza o cardio para este día.</p>
              </div>
          )}

          {sessions.map(session => {
              const needsUpdate = session.type === 'STRENGTH' && 
                                  session.generatedWithConstraintsHash && 
                                  session.generatedWithConstraintsHash !== currentConstraintsHash &&
                                  !session.completed;

              return (
                  <div 
                    key={session.id}
                    onClick={() => openSessionDetails(session)}
                    className={`p-4 rounded-2xl border shadow-sm transition-transform relative overflow-hidden cursor-pointer active:scale-95 ${
                        session.completed ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100'
                    }`}
                  >
                      {session.completed && (
                          <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl shadow-sm z-10">
                              ✓ Completada
                          </div>
                      )}
                      {!session.completed && needsUpdate && (
                          <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-bl-xl shadow-sm z-10">
                              ⚠ Revisar Lesiones
                          </div>
                      )}

                      <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-full ${
                                  session.type === 'STRENGTH' ? 'bg-blue-100 text-blue-600' : 
                                  'bg-orange-100 text-orange-600'
                              }`}>
                                  {session.type === 'STRENGTH' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                                  {(session.type === 'CARDIO' || session.type === 'SPORT') && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                              </div>
                              <div>
                                  <h4 className={`font-bold ${session.completed ? 'text-green-800' : 'text-gray-900'}`}>
                                      {session.type === 'STRENGTH' ? 'Fuerza' : 'Cardio'}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                      {session.type === 'STRENGTH' 
                                          ? (session.subtype === 'BANDS' ? 'Gomas' : session.subtype === 'CIRCUIT_BW' ? 'Circuito' : 'Gimnasio')
                                          : `${session.subtype || 'Actividad'} · ${session.durationMin} min`
                                      }
                                  </p>
                              </div>
                          </div>
                          
                          {/* DELETE BUTTON (List View) */}
                          {isOpen && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSessionToDelete(session); }}
                                className="text-gray-400 hover:text-red-500 p-2"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                          )}
                      </div>
                      
                      {needsUpdate && isOpen && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRegenerateSession(session); }}
                            className="mt-3 w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 flex items-center justify-center gap-1"
                          >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              Regenerar (Cambios en lesiones)
                          </button>
                      )}
                  </div>
              );
          })}
      </div>

      {/* --- MODAL: CREATE SESSION --- */}
      {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                   <h3 className="text-lg font-bold mb-4">Añadir Actividad</h3>
                  
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-6">
                      <button onClick={() => setNewSessionType('STRENGTH')} className={`flex-1 py-2 rounded-md font-bold text-xs ${newSessionType === 'STRENGTH' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}>Fuerza</button>
                      <button onClick={() => setNewSessionType('CARDIO')} className={`flex-1 py-2 rounded-md font-bold text-xs ${newSessionType === 'CARDIO' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}>Cardio / Actividad</button>
                  </div>

                  <div className="space-y-4 mb-6">
                      {newSessionType === 'STRENGTH' ? (
                          <div className="space-y-3">
                              <label className="block text-sm font-bold text-gray-700">Tipo de Sesión</label>
                              <select value={newStrengthSubtype} onChange={(e) => setNewStrengthSubtype(e.target.value as StrengthSubtype)} className="w-full p-3 rounded-lg border bg-gray-50">
                                  <option value="GYM_MACHINES">Pesas en Gimnasio</option>
                                  <option value="BANDS">Gomas Elásticas</option>
                                  <option value="CIRCUIT_BW">Circuito Funcional</option>
                              </select>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              <label className="block text-sm font-bold text-gray-700">Actividad</label>
                              <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-3 rounded-lg border bg-gray-50">
                                  {CARDIO_ACTIVITIES.map(a => <option key={a} value={a}>{a}</option>)}
                              </select>
                              {selectedActivity === 'Otro' && <input type="text" placeholder="Nombre" value={customActivityName} onChange={e => setCustomActivityName(e.target.value)} className="w-full p-3 rounded-lg border" />}
                              <label className="block text-sm font-bold text-gray-700 mt-2">Duración (min)</label>
                              <input type="number" value={activityDuration} onChange={e => setActivityDuration(e.target.value)} className="w-full p-3 rounded-lg border font-bold" />
                          </div>
                      )}
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setEditModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold">Cancelar</button>
                      <button onClick={handleCreateOrUpdateSession} className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-md">Crear</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: VIEW SESSION DETAILS --- */}
      {viewSession && (
          <div className="fixed inset-0 bg-white z-[100] flex flex-col h-[100dvh]">
              
              <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10 shrink-0">
                  <button onClick={() => setViewSession(null)} className="p-2 -ml-2 text-gray-500">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="text-center">
                    <h3 className="font-bold text-lg leading-tight">Detalles Sesión</h3>
                    {viewSession.completed && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">¡Completada!</span>}
                  </div>
                  <div className="w-10 flex justify-end">
                      {isOpen && (
                          <button onClick={() => setSessionToDelete(viewSession)} className="text-red-500 p-2">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                      )}
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                  <div className="flex items-center gap-3 mb-6">
                       <div className={`p-4 rounded-full ${viewSession.type === 'STRENGTH' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                           {viewSession.type === 'STRENGTH' && <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                           {viewSession.type !== 'STRENGTH' && <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                       </div>
                       <div>
                           <h2 className="text-2xl font-bold text-gray-900 leading-tight">{viewSession.type === 'STRENGTH' ? 'Fuerza' : 'Cardio'}</h2>
                           {viewSession.type === 'STRENGTH' ? (
                               <span className="bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">{viewSession.subtype}</span>
                           ) : (
                               <span className="text-gray-500 text-sm font-medium">Actividad física</span>
                           )}
                       </div>
                  </div>

                  {(viewSession.type === 'CARDIO' || viewSession.type === 'SPORT') && (
                      <div className="bg-white p-6 rounded-xl border shadow-sm text-center mb-6 relative">
                          {!isEditingDetails && isOpen ? (
                              <>
                                  <button onClick={() => setIsEditingDetails(true)} className="absolute top-3 right-3 text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">Editar</button>
                                  <p className="text-gray-500 mb-4 text-lg font-medium">{viewSession.subtype}</p>
                                  <div className="text-5xl font-bold text-orange-500 mb-2">{viewSession.durationMin}</div>
                                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Minutos</div>
                              </>
                          ) : isEditingDetails ? (
                              <div className="space-y-4 text-left">
                                  <h4 className="font-bold text-gray-700 border-b pb-2">Editar Actividad</h4>
                                  <div><label className="text-xs font-bold text-gray-500">Actividad</label><input type="text" value={editActivityName} onChange={e => setEditActivityName(e.target.value)} className="w-full p-2 border rounded font-bold text-gray-800" /></div>
                                  <div><label className="text-xs font-bold text-gray-500">Duración (min)</label><input type="number" value={editDuration} onChange={e => setEditDuration(e.target.value)} className="w-full p-2 border rounded font-bold text-gray-800" /></div>
                                  <div className="flex gap-2 mt-2"><button onClick={() => setIsEditingDetails(false)} className="flex-1 py-2 text-gray-500 text-sm">Cancelar</button><button onClick={handleSaveEditDetails} className="flex-1 py-2 bg-brand-600 text-white rounded text-sm font-bold">Guardar</button></div>
                              </div>
                          ) : (
                             <>
                                <p className="text-gray-500 mb-4 text-lg font-medium">{viewSession.subtype}</p>
                                <div className="text-5xl font-bold text-orange-500 mb-2">{viewSession.durationMin}</div>
                                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Minutos</div>
                             </>
                          )}
                          {!isEditingDetails && (
                              <button onClick={() => handleSearchVideo(viewSession.subtype as string, viewSession.type as any, viewSession.subtype as string)} className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 flex items-center justify-center gap-2"><span>🔍 Buscar en YouTube</span></button>
                          )}
                      </div>
                  )}

                  {viewSession.type === 'STRENGTH' && (
                      <div className="space-y-4">
                          <h4 className="font-bold text-gray-800">Ejercicios</h4>
                          {viewSession.exercises.map((ex, idx) => (
                              <div key={ex.slotId || idx} onClick={() => toggleExercise(idx)} className={`p-4 rounded-xl border shadow-sm transition-all flex flex-col gap-3 ${ex.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                  <div className="flex gap-4 items-start">
                                      <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${ex.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                                          {ex.completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                      </div>
                                      <div className="flex-1">
                                          <h5 className={`font-bold ${ex.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>{ex.name}</h5>
                                          <p className="text-sm text-gray-500">{ex.sets} x {ex.reps} {ex.notes && `• ${ex.notes}`}</p>
                                          {ex.replacedFrom && <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-1 rounded">⟳ Reemplazo</span>}
                                      </div>
                                  </div>
                                  <div className="flex justify-end gap-2 items-center">
                                     {isOpen && !viewSession.completed && (
                                         <button 
                                            onClick={(e) => handleOpenSwapModal(e, ex)}
                                            className={`px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50 flex items-center gap-1`}
                                         >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            Cambiar
                                         </button>
                                     )}
                                     <button onClick={(e) => { e.stopPropagation(); handleSearchVideo(ex.name, 'STRENGTH', viewSession.subtype as string); }} className="px-3 py-1 bg-gray-50 text-gray-500 rounded text-xs font-bold hover:bg-gray-100">🔍 Video</button>
                                  </div>
                              </div>
                          ))}
                          <div className="h-4"></div>
                      </div>
                  )}
              </div>
              
              <div className="p-4 border-t bg-white safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">
                  {isOpen ? (
                      <>
                        <button 
                            onClick={!viewSession.completed ? handleFinishSession : undefined} 
                            disabled={viewSession.completed} 
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 ${viewSession.completed ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-default' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                        >
                            {viewSession.completed ? 'Sesión Completada' : '¡Finalizar Sesión!'}
                        </button>
                        {viewSession.completed && (
                            <button 
                                onClick={handleReopenSession} 
                                className="w-full mt-3 py-2 text-sm text-gray-500 font-bold hover:text-brand-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                ↻ Reabrir sesión para editar
                            </button>
                        )}
                      </>
                  ) : (
                      <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm font-medium text-center border border-orange-100">
                          🔒 El día está cerrado. <br/>Reabre el día en el Inicio para editar.
                      </div>
                  )}
              </div>

              {/* --- SWAP MODAL (BOTTOM SHEET) --- */}
              {swapModalData?.isOpen && (
                  <div className="fixed inset-0 bg-black/60 z-[110] flex flex-col justify-end">
                      <div className="bg-white rounded-t-2xl p-5 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
                          <div className="flex justify-between items-center mb-4 shrink-0">
                              <h3 className="text-lg font-bold text-gray-900">Elegir alternativa</h3>
                              <button onClick={() => setSwapModalData(null)} className="p-2 text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                          </div>
                          
                          {swapModalData.loading ? (
                              <div className="py-10 text-center text-gray-500">
                                  <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                  Buscando opciones seguras...
                              </div>
                          ) : (
                              <div className="overflow-y-auto space-y-3 pb-safe">
                                  {swapModalData.candidates.map(cand => (
                                      <button 
                                          key={cand.id}
                                          onClick={() => handleSelectAlternative(cand)}
                                          className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-brand-500 hover:bg-brand-50 transition-colors flex justify-between items-center group shadow-sm"
                                      >
                                          <div>
                                              <h4 className="font-bold text-gray-800 group-hover:text-brand-700">{cand.name}</h4>
                                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{cand.notes || 'Sin notas'}</p>
                                          </div>
                                          <span className="text-brand-600 font-bold text-sm bg-brand-100 px-3 py-1 rounded-lg">Seleccionar</span>
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* --- CONFIRM DELETE SESSION MODAL --- */}
      {sessionToDelete && (
          <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-lg font-bold mb-2 text-gray-900">¿Eliminar esta sesión?</h3>
                  <p className="text-sm text-gray-600 mb-6">Se borrará de tu planificación de hoy. Si quieres cambiar el tipo de entreno (ej: de Gimnasio a Casa), esta es la forma correcta.</p>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setSessionToDelete(null)} 
                          className="flex-1 py-2 text-gray-600 font-bold border border-gray-200 rounded-lg"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleDeleteSession} 
                          className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                      >
                          Eliminar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TrainingView;
