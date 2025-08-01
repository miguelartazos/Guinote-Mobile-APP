import { useState, useEffect, useCallback } from 'react';
import type { GameSettings } from '../utils/gameSettings';
import {
  loadSettings,
  saveSettings,
  resetSettings as resetSettingsUtil,
} from '../utils/gameSettings';

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(err => {
        console.error('Failed to load settings:', err);
        setError('Error al cargar ajustes');
        // Return default settings on error
        return loadSettings().catch(() => null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<GameSettings>) => {
      if (!settings) return;

      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);

      try {
        await saveSettings(newSettings);
        setError(null);
      } catch (err) {
        console.error('Failed to save settings:', err);
        setError('Error al guardar ajustes');
        // Revert settings on error
        setSettings(settings);
        throw err;
      }
    },
    [settings],
  );

  const resetSettings = useCallback(async () => {
    try {
      const defaultSettings = await resetSettingsUtil();
      setSettings(defaultSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      setError('Error al restablecer ajustes');
      throw err;
    }
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    resetSettings,
  };
}
