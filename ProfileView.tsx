
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, MacroSettings, MacroGoals, CustomInjury, BodyArea } from '../types';
import { INITIAL_USER } from '../constants';
import { injuryService } from '../services/injuryService';
import { backupService } from '../services/backupService';
import { diagnosticService } from '../services/diagnosticService';
import { toast } from '../utils/toast';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateMacroSettings: (settings: MacroSettings) => void;
}

const BODY_AREAS: BodyArea[] = ['HOMBRO', 'RODILLA', 'LUMBAR', 'CADERA', 'CODO', 'MUÑECA', 'CUELLO', 'TOBILLO', 'ESPALDA', 'OTRO'];

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateMacroSettings }) => {
  // Macros State
  const [isEditingMacros, setIsEditingMacros] = useState(false);
  const [tempMacros, setTempMacros] = useState<MacroGoals>(user.macroSettings.targets);
  const [tempMode, setTempMode] = useState<'AUTO' | 'MANUAL'>(user.macroSettings.mode);

  // Injuries State
  const [customInjuries, setCustomInjuries] = useState<CustomInjury[]>([]);
  const [isAddingInjury, setIsAddingInjury] = useState(false);
  const [newInjury, setNewInjury] = useState<{ title: string; area: BodyArea; severity: number; keywords: string }>({
      title: '', area: 'HOMBRO', severity: 3, keywords: ''
  });

  // Delete Modal
  const [injuryToDelete, setInjuryToDelete] = useState<string | null>(null);

  // Backup State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreModal, setRestoreModal] = useState<{ isOpen: boolean; content: string } | null>(null);

  // Diagnostic State
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticLog, setDiagnosticLog] = useState<string[]>([]);

  useEffect(() => {
      refreshInjuries();
  }, []);

  const refreshInjuries = () => {
      setCustomInjuries(injuryService.getAll());
  };

  const handleSaveMacros = () => {
      onUpdateMacroSettings({
          mode: tempMode,
          targets: tempMacros,
          lastUpdated: Date.now(),
          source: tempMode === 'AUTO' ? 'AUTO_ADJUST' : 'MANUAL'
      });
      setIsEditingMacros(false);
      toast.success("Macros actualizados");
  };

  const handleAddInjury = () => {
      if (!newInjury.title) return;
      
      const keywordsArray = newInjury.keywords.split(',').map(s => s.trim()).filter(Boolean);
      
      const updatedList = injuryService.add({
          title: newInjury.title,
          bodyArea: newInjury.area,
          severity: newInjury.severity,
          isActive: true, // Default active
          avoidMovements: keywordsArray
      });
      
      setCustomInjuries(updatedList);
      setNewInjury({ title: '', area: 'HOMBRO', severity: 3, keywords: '' });
      setIsAddingInjury(false);
      toast.success("Lesión añadida");
  };

  const handleToggleInjury = (id: string) => {
      const updatedList = injuryService.toggleActive(id);
      setCustomInjuries(updatedList);
  };

  const handleDeleteClick = (id: string) => {
      setInjuryToDelete(id);
  };

  const confirmDelete = () => {
      if (injuryToDelete) {
          const updatedList = injuryService.delete(injuryToDelete);
          setCustomInjuries(updatedList);
          setInjuryToDelete(null);
          toast.success("Lesión eliminada");
      }
  };

  // --- BACKUP HANDLERS ---
  const handleExport = () => {
      backupService.exportData();
      toast.success("Copia exportada correctamente");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const text = await backupService.readFile(file);
          setRestoreModal({ isOpen: true, content: text });
      } catch (e) {
          toast.error("Error leyendo archivo");
      }
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  const handleRestore = (mode: 'REPLACE' | 'MERGE') => {
      if (!restoreModal) return;
      const res = backupService.importData(restoreModal.content, mode);
      if (res.success) {
          alert(res.message + "\nLa aplicación se recargará ahora.");
          window.location.reload();
      } else {
          toast.error("Error: " + res.message);
          setRestoreModal(null);
      }
  };

  // --- DIAGNOSTIC HANDLERS ---
  const runDiagnostic = () => {
      const report = diagnosticService.scan();
      const logs = [
          `Índice: ${report.indexCount} entradas`,
          `Archivos de datos: ${report.dataFilesCount}`,
          `Errores encontrados: ${report.issues.length}`,
          ...report.issues
      ];
      setDiagnosticLog(logs);
  };

  const runRepair = () => {
      if (!confirm("Esto intentará reparar inconsistencias. ¿Continuar?")) return;
      const logs = diagnosticService.repair();
      setDiagnosticLog(prev => [...prev, '--- REPARACIÓN ---', ...logs]);
      toast.success("Reparación completada");
  };

  return (
    <div className="p-4 space-y-6 relative pb-32">
      <h2 className="text-2xl font-bold text-gray-900">Perfil</h2>
      
      {/* Datos Personales */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center text-3xl font-bold text-gray-400">
            R
        </div>
        <h3 className="text-xl font-bold">{user.name}</h3>
        <p className="text-gray-500">{user.age} años • {user.height} cm • {user.weight} kg</p>
      </div>

      {/* --- SECCIÓN LESIONES --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h4 className="font-bold text-gray-800">Lesiones y Dolores</h4>
            <button onClick={() => setIsAddingInjury(!isAddingInjury)} className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full border border-red-100">
                {isAddingInjury ? 'Cancelar' : '+ Añadir'}
            </button>
        </div>

        {/* Formulario Añadir */}
        {isAddingInjury && (
            <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200 space-y-3">
                <input 
                    type="text" placeholder="Ej: Dolor hombro al levantar" 
                    className="w-full p-2 border rounded text-sm"
                    value={newInjury.title} onChange={e => setNewInjury({...newInjury, title: e.target.value})}
                />
                <div className="flex gap-2">
                    <select 
                        className="flex-1 p-2 border rounded text-sm bg-white"
                        value={newInjury.area} onChange={e => setNewInjury({...newInjury, area: e.target.value as BodyArea})}
                    >
                        {BODY_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <div className="flex items-center gap-2 bg-white px-2 border rounded">
                        <span className="text-xs font-bold text-gray-500">Nivel {newInjury.severity}</span>
                        <input 
                            type="range" min="1" max="5" step="1" 
                            className="w-20"
                            value={newInjury.severity} onChange={e => setNewInjury({...newInjury, severity: parseInt(e.target.value)})}
                        />
                    </div>
                </div>
                <input 
                    type="text" placeholder="Evitar (opcional): saltos, impacto..." 
                    className="w-full p-2 border rounded text-xs"
                    value={newInjury.keywords} onChange={e => setNewInjury({...newInjury, keywords: e.target.value})}
                />
                <button onClick={handleAddInjury} className="w-full bg-red-600 text-white py-2 rounded font-bold text-sm">Guardar Dolor</button>
            </div>
        )}

        <div className="space-y-3">
            {/* Lesiones Fijas */}
            {INITIAL_USER.injuries.map((injury, i) => (
                <div key={`static-${i}`} className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="flex-1">{injury}</span>
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded">Crónica</span>
                </div>
            ))}

            {/* Lesiones Personalizadas */}
            {customInjuries.map(inj => (
                <div key={inj.id} className={`flex flex-col p-3 rounded-lg border transition-colors ${inj.isActive ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${inj.isActive ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                            <span className={`font-bold text-sm ${inj.isActive ? 'text-red-800' : 'text-gray-500'}`}>{inj.title}</span>
                        </div>
                        
                        {/* Control Actions */}
                        <div className="flex gap-2 items-center">
                            <button 
                                onClick={() => handleToggleInjury(inj.id)} 
                                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${inj.isActive ? 'text-white bg-green-500 hover:bg-green-600' : 'text-gray-500 bg-gray-200 hover:bg-gray-300'}`}
                            >
                                {inj.isActive ? 'ACTIVO' : 'INACTIVO'}
                            </button>
                            
                            {/* Delete Button - Only enabled if Inactive */}
                            <button 
                                onClick={() => !inj.isActive && handleDeleteClick(inj.id)} 
                                disabled={inj.isActive}
                                title={inj.isActive ? "Desactiva la lesión para eliminarla" : "Eliminar definitivamente"}
                                className={`p-1.5 rounded transition-colors ${
                                    inj.isActive 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="text-xs text-gray-500">
                            {inj.bodyArea} • Nivel {inj.severity} 
                            {inj.avoidMovements && inj.avoidMovements.length > 0 && <span className="block mt-1 italic text-[10px]">Evitar: {inj.avoidMovements.join(', ')}</span>}
                        </div>
                    </div>
                </div>
            ))}
            
            {customInjuries.length === 0 && <p className="text-center text-xs text-gray-400 italic pt-2">No has añadido dolores nuevos.</p>}
        </div>
      </div>

      {/* Configuración Nutricional */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h4 className="font-bold text-gray-800">Objetivos Nutricionales</h4>
              {!isEditingMacros ? (
                  <button onClick={() => setIsEditingMacros(true)} className="text-xs text-brand-600 font-bold bg-brand-50 px-2 py-1 rounded">Editar</button>
              ) : (
                  <div className="flex gap-2">
                      <button onClick={() => setIsEditingMacros(false)} className="text-xs text-gray-500 font-bold">Cancelar</button>
                      <button onClick={handleSaveMacros} className="text-xs text-white bg-brand-600 px-2 py-1 rounded font-bold">Guardar</button>
                  </div>
              )}
          </div>

          <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">Modo Ajuste</span>
                  {isEditingMacros ? (
                      <div className="flex bg-gray-100 rounded p-1">
                          <button onClick={() => setTempMode('AUTO')} className={`px-3 py-1 rounded text-xs font-bold ${tempMode === 'AUTO' ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}>Auto</button>
                          <button onClick={() => setTempMode('MANUAL')} className={`px-3 py-1 rounded text-xs font-bold ${tempMode === 'MANUAL' ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}>Manual</button>
                      </div>
                  ) : (
                      <span className={`text-xs font-bold px-2 py-1 rounded ${user.macroSettings.mode === 'AUTO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {user.macroSettings.mode === 'AUTO' ? 'Automático' : 'Manual'}
                      </span>
                  )}
              </div>

              {tempMode === 'AUTO' && isEditingMacros && (
                  <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                      El sistema ajustará tus calorías y macros semanalmente basándose en tu peso.
                  </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs text-gray-500 block mb-1">Calorías</label>
                      <input 
                        type="number" 
                        disabled={!isEditingMacros || tempMode === 'AUTO'}
                        value={tempMacros.calories}
                        onChange={e => setTempMacros({...tempMacros, calories: parseInt(e.target.value)})}
                        className="w-full p-2 border rounded font-bold bg-gray-50 disabled:text-gray-400"
                      />
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 block mb-1">Proteína (g)</label>
                      <input 
                        type="number" 
                        disabled={!isEditingMacros || tempMode === 'AUTO'}
                        value={tempMacros.protein}
                        onChange={e => setTempMacros({...tempMacros, protein: parseInt(e.target.value)})}
                        className="w-full p-2 border rounded font-bold bg-gray-50 disabled:text-gray-400"
                      />
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 block mb-1">Carbos (g)</label>
                      <input 
                        type="number" 
                        disabled={!isEditingMacros || tempMode === 'AUTO'}
                        value={tempMacros.carbs}
                        onChange={e => setTempMacros({...tempMacros, carbs: parseInt(e.target.value)})}
                        className="w-full p-2 border rounded font-bold bg-gray-50 disabled:text-gray-400"
                      />
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 block mb-1">Grasas (g)</label>
                      <input 
                        type="number" 
                        disabled={!isEditingMacros || tempMode === 'AUTO'}
                        value={tempMacros.fats}
                        onChange={e => setTempMacros({...tempMacros, fats: parseInt(e.target.value)})}
                        className="w-full p-2 border rounded font-bold bg-gray-50 disabled:text-gray-400"
                      />
                  </div>
              </div>
          </div>
      </div>

      {/* --- BACKUP SECTION --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Copia de Seguridad</h4>
          <div className="grid grid-cols-2 gap-4">
              <button 
                  onClick={handleExport}
                  className="py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 border border-gray-200 flex flex-col items-center justify-center gap-1"
              >
                  <span>⬇️ Exportar</span>
                  <span className="text-[10px] font-normal text-gray-500">Guardar archivo</span>
              </button>
              
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 border border-gray-200 flex flex-col items-center justify-center gap-1"
              >
                  <span>⬆️ Importar</span>
                  <span className="text-[10px] font-normal text-gray-500">Restaurar datos</span>
              </button>
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept=".json" 
                  className="hidden" 
              />
          </div>
          <p className="text-[10px] text-gray-400 mt-3 text-center">
              Guarda tu archivo .json en un lugar seguro. Contiene todo tu historial.
          </p>
      </div>

      {/* --- DIAGNOSTIC TOOL (BOTTOM) --- */}
      <div className="mt-8 pt-8 border-t border-gray-200">
          <button onClick={() => setShowDiagnostic(!showDiagnostic)} className="text-xs text-gray-400 font-bold block mx-auto hover:text-gray-600">
              🛠️ Herramientas de Diagnóstico
          </button>
          
          {showDiagnostic && (
              <div className="mt-4 bg-gray-800 p-4 rounded-xl text-white font-mono text-xs">
                  <div className="flex gap-2 mb-4">
                      <button onClick={runDiagnostic} className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded">Escanear</button>
                      <button onClick={runRepair} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded">Reparar</button>
                  </div>
                  <div className="h-40 overflow-y-auto bg-gray-900 p-2 rounded">
                      {diagnosticLog.length === 0 ? <p className="opacity-50">Listo para escanear.</p> : diagnosticLog.map((l, i) => <div key={i}>{l}</div>)}
                  </div>
              </div>
          )}
      </div>

      <div className="text-center text-xs text-gray-400 mt-4">
        RafaFit Coach v1.4.0
      </div>

      {/* --- CONFIRMATION MODAL DELETE INJURY --- */}
      {injuryToDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-xs shadow-2xl">
                  <h3 className="font-bold text-lg mb-2 text-gray-900">¿Eliminar lesión?</h3>
                  <p className="text-sm text-gray-600 mb-6">
                      Se borrará del historial y no aparecerá en el listado.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setInjuryToDelete(null)} className="flex-1 py-2 text-gray-600 font-bold border border-gray-200 rounded-lg">Cancelar</button>
                      <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg">Eliminar</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- RESTORE MODAL --- */}
      {restoreModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Restaurar Datos</h3>
                  <p className="text-sm text-gray-600 mb-6">
                      ¿Cómo quieres restaurar la copia de seguridad?
                  </p>
                  <div className="space-y-3">
                      <button 
                          onClick={() => handleRestore('MERGE')} 
                          className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold text-sm shadow-sm"
                      >
                          Fusionar (Recomendado)
                          <span className="block text-[10px] font-normal opacity-80">Mantiene datos actuales y añade/actualiza con la copia.</span>
                      </button>
                      <button 
                          onClick={() => handleRestore('REPLACE')} 
                          className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-lg font-bold text-sm"
                      >
                          Reemplazar Todo
                          <span className="block text-[10px] font-normal opacity-80">Borra todo lo actual y carga la copia.</span>
                      </button>
                      <button 
                          onClick={() => setRestoreModal(null)} 
                          className="w-full py-2 text-gray-500 font-bold text-sm mt-2"
                      >
                          Cancelar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProfileView;
