import { BaseFood } from '../types';

/**
 * CORE NUTRITION DATABASE
 * Optimized for Spanish market / Mediterranean diet.
 * Normalized IDs: lowercase, no accents, dashed.
 */
export const CORE_FOODS: BaseFood[] = [
  // --- PROTEINAS ---
  { id: 'pechuga-pollo', displayName: 'Pechuga de Pollo', aliases: ['pollo', 'pechuga'], category: 'PROTEINA', kcal100g: 165, protein100g: 31, carbs100g: 0, fats100g: 3.6, source: 'CORE', version: 1 },
  { id: 'muslo-pollo', displayName: 'Muslo de Pollo (sin piel)', aliases: ['muslo', 'contramuslo'], category: 'PROTEINA', kcal100g: 175, protein100g: 20, carbs100g: 0, fats100g: 8, source: 'CORE', version: 1 },
  { id: 'lomo-cerdo', displayName: 'Lomo de Cerdo', aliases: ['cerdo', 'lomo'], category: 'PROTEINA', kcal100g: 145, protein100g: 21, carbs100g: 0, fats100g: 6, source: 'CORE', version: 1 },
  { id: 'ternera-magra', displayName: 'Ternera Magra (Filete)', aliases: ['ternera', 'bistec', 'res'], category: 'PROTEINA', kcal100g: 130, protein100g: 22, carbs100g: 0, fats100g: 4, source: 'CORE', version: 1 },
  { id: 'huevo', displayName: 'Huevo (entero)', aliases: ['huevo', 'huevos'], category: 'PROTEINA', kcal100g: 155, protein100g: 13, carbs100g: 1.1, fats100g: 11, source: 'CORE', version: 1 },
  { id: 'clara-huevo', displayName: 'Clara de Huevo', aliases: ['clara', 'claras'], category: 'PROTEINA', kcal100g: 52, protein100g: 11, carbs100g: 0.7, fats100g: 0.2, source: 'CORE', version: 1 },
  { id: 'merluza', displayName: 'Merluza', aliases: ['pescado blanco', 'pescado'], category: 'PROTEINA', kcal100g: 64, protein100g: 12, carbs100g: 0, fats100g: 1.8, source: 'CORE', version: 1 },
  { id: 'salmon', displayName: 'Salmón', aliases: ['pescado azul'], category: 'PROTEINA', kcal100g: 208, protein100g: 20, carbs100g: 0, fats100g: 13, source: 'CORE', version: 1 },
  { id: 'atun-natural', displayName: 'Atún al natural (lata)', aliases: ['atun', 'lata atun'], category: 'PROTEINA', kcal100g: 99, protein100g: 23, carbs100g: 0, fats100g: 1, source: 'CORE', version: 1 },
  { id: 'sardinas-lata', displayName: 'Sardinas en aceite (escurridas)', aliases: ['sardinas'], category: 'PROTEINA', kcal100g: 208, protein100g: 24, carbs100g: 0, fats100g: 11, source: 'CORE', version: 1 },
  { id: 'tofu', displayName: 'Tofu Firme', aliases: ['tofu'], category: 'PROTEINA', kcal100g: 144, protein100g: 15, carbs100g: 3, fats100g: 8, source: 'CORE', version: 1 },
  { id: 'jamon-serrano', displayName: 'Jamón Serrano (sin grasa)', aliases: ['jamon'], category: 'PROTEINA', kcal100g: 240, protein100g: 30, carbs100g: 0, fats100g: 12, source: 'CORE', version: 1 },
  { id: 'pavo-fiambre', displayName: 'Pechuga de Pavo (Fiambre)', aliases: ['pavo', 'fiambre pavo'], category: 'PROTEINA', kcal100g: 105, protein100g: 22, carbs100g: 1, fats100g: 1.5, source: 'CORE', version: 1 },

  // --- CARBOHIDRATOS ---
  { id: 'arroz-blanco', displayName: 'Arroz Blanco (cocido)', aliases: ['arroz', 'basmati'], category: 'CARBOHIDRATO', kcal100g: 130, protein100g: 2.7, carbs100g: 28, fats100g: 0.3, source: 'CORE', version: 1 },
  { id: 'arroz-integral', displayName: 'Arroz Integral (cocido)', aliases: ['arroz integral'], category: 'CARBOHIDRATO', kcal100g: 111, protein100g: 2.6, carbs100g: 23, fats100g: 0.9, source: 'CORE', version: 1 },
  { id: 'pasta-trigo', displayName: 'Pasta de Trigo (cocida)', aliases: ['pasta', 'macarrones', 'espaguetis'], category: 'CARBOHIDRATO', kcal100g: 158, protein100g: 5.8, carbs100g: 31, fats100g: 0.9, source: 'CORE', version: 1 },
  { id: 'patata-cocida', displayName: 'Patata Cocida', aliases: ['patata', 'papa'], category: 'CARBOHIDRATO', kcal100g: 77, protein100g: 2, carbs100g: 17, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'boniato', displayName: 'Boniato / Batata (asado)', aliases: ['boniato', 'batata'], category: 'CARBOHIDRATO', kcal100g: 90, protein100g: 2, carbs100g: 21, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'avena', displayName: 'Copos de Avena', aliases: ['avena', 'porridge'], category: 'CARBOHIDRATO', kcal100g: 389, protein100g: 16.9, carbs100g: 66, fats100g: 6.9, source: 'CORE', version: 1 },
  { id: 'pan-integral', displayName: 'Pan Integral 100%', aliases: ['pan', 'pan integral'], category: 'CARBOHIDRATO', kcal100g: 247, protein100g: 13, carbs100g: 41, fats100g: 3.4, source: 'CORE', version: 1 },
  { id: 'tortilla-trigo', displayName: 'Tortilla de Trigo (Fajita)', aliases: ['tortilla', 'fajita', 'wrap'], category: 'CARBOHIDRATO', kcal100g: 300, protein100g: 8, carbs100g: 50, fats100g: 7, source: 'CORE', version: 1 },
  { id: 'lentejas', displayName: 'Lentejas (cocidas)', aliases: ['lentejas', 'legumbres'], category: 'CARBOHIDRATO', kcal100g: 116, protein100g: 9, carbs100g: 20, fats100g: 0.4, source: 'CORE', version: 1 },
  { id: 'garbanzos', displayName: 'Garbanzos (cocidos)', aliases: ['garbanzos'], category: 'CARBOHIDRATO', kcal100g: 164, protein100g: 9, carbs100g: 27, fats100g: 2.6, source: 'CORE', version: 1 },
  { id: 'quinoa', displayName: 'Quinoa (cocida)', aliases: ['quinoa'], category: 'CARBOHIDRATO', kcal100g: 120, protein100g: 4.4, carbs100g: 21, fats100g: 1.9, source: 'CORE', version: 1 },
  { id: 'maiz-dulce', displayName: 'Maíz Dulce (lata)', aliases: ['maiz', 'maíz'], category: 'CARBOHIDRATO', kcal100g: 80, protein100g: 2.5, carbs100g: 15, fats100g: 1, source: 'CORE', version: 1 },

  // --- LÁCTEOS ---
  { id: 'yogur-griego', displayName: 'Yogur Griego Natural', aliases: ['yogur', 'griego'], category: 'LACTEO', kcal100g: 59, protein100g: 10, carbs100g: 3.6, fats100g: 0.4, source: 'CORE', version: 1 },
  { id: 'yogur-natural', displayName: 'Yogur Natural', aliases: ['yogur', 'yogurt'], category: 'LACTEO', kcal100g: 57, protein100g: 3.5, carbs100g: 4.7, fats100g: 2.5, source: 'CORE', version: 1 },
  { id: 'queso-fresco-batido', displayName: 'Queso Fresco Batido 0%', aliases: ['queso batido'], category: 'LACTEO', kcal100g: 46, protein100g: 8, carbs100g: 3.5, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'queso-fresco', displayName: 'Queso Fresco (Burgos)', aliases: ['queso', 'burgos'], category: 'LACTEO', kcal100g: 195, protein100g: 11, carbs100g: 3, fats100g: 15, source: 'CORE', version: 1 },
  { id: 'leche-semidesnatada', displayName: 'Leche Semidesnatada', aliases: ['leche', 'leche semi'], category: 'LACTEO', kcal100g: 46, protein100g: 3.4, carbs100g: 4.8, fats100g: 1.6, source: 'CORE', version: 1 },
  { id: 'leche-entera', displayName: 'Leche Entera', aliases: ['leche entera'], category: 'LACTEO', kcal100g: 65, protein100g: 3.2, carbs100g: 4.8, fats100g: 3.6, source: 'CORE', version: 1 },
  { id: 'leche-soja', displayName: 'Bebida de Soja', aliases: ['leche soja'], category: 'LACTEO', kcal100g: 33, protein100g: 3.3, carbs100g: 1.8, fats100g: 1.6, source: 'CORE', version: 1 },

  // --- GRASAS ---
  { id: 'aceite-oliva', displayName: 'Aceite de Oliva Virgen', aliases: ['aceite', 'aove'], category: 'GRASA', kcal100g: 884, protein100g: 0, carbs100g: 0, fats100g: 100, source: 'CORE', version: 1 },
  { id: 'aguacate', displayName: 'Aguacate', aliases: ['aguacate', 'palta'], category: 'GRASA', kcal100g: 160, protein100g: 2, carbs100g: 8.5, fats100g: 15, source: 'CORE', version: 1 },
  { id: 'almendras', displayName: 'Almendras', aliases: ['almendra', 'frutos secos'], category: 'GRASA', kcal100g: 579, protein100g: 21, carbs100g: 22, fats100g: 50, source: 'CORE', version: 1 },
  { id: 'nueces', displayName: 'Nueces', aliases: ['nuez', 'nueces'], category: 'GRASA', kcal100g: 654, protein100g: 15, carbs100g: 13, fats100g: 65, source: 'CORE', version: 1 },
  { id: 'mayonesa', displayName: 'Mayonesa', aliases: ['mayonesa'], category: 'SALSAS', kcal100g: 680, protein100g: 1, carbs100g: 1, fats100g: 75, source: 'CORE', version: 1 },
  { id: 'mantequilla-cacahuete', displayName: 'Mantequilla de Cacahuete', aliases: ['crema cacahuete'], category: 'GRASA', kcal100g: 588, protein100g: 25, carbs100g: 20, fats100g: 50, source: 'CORE', version: 1 },

  // --- FRUTAS ---
  { id: 'manzana', displayName: 'Manzana', aliases: ['manzana'], category: 'FRUTA', kcal100g: 52, protein100g: 0.3, carbs100g: 14, fats100g: 0.2, source: 'CORE', version: 1 },
  { id: 'platano', displayName: 'Plátano', aliases: ['platano', 'banana'], category: 'FRUTA', kcal100g: 89, protein100g: 1.1, carbs100g: 23, fats100g: 0.3, source: 'CORE', version: 1 },
  { id: 'naranja', displayName: 'Naranja', aliases: ['naranja'], category: 'FRUTA', kcal100g: 47, protein100g: 0.9, carbs100g: 11, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'pera', displayName: 'Pera', aliases: ['pera'], category: 'FRUTA', kcal100g: 57, protein100g: 0.4, carbs100g: 15, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'kiwi', displayName: 'Kiwi', aliases: ['kiwi'], category: 'FRUTA', kcal100g: 61, protein100g: 1.1, carbs100g: 15, fats100g: 0.5, source: 'CORE', version: 1 },
  { id: 'fresas', displayName: 'Fresas', aliases: ['fresas', 'fresa'], category: 'FRUTA', kcal100g: 32, protein100g: 0.7, carbs100g: 7.7, fats100g: 0.3, source: 'CORE', version: 1 },
  { id: 'uvas', displayName: 'Uvas', aliases: ['uvas'], category: 'FRUTA', kcal100g: 67, protein100g: 0.6, carbs100g: 17, fats100g: 0.4, source: 'CORE', version: 1 },
  { id: 'melon', displayName: 'Melón', aliases: ['melon'], category: 'FRUTA', kcal100g: 34, protein100g: 0.8, carbs100g: 8, fats100g: 0.2, source: 'CORE', version: 1 },
  { id: 'sandia', displayName: 'Sandía', aliases: ['sandia'], category: 'FRUTA', kcal100g: 30, protein100g: 0.6, carbs100g: 7.5, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'arandanos', displayName: 'Arándanos', aliases: ['arandanos'], category: 'FRUTA', kcal100g: 57, protein100g: 0.7, carbs100g: 14, fats100g: 0.3, source: 'CORE', version: 1 },

  // --- VERDURAS ---
  { id: 'brocoli', displayName: 'Brócoli', aliases: ['brocoli'], category: 'VERDURA', kcal100g: 34, protein100g: 2.8, carbs100g: 7, fats100g: 0.4, source: 'CORE', version: 1 },
  { id: 'calabacin', displayName: 'Calabacín', aliases: ['calabacin'], category: 'VERDURA', kcal100g: 17, protein100g: 1.2, carbs100g: 3, fats100g: 0.3, source: 'CORE', version: 1 },
  { id: 'espinacas', displayName: 'Espinacas', aliases: ['espinacas'], category: 'VERDURA', kcal100g: 23, protein100g: 2.9, carbs100g: 3.6, fats100g: 0.4, source: 'CORE', version: 1 },
  { id: 'zanahoria', displayName: 'Zanahoria', aliases: ['zanahoria'], category: 'VERDURA', kcal100g: 41, protein100g: 0.9, carbs100g: 9.6, fats100g: 0.2, source: 'CORE', version: 1 },
  { id: 'cebolla', displayName: 'Cebolla', aliases: ['cebolla'], category: 'VERDURA', kcal100g: 40, protein100g: 1.1, carbs100g: 9, fats100g: 0.1, source: 'CORE', version: 1 },
  { id: 'pimiento-rojo', displayName: 'Pimiento Rojo', aliases: ['pimiento'], category: 'VERDURA', kcal100g: 31, protein100g: 1, carbs100g: 6, fats100g: 0.3, source: 'CORE', version: 1 },
  { id: 'tomate', displayName: 'Tomate', aliases: ['tomate'], category: 'VERDURA', kcal100g: 18, protein100g: 0.9, carbs100g: 3.9, fats100g: 0.2, source: 'CORE', version: 1 },
  { id: 'lechuga', displayName: 'Lechuga / Ensalada mix', aliases: ['lechuga', 'ensalada'], category: 'VERDURA', kcal100g: 15, protein100g: 1.4, carbs100g: 2.9, fats100g: 0.2, source: 'CORE', version: 1 },
  { id: 'judias-verdes', displayName: 'Judías Verdes', aliases: ['judias'], category: 'VERDURA', kcal100g: 31, protein100g: 1.8, carbs100g: 7, fats100g: 0.1, source: 'CORE', version: 1 },

  // --- OTROS ---
  { id: 'galleta-maria', displayName: 'Galleta María', aliases: ['galleta', 'galletas'], category: 'SNACK', kcal100g: 430, protein100g: 7, carbs100g: 75, fats100g: 11, source: 'CORE', version: 1 },
  { id: 'chocolate-negro', displayName: 'Chocolate Negro 85%', aliases: ['chocolate'], category: 'SNACK', kcal100g: 570, protein100g: 9, carbs100g: 30, fats100g: 45, source: 'CORE', version: 1 },
  { id: 'caldo-pollo', displayName: 'Caldo de Pollo Casero', aliases: ['caldo', 'sopa'], category: 'BEBIDA', kcal100g: 10, protein100g: 1, carbs100g: 0.5, fats100g: 0.2, source: 'CORE', version: 1 },
  { id: 'proteina-whey', displayName: 'Proteína Whey (polvo)', aliases: ['whey', 'batido proteina'], category: 'PROTEINA', kcal100g: 370, protein100g: 75, carbs100g: 5, fats100g: 4, source: 'CORE', version: 1 },
];