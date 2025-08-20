import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Clipboard } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

export function CreateRoomScreen({ navigation }: JugarStackScreenProps<'CreateRoom'>) {
  const [roomCode] = useState('A7X9M2'); // Mock room code
  const [playersJoined] = useState(1); // Mock player count

  const copyRoomCode = () => {
    Clipboard.setString(roomCode);
    Alert.alert('Código copiado', 'El código de la sala se ha copiado al portapapeles');
  };

  const shareWhatsApp = () => {
    const message = `¡Únete a mi partida de Guiñote+!\n\nCódigo de sala: ${roomCode}\n\n¡Te espero para jugar!`;
    // In real app, would use Linking.openURL with WhatsApp deep link
    Alert.alert('Compartir por WhatsApp', `Mensaje a enviar:\n\n${message}`, [{ text: 'OK' }]);
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Sala Privada</Text>
          <Text style={styles.subtitle}>Invita a tus amigos a jugar</Text>
        </View>

        <View style={styles.content}>
          {/* Room Code Display */}
          <View style={styles.roomCodeContainer}>
            <Text style={styles.roomCodeLabel}>Código de la sala</Text>
            <View style={styles.roomCodeDisplay}>
              <Text style={styles.roomCode}>{roomCode}</Text>
            </View>
            <Text style={styles.roomCodeHint}>Comparte este código con tus amigos</Text>
          </View>

          {/* Share Buttons */}
          <View style={styles.shareContainer}>
            <Button onPress={copyRoomCode} style={styles.shareButton}>
              📋 Copiar Código
            </Button>
            <Button variant="secondary" onPress={shareWhatsApp} style={styles.shareButton}>
              📱 Compartir WhatsApp
            </Button>
          </View>

          {/* Players List */}
          <View style={styles.playersContainer}>
            <Text style={styles.playersTitle}>Jugadores ({playersJoined}/4)</Text>
            <View style={styles.playersList}>
              <View style={styles.playerItem}>
                <Text style={styles.playerIcon}>👑</Text>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>Tú (Anfitrión)</Text>
                  <Text style={styles.playerStatus}>Listo</Text>
                </View>
              </View>

              <View style={[styles.playerItem, styles.emptyPlayer]}>
                <Text style={styles.playerIcon}>⏳</Text>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>Esperando jugador...</Text>
                  <Text style={styles.playerStatus}>—</Text>
                </View>
              </View>

              <View style={[styles.playerItem, styles.emptyPlayer]}>
                <Text style={styles.playerIcon}>⏳</Text>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>Esperando jugador...</Text>
                  <Text style={styles.playerStatus}>—</Text>
                </View>
              </View>

              <View style={[styles.playerItem, styles.emptyPlayer]}>
                <Text style={styles.playerIcon}>⏳</Text>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>Esperando jugador...</Text>
                  <Text style={styles.playerStatus}>—</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Game Settings */}
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>Configuración</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Modo de juego:</Text>
              <Text style={styles.settingValue}>4 jugadores (por parejas)</Text>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Puntos para ganar:</Text>
              <Text style={styles.settingValue}>101 puntos</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={() =>
              navigation.navigate('Game', {
                gameMode: 'private',
              })
            }
            disabled={playersJoined < 4}
            style={styles.startButton}
          >
            {playersJoined >= 4 ? 'Comenzar Partida' : `Faltan ${4 - playersJoined} jugadores`}
          </Button>

          <Button variant="secondary" onPress={() => navigation.goBack()} style={styles.button}>
            Cerrar Sala
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: dimensions.spacing.xl,
  },
  roomCodeContainer: {
    alignItems: 'center',
    marginBottom: dimensions.spacing.xl,
  },
  roomCodeLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.md,
  },
  roomCodeDisplay: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    paddingHorizontal: dimensions.spacing.xxl,
    paddingVertical: dimensions.spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
    marginBottom: dimensions.spacing.sm,
  },
  roomCode: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    letterSpacing: 4,
    textAlign: 'center',
  },
  roomCodeHint: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  shareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: dimensions.spacing.xl,
  },
  shareButton: {
    flex: 1,
    marginHorizontal: dimensions.spacing.sm,
    minHeight: dimensions.touchTarget.large,
  },
  playersContainer: {
    marginBottom: dimensions.spacing.lg,
  },
  playersTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.md,
  },
  playersList: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  emptyPlayer: {
    opacity: 0.6,
  },
  playerIcon: {
    fontSize: typography.fontSize.xl,
    marginRight: dimensions.spacing.md,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    marginBottom: dimensions.spacing.xs,
  },
  playerStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
  },
  settingsContainer: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  settingsTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  settingLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  settingValue: {
    fontSize: typography.fontSize.md,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  buttonContainer: {
    marginBottom: dimensions.spacing.xxl,
  },
  startButton: {
    minHeight: dimensions.touchTarget.large,
  },
  button: {
    marginTop: dimensions.spacing.md,
  },
});
