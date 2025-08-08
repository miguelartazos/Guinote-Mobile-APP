import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AnimatedButton } from './AnimatedButton';
import { haptics } from '../../utils/haptics';

jest.mock('../../utils/haptics', () => ({
  haptics: {
    light: jest.fn(),
    medium: jest.fn(),
    selection: jest.fn(),
  },
}));

describe('AnimatedButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children correctly', () => {
    const { getByText } = render(
      <AnimatedButton>
        <Text>Test Button</Text>
      </AnimatedButton>,
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  test('triggers light haptic by default on press', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <AnimatedButton onPress={mockOnPress}>
        <Text>Test Button</Text>
      </AnimatedButton>,
    );

    fireEvent.press(getByText('Test Button'));

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('triggers medium haptic when specified', () => {
    const { getByText } = render(
      <AnimatedButton hapticType="medium">
        <Text>Test Button</Text>
      </AnimatedButton>,
    );

    fireEvent.press(getByText('Test Button'));

    expect(haptics.medium).toHaveBeenCalledTimes(1);
    expect(haptics.light).not.toHaveBeenCalled();
  });

  test('triggers selection haptic when specified', () => {
    const { getByText } = render(
      <AnimatedButton hapticType="selection">
        <Text>Test Button</Text>
      </AnimatedButton>,
    );

    fireEvent.press(getByText('Test Button'));

    expect(haptics.selection).toHaveBeenCalledTimes(1);
    expect(haptics.light).not.toHaveBeenCalled();
  });

  test('passes through TouchableOpacity props', () => {
    const { getByTestId } = render(
      <AnimatedButton testID="test-button" disabled>
        <Text>Test Button</Text>
      </AnimatedButton>,
    );

    const button = getByTestId('test-button');
    expect(button.props.disabled).toBe(true);
  });

  test('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByText } = render(
      <AnimatedButton style={customStyle}>
        <Text>Test Button</Text>
      </AnimatedButton>,
    );

    const animatedView = getByText('Test Button').parent;
    expect(animatedView?.props.style).toContainEqual(customStyle);
  });

  test('disables scale animation when scaleOnPress is false', () => {
    const { getByText } = render(
      <AnimatedButton scaleOnPress={false}>
        <Text>Test Button</Text>
      </AnimatedButton>,
    );

    const animatedView = getByText('Test Button').parent;
    expect(animatedView?.props.style).not.toContainEqual(
      expect.objectContaining({ transform: expect.any(Array) }),
    );
  });
});
