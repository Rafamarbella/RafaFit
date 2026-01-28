import { BaseFood, UnitConversion } from '../types';

export const INITIAL_FOOD_DB: BaseFood[] = [
  // PROTEÍNAS
  { id: 'pechuga-pollo', displayName: 'Pechuga de Pollo', aliases: ['pollo', 'pechuga'], category: 'PROTEINA', kcal100g: 165, protein100g: 31, carbs100g: 0, fats100g: 3.6, source: 'CORE', version: 1 },
  { id: 'huevo', displayName: 'Huevo (entero)', aliases: ['huevo', 'huevos'], category: 'PROTEINA', kcal100g: 155, protein100g: 13, carbs100g: 1.1, fats100g: 11, source: 'CORE', version: 1 },
  { id: 'clara-huevo', displayName: 'Clara de Huevo', aliases: ['clara', 'claras'], category: 'PROTEINA', kcal100g: 52, protein100g: 11, carbs100g: 0.7, fats100g: 0.2, source: 'CORE', version: 1 },
  { id: 'merluza', displayName: 'Merluza', aliases: ['pescado', 'merluza'], category: 'PROTEINA', kcal100g: 64, protein100g: 12, carbs100g: 0, fats100g: 1.8, source: 'CORE', version: 1 },
  { id: 'salmon', displayName: 'Salmón', aliases: ['salmon', 'salmón'], category: 'PROTEINA', kcal100g: 208, protein100g: 20, carbs100g: 0, fats100g: 13, source: 'CORE', version: 1 },
  { id: 'atun-natural', displayName: 'Atún al natural (lata)', aliases: ['atun', 'atún'], category: 'PROTEINA', kcal100g: 99, protein100g: 23, carbs100g: 0, fats100g: 1, source: 'CORE', version: 1 },
  { id: 'sardinas-lata', displayName: 'Sardinas en aceite (escurridas)', aliases: ['sardinas'], category: 'PROTEINA', kcal100g: 208, protein100g: 24, carbs100g: 0, fats100g: 11, source: 'CORE', version: 1 },

  // LÁCTEOS
  { id: 'yogur-griego', displayName: 'Yogur Griego Natural', aliases: ['yogur griego'], category: 'LACTEO', kcal100g: 59, protein100g: 10, carbs100g: 3.6, fats100g: 0.4, source: 'CORE', version: 1 },
  { id: 'yogur-natural', displayName: 'Yogur Natural', aliases: ['yogur'], category: 'LACTEO', kcal100g: 57, protein100g: 3.5, carbs100g: 4.7, fats100g: 2.5, source: 'CORE', version: 1 },
  { id: 'queso-fresco-batido', displayName: 'Queso Fresco Batido 0%', aliases: ['queso batido'], category: 'LACTEO', kcal100g: 46, protein100g: 8, carbs100g: 3.5, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'queso-fresco', displayName: 'Queso Fresco (Burgos)', aliases: ['queso fresco', 'burgos'], category: 'LACTEO', kcal100g: 195, protein100g: 11, carbs100g: 3, fats100g: 15, source: 'CORE', version: 1 },
  { id: 'leche-semidesnatada', displayName: 'Leche Semidesnatada', aliases: ['leche', 'leche semi'], category: 'LACTEO', kcal100g: 46, protein100g: 3.4, carbs100g: 4.8, fats100g: 1.6, source: 'CORE', version: 1 },

  // CARBOHIDRATOS
  { id: 'arroz-blanco', displayName: 'Arroz Blanco (cocido)', aliases: ['arroz'], category: 'CARBOHIDRATO', kcal100g: 130, protein100g: 2.7, carbs100g: 28, fats100g: 0.3, source: 'CORE', version: 1 },
  { id: 'patata-cocida', displayName: 'Patata Cocida', aliases: ['patata'], category: 'CARBOHIDRATO', kcal100g: 77, protein100g: 2, carbs100g: 17, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'boniato', displayName: 'Boniato / Batata', aliases: ['boniato', 'batata'], category: 'CARBOHIDRATO', kcal100g: 86, protein100g: 1.6, carbs100g: 20, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'avena', displayName: 'Copos de Avena', aliases: ['avena'], category: 'CARBOHIDRATO', kcal100g: 389, protein100g: 16.9, carbs100g: 66, fats100g: 6.9, source: 'CORE', version: 1 },
  { id: 'pan-integral', displayName: 'Pan Integral 100%', aliases: ['pan', 'pan integral'], category: 'CARBOHIDRATO', kcal100g: 247, protein100g: 13, carbs100g: 41, fats100g: 3.4, source: 'CORE', version: 1 },
  { id: 'tortilla-trigo', displayName: 'Tortilla de Trigo (Fajita)', aliases: ['tortilla', 'fajita'], category: 'CARBOHIDRATO', kcal100g: 300, protein100g: 8, carbs100g: 50, fats100g: 7, source: 'CORE', version: 1 },
  { id: 'galleta-maria', displayName: 'Galleta María', aliases: ['galleta'], category: 'SNACK', kcal100g: 430, protein100g: 7, carbs100g: 75, fats100g: 11, source: 'CORE', version: 1 },
  { id: 'lentejas', displayName: 'Lentejas (cocidas)', aliases: ['lentejas'], category: 'CARBOHIDRATO', kcal100g: 116, protein100g: 9, carbs100g: 20, fats100g: 0.4, source: 'CORE', version: 1 },
  { id: 'maiz-dulce', displayName: 'Maíz Dulce (lata)', aliases: ['maiz', 'maíz'], category: 'CARBOHIDRATO', kcal100g: 80, protein100g: 2.5, carbs100g: 15, fats100g: 1, source: 'CORE', version: 1 },

  // GRASAS
  { id: 'aceite-oliva', displayName: 'Aceite de Oliva Virgen', aliases: ['aceite'], category: 'GRASA', kcal100g: 884, protein100g: 0, carbs100g: 0, fats100g: 100, source: 'CORE', version: 1 },
  { id: 'aguacate', displayName: 'Aguacate', aliases: ['aguacate', 'palta'], category: 'GRASA', kcal100g: 160, protein100g: 2, carbs100g: 8.5, fats100g: 15, source: 'CORE', version: 1 },
  { id: 'almendras', displayName: 'Almendras', aliases: ['almendras'], category: 'GRASA', kcal100g: 579, protein100g: 21, carbs100g: 22, fats100g: 50, source: 'CORE', version: 1 },
  { id: 'nueces', displayName: 'Nueces', aliases: ['nueces'], category: 'GRASA', kcal100g: 654, protein100g: 15, carbs100g: 13, fats100g: 65, source: 'CORE', version: 1 },
  { id: 'mayonesa', displayName: 'Mayonesa', aliases: ['mayonesa'], category: 'SALSAS', kcal100g: 680, protein100g: 1, carbs100g: 1, fats100g: 75, source: 'CORE', version: 1 },

  // FRUTAS Y VERDURAS
  { id: 'manzana', displayName: 'Manzana', aliases: ['manzana'], category: 'FRUTA', kcal100g: 52, protein100g: 0.3, carbs100g: 14, fats100g: 0.2, source: 'CORE', version: 1 },
  { id: 'platano', displayName: 'Plátano', aliases: ['platano'], category: 'FRUTA', kcal100g: 89, protein100g: 1.1, carbs100g: 23, fats100g: 0.3, source: 'CORE', version: 1 },
  { id: 'naranja', displayName: 'Naranja', aliases: ['naranja'], category: 'FRUTA', kcal100g: 47, protein100g: 0.9, carbs100g: 11, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'pera', displayName: 'Pera', aliases: ['pera'], category: 'FRUTA', kcal100g: 57, protein100g: 0.4, carbs100g: 15, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'kiwi', displayName: 'Kiwi', aliases: ['kiwi'], category: 'FRUTA', kcal100g: 61, protein100g: 1.1, carbs100g: 15, fats100g: 0.5, source: 'CORE', version: 1 },
  { id: 'fresas', displayName: 'Fresas', aliases: ['fresas'], category: 'FRUTA', kcal100g: 32, protein100g: 0.7, carbs100g: 7.7, fats100g: 0.3, source: 'CORE', version: 1 },
  { id: 'uvas', displayName: 'Uvas', aliases: ['uvas'], category: 'FRUTA', kcal100g: 67, protein100g: 0.6, carbs100g: 17, fats100g: 0.4, source: 'CORE', version: 1 },
  { id: 'brocoli', displayName: 'Brócoli', aliases: ['brocoli'], category: 'VERDURA', kcal100g: 34, protein100g: 2.8, carbs100g: 7, fats100g: 0.4, source: 'CORE', version: 1 },
  { id: 'calabacin', displayName: 'Calabacín', aliases: ['calabacin'], category: 'VERDURA', kcal100g: 17, protein100g: 1.2, carbs100g: 3, fats100g: 0.3, source: 'CORE', version: 1 },
  { id: 'espinacas', displayName: 'Espinacas', aliases: ['espinacas'], category: 'VERDURA', kcal100g: 23, protein100g: 2.9, carbs100g: 3.6, fats100g: 0.4, source: 'CORE', version: 1 },
  { id: 'caldo-pollo', displayName: 'Caldo de Pollo Casero', aliases: ['caldo'], category: 'BEBIDA', kcal100g: 10, protein100g: 1, carbs100g: 0.5, fats100g: 0.2, source: 'CORE', version: 1 },
];

// Comprehensive Unit Conversions
export const UNIT_CONVERSIONS: UnitConversion[] = [
  // HUEVOS Y LÁCTEOS
  { id: 'uc_huevo', label: 'unidad', grams: 60, aliases: ['huevo', 'huevos', 'unidad'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'uc_clara', label: 'clara', grams: 35, aliases: ['clara', 'claras'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'uc_yogur_griego', label: 'unidad', grams: 125, aliases: ['yogur griego', 'yogurt griego', 'vaso'], defaultIfNoNumber: true },
  { id: 'uc_yogur_nat', label: 'unidad', grams: 125, aliases: ['yogur', 'yogurt', 'yogur natural'], defaultIfNoNumber: true },
  { id: 'uc_q_batido', label: 'cucharada', grams: 25, aliases: ['queso batido', 'cucharada queso batido', 'cda queso batido'] },
  { id: 'uc_q_fresco', label: 'tarrina ind.', grams: 60, aliases: ['queso fresco', 'queso burgos', 'tarrina'], defaultIfNoNumber: true },
  { id: 'uc_leche', label: 'vaso', grams: 200, aliases: ['vaso leche', 'taza leche', 'leche'], defaultIfNoNumber: true },

  // FRUTAS
  { id: 'uc_platano', label: 'unidad', grams: 120, aliases: ['platano', 'banana', 'plátano'], defaultIfNoNumber: true },
  { id: 'uc_manzana', label: 'unidad', grams: 150, aliases: ['manzana', 'manzanas'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'uc_naranja', label: 'unidad', grams: 180, aliases: ['naranja', 'naranjas'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'uc_pera', label: 'unidad', grams: 160, aliases: ['pera', 'peras'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'uc_kiwi', label: 'unidad', grams: 75, aliases: ['kiwi', 'kiwis'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'uc_aguacate', label: 'unidad', grams: 150, aliases: ['aguacate', 'palta'], defaultIfNoNumber: true },
  { id: 'uc_fresas', label: 'ración', grams: 100, aliases: ['fresas', 'fresa', 'cuenco fresas'], defaultIfNoNumber: true },
  { id: 'uc_uvas', label: 'ración', grams: 80, aliases: ['uvas', 'racimo'], defaultIfNoNumber: true },

  // CONSERVAS / ENVASES
  { id: 'uc_atun', label: 'lata', grams: 80, aliases: ['lata atun', 'lata de atun', 'atun', 'atún'], defaultIfNoNumber: true },
  { id: 'uc_sardinas', label: 'lata', grams: 90, aliases: ['lata sardinas', 'sardinas', 'lata de sardinas'], defaultIfNoNumber: true },
  { id: 'uc_maiz', label: 'lata peq.', grams: 140, aliases: ['lata maiz', 'lata maíz', 'maiz', 'maíz'], defaultIfNoNumber: true },
  { id: 'uc_lentejas', label: 'bote peq.', grams: 200, aliases: ['bote lentejas', 'lentejas bote'], defaultIfNoNumber: true },

  // PAN Y CEREALES
  { id: 'uc_pan', label: 'rebanada', grams: 40, aliases: ['rebanada', 'rebanada pan', 'tostada', 'rebanadas'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'uc_tortilla', label: 'unidad', grams: 60, aliases: ['tortilla', 'fajita', 'tortilla trigo', 'wrap'], defaultIfNoNumber: true },
  { id: 'uc_galleta', label: 'unidad', grams: 10, aliases: ['galleta', 'galletas'], defaultIfNoNumber: true, askUnitsIfPluralNoNumber: true },
  { id: 'uc_avena', label: 'cucharada', grams: 15, aliases: ['cucharada avena', 'cuch avena', 'avena'] },
  { id: 'uc_patata', label: 'unidad med', grams: 150, aliases: ['patata', 'papa'], defaultIfNoNumber: true },

  // GRASAS Y SALSAS
  { id: 'uc_aceite_cda', label: 'cucharada', grams: 10, aliases: ['cucharada aceite', 'cda aceite', 'aceite'] },
  { id: 'uc_aceite_cdita', label: 'cucharadita', grams: 5, aliases: ['cucharadita aceite', 'cdita aceite'] },
  { id: 'uc_mayo', label: 'cucharada', grams: 15, aliases: ['cucharada mayonesa', 'mayonesa'] },

  // FRUTOS SECOS
  { id: 'uc_almendras', label: 'puñado', grams: 30, aliases: ['puñado almendras', 'puño almendras', 'almendras'], defaultIfNoNumber: true },
  { id: 'uc_nueces', label: 'puñado', grams: 30, aliases: ['puñado nueces', 'puño nueces', 'nueces'], defaultIfNoNumber: true },
];