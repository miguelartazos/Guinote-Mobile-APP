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
    test('contains complete tutorial steps', () => {
      expect(completeTutorialSteps).toHaveLength(9);
      expect(completeTutorialSteps[0].title).toBe('🎓 Has llegado al final del camino');
    });

    test('all steps have required properties', () => {
      completeTutorialSteps.forEach(step => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('basicTutorialSteps', () => {
    test('contains basic tutorial steps', () => {
      expect(basicTutorialSteps).toHaveLength(7);
      expect(basicTutorialSteps[0].title).toBe('¡Hola, futuro campeón/a de Guiñote! 🏆');
    });

    test('all steps have required properties', () => {
      basicTutorialSteps.forEach(step => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
      });
    });
  });

  describe('cantesTutorialSteps', () => {
    test('contains cante-specific steps', () => {
      expect(cantesTutorialSteps).toHaveLength(8);
      expect(cantesTutorialSteps[0].title).toBe('🚀 ¿Ya te sientes cómodo/a con lo básico?');
    });

    test('all steps have required properties', () => {
      cantesTutorialSteps.forEach(step => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
      });
    });
  });

  describe('specialTutorialSteps', () => {
    test('contains special rules steps', () => {
      expect(specialTutorialSteps).toHaveLength(4);
      expect(specialTutorialSteps[0].title).toBe('⭐ Reglas Especiales y Situaciones Avanzadas');
    });

    test('all steps have required properties', () => {
      specialTutorialSteps.forEach(step => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
      });
    });
  });

  describe('getTutorialSteps', () => {
    test('returns complete tutorial steps', () => {
      const steps = getTutorialSteps(tutorialType('complete'));
      expect(steps).toEqual(completeTutorialSteps);
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
      expect(getContextualHelp('partner-turn')).toContain('turno de tu compañero');
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
    test('all tutorial steps have meaningful descriptions', () => {
      const allTutorialSteps = [
        ...completeTutorialSteps,
        ...basicTutorialSteps,
        ...cantesTutorialSteps,
        ...specialTutorialSteps,
      ];

      allTutorialSteps.forEach(step => {
        expect(step.description.length).toBeGreaterThan(20);
        expect(step.description).not.toContain('TODO');
        expect(step.description).not.toContain('TBD');
      });
    });
  });
});
