import React from 'react';
import { describe, expect, test, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ScreenContainer } from './ScreenContainer';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';

// Mock the useOrientationLock hook
jest.mock('../hooks/useOrientationLock', () => ({
  useOrientationLock: jest.fn(),
}));

describe('ScreenContainer', () => {
  test('renders children', () => {
    const testText = 'Test Content';
    const { getByText } = render(
      <ScreenContainer>
        <Text>{testText}</Text>
      </ScreenContainer>,
    );

    expect(getByText(testText)).toBeTruthy();
  });

  test('applies background color', () => {
    const { getByTestId } = render(
      <ScreenContainer testID="container">
        <Text>Content</Text>
      </ScreenContainer>,
    );

    const container = getByTestId('container');
    const styles = Array.isArray(container.props.style)
      ? container.props.style[0]
      : container.props.style;
    expect(styles).toEqual(
      expect.objectContaining({
        backgroundColor: colors.background,
      }),
    );
  });

  test('applies screen padding', () => {
    const { getByTestId } = render(
      <ScreenContainer testID="container">
        <Text>Content</Text>
      </ScreenContainer>,
    );

    const container = getByTestId('container');
    const styles = Array.isArray(container.props.style)
      ? container.props.style[0]
      : container.props.style;
    expect(styles).toEqual(
      expect.objectContaining({
        paddingHorizontal: dimensions.screen.paddingHorizontal,
        paddingVertical: dimensions.screen.paddingVertical,
      }),
    );
  });

  test('fills screen with flex', () => {
    const { getByTestId } = render(
      <ScreenContainer testID="container">
        <Text>Content</Text>
      </ScreenContainer>,
    );

    const container = getByTestId('container');
    const styles = Array.isArray(container.props.style)
      ? container.props.style[0]
      : container.props.style;
    expect(styles).toEqual(
      expect.objectContaining({
        flex: 1,
      }),
    );
  });

  test('calls useOrientationLock with default landscape orientation', () => {
    const { useOrientationLock } = require('../hooks/useOrientationLock');

    render(
      <ScreenContainer>
        <Text>Content</Text>
      </ScreenContainer>,
    );

    expect(useOrientationLock).toHaveBeenCalledWith('landscape');
  });

  test('calls useOrientationLock with specified orientation', () => {
    const { useOrientationLock } = require('../hooks/useOrientationLock');

    render(
      <ScreenContainer orientation="landscape">
        <Text>Content</Text>
      </ScreenContainer>,
    );

    expect(useOrientationLock).toHaveBeenCalledWith('landscape');
  });
});
