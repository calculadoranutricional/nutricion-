import { NutrienteInfo, NutrientePlano } from '../models/nutrition.model';

export const COMIDAS: string[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

export const CATEGORIAS: string[] = [
  'Frutas',
  'Verduras',
  'Cereales',
  'Lácteos',
  'Carnes',
  'Huevos',
];

export type ArbolNutrientes = Record<string, NutrienteInfo[] | Record<string, unknown>>;

export const NUTRIENTES: ArbolNutrientes = {
  'Peso Total': [
    {
      nombre: 'Agua',
      unidad: 'g',
      descripcion:
        'Componente principal del alimento; esencial para funciones celulares, transporte de nutrientes y regulación de la temperatura corporal. No aporta energía (0 kcal/g).',
    },
    {
      nombre: 'Sólidos totales',
      unidad: 'g',
      descripcion:
        'Parte seca del alimento que incluye carbohidratos, proteínas, grasas y minerales; representa la materia nutritiva disponible. Su aporte energético depende de los componentes individuales.',
    },
  ],

  Macronutrientes: {
    Principales: [
      {
        nombre: 'Energía',
        unidad: 'kcal',
        descripcion:
          'Cantidad total de energía que el cuerpo puede obtener del alimento; proviene de proteínas (4 kcal/g), carbohidratos (4 kcal/g), grasas (9 kcal/g) y alcohol (7 kcal/g).',
      },
      {
        nombre: 'Proteínas',
        unidad: 'g',
        descripcion:
          'Macronutriente formado por aminoácidos; esencial para la formación y reparación de tejidos, enzimas y hormonas. Aporta 4 kcal por gramo.',
      },
      {
        nombre: 'Carbohidratos',
        unidad: 'g',
        descripcion:
          'Incluye azúcares, almidón y fibras; los azúcares y el almidón aportan energía (4 kcal/g), mientras que las fibras promueven la salud digestiva.',
      },
      {
        nombre: 'Grasas totales',
        unidad: 'g',
        descripcion:
          'Lípidos que aportan energía concentrada (9 kcal/g); participan en la absorción de vitaminas liposolubles y en la formación de membranas celulares.',
      },
      {
        nombre: 'Alcohol etílico',
        unidad: 'g',
        descripcion:
          'Fuente de energía no esencial (7 kcal/g); se metaboliza en el hígado y aporta calorías sin proporcionar nutrientes esenciales.',
      },
      {
        nombre: 'Cafeína',
        unidad: 'mg',
        descripcion: 'Estimulante del sistema nervioso central; aumenta alerta y reduce la fatiga.',
      },
      {
        nombre: 'Cenizas',
        unidad: 'g',
        descripcion:
          'Residuo mineral total tras la combustión del alimento; refleja la cantidad total de minerales presentes.',
      },
    ],

    'Componentes de proteínas': {
      'Aminoácidos esenciales': [
        {
          nombre: 'Histidina',
          unidad: 'mg',
          descripcion:
            'Aminoácido esencial necesario para el crecimiento, reparación de tejidos y función inmune.',
        },
        {
          nombre: 'Isoleucina',
          unidad: 'mg',
          descripcion:
            'Aminoácido que contribuye a la recuperación muscular y equilibrio energético.',
        },
        {
          nombre: 'Leucina',
          unidad: 'mg',
          descripcion:
            'Estimula la síntesis de proteínas musculares y favorece la regeneración de tejidos.',
        },
        {
          nombre: 'Lisina',
          unidad: 'mg',
          descripcion:
            'Fundamental para el crecimiento, formación de colágeno y absorción de calcio.',
        },
        {
          nombre: 'Metionina',
          unidad: 'mg',
          descripcion:
            'Aminoácido esencial que apoya el metabolismo y la desintoxicación hepática.',
        },
        {
          nombre: 'Fenilalanina',
          unidad: 'mg',
          descripcion:
            'Precursora de dopamina y adrenalina; importante para la función cerebral y el estado de ánimo.',
        },
        {
          nombre: 'Treonina',
          unidad: 'mg',
          descripcion:
            'Contribuye a la salud del hígado, el sistema inmune y el metabolismo proteico.',
        },
        {
          nombre: 'Triptófano',
          unidad: 'mg',
          descripcion:
            'Precursora de serotonina y melatonina; apoya el sueño y el bienestar general.',
        },
        {
          nombre: 'Valina',
          unidad: 'mg',
          descripcion: 'Favorece la energía, recuperación y regeneración muscular.',
        },
      ],

      'Aminoácidos condicionalmente esenciales': [
        {
          nombre: 'Cisteína',
          unidad: 'mg',
          descripcion:
            'Aminoácido con función antioxidante y componente de queratina; importante para cabello, piel y uñas.',
        },
        {
          nombre: 'Tirosina',
          unidad: 'mg',
          descripcion:
            'Precursora de dopamina y hormonas tiroideas; importante para el sistema nervioso y el metabolismo hormonal.',
        },
        {
          nombre: 'Arginina',
          unidad: 'mg',
          descripcion:
            'Aminoácido condicionalmente esencial; mejora la circulación, función inmune y síntesis de proteínas. Es esencial en niños cuando el cuerpo no produce suficiente cantidad.',
        },
        {
          nombre: 'Glutamina',
          unidad: 'mg',
          descripcion:
            'Apoya la función inmune e intestinal; su requerimiento aumenta en estrés o enfermedad.',
        },
        {
          nombre: 'Prolina',
          unidad: 'mg',
          descripcion:
            'Importante para la síntesis de colágeno y la salud de tejidos conectivos.',
        },
        {
          nombre: 'Glicina',
          unidad: 'mg',
          descripcion:
            'Participa en la síntesis de colágeno y neurotransmisores; contribuye a funciones celulares y antioxidantes.',
        },
      ],
    },

    'Componentes de carbohidratos': [
      {
        nombre: 'Azúcares totales',
        unidad: 'g',
        descripcion:
          'Carbohidratos simples presentes de forma natural o añadida que aportan energía rápida.',
      },
      {
        nombre: 'Fibra insoluble',
        unidad: 'g',
        descripcion:
          'Carbohidrato insoluble que no aporta energía; mejora el tránsito intestinal y previene estreñimiento.',
      },
      {
        nombre: 'Fibra soluble',
        unidad: 'g',
        descripcion:
          'Carbohidrato soluble no digerible; ayuda a regular colesterol y glucosa en sangre. Aporta energía limitada (~2 kcal/g).',
      },
      {
        nombre: 'Almidón',
        unidad: 'g',
        descripcion:
          'Carbohidrato complejo que libera glucosa lentamente, proporcionando energía sostenida.',
      },
    ],

    'Componentes de grasas': [
      {
        nombre: 'Grasas monoinsaturadas',
        unidad: 'g',
        descripcion:
          'Grasas saludables presentes en aceite de oliva, frutos secos y palta; favorecen la salud cardiovascular.',
      },
      {
        nombre: 'Grasas poliinsaturadas',
        unidad: 'g',
        descripcion:
          'Incluyen ácidos grasos esenciales omega-3 y omega-6; participan en funciones antiinflamatorias y hormonales.',
      },
      {
        nombre: 'Grasas saturadas',
        unidad: 'g',
        descripcion:
          'Lípidos sólidos a temperatura ambiente; su consumo excesivo puede aumentar el riesgo cardiovascular.',
      },
      {
        nombre: 'Grasas trans',
        unidad: 'g',
        descripcion: 'Grasas artificiales que aumentan el riesgo cardiovascular; deben evitarse.',
      },
      {
        nombre: 'Colesterol',
        unidad: 'mg',
        descripcion:
          'Lípido de origen animal necesario en pequeñas cantidades para hormonas y membranas celulares.',
      },
      {
        nombre: 'Ácido linoleico (Omega 6)',
        unidad: 'g',
        descripcion: 'Grasa esencial que participa en procesos inflamatorios, hormonales y celulares.',
      },
      {
        nombre: 'Ácido alfa-linolénico (Omega 3)',
        unidad: 'g',
        descripcion: 'Grasa esencial con funciones antiinflamatorias y protectoras del corazón.',
      },
      {
        nombre: 'EPA (ácido eicosapentaenoico)',
        unidad: 'g',
        descripcion:
          'Omega-3 marino que protege el corazón, reduce inflamación y apoya la función cerebral.',
      },
      {
        nombre: 'DHA (ácido docosahexaenoico)',
        unidad: 'g',
        descripcion:
          'Omega-3 esencial para el desarrollo cerebral, la visión y la salud cardiovascular.',
      },
    ],
  },

  Micronutrientes: {
    'Vitaminas liposolubles': [
      {
        nombre: 'Vitamina A',
        unidad: 'µg',
        descripcion:
          'Esencial para visión, crecimiento celular, piel y función inmune; se almacena en hígado y tejidos grasos.',
      },
      {
        nombre: 'Vitamina D',
        unidad: 'µg',
        descripcion:
          'Regula absorción de calcio y fósforo; importante para huesos, dientes y función inmune. Su síntesis depende de la exposición solar.',
      },
      {
        nombre: 'Vitamina E',
        unidad: 'mg',
        descripcion:
          'Antioxidante que protege membranas celulares y tejidos del daño oxidativo.',
      },
      {
        nombre: 'Vitamina K',
        unidad: 'µg',
        descripcion: 'Necesaria para coagulación sanguínea y metabolismo óseo.',
      },
    ],

    'Vitaminas hidrosolubles': [
      {
        nombre: 'Vitamina C',
        unidad: 'mg',
        descripcion:
          'Antioxidante que fortalece el sistema inmune, ayuda a formar colágeno y mejora la absorción de hierro.',
      },
      {
        nombre: 'Tiamina (B1)',
        unidad: 'mg',
        descripcion: 'Participa en el metabolismo energético y el funcionamiento nervioso.',
      },
      {
        nombre: 'Riboflavina (B2)',
        unidad: 'mg',
        descripcion:
          'Apoya el metabolismo de carbohidratos, grasas y proteínas; mantiene piel y ojos saludables.',
      },
      {
        nombre: 'Niacina (B3)',
        unidad: 'mg',
        descripcion: 'Interviene en el metabolismo energético y la síntesis de ácidos grasos.',
      },
      {
        nombre: 'Ácido pantoténico (B5)',
        unidad: 'mg',
        descripcion: 'Participa en la producción de energía y síntesis de hormonas y colesterol.',
      },
      {
        nombre: 'Piridoxina (B6)',
        unidad: 'mg',
        descripcion: 'Participa en el metabolismo de aminoácidos y la síntesis de neurotransmisores.',
      },
      {
        nombre: 'Biotina (B7)',
        unidad: 'µg',
        descripcion:
          'Coenzima que apoya el metabolismo de macronutrientes y la salud de cabello, piel y uñas.',
      },
      {
        nombre: 'Ácido fólico (B9)',
        unidad: 'µg',
        descripcion:
          'Esencial para la formación de ADN y desarrollo fetal. Su requerimiento aumenta en embarazo.',
      },
      {
        nombre: 'Cobalamina (B12)',
        unidad: 'µg',
        descripcion:
          'Necesaria para la formación de glóbulos rojos, función neurológica y síntesis de ADN.',
      },
      {
        nombre: 'Colina',
        unidad: 'mg',
        descripcion:
          'Importante para el cerebro, memoria y metabolismo de grasas. Su deficiencia afecta desarrollo fetal.',
      },
    ],

    Minerales: {
      Macrominerales: [
        {
          nombre: 'Calcio (Ca)',
          unidad: 'mg',
          descripcion:
            'Fortalece huesos y dientes; participa en contracción muscular y función nerviosa.',
        },
        {
          nombre: 'Fósforo (P)',
          unidad: 'mg',
          descripcion: 'Trabaja con el calcio en huesos y dientes; importante para energía y ADN.',
        },
        {
          nombre: 'Magnesio (Mg)',
          unidad: 'mg',
          descripcion:
            'Regula función muscular y nerviosa, producción de energía y síntesis de proteínas.',
        },
        {
          nombre: 'Sodio (Na)',
          unidad: 'mg',
          descripcion:
            'Equilibra líquidos y presión arterial. El exceso aumenta el riesgo de hipertensión.',
        },
        {
          nombre: 'Potasio (K)',
          unidad: 'mg',
          descripcion:
            'Regula función muscular y presión arterial; mantiene el equilibrio de líquidos.',
        },
        {
          nombre: 'Cloro (Cl)',
          unidad: 'mg',
          descripcion:
            'Ayuda en digestión y equilibrio de fluidos; componente del ácido gástrico.',
        },
        {
          nombre: 'Azufre (S)',
          unidad: 'mg',
          descripcion:
            'Componente de aminoácidos y vitaminas; importante para el metabolismo y los tejidos.',
        },
      ],
      Oligoelementos: [
        {
          nombre: 'Hierro (Fe)',
          unidad: 'mg',
          descripcion:
            'Transporta oxígeno y apoya la función inmune. Su deficiencia es común en mujeres y niños.',
        },
        {
          nombre: 'Zinc (Zn)',
          unidad: 'mg',
          descripcion: 'Participa en función inmune, cicatrización y síntesis de proteínas.',
        },
        {
          nombre: 'Cobre (Cu)',
          unidad: 'mg',
          descripcion:
            'Interviene en formación de glóbulos rojos, metabolismo y función antioxidante.',
        },
        {
          nombre: 'Manganeso (Mn)',
          unidad: 'mg',
          descripcion:
            'Ayuda al metabolismo de carbohidratos y proteínas; contribuye al crecimiento óseo.',
        },
        {
          nombre: 'Selenio (Se)',
          unidad: 'µg',
          descripcion: 'Antioxidante que protege células y apoya la función tiroidea.',
        },
        {
          nombre: 'Yodo (I)',
          unidad: 'µg',
          descripcion:
            'Esencial para la síntesis de hormonas tiroideas y el metabolismo energético.',
        },
        {
          nombre: 'Molibdeno (Mo)',
          unidad: 'µg',
          descripcion: 'Cofactor enzimático que participa en el metabolismo de aminoácidos.',
        },
        {
          nombre: 'Cromo (Cr)',
          unidad: 'µg',
          descripcion: 'Contribuye al metabolismo de glucosa y al control del azúcar en sangre.',
        },
        {
          nombre: 'Flúor (F)',
          unidad: 'mg',
          descripcion: 'Fortalece dientes y huesos; previene caries y mantiene estructura ósea.',
        },
      ],
    },
  },
};

export const VDR_BASE: Record<string, number> = {};

export const COLORES_VDR = {
  verde: 'var(--green)',
  amarillo: 'var(--yellow)',
  rojo: 'var(--red)',
  neutro: 'var(--text-secondary)',
};

export const DISTRIBUCION_VDR_BASE: Record<string, number> = {
  Desayuno: 25,
  Almuerzo: 25,
  Merienda: 25,
  Cena: 25,
  Total: 100,
};

export const NUTRIENTES_PLANOS: NutrientePlano[] = [];

function aplanar(obj: Record<string, unknown>, niveles: string[] = []): void {
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      (v as NutrienteInfo[]).forEach((n) =>
        NUTRIENTES_PLANOS.push({ ...n, niveles: [...niveles, k] }),
      );
    } else if (typeof v === 'object' && v !== null) {
      aplanar(v as Record<string, unknown>, [...niveles, k]);
    }
  }
}

aplanar(NUTRIENTES);
