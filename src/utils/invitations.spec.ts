import { Linking, Share, Platform } from 'react-native';
import {
  createRoomDeepLink,
  shareViaWhatsApp,
  shareRoomNative,
  handleDeepLink,
} from './invitations';
import { isMultiplayerEnabled } from '../config/featureFlags';

// Mock React Native modules
jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
    getInitialURL: jest.fn(),
    addEventListener: jest.fn(),
  },
  Share: {
    share: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('../config/featureFlags', () => ({
  isMultiplayerEnabled: jest.fn(() => true),
}));

describe('invitations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isMultiplayerEnabled as jest.Mock).mockReturnValue(true);
  });

  describe('createRoomDeepLink', () => {
    it('should create a deep link with the correct format', () => {
      const roomCode = 'ABC123';
      const result = createRoomDeepLink(roomCode);
      expect(result).toBe('guinote://room/ABC123');
    });

    it('should handle special characters in room code', () => {
      const roomCode = 'TEST-123';
      const result = createRoomDeepLink(roomCode);
      expect(result).toBe('guinote://room/TEST-123');
    });
  });

  describe('shareViaWhatsApp', () => {
    it('should open WhatsApp with the correct message when available', async () => {
      const roomCode = 'XYZ789';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await shareViaWhatsApp(roomCode);

      expect(Linking.canOpenURL).toHaveBeenCalledWith(
        expect.stringContaining('whatsapp://send?text='),
      );
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('whatsapp://send?text='),
      );
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(roomCode)),
      );
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('guinote://room/XYZ789')),
      );
    });

    it('should fallback to web WhatsApp when app is not available', async () => {
      const roomCode = 'ABC123';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await shareViaWhatsApp(roomCode);

      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/?text='));
    });

    it('should fallback to native share on error', async () => {
      const roomCode = 'DEF456';
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('Test error'));
      (Share.share as jest.Mock).mockResolvedValue({ action: 'sharedAction' });

      await shareViaWhatsApp(roomCode);

      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(roomCode),
          title: 'Invitación a Guiñote',
        }),
      );
    });

    it('should not share when multiplayer is disabled', async () => {
      (isMultiplayerEnabled as jest.Mock).mockReturnValue(false);
      const roomCode = 'TEST123';

      await shareViaWhatsApp(roomCode);

      expect(Linking.canOpenURL).not.toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  describe('shareRoomNative', () => {
    it('should share room code using native share on iOS', async () => {
      const roomCode = 'ROOM123';
      (Share.share as jest.Mock).mockResolvedValue({ action: 'sharedAction' });
      Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });

      await shareRoomNative(roomCode);

      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining(roomCode),
        title: 'Invitación a Guiñote',
        url: 'guinote://room/ROOM123',
      });
    });

    it('should share room code using native share on Android', async () => {
      const roomCode = 'ROOM456';
      (Share.share as jest.Mock).mockResolvedValue({ action: 'sharedAction' });
      Object.defineProperty(Platform, 'OS', { value: 'android', writable: true });

      await shareRoomNative(roomCode);

      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining(roomCode),
        title: 'Invitación a Guiñote',
      });
    });

    it('should include store URLs in the message', async () => {
      const roomCode = 'STORE789';
      (Share.share as jest.Mock).mockResolvedValue({ action: 'sharedAction' });
      Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });

      await shareRoomNative(roomCode);

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      expect(callArgs.message).toContain('apps.apple.com');
      expect(callArgs.message).toContain('play.google.com');
      expect(callArgs.title).toBe('Invitación a Guiñote');
      expect(callArgs.url).toBe('guinote://room/STORE789');
    });

    it('should handle share errors gracefully', async () => {
      const roomCode = 'ERROR123';
      (Share.share as jest.Mock).mockRejectedValue(new Error('Share failed'));

      // Should not throw when share fails
      await expect(shareRoomNative(roomCode)).resolves.not.toThrow();
    });

    it('should not share when multiplayer is disabled', async () => {
      (isMultiplayerEnabled as jest.Mock).mockReturnValue(false);
      const roomCode = 'DISABLED123';

      await shareRoomNative(roomCode);

      expect(Share.share).not.toHaveBeenCalled();
    });
  });

  describe('handleDeepLink', () => {
    it('should parse room deep link correctly', () => {
      const url = 'guinote://room/DEEP123';
      const result = handleDeepLink(url);

      expect(result).toEqual({
        screen: 'GameRoom',
        params: {
          roomCode: 'DEEP123',
          fromDeepLink: true,
        },
      });
    });

    it('should return null for non-guinote URLs', () => {
      const url = 'https://example.com/room/123';
      const result = handleDeepLink(url);

      expect(result).toBeNull();
    });

    it('should return null for invalid deep link format', () => {
      const url = 'guinote://invalid/path';
      const result = handleDeepLink(url);

      expect(result).toBeNull();
    });

    it('should return null for room link without code', () => {
      const url = 'guinote://room/';
      const result = handleDeepLink(url);

      expect(result).toBeNull();
    });

    it('should handle room codes with special characters', () => {
      const url = 'guinote://room/ABC-123_XYZ';
      const result = handleDeepLink(url);

      expect(result).toEqual({
        screen: 'GameRoom',
        params: {
          roomCode: 'ABC-123_XYZ',
          fromDeepLink: true,
        },
      });
    });
  });
});
