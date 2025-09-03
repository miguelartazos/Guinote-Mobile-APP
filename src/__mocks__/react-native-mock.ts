import React from 'react';

// Mock FlatList to render its content
export const mockFlatList = ({ data, renderItem, ListEmptyComponent }: any) => {
  if (!data || data.length === 0) {
    return ListEmptyComponent
      ? React.createElement(React.Fragment, null, ListEmptyComponent())
      : null;
  }
  return React.createElement(
    React.Fragment,
    null,
    data.map((item: any, index: number) =>
      React.createElement(React.Fragment, { key: item.id || index }, renderItem({ item, index })),
    ),
  );
};

// Mock NativeDeviceInfo for StyleSheet
export const mockNativeDeviceInfo = {
  getConstants: () => ({
    Dimensions: {
      window: {
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      },
      screen: {
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      },
    },
  }),
};
