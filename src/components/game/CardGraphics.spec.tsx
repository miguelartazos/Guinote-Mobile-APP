import React from 'react';
import { render } from '@testing-library/react-native';
import { CardGraphics } from './CardGraphics';

// Mock all SVG imports
jest.mock('../../../assets/images/cards/oros_1.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/oros_2.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/oros_3.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/oros_4.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/oros_5.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/oros_6.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/oros_7.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/oros_10.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/oros_11.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/oros_12.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/copas_1.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/copas_2.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/copas_3.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/copas_4.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/copas_5.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/copas_6.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/copas_7.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/copas_10.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/copas_11.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/copas_12.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/espadas_1.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/espadas_2.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/espadas_3.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/espadas_4.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/espadas_5.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/espadas_6.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/espadas_7.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/espadas_10.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/espadas_11.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/espadas_12.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/bastos_1.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/bastos_2.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/bastos_3.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/bastos_4.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/bastos_5.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/bastos_6.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/bastos_7.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/bastos_10.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/bastos_11.svg', () => 'SvgMock');
jest.mock('../../../assets/images/cards/bastos_12.svg', () => 'SvgMock');

describe('CardGraphics', () => {
  const defaultProps = {
    width: 100,
    height: 140,
  };

  describe('rendering valid cards', () => {
    test('renders oros 1 card', () => {
      const { getByTestId } = render(<CardGraphics suit="oros" value={1} {...defaultProps} />);

      expect(() => getByTestId('card-svg')).not.toThrow();
    });

    test('renders copas 12 card', () => {
      const { getByTestId } = render(<CardGraphics suit="copas" value={12} {...defaultProps} />);

      expect(() => getByTestId('card-svg')).not.toThrow();
    });

    test('renders espadas 7 card', () => {
      const { getByTestId } = render(<CardGraphics suit="espadas" value={7} {...defaultProps} />);

      expect(() => getByTestId('card-svg')).not.toThrow();
    });

    test('renders bastos 10 card', () => {
      const { getByTestId } = render(<CardGraphics suit="bastos" value={10} {...defaultProps} />);

      expect(() => getByTestId('card-svg')).not.toThrow();
    });
  });

  describe('card dimensions', () => {
    test('passes width and height to card component', () => {
      const customWidth = 200;
      const customHeight = 280;

      const { UNSAFE_root } = render(
        <CardGraphics suit="oros" value={1} width={customWidth} height={customHeight} />,
      );

      const svgElement = UNSAFE_root.findByType('SvgMock' as any);
      expect(svgElement.props.width).toBe(customWidth);
      expect(svgElement.props.height).toBe(customHeight);
    });

    test('handles small card size', () => {
      const { UNSAFE_root } = render(
        <CardGraphics suit="copas" value={3} width={50} height={70} />,
      );

      const svgElement = UNSAFE_root.findByType('SvgMock' as any);
      expect(svgElement.props.width).toBe(50);
      expect(svgElement.props.height).toBe(70);
    });

    test('handles large card size', () => {
      const { UNSAFE_root } = render(
        <CardGraphics suit="espadas" value={11} width={300} height={420} />,
      );

      const svgElement = UNSAFE_root.findByType('SvgMock' as any);
      expect(svgElement.props.width).toBe(300);
      expect(svgElement.props.height).toBe(420);
    });
  });

  describe('fallback handling', () => {
    const originalWarn = console.warn;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
      console.warn = originalWarn;
    });

    test('shows fallback for invalid card value', () => {
      const { getByText } = render(
        <CardGraphics suit="oros" value={99 as any} {...defaultProps} />,
      );

      expect(getByText('O99')).toBeTruthy();
      expect(warnSpy).toHaveBeenCalledWith('Card component not found for: oros_99');
    });

    test('fallback displays suit initial and value', () => {
      const { getByText } = render(
        <CardGraphics suit="copas" value={8 as any} {...defaultProps} />,
      );

      expect(getByText('C8')).toBeTruthy();
    });

    test('fallback respects width and height props', () => {
      const { UNSAFE_root } = render(
        <CardGraphics suit="bastos" value={9 as any} width={150} height={210} />,
      );

      const svgElement = UNSAFE_root.findByType('Svg' as any);
      expect(svgElement.props.width).toBe(150);
      expect(svgElement.props.height).toBe(210);
    });
  });

  describe('all valid card combinations', () => {
    const suits = ['oros', 'copas', 'espadas', 'bastos'] as const;
    const values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const;

    suits.forEach(suit => {
      values.forEach(value => {
        test(`renders ${suit} ${value} without errors`, () => {
          expect(() =>
            render(<CardGraphics suit={suit} value={value} {...defaultProps} />),
          ).not.toThrow();
        });
      });
    });
  });
});
