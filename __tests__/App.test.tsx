/**
 * @format
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../src/App';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual('react-native-screens');
  return {
    ...actualScreens,
    enableScreens: jest.fn(),
  };
});

test('renders correctly', () => {
  const { getByText } = render(<App />);
  expect(getByText('Guiñote+')).toBeTruthy();
});
