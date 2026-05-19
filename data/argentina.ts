export interface HistoryEvent {
  id: number;
  event: string;
  year: number;
}

export type PuzzleSet = HistoryEvent[];

export interface Deck {
  name: string;
  daily: PuzzleSet[];
  endless: PuzzleSet[];
}

export const deck: Deck = {
  name: "Historia Argentina",

  daily: [
    [
      { id: 1, event: "Juan de Garay funda Buenos Aires (segunda fundación)", year: 1580 },
      { id: 2, event: "Invasiones Inglesas al Río de la Plata", year: 1806 },
      { id: 3, event: "Revolución de Mayo", year: 1810 },
      { id: 4, event: "Declaración de Independencia Argentina", year: 1816 },
      { id: 5, event: "Batalla de Caseros — caída de Rosas", year: 1852 },
      { id: 6, event: "Sanción de la Constitución Nacional Argentina", year: 1853 },
    ],
    [
      { id: 1, event: "Creación del Virreinato del Río de la Plata", year: 1776 },
      { id: 2, event: "Muerte de Manuel Belgrano, creador de la bandera", year: 1820 },
      { id: 3, event: "Ley Sáenz Peña — voto secreto y obligatorio", year: 1912 },
      { id: 4, event: "Presidencia de Hipólito Yrigoyen — primer gobierno radical", year: 1916 },
      { id: 5, event: "Primera transmisión de radio en el mundo — Argentina", year: 1920 },
      { id: 6, event: "Golpe de Estado de Uriburu — primera dictadura militar", year: 1930 },
    ],
    [
      { id: 1, event: "Primer ferrocarril argentino en funcionamiento", year: 1857 },
      { id: 2, event: "Creación de YPF — Yacimientos Petrolíferos Fiscales", year: 1922 },
      { id: 3, event: "Primera presidencia de Juan Domingo Perón", year: 1946 },
      { id: 4, event: "Golpe de 1955 — Revolución Libertadora derroca a Perón", year: 1955 },
      { id: 5, event: "Regreso de Perón al país tras 18 años de exilio", year: 1973 },
      { id: 6, event: "Argentina campeona del mundo — México 1986", year: 1986 },
    ],
    [
      { id: 1, event: "Dictadura militar — inicio del Proceso de Reorganización Nacional", year: 1976 },
      { id: 2, event: "Argentina campeona del mundo — Argentina 1978", year: 1978 },
      { id: 3, event: "Guerra de las Malvinas", year: 1982 },
      { id: 4, event: "Retorno de la democracia — asume Raúl Alfonsín", year: 1983 },
      { id: 5, event: "Crisis económica, corralito y default", year: 2001 },
      { id: 6, event: "Argentina campeona del mundo — Qatar 2022", year: 2022 },
    ],
  ],

  endless: [
    [
      { id: 1, event: "Primer asentamiento europeo en territorio argentino — Sancti Spiritu", year: 1527 },
      { id: 2, event: "Fundación de Córdoba por Jerónimo Luis de Cabrera", year: 1573 },
      { id: 3, event: "Fundación de Salta por Hernando de Lerma", year: 1582 },
      { id: 4, event: "Creación del Consulado de Comercio de Buenos Aires", year: 1794 },
      { id: 5, event: "Asamblea del Año XIII — abolición de la esclavitud", year: 1813 },
      { id: 6, event: "San Martín cruza los Andes — campaña libertadora", year: 1817 },
    ],
    [
      { id: 1, event: "Muerte de José de San Martín en Boulogne-sur-Mer", year: 1850 },
      { id: 2, event: "Buenos Aires se convierte en capital federal del país", year: 1880 },
      { id: 3, event: "Guerra de la Triple Alianza — Argentina, Brasil y Uruguay vs. Paraguay", year: 1864 },
      { id: 4, event: "Conquista del Desierto — campaña militar de Roca", year: 1879 },
      { id: 5, event: "Semana Trágica — huelga obrera y represión en Buenos Aires", year: 1919 },
      { id: 6, event: "Muerte de Eva Perón — Evita", year: 1952 },
    ],
    [
      { id: 1, event: "Juicio a las Juntas Militares", year: 1985 },
      { id: 2, event: "Hiperinflación — caída anticipada del gobierno de Alfonsín", year: 1989 },
      { id: 3, event: "Firma del Tratado de Asunción — creación del MERCOSUR", year: 1991 },
      { id: 4, event: "Atentado terrorista a la AMIA en Buenos Aires", year: 1994 },
      { id: 5, event: "Néstor Kirchner asume la presidencia", year: 2003 },
      { id: 6, event: "Bicentenario de la Revolución de Mayo", year: 2010 },
    ],
    [
      { id: 1, event: "Muerte de Néstor Kirchner", year: 2010 },
      { id: 2, event: "Argentina campeona de la Copa América — Brasil 2021", year: 2021 },
      { id: 3, event: "Fallecimiento de Carlos Menem, ex presidente", year: 2021 },
      { id: 4, event: "Argentina campeona del mundo — Qatar 2022", year: 2022 },
      { id: 5, event: "Javier Milei asume la presidencia de Argentina", year: 2023 },
      { id: 6, event: "Cierre de la Secretaría de Cultura bajo ajuste fiscal", year: 2024 },
    ],
  ],
};
