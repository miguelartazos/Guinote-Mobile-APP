import React from 'react';
import { describe, expect, test, jest } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';

describe('Button', () => {
  const mockOnPress = jest.fn();
  const buttonText = 'Jugar';

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  test('renders button with text', () => {
    const { getByText } = render(
      <Button onPress={mockOnPress}>{buttonText}</Button>,
    );

    expect(getByText(buttonText)).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const { getByText } = render(
      <Button onPress={mockOnPress}>{buttonText}</Button>,
    );

    fireEvent.press(getByText(buttonText));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('applies primary variant styles by default', () => {
    const { getByTestId } = render(
      <Button onPress={mockOnPress} testID="button">
        {buttonText}
      </Button>,
    );

    const button = getByTestId('button');
    expect(button.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: colors.accent,
      }),
    );
  });

  test('applies secondary variant styles when specified', () => {
    const { getByTestId } = render(
      <Button onPress={mockOnPress} variant="secondary" testID="button">
        {buttonText}
      </Button>,
    );

    const button = getByTestId('button');
    expect(button.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: colors.secondary,
      }),
    );
  });

  test('respects minimum touch target size', () => {
    const { getByTestId } = render(
      <Button onPress={mockOnPress} testID="button">
        {buttonText}
      </Button>,
    );

    const button = getByTestId('button');
    expect(button.props.style).toEqual(
      expect.objectContaining({
        minHeight: dimensions.touchTarget.comfortable,
        minWidth: dimensions.touchTarget.comfortable,
      }),
    );
  });

  test('disables button when disabled prop is true', () => {
    const { getByText, getByTestId } = render(
      <Button onPress={mockOnPress} disabled testID="button">
        {buttonText}
      </Button>,
    );

    fireEvent.press(getByText(buttonText));
    expect(mockOnPress).not.toHaveBeenCalled();

    const button = getByTestId('button');
    expect(button.props.style).toEqual(
      expect.objectContaining({
        opacity: 0.5,
      }),
    );
  });
});
