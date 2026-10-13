import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { initDB, db } from './db.js';
import { setupSocketHandlers } from './socket.js';
import { sendVerificationEmail, generateOtpCode, verifyStoredOtp, storeOtp } from './email.js';
import 'dotenv/config';

initDB();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Setup Socket.IO
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocketHandlers(io);

// Phone number normalizer and variants for Pakistani and international formats
function normalizePhone(p: string): string {
  if (!p) return '';
  return p.replace(/[\s\-\(\)\+]/g, '');
}

function getPhoneVariants(p: string): string[] {
  if (!p) return [];
  const clean = p.replace(/[\s\-\(\)\+]/g, '');
  const variants = new Set<string>([clean, p]);
  if (clean.startsWith('923')) {
    variants.add('0' + clean.slice(2));
    variants.add('+92' + clean.slice(2));
  } else if (clean.startsWith('03')) {
    variants.add('92' + clean.slice(1));
    variants.add('+92' + clean.slice(1));
  }
  return Array.from(variants);
}

// F0UNDR Number validation: starts with 'f', followed by exactly 7 alphanumeric characters (e.g. f1234567, f0000000)
function isValidFoundrNumber(f: string): boolean {
  if (!f) return false;
  return /^f[a-z0-9]{7}$/i.test(f.trim());
}

// REST API Routes

// 1. Get all contacts/users
app.get('/api/users', (_req, res) => {
  const users = db.prepare(`
    SELECT id, phone, original_phone, email, foundr_number, custom_phone, name, about, avatar, chat_pin, is_online, last_seen, created_at 
    FROM users
  `).all();
  res.json(users);
});

// 2. Get specific user
app.get('/api/users/:id', (req, res) => {
  const user = db.prepare(`
    SELECT id, phone, original_phone, email, foundr_number, custom_phone, name, about, avatar, chat_pin, is_online, last_seen, created_at 
    FROM users WHERE id = ?
  `).get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// 3. Update user profile / settings
app.put('/api/users/:id', (req, res) => {
  const { name, about, avatar, customPhone, chatPin } = req.body;
  db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        about = COALESCE(?, about),
        avatar = COALESCE(?, avatar),
        custom_phone = COALESCE(?, custom_phone),
        phone = COALESCE(?, phone),
        chat_pin = COALESCE(?, chat_pin)
    WHERE id = ?
  `).run(name, about, avatar, customPhone, customPhone, chatPin, req.params.id);

  const updated = db.prepare(`
    SELECT id, phone, original_phone, email, foundr_number, custom_phone, name, about, avatar, chat_pin, is_online, last_seen 
    FROM users WHERE id = ?
  `).get(req.params.id);
  
  io.emit('user:profile_updated', updated);
  res.json(updated);
});

// 4. Verify Phone Number (WhatsApp Sign Flow: checks if registered, sends OTP)
app.post('/api/auth/verify-phone', (req, res) => {
  const { phone } = req.body;
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const clean = phone.trim();
  const variants = getPhoneVariants(clean);
  const placeholders = variants.map(() => '?').join(',');

  const existingUser = db.prepare(`
    SELECT id, phone, original_phone, email, foundr_number, custom_phone, name, about, avatar, chat_pin, is_online, last_seen, created_at 
    FROM users 
    WHERE original_phone IN (${placeholders}) OR phone IN (${placeholders})
  `).get(...variants, ...variants) as any;

  // Generate 6-digit OTP code & store it
  const otp = generateOtpCode();
  storeOtp(clean, 'phone', otp);

  if (existingUser) {
    res.json({
      exists: true,
      user: existingUser,
      simulatedOtp: otp,
      message: 'Account verified. Enter the 6-digit code to log in.'
    });
  } else {
    res.json({
      exists: false,
      phone: clean,
      simulatedOtp: otp,
      message: 'Phone number verified. Proceed to create your profile and F0UNDR ID.'
    });
  }
});

// 4b. Verify Email Address (sends real email via SMTP or simulated if not configured)
app.post('/api/auth/verify-email', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@example.com)' });
  }

  const existingUser = db.prepare(`
    SELECT id, phone, original_phone, email, foundr_number, custom_phone, name, about, avatar, chat_pin, is_online, last_seen, created_at 
    FROM users 
    WHERE LOWER(COALESCE(email, '')) = ?
  `).get(cleanEmail) as any;

  const otp = generateOtpCode();
  const emailResult = await sendVerificationEmail(cleanEmail, otp, existingUser?.name);

  res.json({
    exists: !!existingUser,
    user: existingUser || undefined,
    simulatedOtp: emailResult.simulated ? otp : undefined,
    sent: !emailResult.simulated,
    message: emailResult.message
  });
});

// 4c. Verify OTP Code (supports both phone and email)
app.post('/api/auth/verify-otp', (req, res) => {
  const { identifier, code } = req.body;
  if (!identifier || !code) {
    return res.status(400).json({ error: 'Identifier and 6-digit verification code are required' });
  }

  const result = verifyStoredOtp(identifier, code);
  if (!result.valid) {
    return res.status(400).json({ error: result.message || 'Invalid verification code' });
  }

  res.json({ success: true, message: 'Code verified successfully.' });
});

// 5. Login Existing User (Supports phone number or email)
app.post('/api/auth/login', (req, res) => {
  const { identifier, phone, email, code } = req.body;
  const target = (identifier || phone || email || '').trim();
  if (!target) {
    return res.status(400).json({ error: 'Phone number or email is required' });
  }

  // Validate OTP code if provided (or allow master 123456)
  if (code && code.trim()) {
    const otpRes = verifyStoredOtp(target, code);
    if (!otpRes.valid) {
      return res.status(400).json({ error: otpRes.message || 'Invalid verification code' });
    }
  }

  const targetLower = target.toLowerCase();
  const variants = getPhoneVariants(target);
  const placeholders = variants.map(() => '?').join(',');

  const user = db.prepare(`
    SELECT id, phone, original_phone, email, foundr_number, custom_phone, name, about, avatar, chat_pin, is_online, last_seen, created_at 
    FROM users 
    WHERE LOWER(COALESCE(email, '')) = ? 
       OR original_phone IN (${placeholders}) 
       OR phone IN (${placeholders})
  `).get(targetLower, ...variants, ...variants) as any;

  if (!user) {
    return res.status(404).json({ error: 'No account registered with this phone number or email. Please sign up first.' });
  }

  const now = Date.now();
  db.prepare('UPDATE users SET is_online = 1, last_seen = ? WHERE id = ?').run(now, user.id);
  user.is_online = 1;
  user.last_seen = now;
  io.emit('user:status_changed', { userId: user.id, isOnline: true, lastSeen: now });

  res.json({ success: true, user });
});

// 6. Register New Account (Strictly enforces: 1 account per phone, 1 account per email, F0UNDR ID syntax 'f' + 7 chars)
app.post('/api/auth/register', (req, res) => {
  const { originalPhone, email, name, customPhone, foundrNumber, avatar, about, code } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const cleanPhone = originalPhone?.trim() || '';
  const cleanEmail = email?.trim().toLowerCase() || '';

  if (!cleanPhone && !cleanEmail) {
    return res.status(400).json({ error: 'Either a phone number or an email address is required to register' });
  }

  // Validate OTP code if provided
  if (code && code.trim()) {
    const target = cleanEmail || cleanPhone;
    const otpRes = verifyStoredOtp(target, code);
    if (!otpRes.valid) {
      return res.status(400).json({ error: otpRes.message || 'Invalid verification code' });
    }
  }

  // Enforce F0UNDR Number Format: 'f' is necessary at start, followed by 7 letters/digits
  const trimmedFoundr = (foundrNumber || '').trim();
  if (!isValidFoundrNumber(trimmedFoundr)) {
    return res.status(400).json({
      error: "Invalid F0UNDR number. It must start with 'f' followed by exactly 7 characters (e.g. f1234567, f0000000)."
    });
  }

  const normalizedFoundr = trimmedFoundr.toLowerCase();

  // Enforce 1 Account Per Original Phone Number (if phone provided)
  if (cleanPhone) {
    const variants = getPhoneVariants(cleanPhone);
    const placeholders = variants.map(() => '?').join(',');

    const existingPhone = db.prepare(`
      SELECT id, name, original_phone FROM users 
      WHERE original_phone IN (${placeholders}) OR phone IN (${placeholders})
    `).get(...variants, ...variants) as any;

    if (existingPhone) {
      return res.status(400).json({
        error: `An account already exists for phone number ${cleanPhone}. Only 1 WhatsApp account is permitted per real phone number. Please log in instead.`
      });
    }
  }

  // Enforce 1 Account Per Email Address (if email provided)
  if (cleanEmail) {
    const existingEmail = db.prepare(`
      SELECT id, name, email FROM users 
      WHERE LOWER(COALESCE(email, '')) = ?
    `).get(cleanEmail) as any;

    if (existingEmail) {
      return res.status(400).json({
        error: `An account already exists for email ${cleanEmail}. Only 1 WhatsApp account is permitted per email address. Please log in instead.`
      });
    }
  }

  // Ensure F0UNDR number is unique
  const existingFoundr = db.prepare(`
    SELECT id FROM users WHERE LOWER(foundr_number) = ?
  `).get(normalizedFoundr) as any;

  if (existingFoundr) {
    return res.status(400).json({
      error: `F0UNDR number '${trimmedFoundr}' is already taken. Please choose another one.`
    });
  }

  const finalPhone = customPhone?.trim() || cleanPhone || (cleanEmail ? `mail:${cleanEmail}` : '');
  const id = `user-${uuidv4().substring(0, 8)}`;
  const now = Date.now();
  const finalAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`;
  const finalAbout = about?.trim() || 'Hey there! I am using WhatsApp.';

  db.prepare(`
    INSERT INTO users (id, phone, original_phone, email, foundr_number, custom_phone, name, about, avatar, chat_pin, is_online, last_seen, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '1234', 1, ?, ?)
  `).run(id, finalPhone, cleanPhone || null, cleanEmail || null, normalizedFoundr, finalPhone, name.trim(), finalAbout, finalAvatar, now, now);

  const newUser = db.prepare(`
    SELECT id, phone, original_phone, email, foundr_number, custom_phone, name, about, avatar, chat_pin, is_online, last_seen, created_at 
    FROM users WHERE id = ?
  `).get(id);

  io.emit('user:registered', newUser);
  res.status(201).json({ success: true, user: newUser });
});

// 7. Add Contact (Lookup via Original Phone, Email, Custom Phone, OR F0UNDR Number)
app.post('/api/contacts/add', (req, res) => {
  const { userId, query, nickname } = req.body;
  if (!userId || !query) {
    return res.status(400).json({ error: 'userId and query (phone, email, or F0UNDR number) are required' });
  }

  const cleanQuery = query.trim();
  const cleanLower = cleanQuery.toLowerCase();
  const variants = getPhoneVariants(cleanQuery);
  const placeholders = variants.map(() => '?').join(',');

  // Search by case-insensitive foundr_number, email, OR phone variants
  const targetUser = db.prepare(`
    SELECT id, name, phone, original_phone, email, foundr_number, avatar, about, is_online, last_seen
    FROM users
    WHERE LOWER(foundr_number) = ? 
       OR LOWER(COALESCE(email, '')) = ?
       OR original_phone IN (${placeholders}) 
       OR phone IN (${placeholders}) 
       OR custom_phone IN (${placeholders})
  `).get(cleanLower, cleanLower, ...variants, ...variants, ...variants) as any;

  if (!targetUser) {
    return res.status(404).json({
      error: `No WhatsApp user found with "${cleanQuery}". You can add users via their phone number (e.g. 03446789261), email address, or F0UNDR ID (e.g. f3446789 or f0000000).`
    });
  }

  if (targetUser.id === userId) {
    return res.status(400).json({ error: 'You cannot add yourself as a contact' });
  }

  const now = Date.now();

  // Save to contacts table
  try {
    db.prepare(`
      INSERT OR REPLACE INTO contacts (user_id, contact_user_id, nickname, created_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, targetUser.id, nickname || targetUser.name, now);
  } catch {}

  // Automatically ensure a direct chat exists between both users
  let chat = db.prepare(`
    SELECT c.id
    FROM chats c
    JOIN chat_participants cp1 ON cp1.chat_id = c.id AND cp1.user_id = ?
    JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id = ?
    WHERE c.type = 'direct'
  `).get(userId, targetUser.id) as any;

  if (!chat) {
    const chatId = `chat-${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO chats (id, type, name, avatar, created_at, updated_at)
      VALUES (?, 'direct', NULL, NULL, ?, ?)
    `).run(chatId, now, now);

    db.prepare("INSERT INTO chat_participants (chat_id, user_id, role, is_archived, is_locked, joined_at) VALUES (?, ?, 'member', 0, 0, ?)").run(chatId, userId, now);
    db.prepare("INSERT INTO chat_participants (chat_id, user_id, role, is_archived, is_locked, joined_at) VALUES (?, ?, 'member', 0, 0, ?)").run(chatId, targetUser.id, now);

    chat = { id: chatId };
  }

  res.json({
    success: true,
    contact: targetUser,
    chatId: chat.id
  });
});

// 6. Get user chats (including is_archived and is_locked flags)
app.get('/api/chats', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const query = `
    SELECT 
      c.id, c.type, c.name, c.avatar, c.created_at, c.updated_at,
      COALESCE(cp.is_archived, 0) as is_archived,
      COALESCE(cp.is_locked, 0) as is_locked,
      (
        SELECT json_group_array(
          json_object('id', u.id, 'name', u.name, 'phone', u.phone, 'original_phone', u.original_phone, 'foundr_number', u.foundr_number, 'avatar', u.avatar, 'is_online', u.is_online, 'last_seen', u.last_seen, 'role', cp2.role)
        )
        FROM chat_participants cp2
        JOIN users u ON u.id = cp2.user_id
        WHERE cp2.chat_id = c.id
      ) as participants_json,
      (
        SELECT json_object('id', m.id, 'sender_id', m.sender_id, 'text', m.text, 'type', m.type, 'status', m.status, 'created_at', m.created_at)
        FROM messages m
        WHERE m.chat_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) as last_message_json,
      (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.chat_id = c.id AND m.sender_id != ? AND m.status != 'read'
      ) as unread_count
    FROM chats c
    JOIN chat_participants cp ON cp.chat_id = c.id AND cp.user_id = ?
    ORDER BY c.updated_at DESC
  `;

  const rows = db.prepare(query).all(userId, userId) as any[];

  const chats = rows.map(r => ({
    id: r.id,
    type: r.type,
    name: r.name,
    avatar: r.avatar,
    isArchived: Boolean(r.is_archived),
    isLocked: Boolean(r.is_locked),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    unreadCount: r.unread_count,
    participants: JSON.parse(r.participants_json || '[]'),
    lastMessage: r.last_message_json ? JSON.parse(r.last_message_json) : null
  }));

  res.json(chats);
});

// 7. Clear chat messages
app.post('/api/chats/:id/clear', (req, res) => {
  const chatId = req.params.id;
  db.prepare('DELETE FROM messages WHERE chat_id = ?').run(chatId);
  const now = Date.now();
  db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?').run(now, chatId);

  io.emit('chat:cleared', { chatId });
  res.json({ success: true, message: 'Chat cleared successfully' });
});

// 8. Toggle Archive chat
app.post('/api/chats/:id/archive', (req, res) => {
  const chatId = req.params.id;
  const { userId, archive } = req.body;
  const val = archive ? 1 : 0;

  db.prepare('UPDATE chat_participants SET is_archived = ? WHERE chat_id = ? AND user_id = ?').run(val, chatId, userId);
  res.json({ success: true, isArchived: Boolean(val) });
});

// 9. Toggle Lock chat (protect with PIN)
app.post('/api/chats/:id/lock', (req, res) => {
  const chatId = req.params.id;
  const { userId, lock, pin } = req.body;

  // Verify PIN if unlocking or locking
  const user = db.prepare('SELECT chat_pin FROM users WHERE id = ?').get(userId) as any;
  if (pin && user?.chat_pin && user.chat_pin !== pin) {
    return res.status(403).json({ error: 'Incorrect PIN passcode' });
  }

  const val = lock ? 1 : 0;
  db.prepare('UPDATE chat_participants SET is_locked = ? WHERE chat_id = ? AND user_id = ?').run(val, chatId, userId);
  res.json({ success: true, isLocked: Boolean(val) });
});

// 10. Block or Unblock a contact
app.post('/api/users/block', (req, res) => {
  const { blockerId, blockedId } = req.body;
  if (!blockerId || !blockedId) {
    return res.status(400).json({ error: 'blockerId and blockedId are required' });
  }

  const existing = db.prepare('SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?').get(blockerId, blockedId);
  let isBlocked = false;

  if (existing) {
    db.prepare('DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?').run(blockerId, blockedId);
    isBlocked = false;
  } else {
    db.prepare('INSERT INTO blocked_users (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)').run(blockerId, blockedId, Date.now());
    isBlocked = true;
  }

  io.emit('user:block_updated', { blockerId, blockedId, isBlocked });
  res.json({ success: true, isBlocked });
});

// 11. Get blocked list
app.get('/api/users/:id/blocked', (req, res) => {
  const rows = db.prepare('SELECT blocked_id FROM blocked_users WHERE blocker_id = ?').all(req.params.id) as any[];
  res.json(rows.map(r => r.blocked_id));
});

// 12. Create a new chat (direct or group)
app.post('/api/chats', (req, res) => {
  const { type, name, avatar, participantIds, creatorId } = req.body;
  if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
    return res.status(400).json({ error: 'participantIds array is required' });
  }

  const allParticipantIds = Array.from(new Set([...participantIds, creatorId]));

  if (type === 'direct' && allParticipantIds.length === 2) {
    const existingChat = db.prepare(`
      SELECT c.id
      FROM chats c
      JOIN chat_participants cp1 ON cp1.chat_id = c.id AND cp1.user_id = ?
      JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id = ?
      WHERE c.type = 'direct'
    `).get(allParticipantIds[0], allParticipantIds[1]) as any;

    if (existingChat) {
      return res.json({ id: existingChat.id, isExisting: true });
    }
  }

  const chatId = `chat-${uuidv4().substring(0, 8)}`;
  const now = Date.now();

  db.prepare(`
    INSERT INTO chats (id, type, name, avatar, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(chatId, type, name || null, avatar || null, now, now);

  const insertParticipant = db.prepare(`
    INSERT INTO chat_participants (chat_id, user_id, role, is_archived, is_locked, joined_at)
    VALUES (?, ?, ?, 0, 0, ?)
  `);

  for (const pId of allParticipantIds) {
    const role = (pId === creatorId && type === 'group') ? 'admin' : 'member';
    insertParticipant.run(chatId, pId, role, now);
  }

  res.json({ id: chatId, isNew: true });
});

// 13. Get chat messages
app.get('/api/chats/:id/messages', (req, res) => {
  const chatId = req.params.id;
  const messages = db.prepare(`
    SELECT 
      m.id, m.chat_id as chatId, m.sender_id as senderId, 
      u.name as senderName, u.avatar as senderAvatar,
      m.text, m.type, m.media_url as mediaUrl, m.media_name as mediaName,
      m.media_size as mediaSize, m.media_duration as mediaDuration,
      m.status, m.reply_to_id as replyToId, m.reactions, m.created_at as createdAt
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE m.chat_id = ?
    ORDER BY m.created_at ASC
  `).all(chatId) as any[];

  const parsed = messages.map(m => ({
    ...m,
    reactions: JSON.parse(m.reactions || '[]')
  }));

  res.json(parsed);
});

// 14. Media File Upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// 15. Call history
app.get('/api/calls', (req, res) => {
  const userId = req.query.userId as string;
  const calls = db.prepare(`
    SELECT 
      c.id, c.chat_id as chatId, c.caller_id as callerId, c.receiver_id as receiverId,
      c.type, c.status, c.duration, c.created_at as createdAt,
      u1.name as callerName, u1.avatar as callerAvatar,
      u2.name as receiverName, u2.avatar as receiverAvatar
    FROM calls c
    JOIN users u1 ON u1.id = c.caller_id
    JOIN users u2 ON u2.id = c.receiver_id
    WHERE c.caller_id = ? OR c.receiver_id = ?
    ORDER BY c.created_at DESC
    LIMIT 30
  `).all(userId, userId);

  res.json(calls);
});

// 16. Serve Frontend Static Build in Production
const clientDistPath = path.resolve('../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`WhatsApp Clone Server running on http://localhost:${PORT}`);
});
