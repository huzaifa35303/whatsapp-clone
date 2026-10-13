import { Server, Socket } from 'socket.io';
import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';

interface ActiveUser {
  userId: string;
  socketId: string;
}

// Map: userId -> Set of socketIds
const userSockets = new Map<string, Set<string>>();
// Map: socketId -> userId
const socketToUser = new Map<string, string>();
// Map: socketId -> currentChatId (to automatically mark as read)
const socketActiveChat = new Map<string, string>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    // 1. User Connect / Authenticate
    socket.on('auth:connect', (userId: string) => {
      if (!userId) return;

      socketToUser.set(socket.id, userId);

      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);

      // Update DB is_online
      const now = Date.now();
      db.prepare('UPDATE users SET is_online = 1, last_seen = ? WHERE id = ?').run(now, userId);

      // Broadcast user online status
      io.emit('user:status_changed', { userId, isOnline: true, lastSeen: now });

      // Check if there are messages waiting to be marked as delivered for this user
      markMessagesAsDeliveredForUser(userId, io);
    });

    // 2. Set Current Active Chat (to mark messages as read immediately)
    socket.on('chat:set_active', ({ chatId }: { chatId: string | null }) => {
      const userId = socketToUser.get(socket.id);
      if (chatId) {
        socketActiveChat.set(socket.id, chatId);
        if (userId) {
          // Mark all unread messages in this chat as read
          markChatMessagesAsRead(chatId, userId, io);
        }
      } else {
        socketActiveChat.delete(socket.id);
      }
    });

    // 3. Send Message
    socket.on('message:send', (data: {
      chatId: string;
      text?: string;
      type?: 'text' | 'image' | 'audio' | 'document' | 'video';
      mediaUrl?: string;
      mediaName?: string;
      mediaSize?: number;
      mediaDuration?: number;
      replyToId?: string;
    }) => {
      const senderId = socketToUser.get(socket.id);
      if (!senderId || !data.chatId) return;

      const messageId = uuidv4();
      const now = Date.now();
      const type = data.type || 'text';

      // Determine initial status based on recipients' online state
      const participants = getChatParticipants(data.chatId);
      const otherParticipants = participants.filter(p => p.user_id !== senderId);

      let initialStatus: 'sent' | 'delivered' | 'read' = 'sent';

      const anyRecipientOnline = otherParticipants.some(p => {
        const sockets = userSockets.get(p.user_id);
        return sockets && sockets.size > 0;
      });

      const anyRecipientInChat = otherParticipants.some(p => {
        const sockets = userSockets.get(p.user_id);
        if (!sockets) return false;
        for (const sId of sockets) {
          if (socketActiveChat.get(sId) === data.chatId) return true;
        }
        return false;
      });

      if (anyRecipientInChat) {
        initialStatus = 'read';
      } else if (anyRecipientOnline) {
        initialStatus = 'delivered';
      }

      // Insert message
      db.prepare(`
        INSERT INTO messages (id, chat_id, sender_id, text, type, media_url, media_name, media_size, media_duration, status, reply_to_id, reactions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        messageId,
        data.chatId,
        senderId,
        data.text || null,
        type,
        data.mediaUrl || null,
        data.mediaName || null,
        data.mediaSize || null,
        data.mediaDuration || null,
        initialStatus,
        data.replyToId || null,
        JSON.stringify([]),
        now
      );

      // Update chat updated_at
      db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?').run(now, data.chatId);

      const sender = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(senderId) as any;

      const fullMessage = {
        id: messageId,
        chatId: data.chatId,
        senderId,
        senderName: sender?.name,
        senderAvatar: sender?.avatar,
        text: data.text || null,
        type,
        mediaUrl: data.mediaUrl || null,
        mediaName: data.mediaName || null,
        mediaSize: data.mediaSize || null,
        mediaDuration: data.mediaDuration || null,
        status: initialStatus,
        replyToId: data.replyToId || null,
        reactions: [],
        createdAt: now
      };

      // Emit to all participants of this chat (excluding those who blocked sender)
      for (const p of participants) {
        if (p.user_id !== senderId) {
          const isBlocked = db.prepare('SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?').get(p.user_id, senderId);
          if (isBlocked) continue;
        }
        const sockets = userSockets.get(p.user_id);
        if (sockets) {
          for (const sId of sockets) {
            io.to(sId).emit('message:new', fullMessage);
          }
        }
      }
    });

    // 4. Message Reaction
    socket.on('message:react', ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const userId = socketToUser.get(socket.id);
      if (!userId) return;

      const msg = db.prepare('SELECT chat_id, reactions FROM messages WHERE id = ?').get(messageId) as any;
      if (!msg) return;

      let reactions: Array<{ userId: string; emoji: string }> = [];
      try {
        reactions = JSON.parse(msg.reactions || '[]');
      } catch {
        reactions = [];
      }

      // Toggle or replace reaction
      const existingIdx = reactions.findIndex(r => r.userId === userId);
      if (existingIdx !== -1) {
        if (reactions[existingIdx].emoji === emoji) {
          reactions.splice(existingIdx, 1);
        } else {
          reactions[existingIdx].emoji = emoji;
        }
      } else {
        reactions.push({ userId, emoji });
      }

      const reactionsStr = JSON.stringify(reactions);
      db.prepare('UPDATE messages SET reactions = ? WHERE id = ?').run(reactionsStr, messageId);

      const participants = getChatParticipants(msg.chat_id);
      for (const p of participants) {
        const sockets = userSockets.get(p.user_id);
        if (sockets) {
          for (const sId of sockets) {
            io.to(sId).emit('message:reaction_updated', {
              messageId,
              chatId: msg.chat_id,
              reactions
            });
          }
        }
      }
    });

    // 5. Typing Indicators
    socket.on('typing:start', ({ chatId }: { chatId: string }) => {
      const userId = socketToUser.get(socket.id);
      if (!userId || !chatId) return;

      const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(userId) as any;
      const participants = getChatParticipants(chatId);

      for (const p of participants) {
        if (p.user_id !== userId) {
          const sockets = userSockets.get(p.user_id);
          if (sockets) {
            for (const sId of sockets) {
              io.to(sId).emit('typing:user_started', { chatId, userId, userName: user?.name });
            }
          }
        }
      }
    });

    socket.on('typing:stop', ({ chatId }: { chatId: string }) => {
      const userId = socketToUser.get(socket.id);
      if (!userId || !chatId) return;

      const participants = getChatParticipants(chatId);
      for (const p of participants) {
        if (p.user_id !== userId) {
          const sockets = userSockets.get(p.user_id);
          if (sockets) {
            for (const sId of sockets) {
              io.to(sId).emit('typing:user_stopped', { chatId, userId });
            }
          }
        }
      }
    });

    // 6. QR Code Pairing for WhatsApp Desktop
    socket.on('qr:generate', () => {
      const token = `wa_pair_${uuidv4()}`;
      const now = Date.now();
      const expiresAt = now + 5 * 60 * 1000; // 5 mins

      db.prepare(`
        INSERT INTO qr_sessions (token, status, user_id, socket_id, created_at, expires_at)
        VALUES (?, 'pending', NULL, ?, ?, ?)
      `).run(token, socket.id, now, expiresAt);

      socket.emit('qr:code_ready', { token, expiresAt });
    });

    socket.on('qr:scan', ({ token, userId }: { token: string; userId: string }) => {
      const now = Date.now();
      const session = db.prepare('SELECT * FROM qr_sessions WHERE token = ? AND expires_at > ?').get(token, now) as any;

      if (!session) {
        socket.emit('qr:scan_result', { success: false, message: 'Invalid or expired QR code' });
        return;
      }

      db.prepare("UPDATE qr_sessions SET status = 'authenticated', user_id = ? WHERE token = ?").run(userId, token);

      const user = db.prepare('SELECT id, phone, name, about, avatar FROM users WHERE id = ?').get(userId) as any;

      // Notify the desktop client that generated this QR code!
      if (session.socket_id) {
        io.to(session.socket_id).emit('qr:authenticated', {
          token,
          user
        });
      }

      socket.emit('qr:scan_result', { success: true, message: 'Device paired successfully!' });
    });

    // 7. WebRTC Audio / Video Calling
    socket.on('call:initiate', (data: {
      chatId: string;
      receiverId: string;
      type: 'audio' | 'video';
    }) => {
      const callerId = socketToUser.get(socket.id);
      if (!callerId) return;

      // Check if receiver blocked caller
      const isBlocked = db.prepare("SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?").get(data.receiverId, callerId);
      if (isBlocked) {
        socket.emit('call:failed', { message: 'Contact is unavailable' });
        return;
      }

      const callId = uuidv4();
      const caller = db.prepare('SELECT id, name, avatar, phone, original_phone, foundr_number FROM users WHERE id = ?').get(callerId) as any;

      const now = Date.now();
      db.prepare(`
        INSERT INTO calls (id, chat_id, caller_id, receiver_id, type, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'ringing', ?)
      `).run(callId, data.chatId, callerId, data.receiverId, data.type, now);

      const receiverSockets = userSockets.get(data.receiverId);
      if (receiverSockets && receiverSockets.size > 0) {
        for (const sId of receiverSockets) {
          io.to(sId).emit('call:incoming', {
            callId,
            chatId: data.chatId,
            caller,
            type: data.type
          });
        }
      } else {
        // Receiver is offline
        socket.emit('call:failed', { message: 'User is currently unavailable' });
      }
    });

    socket.on('call:signal', (data: { targetUserId: string; signal: any; callId: string }) => {
      const fromUserId = socketToUser.get(socket.id);
      const targetSockets = userSockets.get(data.targetUserId);
      if (targetSockets) {
        for (const sId of targetSockets) {
          io.to(sId).emit('call:signal', {
            fromUserId,
            signal: data.signal,
            callId: data.callId
          });
        }
      }
    });

    socket.on('call:accept', (data: { callId: string; callerId: string }) => {
      const receiverId = socketToUser.get(socket.id);
      db.prepare('UPDATE calls SET status = "completed" WHERE id = ?').run(data.callId);

      const callerSockets = userSockets.get(data.callerId);
      if (callerSockets) {
        for (const sId of callerSockets) {
          io.to(sId).emit('call:accepted', { callId: data.callId, receiverId });
        }
      }
    });

    socket.on('call:reject', (data: { callId: string; callerId: string }) => {
      db.prepare("UPDATE calls SET status = 'declined' WHERE id = ?").run(data.callId);
      const callerSockets = userSockets.get(data.callerId);
      if (callerSockets) {
        for (const sId of callerSockets) {
          io.to(sId).emit('call:rejected', { callId: data.callId });
        }
      }
    });

    socket.on('call:end', (data: { callId: string; otherUserId: string; duration?: number }) => {
      if (data.callId) {
        db.prepare("UPDATE calls SET status = 'completed', duration = ? WHERE id = ?").run(data.duration || 0, data.callId);
      }
      const otherSockets = userSockets.get(data.otherUserId);
      if (otherSockets) {
        for (const sId of otherSockets) {
          io.to(sId).emit('call:ended', { callId: data.callId });
        }
      }
    });

    // 8. Disconnect
    socket.on('disconnect', () => {
      const userId = socketToUser.get(socket.id);
      socketToUser.delete(socket.id);
      socketActiveChat.delete(socket.id);

      if (userId && userSockets.has(userId)) {
        const sockets = userSockets.get(userId)!;
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          const now = Date.now();
          db.prepare('UPDATE users SET is_online = 0, last_seen = ? WHERE id = ?').run(now, userId);
          io.emit('user:status_changed', { userId, isOnline: false, lastSeen: now });
        }
      }
    });
  });
}

function getChatParticipants(chatId: string): Array<{ user_id: string; role: string }> {
  return db.prepare('SELECT user_id, role FROM chat_participants WHERE chat_id = ?').all(chatId) as any[];
}

function markChatMessagesAsRead(chatId: string, currentUserId: string, io: Server) {
  // Mark all unread messages from other senders as read
  db.prepare(`
    UPDATE messages 
    SET status = 'read' 
    WHERE chat_id = ? AND sender_id != ? AND status != 'read'
  `).run(chatId, currentUserId);

  // Notify participants of the update
  const participants = getChatParticipants(chatId);
  for (const p of participants) {
    const sockets = userSockets.get(p.user_id);
    if (sockets) {
      for (const sId of sockets) {
        io.to(sId).emit('chat:messages_read', { chatId, readerId: currentUserId });
      }
    }
  }
}

function markMessagesAsDeliveredForUser(userId: string, io: Server) {
  // Find all chats where user is participant
  const userChats = db.prepare('SELECT chat_id FROM chat_participants WHERE user_id = ?').all(userId) as any[];
  for (const c of userChats) {
    db.prepare(`
      UPDATE messages 
      SET status = 'delivered' 
      WHERE chat_id = ? AND sender_id != ? AND status = 'sent'
    `).run(c.chat_id, userId);

    io.emit('chat:messages_delivered', { chatId: c.chat_id });
  }
}
