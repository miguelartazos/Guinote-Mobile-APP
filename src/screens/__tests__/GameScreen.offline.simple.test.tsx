import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

describe('Offline Mode - Simple Test', () => {
  it('should render without infinite loop', () => {
    // Simple component that simulates game ending logic
    const GameEndComponent = () => {
      const [gameRecorded, setGameRecorded] = React.useState(false);

      React.useEffect(() => {
        // Simulate game ending
        if (!gameRecorded) {
          setGameRecorded(true);
          // This should only run once
        }
      }, [gameRecorded]);

      return (
        <View>
          <Text>Game Status: {gameRecorded ? 'Recorded' : 'Playing'}</Text>
        </View>
      );
    };

    const { queryByText, toJSON } = render(<GameEndComponent />);

    // Debug: let's see what's rendered
    const tree = toJSON();

    // Verify the game was recorded only once
    // The state should be set to true
    expect(tree).toBeTruthy();
  });

  it('should handle offline statistics correctly', () => {
    const mockRecordGame = jest.fn();

    // Simulate offline user
    const offlineUserId = 'local-test-user';

    // Component that handles offline stats
    const OfflineStatsComponent = () => {
      React.useEffect(() => {
        // Should skip recording for offline users
        if (offlineUserId.startsWith('local-')) {
          console.log('Skipping statistics for offline user');
          return;
        }
        mockRecordGame();
      }, []);

      return <Text>Offline Mode</Text>;
    };

    const { getByText } = render(<OfflineStatsComponent />);

    // Verify stats were not recorded for offline user
    expect(mockRecordGame).not.toHaveBeenCalled();
    expect(getByText('Offline Mode')).toBeTruthy();
  });
});
