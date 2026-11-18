import { Alimento } from '../models/nutrition.model';

export const ALIMENTOS: Alimento[] = [
  {
    nombre: 'Huevo entero crudo',
    categoria: 'Huevos',
    composicion: {
      Agua: 75.3,
      Energía: 143,
      Proteínas: 12.6,
      Carbohidratos: 0.72,
      'Grasas totales': 9.5,
    },
  },
  {
    nombre: 'Leche entera',
    categoria: 'Lácteos',
    composicion: {
      Agua: 87,
      Energía: 61,
      Proteínas: 3.2,
      Carbohidratos: 4.8,
      'Grasas totales': 3.3,
    },
  },
  {
    nombre: 'Pan blanco',
    categoria: 'Cereales',
    composicion: {
      Agua: 36,
      Energía: 265,
      Proteínas: 9,
      Carbohidratos: 49,
      'Grasas totales': 3.2,
    },
  },
  {
    nombre: 'Manzana cruda',
    categoria: 'Frutas',
    composicion: {
      Agua: 85.6,
      Energía: 52,
      Proteínas: 0.26,
      Carbohidratos: 13.8,
      'Grasas totales': 0.17,
    },
  },
  {
    nombre: 'Pollo cocido',
    categoria: 'Carnes',
    composicion: {
      Agua: 64,
      Energía: 239,
      Proteínas: 27.3,
      Carbohidratos: 0,
      'Grasas totales': 13.6,
    },
  },
  {
    nombre: 'Arroz blanco cocido',
    categoria: 'Cereales',
    composicion: {
      Agua: 68,
      Energía: 130,
      Proteínas: 2.4,
      Carbohidratos: 28.2,
      'Grasas totales': 0.3,
    },
  },
  {
    nombre: 'Queso fresco',
    categoria: 'Lácteos',
    composicion: {
      Agua: 60,
      Energía: 264,
      Proteínas: 18,
      Carbohidratos: 3.1,
      'Grasas totales': 21,
    },
  },
  {
    nombre: 'Tomate crudo',
    categoria: 'Verduras',
    composicion: {
      Agua: 94.5,
      Energía: 18,
      Proteínas: 0.9,
      Carbohidratos: 3.9,
      'Grasas totales': 0.2,
    },
  },
  {
    nombre: 'Papa hervida',
    categoria: 'Verduras',
    composicion: {
      Agua: 77,
      Energía: 87,
      Proteínas: 1.9,
      Carbohidratos: 20,
      'Grasas totales': 0.1,
    },
  },
  {
    nombre: 'Aceite de oliva',
    categoria: 'Grasas y aceites',
    composicion: {
      Agua: 0.2,
      Energía: 884,
      Proteínas: 0,
      Carbohidratos: 0,
      'Grasas totales': 100,
    },
  },
];
