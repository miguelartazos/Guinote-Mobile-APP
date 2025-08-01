import type { TutorialStep } from '../components/tutorial/TutorialOverlay';
import type { TutorialType } from '../types/game.types';
import { tutorialStepId } from '../utils/brandedTypes';

export type TutorialSection = {
  id: string;
  title: string;
  steps: TutorialStep[];
};

export const completeTutorialSteps: TutorialSection[] = [
  {
    id: 'intro',
    title: 'Introducción',
    steps: [
      {
        id: tutorialStepId('welcome'),
        title: '¡Bienvenido a Guiñote!',
        description:
          'Guiñote es un juego de cartas español tradicional. Se juega en parejas: tú y tu compañero contra dos oponentes. El objetivo es ser los primeros en llegar a 101 puntos.',
        action: 'observe',
      },
      {
        id: tutorialStepId('table-overview'),
        title: 'La Mesa de Juego',
        description:
          'Esta es tu mesa de juego. Arriba están los oponentes, a los lados tu compañero y tú estás abajo. En el centro se juegan las cartas.',
        action: 'observe',
      },
    ],
  },
  {
    id: 'cards',
    title: 'Las Cartas',
    steps: [
      {
        id: tutorialStepId('deck'),
        title: 'La Baraja Española',
        description:
          'Usamos 40 cartas de la baraja española: Oros, Copas, Espadas y Bastos. Cada palo tiene: As, 2-7, Sota, Caballo y Rey.',
        action: 'observe',
      },
      {
        id: tutorialStepId('card-values'),
        title: 'Valor de las Cartas',
        description:
          'As vale 11 puntos, Tres vale 10, Rey 4, Caballo 3, Sota 2. Las demás cartas (7,6,5,4,2) valen 0 puntos.',
        action: 'observe',
      },
      {
        id: tutorialStepId('trump'),
        title: 'El Triunfo',
        description:
          'Hay un palo especial llamado "triunfo" que gana a todos los demás. Mira el indicador de triunfo en la mesa.',
        targetElement: 'trump-indicator',
        action: 'observe',
      },
    ],
  },
  {
    id: 'basic-play',
    title: 'Juego Básico',
    steps: [
      {
        id: 'dealing',
        title: 'Reparto de Cartas',
        description:
          'Cada jugador recibe 6 cartas. El resto forma el mazo. La última carta del mazo determina el triunfo.',
        action: 'observe',
      },
      {
        id: 'your-turn',
        title: 'Tu Turno',
        description:
          'Cuando sea tu turno, selecciona una carta para jugar. Las cartas válidas se resaltarán.',
        targetElement: 'player-hand',
        action: 'tap',
      },
      {
        id: 'follow-suit',
        title: 'Seguir el Palo',
        description:
          'Debes jugar una carta del mismo palo que la primera. Si no tienes, puedes usar triunfo o cualquier otra carta.',
        action: 'observe',
      },
      {
        id: 'winning-trick',
        title: 'Ganar la Baza',
        description:
          'La carta más alta del palo inicial gana, pero el triunfo siempre gana. El ganador se lleva las cartas y empieza la siguiente ronda.',
        action: 'observe',
      },
      {
        id: 'drawing-cards',
        title: 'Robar Cartas',
        description:
          'Después de cada baza, todos roban una carta del mazo hasta tener 6 cartas otra vez.',
        action: 'observe',
      },
    ],
  },
  {
    id: 'cantes',
    title: 'Los Cantes',
    steps: [
      {
        id: 'what-are-cantes',
        title: '¿Qué son los Cantes?',
        description:
          'Cuando tienes Rey y Caballo del mismo palo, puedes "cantar" para ganar puntos extra.',
        action: 'observe',
      },
      {
        id: 'twenty-points',
        title: 'Las 20',
        description:
          'Rey y Caballo de cualquier palo (excepto triunfo) valen 20 puntos. Debes ganar una baza para poder cantar.',
        action: 'observe',
      },
      {
        id: 'forty-points',
        title: 'Las 40',
        description:
          'Rey y Caballo del palo de triunfo valen 40 puntos. ¡Es el cante más valioso!',
        action: 'observe',
      },
      {
        id: 'how-to-cante',
        title: 'Cómo Cantar',
        description:
          'Después de ganar una baza, si tienes Rey y Caballo del mismo palo, aparecerá el botón "Cantar". Púlsalo para cantar.',
        targetElement: 'cante-button',
        action: 'tap',
      },
    ],
  },
  {
    id: 'special-rules',
    title: 'Reglas Especiales',
    steps: [
      {
        id: 'change-seven',
        title: 'Cambiar el 7',
        description:
          'Si tienes el 7 de triunfo, puedes cambiarlo por la carta de triunfo del mazo. Hazlo después de ganar una baza.',
        action: 'observe',
      },
      {
        id: 'last-cards',
        title: 'Últimas 12 Cartas',
        description:
          'Cuando quedan 12 cartas (sin mazo), las reglas cambian: debes usar triunfo si puedes cuando el oponente lo usa.',
        action: 'observe',
      },
      {
        id: 'last-trick',
        title: 'Última Baza',
        description:
          'La última baza vale 10 puntos extra. ¡Es importante ganarla!',
        action: 'observe',
      },
      {
        id: 'capote',
        title: 'Capote',
        description:
          'Si ganas todas las bazas de una mano, haces "capote" y duplicas los puntos. ¡Es muy difícil pero muy valioso!',
        action: 'observe',
      },
    ],
  },
  {
    id: 'strategy',
    title: 'Estrategia Básica',
    steps: [
      {
        id: 'counting-cards',
        title: 'Contar Cartas',
        description:
          'Intenta recordar qué cartas se han jugado, especialmente los Ases y Treses que valen muchos puntos.',
        action: 'observe',
      },
      {
        id: 'save-trumps',
        title: 'Guarda los Triunfos',
        description:
          'Los triunfos son valiosos. Úsalos estratégicamente para ganar bazas importantes o cuando hay muchos puntos en juego.',
        action: 'observe',
      },
      {
        id: 'partner-play',
        title: 'Juega con tu Compañero',
        description:
          'Recuerda que juegas en equipo. Intenta que tu compañero gane bazas cuando tiene buenas cartas.',
        action: 'observe',
      },
      {
        id: 'cante-timing',
        title: 'Cuándo Cantar',
        description:
          'No siempre debes cantar inmediatamente. A veces es mejor esperar para no revelar tu juego a los oponentes.',
        action: 'observe',
      },
    ],
  },
];

export const basicTutorialSteps: TutorialStep[] = [
  completeTutorialSteps[0].steps[0], // Welcome
  completeTutorialSteps[1].steps[2], // Trump
  completeTutorialSteps[2].steps[1], // Your turn
  completeTutorialSteps[2].steps[2], // Follow suit
  completeTutorialSteps[2].steps[3], // Winning trick
];

export const cantesTutorialSteps: TutorialStep[] = [
  completeTutorialSteps[3].steps[0], // What are cantes
  completeTutorialSteps[3].steps[1], // Twenty points
  completeTutorialSteps[3].steps[2], // Forty points
  completeTutorialSteps[3].steps[3], // How to cante
];

export const specialTutorialSteps: TutorialStep[] = [
  completeTutorialSteps[4].steps[0], // Change seven
  completeTutorialSteps[4].steps[1], // Last cards
  completeTutorialSteps[4].steps[2], // Last trick
  completeTutorialSteps[4].steps[3], // Capote
];

export function getTutorialSteps(type: TutorialType): TutorialStep[] {
  switch (type) {
    case 'complete':
      return completeTutorialSteps.flatMap(section => section.steps);
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
