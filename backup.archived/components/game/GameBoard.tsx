import React from 'react';
import { View, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getResponsiveFontSize } from '../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameBoardProps {
  children: React.ReactNode;
}

export const GameBoard: React.FC<GameBoardProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#1B5E20', '#0D3A19']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.6, 1]}
      >
        <View style={styles.tableContainer}>
          {/* Subtle felt texture overlay */}
          <View style={styles.feltOverlay} />

          {/* Center radial gradient for depth */}
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'transparent']}
            style={styles.centerGlow}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />

          {children}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E20',
  },
  gradient: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    position: 'relative',
  },
  feltOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    opacity: 0.3,
  },
  centerGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    top: (SCREEN_HEIGHT - SCREEN_WIDTH * 0.8) / 2,
    left: SCREEN_WIDTH * 0.1,
    opacity: 0.3,
  },
});

export default GameBoard;
