import { mutation, query, action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// Create voice message record mutation (must be defined first)
export const createVoiceMessage = mutation({
  args: {
    roomId: v.id('rooms'),
    senderId: v.id('users'),
    storageId: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('voiceMessages', {
      roomId: args.roomId,
      senderId: args.senderId,
      storageId: args.storageId,
      duration: args.duration,
      timestamp: Date.now(),
    });
  },
});

// Store audio file and create message record
export const uploadVoiceMessage = action({
  args: {
    roomId: v.id('rooms'),
    senderId: v.id('users'),
    audioData: v.string(), // Base64 encoded audio
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    // Convert base64 to blob
    const base64Data = args.audioData.includes(',') 
      ? args.audioData.split(',')[1] 
      : args.audioData;
    
    // Decode base64 to bytes
    const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'audio/mp4' });
    
    // Store in Convex storage
    const storageId = await ctx.storage.store(blob);
    
    // Create message record via mutation
    const messageId = await ctx.runMutation(api.voice.createVoiceMessage, {
      roomId: args.roomId,
      senderId: args.senderId,
      storageId,
      duration: args.duration,
    });
    
    return { messageId, storageId };
  },
});


// Get voice messages for a room
export const getVoiceMessages = query({
  args: {
    roomId: v.id('rooms'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('voiceMessages')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .order('desc');

    const messages = args.limit
      ? await query.take(args.limit)
      : await query.collect();

    // Get sender details
    const messagesWithSenders = await Promise.all(
      messages.map(async message => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          senderName: sender?.username || 'Unknown',
          senderAvatar: sender?.avatar || '🎮',
        };
      }),
    );

    return messagesWithSenders;
  },
});

// Get audio URL for a voice message
export const getVoiceMessageUrl = action({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const url = await ctx.storage.getUrl(args.storageId as any);
      return url;
    } catch (error) {
      console.error('Failed to get voice message URL:', error);
      return null;
    }
  },
});

// Delete old voice messages (cleanup) - run as scheduled function
export const cleanupOldVoiceMessages = action({
  args: {
    olderThanHours: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - args.olderThanHours * 60 * 60 * 1000;

    // Get old messages via query
    const oldMessages = await ctx.runQuery(api.voice.getOldVoiceMessages, {
      cutoffTime,
    });

    // Delete storage and records
    for (const message of oldMessages) {
      try {
        await ctx.storage.delete(message.storageId as any);
      } catch (error) {
        console.error('Failed to delete storage:', error);
      }
      await ctx.runMutation(api.voice.deleteVoiceMessage, {
        messageId: message._id,
      });
    }

    return { deleted: oldMessages.length };
  },
});

// Query to get old messages
export const getOldVoiceMessages = query({
  args: {
    cutoffTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('voiceMessages')
      .withIndex('by_timestamp', q => q.lt('timestamp', args.cutoffTime))
      .collect();
  },
});

// Mutation to delete a voice message
export const deleteVoiceMessage = mutation({
  args: {
    messageId: v.id('voiceMessages'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});
