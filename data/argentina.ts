export interface HistoryEvent {
  id: string;
  event: string;
  year: number;
  context: string;
}

export type PuzzleSet = HistoryEvent[];

export interface Deck {
  id: string;
  name: string;
  emoji: string;
  puzzles: PuzzleSet[];
}

export const argentina: Deck = {
  id: "argentina",
  name: "Historia Argentina",
  emoji: "🇦🇷",
  puzzles: [
    [
      {
        id: "ar-1",
        event: "Juan de Garay funda Buenos Aires (segunda fundación)",
        year: 1580,
        context: "La primera fundación de Buenos Aires, en 1536, fracasó por conflictos con los pueblos originarios. Garay llegó desde Asunción con colonos y estableció la ciudad que se convertiría en capital del futuro país.",
      },
      {
        id: "ar-2",
        event: "Invasiones Inglesas al Río de la Plata",
        year: 1806,
        context: "Gran Bretaña intentó tomar Buenos Aires y Montevideo para controlar el comercio sudamericano. La resistencia popular —sin apoyo de España— fue clave para expulsarlos y despertó el sentimiento autonomista criollo.",
      },
      {
        id: "ar-3",
        event: "Revolución de Mayo",
        year: 1810,
        context: "El 25 de mayo, una junta de gobierno reemplazó al virrey Baltasar Hidalgo de Cisneros en Buenos Aires. Aunque se mantuvo la lealtad formal a la corona española, fue el primer paso hacia la independencia.",
      },
      {
        id: "ar-4",
        event: "Declaración de Independencia Argentina",
        year: 1816,
        context: "El Congreso reunido en Tucumán declaró la independencia de las Provincias Unidas del Río de la Plata el 9 de julio. La declaración llegó en plena guerra de independencia contra España en toda América del Sur.",
      },
      {
        id: "ar-5",
        event: "Batalla de Caseros — caída de Rosas",
        year: 1852,
        context: "El gobernador Juan Manuel de Rosas fue derrotado por una coalición de fuerzas de Uruguay, Brasil y el general Urquiza. Terminó así su segundo gobierno de 17 años y abrió el camino a la organización nacional.",
      },
      {
        id: "ar-6",
        event: "Sanción de la Constitución Nacional Argentina",
        year: 1853,
        context: "Inspirada en la Constitución de EE.UU. y en el pensamiento de Alberdi, estableció el sistema federal y republicano. Buenos Aires la rechazó y no se incorporó a la Confederación hasta 1859.",
      },
    ],
    [
      {
        id: "ar-7",
        event: "Creación del Virreinato del Río de la Plata",
        year: 1776,
        context: "España creó este virreinato para contener el avance portugués desde Brasil y administrar mejor la región. Buenos Aires se convirtió en capital, desplazando a Lima, y el territorio incluía hoy Argentina, Bolivia, Uruguay y Paraguay.",
      },
      {
        id: "ar-8",
        event: "Muerte de Manuel Belgrano, creador de la bandera",
        year: 1820,
        context: "Belgrano murió en la pobreza el mismo día en que Buenos Aires caía en el caos político de la Anarquía del Año XX. Creó la bandera celeste y blanca en 1812 y dirigió la campaña del Norte contra los realistas.",
      },
      {
        id: "ar-9",
        event: "Ley Sáenz Peña — voto secreto y obligatorio",
        year: 1912,
        context: "La ley instauró el sufragio universal masculino secreto y obligatorio, acabando con el fraude electoral sistemático. Fue impulsada por el presidente Roque Sáenz Peña y llevó a la UCR al poder en 1916.",
      },
      {
        id: "ar-10",
        event: "Presidencia de Hipólito Yrigoyen — primer gobierno radical",
        year: 1916,
        context: "Yrigoyen fue el primer presidente elegido por voto popular secreto en Argentina. Su gobierno amplió derechos laborales y representó el acceso de las clases medias al poder por primera vez en la historia del país.",
      },
      {
        id: "ar-11",
        event: "Primera transmisión de radio en el mundo — Argentina",
        year: 1920,
        context: "El 27 de agosto, el grupo Sociedad Radio Argentina transmitió ópera desde el Teatro Coliseo, siendo considerada la primera transmisión radial pública del mundo. Fue pionera en telecomunicaciones de masas.",
      },
      {
        id: "ar-12",
        event: "Golpe de Estado de Uriburu — primera dictadura militar",
        year: 1930,
        context: "El general José Félix Uriburu derrocó a Yrigoyen iniciando la llamada 'Década Infame'. Fue el primer golpe de Estado exitoso en Argentina y marcó el inicio de décadas de inestabilidad institucional.",
      },
    ],
    [
      {
        id: "ar-13",
        event: "Primer ferrocarril argentino en funcionamiento",
        year: 1857,
        context: "El Ferrocarril del Oeste inauguró su primer tramo entre La Porteña y el Parque (hoy Plaza Lavalle) en Buenos Aires. Fue el inicio de la extensa red ferroviaria que integró el país y potenció la exportación agrícola.",
      },
      {
        id: "ar-14",
        event: "Creación de YPF — Yacimientos Petrolíferos Fiscales",
        year: 1922,
        context: "YPF fue la primera empresa petrolera estatal del mundo y una del mundo en explotar el petróleo a escala nacional. Creada por el presidente Yrigoyen, nació del hallazgo de petróleo en Comodoro Rivadavia en 1907.",
      },
      {
        id: "ar-15",
        event: "Primera presidencia de Juan Domingo Perón",
        year: 1946,
        context: "Perón llegó al poder con un masivo apoyo obrero y fue reelecto en 1951. Su gobierno creó el Estado de bienestar argentino, nacionalizó empresas clave y su esposa Eva Perón se convirtió en figura mítica.",
      },
      {
        id: "ar-16",
        event: "Golpe de 1955 — Revolución Libertadora derroca a Perón",
        year: 1955,
        context: "La alianza entre militares y sectores civiles antiperonistas derrocó a Perón y lo envió al exilio. Se prohibió el peronismo durante 18 años, pero el movimiento sobrevivió clandestinamente con enorme fuerza popular.",
      },
      {
        id: "ar-17",
        event: "Regreso de Perón al país tras 18 años de exilio",
        year: 1973,
        context: "El 20 de junio, más de dos millones de personas fueron a Ezeiza para recibirlo, pero el acto terminó en una masacre entre facciones peronistas rivales. Perón asumió la presidencia en octubre y murió en julio de 1974.",
      },
      {
        id: "ar-18",
        event: "Argentina campeona del mundo — México 1986",
        year: 1986,
        context: "Dirigida por Diego Maradona, quien marcó el célebre 'Gol del Siglo' y el polémico 'Gol de la Mano de Dios' ante Inglaterra en cuartos de final. Argentina venció a Alemania Occidental 3-2 en la final.",
      },
    ],
    [
      {
        id: "ar-19",
        event: "Dictadura militar — inicio del Proceso de Reorganización Nacional",
        year: 1976,
        context: "El golpe del 24 de marzo instauró la dictadura más sangrienta de la historia argentina: entre 10.000 y 30.000 personas fueron desaparecidas. Los militares gobernaron hasta 1983 con represión sistemática y plan económico neoliberal.",
      },
      {
        id: "ar-20",
        event: "Argentina campeona del mundo — Argentina 1978",
        year: 1978,
        context: "El torneo se disputó bajo la dictadura militar en medio de denuncias internacionales por violaciones a los derechos humanos. Argentina venció a Holanda 3-1 en la final en el Estadio Monumental de Buenos Aires.",
      },
      {
        id: "ar-21",
        event: "Guerra de las Malvinas",
        year: 1982,
        context: "La junta militar invadió las Islas Malvinas para desviar la atención de la crisis interna. Gran Bretaña respondió con una fuerza de tareas; Argentina fue derrotada en 74 días con 649 militares muertos y aceleró la caída del régimen.",
      },
      {
        id: "ar-22",
        event: "Retorno de la democracia — asume Raúl Alfonsín",
        year: 1983,
        context: "Alfonsín ganó las primeras elecciones libres tras la dictadura, derrotando al peronismo por primera vez. Su gobierno ordenó el histórico Juicio a las Juntas, condenando a los principales responsables del terrorismo de Estado.",
      },
      {
        id: "ar-23",
        event: "Crisis económica, corralito y default",
        year: 2001,
        context: "En diciembre, el gobierno congeló los depósitos bancarios (el 'corralito') detonando una crisis social: cinco presidentes en dos semanas y la mayor cesación de pagos de la historia hasta ese momento.",
      },
      {
        id: "ar-24",
        event: "Argentina campeona del mundo — Qatar 2022",
        year: 2022,
        context: "Liderada por Lionel Messi, Argentina derrotó a Francia en la final más emocionante de la historia del fútbol, definiéndose por penales. Fue el tercer título mundial del país y el primero de Messi, sellando su legado.",
      },
    ],
    [
      {
        id: "ar-25",
        event: "Primer asentamiento europeo en territorio argentino — Sancti Spiritu",
        year: 1527,
        context: "Fundado por Sebastián Caboto en la confluencia de los ríos Carcarañá y Coronda, fue el primer establecimiento europeo permanente en lo que hoy es Argentina. Fue destruido por los timbúes dos años después.",
      },
      {
        id: "ar-26",
        event: "Fundación de Córdoba por Jerónimo Luis de Cabrera",
        year: 1573,
        context: "Córdoba fue fundada como punto estratégico entre el Alto Perú y el Río de la Plata. Sería sede de la primera universidad de lo que hoy es Argentina, la Universidad Nacional de Córdoba, fundada en 1613.",
      },
      {
        id: "ar-27",
        event: "Fundación de Salta por Hernando de Lerma",
        year: 1582,
        context: "Salta fue fundada para dominar las rutas comerciales entre el Virreinato del Perú y el Río de la Plata. Su ubicación estratégica la convirtió en sede del Ejército del Norte durante las guerras de independencia.",
      },
      {
        id: "ar-28",
        event: "Asamblea del Año XIII — abolición de la esclavitud",
        year: 1813,
        context: "La Asamblea estableció la 'libertad de vientres', por la que los hijos de esclavos nacerían libres. También suprimió la Inquisición, los títulos de nobleza y el uso de instrumentos de tortura.",
      },
      {
        id: "ar-29",
        event: "San Martín cruza los Andes — campaña libertadora",
        year: 1817,
        context: "El cruce de los Andes fue una hazaña militar sin precedentes: 5.000 soldados cruzaron por varios pasos a más de 4.000 metros. Permitió la liberación de Chile y fue el punto de partida de la campaña al Perú.",
      },
      {
        id: "ar-30",
        event: "Buenos Aires se convierte en capital federal del país",
        year: 1880,
        context: "Tras décadas de conflicto entre Buenos Aires y las provincias, la ciudad fue federalizada bajo el presidente Julio Roca. Se creó la Gobernación de Buenos Aires con La Plata como nueva capital provincial.",
      },
    ],
    [
      {
        id: "ar-31",
        event: "Muerte de José de San Martín en Boulogne-sur-Mer",
        year: 1850,
        context: "San Martín murió en Francia a los 72 años, exiliado voluntariamente desde 1824 para no intervenir en las guerras civiles argentinas. Sus restos fueron repatriados en 1880 y descansan en la Catedral Metropolitana.",
      },
      {
        id: "ar-32",
        event: "Guerra de la Triple Alianza — Argentina, Brasil y Uruguay vs. Paraguay",
        year: 1864,
        context: "Fue la guerra más devastadora de América del Sur: Paraguay perdió entre el 60% y el 70% de su población total. Argentina recuperó el territorio de Misiones y parte del Chaco al término del conflicto en 1870.",
      },
      {
        id: "ar-33",
        event: "Conquista del Desierto — campaña militar de Roca",
        year: 1879,
        context: "El general Julio A. Roca lanzó una campaña sistemática contra los pueblos mapuches y tehuelches en la Patagonia. Incorporó millones de hectáreas al Estado y permitió la expansión de la frontera agropecuaria.",
      },
      {
        id: "ar-34",
        event: "Semana Trágica — huelga obrera y represión en Buenos Aires",
        year: 1919,
        context: "Una huelga en los talleres metalúrgicos Vasena desencadenó una semana de violencia con centenares de muertos. Fue la primera gran confrontación entre el movimiento obrero y el Estado en Argentina.",
      },
      {
        id: "ar-35",
        event: "Muerte de Eva Perón — Evita",
        year: 1952,
        context: "Eva Perón murió de cáncer a los 33 años siendo una de las figuras más amadas y polémicas de la historia argentina. Fue la gran impulsora del voto femenino (1947) y de la Fundación Eva Perón que ayudó a millones.",
      },
      {
        id: "ar-36",
        event: "Juicio a las Juntas Militares",
        year: 1985,
        context: "Por primera vez en América Latina, los máximos responsables de una dictadura militar fueron juzgados y condenados por un tribunal civil. Videla y Massera recibieron cadena perpetua en un proceso histórico.",
      },
    ],
    [
      {
        id: "ar-37",
        event: "Hiperinflación — caída anticipada del gobierno de Alfonsín",
        year: 1989,
        context: "La inflación llegó al 3.000% anual, provocando saqueos y una crisis social sin precedentes. Alfonsín entregó anticipadamente el poder a Carlos Menem, siendo el primer traspaso presidencial entre partidos opuestos en décadas.",
      },
      {
        id: "ar-38",
        event: "Firma del Tratado de Asunción — creación del MERCOSUR",
        year: 1991,
        context: "Argentina, Brasil, Paraguay y Uruguay crearon el Mercado Común del Sur, el mayor bloque regional de América Latina. Fue la apuesta por la integración económica sudamericana en la era de la globalización.",
      },
      {
        id: "ar-39",
        event: "Atentado terrorista a la AMIA en Buenos Aires",
        year: 1994,
        context: "Un coche bomba destruyó la sede de la Asociación Mutual Israelita Argentina matando a 85 personas. Es el mayor atentado terrorista en la historia argentina y permanece impune más de 30 años después.",
      },
      {
        id: "ar-40",
        event: "Néstor Kirchner asume la presidencia",
        year: 2003,
        context: "Kirchner asumió con apenas el 22% de los votos, luego de que Carlos Menem renunciara al ballotage. Su gobierno renegó la deuda con el FMI, reabrió los juicios por crímenes de la dictadura y reactivó la economía.",
      },
      {
        id: "ar-41",
        event: "Argentina campeona de la Copa América — Brasil 2021",
        year: 2021,
        context: "Argentina derrotó a Brasil en el Maracaná, rompiendo una sequía de 28 años sin títulos. Fue el primer gran trofeo de Messi con la Selección y abrió el camino al Mundial de Qatar.",
      },
      {
        id: "ar-42",
        event: "Javier Milei asume la presidencia de Argentina",
        year: 2023,
        context: "Milei ganó las elecciones con un programa de shock económico liberal, la dolarización como propuesta y la 'motosierra' como símbolo. Su gobierno inició el mayor ajuste fiscal de la historia argentina reciente.",
      },
    ],
  ],
};
