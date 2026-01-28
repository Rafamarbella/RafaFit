import { UnitConversion } from '../types';

/**
 * UNIT CONVERSIONS DATABASE
 * Define strict mapping for unit parsing.
 */
export const UNIT_CONVERSIONS: UnitConversion[] = [
  // HUEVOS
  { id: 'u_huevo', label: 'unidad', grams: 60, aliases: ['huevo', 'huevos', 'unidad'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'u_clara', label: 'clara', grams: 35, aliases: ['clara', 'claras'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  
  // LÁCTEOS
  { id: 'u_yogur', label: 'unidad', grams: 125, aliases: ['yogur', 'yogurt', 'griego', 'vaso'], defaultIfNoNumber: true },
  { id: 'u_queso_cda', label: 'cucharada', grams: 25, aliases: ['queso batido', 'cucharada queso', 'cda queso'] },
  { id: 'u_leche_vaso', label: 'vaso', grams: 200, aliases: ['vaso leche', 'taza leche', 'leche'], defaultIfNoNumber: true },
  { id: 'u_queso_tarrina', label: 'tarrina', grams: 60, aliases: ['queso fresco', 'queso burgos', 'tarrina'], defaultIfNoNumber: true },

  // FRUTAS
  { id: 'u_platano', label: 'unidad', grams: 120, aliases: ['platano', 'banana', 'plátano'], defaultIfNoNumber: true },
  { id: 'u_manzana', label: 'unidad', grams: 150, aliases: ['manzana', 'manzanas'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'u_naranja', label: 'unidad', grams: 180, aliases: ['naranja', 'naranjas'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'u_pera', label: 'unidad', grams: 160, aliases: ['pera', 'peras'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'u_kiwi', label: 'unidad', grams: 75, aliases: ['kiwi', 'kiwis'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'u_aguacate', label: 'unidad', grams: 150, aliases: ['aguacate', 'palta'], defaultIfNoNumber: true },
  { id: 'u_fresas', label: 'ración', grams: 100, aliases: ['fresas', 'fresa', 'cuenco fresas'], defaultIfNoNumber: true },
  { id: 'u_uvas', label: 'ración', grams: 80, aliases: ['uvas', 'racimo'], defaultIfNoNumber: true },

  // CONSERVAS
  { id: 'u_lata_atun', label: 'lata', grams: 80, aliases: ['lata atun', 'atun', 'atún'], defaultIfNoNumber: true },
  { id: 'u_lata_sardinas', label: 'lata', grams: 90, aliases: ['lata sardinas', 'sardinas'], defaultIfNoNumber: true },
  { id: 'u_lata_maiz', label: 'lata peq.', grams: 140, aliases: ['lata maiz', 'maiz'], defaultIfNoNumber: true },
  { id: 'u_bote_legumbres', label: 'bote peq.', grams: 200, aliases: ['bote lentejas', 'bote garbanzos'], defaultIfNoNumber: true },

  // PAN Y CEREALES
  { id: 'u_pan', label: 'rebanada', grams: 40, aliases: ['rebanada', 'tostada', 'rebanadas'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'u_tortilla', label: 'unidad', grams: 60, aliases: ['tortilla', 'fajita', 'wrap'], defaultIfNoNumber: true },
  { id: 'u_galleta', label: 'unidad', grams: 10, aliases: ['galleta', 'galletas'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'u_avena_cda', label: 'cucharada', grams: 15, aliases: ['cucharada avena', 'avena'] },
  { id: 'u_patata', label: 'unidad med', grams: 150, aliases: ['patata', 'papa'], defaultIfNoNumber: true },

  // GRASAS / SALSAS / OTROS
  { id: 'u_cda_aceite', label: 'cucharada', grams: 10, aliases: ['cucharada aceite', 'cda aceite', 'aceite'] },
  { id: 'u_cdita_aceite', label: 'cucharadita', grams: 5, aliases: ['cucharadita aceite', 'cdita aceite'] },
  { id: 'u_cda_mayo', label: 'cucharada', grams: 15, aliases: ['cucharada mayonesa', 'mayonesa'] },
  { id: 'u_cda_crema', label: 'cucharada', grams: 15, aliases: ['cucharada crema', 'crema cacahuete'] },
  { id: 'u_nuts', label: 'puñado', grams: 30, aliases: ['puñado', 'puño'], defaultIfNoNumber: true },
  
  // GENÉRICOS
  { id: 'u_scoop', label: 'scoop', grams: 30, aliases: ['scoop', 'cazo'], defaultIfNoNumber: true },
];