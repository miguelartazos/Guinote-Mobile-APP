import { useState, useCallback } from 'react';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';
import { computeBoardLayout } from '../utils/cardPositions';
import { useDebounceValue } from './useDebounceValue';

export interface TableLayout {
  table: LayoutRectangle;
  board: LayoutRectangle;
  isReady: boolean;
}

export function useTableLayout() {
  const [rawLayout, setRawLayout] = useState<TableLayout>({
    table: { x: 0, y: 0, width: 0, height: 0 },
    board: { x: 0, y: 0, width: 0, height: 0 },
    isReady: false,
  });

  // Debounce layout changes by one frame (16ms) to prevent excessive updates
  const layout = useDebounceValue(rawLayout, 16);

  const onTableLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    // Compute a default board layout here so we can position before board onLayout fires
    const board = computeBoardLayout(width, height);
    setRawLayout(prev => ({
      ...prev,
      table: { x, y, width, height },
      board:
        prev.board.width > 0
          ? prev.board
          : { x: board.x, y: board.y, width: board.width, height: board.height },
      isReady: true,
    }));
  }, []);

  const onBoardLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setRawLayout(prev => ({
      ...prev,
      board: { x, y, width, height },
      isReady: prev.table.width > 0 && width > 0,
    }));
  }, []);

  return {
    layout,
    onTableLayout,
    onBoardLayout,
  };
}
