import React from 'react';
import { describe, expect, test, jest } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import type { RootStackScreenProps } from '../types/navigation';

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
} as unknown as RootStackScreenProps<'Home'>['navigation'];

const mockRoute = {} as RootStackScreenProps<'Home'>['route'];

describe('HomeScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders app title', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    expect(getByText('Guiñote+')).toBeTruthy();
  });

  test('renders play button', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    expect(getByText('Jugar')).toBeTruthy();
  });

  test('navigates to game screen when play button is pressed', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    fireEvent.press(getByText('Jugar'));
    expect(mockNavigate).toHaveBeenCalledWith('Game');
  });

  test('renders settings button', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    expect(getByText('Ajustes')).toBeTruthy();
  });

  test('navigates to settings screen when settings button is pressed', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    fireEvent.press(getByText('Ajustes'));
    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });

  test('renders multiplayer button', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    expect(getByText('Multijugador')).toBeTruthy();
  });

  test('navigates to multiplayer screen when multiplayer button is pressed', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    fireEvent.press(getByText('Multijugador'));
    expect(mockNavigate).toHaveBeenCalledWith('Multiplayer');
  });
});