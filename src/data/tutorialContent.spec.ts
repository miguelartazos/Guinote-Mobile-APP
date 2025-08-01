import {
  completeTutorialSteps,
  basicTutorialSteps,
  cantesTutorialSteps,
  specialTutorialSteps,
  getTutorialSteps,
  getContextualHelp,
} from './tutorialContent';
import { tutorialType } from '../utils/brandedTypes';

describe('tutorialContent', () => {
  describe('completeTutorialSteps', () => {
    test('contains all tutorial sections', () => {
      expect(completeTutorialSteps).toHaveLength(6);

      const sectionIds = completeTutorialSteps.map(section => section.id);
      expect(sectionIds).toEqual([
        'intro',
        'cards',
        'basic-play',
        'cantes',
        'special-rules',
        'strategy',
      ]);
    });

    test('each section has required properties', () => {
      completeTutorialSteps.forEach(section => {
        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('title');
        expect(section).toHaveProperty('steps');
        expect(Array.isArray(section.steps)).toBe(true);
        expect(section.steps.length).toBeGreaterThan(0);
      });
    });

    test('all steps have required properties', () => {
      completeTutorialSteps.forEach(section => {
        section.steps.forEach(step => {
          expect(step).toHaveProperty('id');
          expect(step).toHaveProperty('title');
          expect(step).toHaveProperty('description');
          expect(['tap', 'drag', 'observe', undefined]).toContain(step.action);
        });
      });
    });

    test('intro section has correct steps', () => {
      const introSection = completeTutorialSteps[0];
      expect(introSection.id).toBe('intro');
      expect(introSection.steps).toHaveLength(2);
      expect(introSection.steps[0].title).toBe('¡Bienvenido a Guiñote!');
      expect(introSection.steps[1].title).toBe('La Mesa de Juego');
    });

    test('some steps have highlight areas', () => {
      const allSteps = completeTutorialSteps.flatMap(section => section.steps);
      const stepsWithHighlight = allSteps.filter(step => step.highlightArea);
      expect(stepsWithHighlight.length).toBeGreaterThan(0);
    });

    test('some steps have target elements', () => {
      const allSteps = completeTutorialSteps.flatMap(section => section.steps);
      const stepsWithTarget = allSteps.filter(step => step.targetElement);
      expect(stepsWithTarget.length).toBeGreaterThan(0);
    });
  });

  describe('basicTutorialSteps', () => {
    test('contains subset of complete tutorial', () => {
      expect(basicTutorialSteps).toHaveLength(5);

      // Verify steps are from complete tutorial
      basicTutorialSteps.forEach(step => {
        const foundInComplete = completeTutorialSteps
          .flatMap(section => section.steps)
          .some(completeStep => completeStep.id === step.id);
        expect(foundInComplete).toBe(true);
      });
    });

    test('covers essential gameplay', () => {
      const titles = basicTutorialSteps.map(step => step.title);
      expect(titles).toContain('¡Bienvenido a Guiñote!');
      expect(titles).toContain('El Triunfo');
      expect(titles).toContain('Tu Turno');
    });
  });

  describe('cantesTutorialSteps', () => {
    test('contains cante-specific steps', () => {
      expect(cantesTutorialSteps).toHaveLength(4);

      const titles = cantesTutorialSteps.map(step => step.title);
      expect(titles).toContain('¿Qué son los Cantes?');
      expect(titles).toContain('Las 20');
      expect(titles).toContain('Las 40');
      expect(titles).toContain('Cómo Cantar');
    });
  });

  describe('specialTutorialSteps', () => {
    test('contains special rules steps', () => {
      expect(specialTutorialSteps).toHaveLength(4);

      const titles = specialTutorialSteps.map(step => step.title);
      expect(titles).toContain('Cambiar el 7');
      expect(titles).toContain('Últimas 12 Cartas');
      expect(titles).toContain('Última Baza');
      expect(titles).toContain('Capote');
    });
  });

  describe('getTutorialSteps', () => {
    test('returns complete tutorial steps', () => {
      const steps = getTutorialSteps(tutorialType('complete'));
      const allSteps = completeTutorialSteps.flatMap(section => section.steps);
      expect(steps).toHaveLength(allSteps.length);
      expect(steps).toEqual(allSteps);
    });

    test('returns basic tutorial steps', () => {
      const steps = getTutorialSteps(tutorialType('basic'));
      expect(steps).toEqual(basicTutorialSteps);
    });

    test('returns cantes tutorial steps', () => {
      const steps = getTutorialSteps(tutorialType('cantes'));
      expect(steps).toEqual(cantesTutorialSteps);
    });

    test('returns special tutorial steps', () => {
      const steps = getTutorialSteps(tutorialType('special'));
      expect(steps).toEqual(specialTutorialSteps);
    });

    test('returns empty array for unknown type', () => {
      const steps = getTutorialSteps('unknown' as any);
      expect(steps).toEqual([]);
    });
  });

  describe('getContextualHelp', () => {
    test('returns help for known contexts', () => {
      expect(getContextualHelp('play-card')).toContain('Selecciona una carta');
      expect(getContextualHelp('cante-available')).toContain('Rey y Caballo');
      expect(getContextualHelp('trump-change')).toContain('7 de triunfo');
      expect(getContextualHelp('last-cards')).toContain('Quedan pocas cartas');
      expect(getContextualHelp('waiting-turn')).toContain('Espera tu turno');
      expect(getContextualHelp('partner-turn')).toContain(
        'turno de tu compañero',
      );
    });

    test('returns default help for unknown context', () => {
      const defaultHelp = getContextualHelp('unknown-context');
      expect(defaultHelp).toContain('Pulsa el botón de ayuda');
    });

    test('all contextual help is non-empty', () => {
      const contexts = [
        'play-card',
        'cante-available',
        'trump-change',
        'last-cards',
        'waiting-turn',
        'partner-turn',
      ];

      contexts.forEach(context => {
        const help = getContextualHelp(context);
        expect(help).toBeTruthy();
        expect(help.length).toBeGreaterThan(0);
      });
    });
  });

  describe('data integrity', () => {
    test('no duplicate step IDs', () => {
      const allSteps = completeTutorialSteps.flatMap(section => section.steps);
      const stepIds = allSteps.map(step => step.id);
      const uniqueIds = [...new Set(stepIds)];

      expect(stepIds).toHaveLength(uniqueIds.length);
    });

    test('all descriptions are meaningful', () => {
      const allSteps = completeTutorialSteps.flatMap(section => section.steps);

      allSteps.forEach(step => {
        expect(step.description.length).toBeGreaterThan(20);
        expect(step.description).not.toContain('TODO');
        expect(step.description).not.toContain('TBD');
      });
    });

    test('action types are consistent', () => {
      const allSteps = completeTutorialSteps.flatMap(section => section.steps);
      const validActions = ['tap', 'drag', 'observe'];

      allSteps.forEach(step => {
        if (step.action) {
          expect(validActions).toContain(step.action);
        }
      });
    });
  });
});
