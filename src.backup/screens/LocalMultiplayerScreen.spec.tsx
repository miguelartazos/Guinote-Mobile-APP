import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LocalMultiplayerScreen } from './LocalMultiplayerScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const navigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
} as any;

const route = {} as any;

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LocalMultiplayerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default 4 players', () => {
    const { getByText, getAllByPlaceholderText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    expect(getByText('Paso y Juego')).toBeTruthy();
    expect(
      getByText('Configura los jugadores para la partida local'),
    ).toBeTruthy();
    expect(getByText('4 Jugadores')).toBeTruthy();

    const nameInputs = getAllByPlaceholderText(/Jugador \d+/);
    expect(nameInputs).toHaveLength(4);
  });

  it('switches to 2 player mode', () => {
    const { getByText, getAllByPlaceholderText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(getByText('2 Jugadores'));

    const nameInputs = getAllByPlaceholderText(/Jugador \d+/);
    expect(nameInputs).toHaveLength(2);
    expect(
      getByText('⚠️ Modo simplificado: cada jugador controla dos manos'),
    ).toBeTruthy();
  });

  it('updates player names correctly', () => {
    const { getAllByPlaceholderText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    const nameInputs = getAllByPlaceholderText(/Jugador \d+/);
    fireEvent.changeText(nameInputs[0], 'Ana');
    fireEvent.changeText(nameInputs[1], 'Carlos');

    expect(nameInputs[0].props.value).toBe('Ana');
    expect(nameInputs[1].props.value).toBe('Carlos');
  });

  it('selects random dealer', () => {
    const { getByText, getAllByPlaceholderText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    // Fill in player names
    const nameInputs = getAllByPlaceholderText(/Jugador \d+/);
    fireEvent.changeText(nameInputs[0], 'Ana');
    fireEvent.changeText(nameInputs[1], 'Carlos');
    fireEvent.changeText(nameInputs[2], 'María');
    fireEvent.changeText(nameInputs[3], 'Juan');

    // Mock Math.random to return a predictable value
    const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    fireEvent.press(getByText('🎲 Seleccionar Dealer al Azar'));

    expect(Alert.alert).toHaveBeenCalledWith(
      '¡Dealer seleccionado!',
      expect.stringContaining('será el dealer'),
    );

    mockRandom.mockRestore();
  });

  it('shows error when trying to select dealer without all names', () => {
    const { getByText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(getByText('🎲 Seleccionar Dealer al Azar'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Nombres incompletos',
      'Por favor, introduce todos los nombres de los jugadores',
    );
  });

  it('starts game with valid configuration', () => {
    const { getByText, getAllByPlaceholderText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    // Fill in player names
    const nameInputs = getAllByPlaceholderText(/Jugador \d+/);
    fireEvent.changeText(nameInputs[0], 'Ana');
    fireEvent.changeText(nameInputs[1], 'Carlos');
    fireEvent.changeText(nameInputs[2], 'María');
    fireEvent.changeText(nameInputs[3], 'Juan');

    // Select dealer
    jest.spyOn(Math, 'random').mockReturnValue(0.25);
    fireEvent.press(getByText('🎲 Seleccionar Dealer al Azar'));

    // Start game
    fireEvent.press(getByText('Comenzar Partida'));

    expect(mockNavigate).toHaveBeenCalledWith('Game', {
      gameMode: 'local',
      playerNames: ['Ana', 'Carlos', 'María', 'Juan'],
    });
  });

  it('shows error when starting game without all names', () => {
    const { getByText, getAllByPlaceholderText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    // Only fill some names
    const nameInputs = getAllByPlaceholderText(/Jugador \d+/);
    fireEvent.changeText(nameInputs[0], 'Ana');
    fireEvent.changeText(nameInputs[1], 'Carlos');

    fireEvent.press(getByText('Comenzar Partida'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Nombres incompletos',
      'Por favor, introduce todos los nombres de los jugadores',
    );
  });

  it('shows error when starting game without selecting dealer', () => {
    const { getByText, getAllByPlaceholderText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    // Fill all names
    const nameInputs = getAllByPlaceholderText(/Jugador \d+/);
    fireEvent.changeText(nameInputs[0], 'Ana');
    fireEvent.changeText(nameInputs[1], 'Carlos');
    fireEvent.changeText(nameInputs[2], 'María');
    fireEvent.changeText(nameInputs[3], 'Juan');

    fireEvent.press(getByText('Comenzar Partida'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Dealer no seleccionado',
      'Por favor, selecciona quién será el dealer',
    );
  });

  it('navigates back when Volver is pressed', () => {
    const { getByText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(getByText('Volver'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows correct team information', () => {
    const { getByText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    expect(
      getByText('🟦 Equipo 1: Jugadores 1 y 3 (enfrentados)'),
    ).toBeTruthy();
    expect(
      getByText('🟥 Equipo 2: Jugadores 2 y 4 (enfrentados)'),
    ).toBeTruthy();
  });

  it('enforces max name length', () => {
    const { getAllByPlaceholderText } = render(
      <LocalMultiplayerScreen navigation={navigation} route={route} />,
    );

    const nameInputs = getAllByPlaceholderText(/Jugador \d+/);
    expect(nameInputs[0].props.maxLength).toBe(20);
  });
});
