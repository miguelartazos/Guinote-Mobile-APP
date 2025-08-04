import type { TutorialStep } from '../components/tutorial/TutorialOverlay';
import type { TutorialType } from '../types/game.types';
import { tutorialStepId } from '../utils/brandedTypes';

export type TutorialSection = {
  id: string;
  title: string;
  steps: TutorialStep[];
};

// Tutorial Básico - "Lo Básico" 👶
export const basicTutorialSteps: TutorialStep[] = [
  {
    id: tutorialStepId('basic-welcome'),
    title: '¡Hola, futuro campeón/a de Guiñote! 🏆',
    description:
      'Estás a punto de aprender un juego legendario. Olvídate de manuales aburridos, aquí vamos al grano para que juegues en menos de 5 minutos. ¿Listo/a?',
  },
  {
    id: tutorialStepId('basic-mission'),
    title: '🎯 Tu Misión (Si decides aceptarla...)',
    description:
      'Fácil: formas equipo con la persona que está sentada en frente. Juntos, intentaréis ganar las rondas ("bazas") para quedaros con las cartas que dan más puntos. ¡Trabajo en equipo al poder!',
  },
  {
    id: tutorialStepId('basic-cards-teams'),
    title: '🃏 Las Cartas y los Equipos',
    description:
      '4 Jugadores, 2 Equipos: Tú y tu compi contra otros dos.\n\nBaraja Española de 40 cartas: Con sus 4 "palos": Oros 🟡, Copas ❤️, Espadas ⚔️ y Bastos 🌳.',
  },
  {
    id: tutorialStepId('basic-trump'),
    title: '✨ El "Triunfo": La Carta Mágica',
    description:
      'Al repartir 6 cartas a cada uno, la siguiente carta del mazo se pone boca arriba. ¡Ese palo es el triunfo!\n\nPiénsalo así: el triunfo es como un superpoder. Una carta de triunfo le gana a CUALQUIER carta de otro palo. ¡Es la jefa de la ronda!',
  },
  {
    id: tutorialStepId('basic-hierarchy'),
    title: '👑 La Jerarquía: ¿Quién Manda Más?',
    description:
      'No todas las cartas son iguales. Este es el orden de poder, de más a menos fuerte:\n\n• As (el 1) - ¡El rey de la baraja!\n• Tres (el 3) - El segundo al mando\n• Rey (el 12)\n• Sota (el 10)\n• Caballo (el 11)\n• Y luego el resto, del 7 al 2',
  },
  {
    id: tutorialStepId('basic-gameplay'),
    title: '🎮 ¡A Jugar! Tu Primer Turno (Fase de Robo)',
    description:
      'El jugador a la derecha de quien repartió empieza tirando una carta. Los demás tiran una por turno.\n\nLa regla de oro en esta fase es: ¡NO HAY REGLAS!\nBueno, casi. Puedes jugar la carta que tú quieras, la que te venga mejor.',
  },
  {
    id: tutorialStepId('basic-winning'),
    title: '🏆 ¿Quién se lleva las 4 cartas de la mesa?',
    description:
      '• Si alguien jugó un triunfo, gana el triunfo más alto\n• Si nadie jugó un triunfo, gana la carta más alta del palo con el que se empezó\n\n¿Y después?\n• El ganador recoge las cartas\n• Luego, ese jugador roba una nueva carta del mazo. Los demás roban después\n• ¡Y vuelta a empezar! Fácil, ¿verdad?\n\nCon esto ya puedes sobrevivir a tus primeras partidas. ¡Ahora a practicar!',
  },
];

// Tutorial Cantes - "Reglas Especiales, Cantes y Puntuación" 🚀
export const cantesTutorialSteps: TutorialStep[] = [
  {
    id: tutorialStepId('cantes-intro'),
    title: '🚀 ¿Ya te sientes cómodo/a con lo básico?',
    description:
      '¡Perfecto! Es hora de subir de nivel. Aquí es donde el Guiñote se pone realmente interesante. ¡Vamos a desbloquear los superpoderes!',
  },
  {
    id: tutorialStepId('cantes-card-values'),
    title: '💰 El Valor Real de las Cartas (¡Money, money!)',
    description:
      'Recuerdas el As y el Tres, ¿verdad? Pues no solo son fuertes, ¡valen un dineral en puntos!\n\n• As: 11 puntazos\n• Tres: 10 puntos\n• Rey: 4 puntos\n• Sota: 3 puntos\n• Caballo: 2 puntos\n\nEl resto (7, 6, 5, 4, 2) valen 0 puntos, pero son tus herramientas para ganar las cartas buenas.',
  },
  {
    id: tutorialStepId('cantes-singing'),
    title: '🎤 ¡A Cantar se ha Dicho! (Las 20 y las 40)',
    description:
      'Cantar es anunciar que tienes una combinación ganadora en la mano para llevarte puntos extra.',
  },
  {
    id: tutorialStepId('cantes-twenty'),
    title: 'LAS VEINTE (20p)',
    description:
      'Si tienes el Rey y la Sota de un palo que NO sea triunfo, puedes gritar (mentalmente) "¡Canto las veinte!". Son 20 puntos para tu equipo.',
  },
  {
    id: tutorialStepId('cantes-forty'),
    title: 'LAS CUARENTA (40p)',
    description:
      'El cante definitivo. Si tienes el Rey y la Sota del palo de TRIUNFO, ¡son 40 puntazos! Es casi medio partido.\n\n☝️ Momento Clave: Solo puedes cantar justo después de que tú o tu pareja ganéis una baza.',
  },
  {
    id: tutorialStepId('cantes-arrastre-intro'),
    title: '⛓️ La Fase de "Arrastre": ¡Ahora el Juego se Pone Serio!',
    description:
      'Esto es CRUCIAL. Cuando el mazo de robar se acaba, el juego se transforma. Se acabaron las libertades, ¡ahora hay que obedecer! A esto se le llama arrastre.',
  },
  {
    id: tutorialStepId('cantes-arrastre-rules'),
    title: 'Reglas del Arrastre',
    description:
      'Desde este momento, cuando alguien tira una carta, estás OBLIGADO a seguir esta lógica:\n\n¿Tengo cartas del mismo palo?\n• SÍ: Debes jugar una. Y si además tienes una que supera a la que hay en la mesa, tienes que jugarla ("montar")\n\n¿No tengo cartas de ese palo?\n• ¿Tengo algún triunfo? SÍ: Estás OBLIGADO a jugar un triunfo ("fallar")\n• Si otro ya falló antes, debes superarlo con un triunfo más alto si puedes\n• NO: Si no puedes hacer nada de lo anterior, ahora sí, puedes jugar la carta que quieras',
  },
  {
    id: tutorialStepId('cantes-final-score'),
    title: '📊 El Recuento Final: La Hora de la Verdad',
    description:
      'Se acaba la ronda. ¿Quién ha ganado? A sumar:\n\n• Puntos de las cartas que ha ganado tu equipo\n• Puntos de los cantes que hayáis hecho\n• Premio "Diez de Últimas": ¡El equipo que gane la última baza se lleva 10 puntos extra por la cara! 🥳\n\nEl primer equipo en sumar 101 puntos o más, ¡gana la ronda!',
  },
];

// Tutorial Completo - "Tutorial Completo" 🎓
export const completeTutorialSteps: TutorialStep[] = [
  {
    id: tutorialStepId('complete-intro'),
    title: '🎓 Has llegado al final del camino',
    description:
      'Has llegado al final del camino, joven padawan del Guiñote. Es hora de unirlo todo y darte las llaves del reino. Con este tutorial, no solo jugarás, sino que dominarás.',
  },
  {
    id: tutorialStepId('complete-soul'),
    title: '1. El Alma del Guiñote',
    description:
      'Bienvenida a la guía definitiva. El objetivo no es solo ganar una ronda, sino ganar el "coto": la partida completa, que se juega a un número de rondas ganadas (por ejemplo, el primero que gane 3).',
  },
  {
    id: tutorialStepId('complete-preparation'),
    title: '2. Preparación (El Ritual Inicial)',
    description:
      'Un repaso visual y claro del reparto de 6 cartas y la revelación del triunfo.',
  },
  {
    id: tutorialStepId('complete-cards-reference'),
    title: '3. Las Cartas: Poder y Puntos (El Arsenal)',
    description:
      'Una tabla-resumen definitiva con la Jerarquía y los Puntos de cada carta:\n\n**PODER (Jerarquía):**\n• As (1) - 11 puntos\n• Tres (3) - 10 puntos\n• Rey (12) - 4 puntos\n• Caballo (11) - 2 puntos\n• Sota (10) - 3 puntos\n• 7, 6, 5, 4, 2 - 0 puntos',
  },
  {
    id: tutorialStepId('complete-two-phases'),
    title: '4. Las Dos Caras del Juego: Fases de la Ronda',
    description:
      '**Fase 1: La Calma (Con Mazo para Robar)**\nAquí manda la astucia y la libertad. Engaña a tus rivales, guarda tus cartas buenas.\n\n**Fase 2: La Tempestad (El Arrastre)**\nSe acaba el mazo y empiezan las obligaciones. Repaso claro de la lógica:\n1. Asistir y Montar → 2. Fallar → 3. Tirar lo que sea',
  },
  {
    id: tutorialStepId('complete-singing-art'),
    title: '5. El Arte de Cantar (Las 20 y las 40)',
    description:
      'Explicación completa de los cantes y el momento exacto para usarlos y sorprender al rival:\n\n• **Las 20:** Rey + Sota de palo NO triunfo = 20 puntos\n• **Las 40:** Rey + Sota del palo de triunfo = 40 puntos\n\n**Cuándo cantar:** Solo después de ganar una baza tú o tu pareja.',
  },
  {
    id: tutorialStepId('complete-championship-scoring'),
    title: '6. Puntuación de Campeonato',
    description:
      'El proceso completo de suma:\n\n**Cartas + Cantes + Diez de Últimas = Puntuación Total**\n\n¡A por los 101 puntos para ganar la ronda!',
  },
  {
    id: tutorialStepId('complete-master-secrets'),
    title: '🧠 Secretos de Maestro: Estrategias para Ganar',
    description:
      '**El Arte del Sacrificio:** A veces, es mejor perder una baza con pocas cartas de puntos para guardar tus ases en la manga.\n\n**"Cargar" al Compañero:** Si tu pareja va a ganar la baza sí o sí (por ejemplo, con un As de triunfo), ¡aprovecha y tira tus cartas con más puntos (Ases, Treses) para dárselas a tu equipo! Esto es clave.\n\n**Memoria de Elefante 🐘:** Intenta recordar qué triunfos importantes ya han salido. Saber si el As de triunfo sigue en juego puede darte la victoria.',
  },
  {
    id: tutorialStepId('complete-final-tips'),
    title: '🎯 Consejos Finales de Campeón',
    description:
      '**Leer el Cante:** Si un rival canta "las veinte de Oros", ya sabes dos cosas: 1) Tiene el Rey y la Sota de Oros. 2) ¡Los Oros NO son triunfo! Usa esa información.\n\n**Las Señales (¡Cuidado!):** En partidas amistosas, es común que haya señas entre compañeros (tocarse la nariz, un gesto...). Oficialmente están prohibidas, ¡pero es bueno que sepas que existen! En esta app, tu mejor seña es jugar bien tus cartas.\n\n¡Felicidades! Ya no eres un principiante. Eres un conocedor del Guiñote. Tienes las reglas, la estrategia y el espíritu del juego.\n\nAhora... ¡A la mesa y a demostrar quién manda! 💪',
  },
];

// For the special tutorial, let's create some content about advanced rules
export const specialTutorialSteps: TutorialStep[] = [
  {
    id: tutorialStepId('special-intro'),
    title: '⭐ Reglas Especiales y Situaciones Avanzadas',
    description:
      'Estas son las reglas especiales que aparecen en situaciones específicas del juego. ¡Domínalas y serás imparable!',
  },
  {
    id: tutorialStepId('special-change-seven'),
    title: 'Cambiar el 7 de Triunfo',
    description:
      'Si tienes el 7 del palo de triunfo, puedes cambiarlo por la carta de triunfo que está boca arriba en el mazo. Esto se hace después de ganar una baza y antes de robar.',
  },
  {
    id: tutorialStepId('special-last-trick'),
    title: 'La Última Baza: 10 Puntos Extra',
    description:
      'El equipo que gane la última baza de la ronda se lleva 10 puntos adicionales. ¡Es importante planificar para ganarla!',
  },
  {
    id: tutorialStepId('special-capote'),
    title: 'El Capote: Victoria Total',
    description:
      'Si un equipo gana todas las bazas de una ronda (capote), duplica todos los puntos obtenidos. Es muy difícil de conseguir, ¡pero devastador!',
  },
];

export function getTutorialSteps(type: TutorialType): TutorialStep[] {
  switch (type) {
    case 'complete':
      return completeTutorialSteps;
    case 'basic':
      return basicTutorialSteps;
    case 'cantes':
      return cantesTutorialSteps;
    case 'special':
      return specialTutorialSteps;
    default:
      return [];
  }
}

export function getContextualHelp(context: string): string {
  const contextualHelpMap: Record<string, string> = {
    'play-card':
      'Selecciona una carta de tu mano para jugarla. Recuerda seguir el palo si puedes.',
    'cante-available':
      'Tienes Rey y Caballo del mismo palo. Puedes cantar después de ganar esta baza.',
    'trump-change':
      'Tienes el 7 de triunfo. Puedes cambiarlo por la carta de triunfo después de ganar una baza.',
    'last-cards':
      'Quedan pocas cartas. Ahora debes usar triunfo si el oponente lo usa y tú tienes.',
    'waiting-turn': 'Espera tu turno. Observa las cartas que juegan los demás.',
    'partner-turn':
      'Es el turno de tu compañero. Observa su jugada para planear tu estrategia.',
  };

  return (
    contextualHelpMap[context] ||
    'Pulsa el botón de ayuda para más información sobre el juego.'
  );
}
