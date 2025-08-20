import React from 'react';
import { render } from '@testing-library/react-native';
import { CardBack } from './CardBack';

// Mock the card back SVG
jest.mock('../../../assets/images/cards/card_back.svg', () => 'SvgMock');

describe('CardBack', () => {
  test('renders without crashing', () => {
    expect(() => render(<CardBack width={100} height={140} />)).not.toThrow();
  });

  test('passes width prop to SVG component', () => {
    const width = 200;
    const { UNSAFE_root } = render(<CardBack width={width} height={140} />);

    const svgElement = UNSAFE_root.findByType('SvgMock' as any);
    expect(svgElement.props.width).toBe(width);
  });

  test('passes height prop to SVG component', () => {
    const height = 280;
    const { UNSAFE_root } = render(<CardBack width={100} height={height} />);

    const svgElement = UNSAFE_root.findByType('SvgMock' as any);
    expect(svgElement.props.height).toBe(height);
  });

  test('handles small card dimensions', () => {
    const width = 50;
    const height = 70;
    const { UNSAFE_root } = render(<CardBack width={width} height={height} />);

    const svgElement = UNSAFE_root.findByType('SvgMock' as any);
    expect(svgElement.props.width).toBe(width);
    expect(svgElement.props.height).toBe(height);
  });

  test('handles large card dimensions', () => {
    const width = 300;
    const height = 420;
    const { UNSAFE_root } = render(<CardBack width={width} height={height} />);

    const svgElement = UNSAFE_root.findByType('SvgMock' as any);
    expect(svgElement.props.width).toBe(width);
    expect(svgElement.props.height).toBe(height);
  });

  test('renders the same component for multiple instances', () => {
    const { UNSAFE_root: root1 } = render(<CardBack width={100} height={140} />);
    const { UNSAFE_root: root2 } = render(<CardBack width={100} height={140} />);

    const svg1 = root1.findByType('SvgMock' as any);
    const svg2 = root2.findByType('SvgMock' as any);

    expect(svg1.type).toBe(svg2.type);
  });

  test('component is memoized', () => {
    expect(CardBack.$$typeof).toBe(Symbol.for('react.memo'));
  });
});
