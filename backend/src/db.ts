import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'whatsapp.db');
export const db = new DatabaseSync(dbPath);

// Initialize Tables and Auto-migrate
export function initDB() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      original_phone TEXT UNIQUE,
      email TEXT UNIQUE,
      foundr_number TEXT UNIQUE,
      custom_phone TEXT,
      name TEXT NOT NULL,
      about TEXT DEFAULT 'Hey there! I am using WhatsApp.',
      avatar TEXT,
      chat_pin TEXT DEFAULT '1234',
      is_online INTEGER DEFAULT 0,
      last_seen INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT,
      avatar TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_participants (
      chat_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      is_archived INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (chat_id, user_id),
      FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      text TEXT,
      type TEXT DEFAULT 'text',
      media_url TEXT,
      media_name TEXT,
      media_size INTEGER,
      media_duration REAL,
      status TEXT DEFAULT 'sent',
      reply_to_id TEXT,
      reactions TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS qr_sessions (
      token TEXT PRIMARY KEY,
      status TEXT DEFAULT 'pending',
      user_id TEXT,
      socket_id TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      chat_id TEXT,
      caller_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocked_users (
      blocker_id TEXT NOT NULL,
      blocked_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (blocker_id, blocked_id),
      FOREIGN KEY (blocker_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (blocked_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contacts (
      user_id TEXT NOT NULL,
      contact_user_id TEXT NOT NULL,
      nickname TEXT,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, contact_user_id),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (contact_user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  // Column Migrations if upgrading an existing db
  try {
    db.exec(`ALTER TABLE users ADD COLUMN original_phone TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN email TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN foundr_number TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN custom_phone TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN chat_pin TEXT DEFAULT '1234';`);
  } catch {}
  try {
    db.exec(`ALTER TABLE chat_participants ADD COLUMN is_archived INTEGER DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE chat_participants ADD COLUMN is_locked INTEGER DEFAULT 0;`);
  } catch {}

  seedInitialData();
}

function seedInitialData() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  
  // If users exist but missing original_phone, update them
  if (userCount > 0) {
    db.prepare(`
      UPDATE users 
      SET original_phone = COALESCE(original_phone, '03446789261'),
          foundr_number = 'f3446789',
          custom_phone = COALESCE(custom_phone, '03446789261'),
          chat_pin = COALESCE(chat_pin, '1234')
      WHERE id = 'user-me'
    `).run();

    db.prepare(`
      UPDATE users 
      SET original_phone = COALESCE(original_phone, '03001234567'),
          foundr_number = 'f3001234',
          custom_phone = COALESCE(custom_phone, '+92 300 1234567')
      WHERE id = 'user-sarah'
    `).run();

    db.prepare(`
      UPDATE users 
      SET original_phone = COALESCE(original_phone, '03123456789'),
          foundr_number = 'f3123456',
          custom_phone = COALESCE(custom_phone, '+92 312 3456789')
      WHERE id = 'user-david'
    `).run();

    db.prepare(`
      UPDATE users 
      SET original_phone = COALESCE(original_phone, '03339876543'),
          foundr_number = 'f3339876',
          custom_phone = COALESCE(custom_phone, '+92 333 9876543')
      WHERE id = 'user-emma'
    `).run();

    db.prepare(`
      UPDATE users 
      SET original_phone = COALESCE(original_phone, '03451122334'),
          foundr_number = 'f3451122',
          custom_phone = COALESCE(custom_phone, '+92 345 1122334')
      WHERE id = 'user-alex'
    `).run();

    return;
  }

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const hourAgo = now - 60 * 60 * 1000;
  const minsAgo10 = now - 10 * 60 * 1000;

  // Insert Default Users with Original Phone and F0undr numbers (f + 7 digits)
  const users = [
    {
      id: 'user-me',
      phone: '03446789261',
      original_phone: '03446789261',
      foundr_number: 'f3446789',
      custom_phone: '03446789261',
      name: 'You (Owner)',
      about: 'Using WhatsApp with F0UNDR ID 🚀',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      chat_pin: '1234',
      is_online: 1,
      last_seen: now,
      created_at: dayAgo
    },
    {
      id: 'user-sarah',
      phone: '+92 300 1234567',
      original_phone: '03001234567',
      foundr_number: 'f3001234',
      custom_phone: '+92 300 1234567',
      name: 'Sarah Jenkins',
      about: 'Coffee first, code later ☕✨',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      chat_pin: '1234',
      is_online: 1,
      last_seen: now,
      created_at: dayAgo
    },
    {
      id: 'user-david',
      phone: '+92 312 3456789',
      original_phone: '03123456789',
      foundr_number: 'f3123456',
      custom_phone: '+92 312 3456789',
      name: 'David Chen',
      about: 'Building full-stack apps & mobile interfaces',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      chat_pin: '1234',
      is_online: 0,
      last_seen: hourAgo,
      created_at: dayAgo
    },
    {
      id: 'user-emma',
      phone: '+92 333 9876543',
      original_phone: '03339876543',
      foundr_number: 'f3339876',
      custom_phone: '+92 333 9876543',
      name: 'Emma Watson',
      about: 'At work | Urgent calls only',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      chat_pin: '1234',
      is_online: 1,
      last_seen: now,
      created_at: dayAgo
    },
    {
      id: 'user-alex',
      phone: '+92 345 1122334',
      original_phone: '03451122334',
      foundr_number: 'f3451122',
      custom_phone: '+92 345 1122334',
      name: 'Alex Rivera',
      about: 'Exploring the mountains 🏔️',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      chat_pin: '1234',
      is_online: 0,
      last_seen: dayAgo + 2 * 60 * 60 * 1000,
      created_at: dayAgo
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, original_phone, foundr_number, custom_phone, name, about, avatar, chat_pin, is_online, last_seen, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    insertUser.run(u.id, u.phone, u.original_phone, u.foundr_number, u.custom_phone, u.name, u.about, u.avatar, u.chat_pin, u.is_online, u.last_seen, u.created_at);
  }

  // Insert Direct & Group Chats
  const chats = [
    {
      id: 'chat-sarah',
      type: 'direct',
      name: null,
      avatar: null,
      created_at: dayAgo,
      updated_at: minsAgo10
    },
    {
      id: 'chat-david',
      type: 'direct',
      name: null,
      avatar: null,
      created_at: dayAgo,
      updated_at: hourAgo
    },
    {
      id: 'chat-team',
      type: 'group',
      name: 'Tech & Engineering Core',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      created_at: dayAgo,
      updated_at: now - 3 * 60 * 1000
    }
  ];

  const insertChat = db.prepare(`
    INSERT INTO chats (id, type, name, avatar, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const c of chats) {
    insertChat.run(c.id, c.type, c.name, c.avatar, c.created_at, c.updated_at);
  }

  // Participants
  const insertPart = db.prepare(`
    INSERT INTO chat_participants (chat_id, user_id, role, is_archived, is_locked, joined_at)
    VALUES (?, ?, ?, 0, 0, ?)
  `);

  insertPart.run('chat-sarah', 'user-me', 'member', dayAgo);
  insertPart.run('chat-sarah', 'user-sarah', 'member', dayAgo);

  insertPart.run('chat-david', 'user-me', 'member', dayAgo);
  insertPart.run('chat-david', 'user-david', 'member', dayAgo);

  insertPart.run('chat-team', 'user-me', 'admin', dayAgo);
  insertPart.run('chat-team', 'user-sarah', 'member', dayAgo);
  insertPart.run('chat-team', 'user-david', 'member', dayAgo);
  insertPart.run('chat-team', 'user-emma', 'member', dayAgo);

  // Seed Realistic Messages
  const insertMsg = db.prepare(`
    INSERT INTO messages (id, chat_id, sender_id, text, type, media_url, media_name, media_size, media_duration, status, reply_to_id, reactions, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMsg.run('m1', 'chat-sarah', 'user-sarah', 'Hey! You can add me using my number +92 300 1234567 or my F0UNDR ID F0UNDR-300123! ✨', 'text', null, null, null, null, 'read', null, JSON.stringify([{ emoji: '🔥', userId: 'user-me' }]), hourAgo - 20 * 60 * 1000);
  insertMsg.run('m2', 'chat-sarah', 'user-me', 'Awesome! I registered with original phone 03446789261 (Telenor) and F0UNDR number F0UNDR-344678! 📱', 'text', null, null, null, null, 'read', 'm1', '[]', hourAgo - 15 * 60 * 1000);
  insertMsg.run('m3', 'chat-sarah', 'user-sarah', 'Nice! We also have locked chats with PIN and archived chats working smoothly.', 'text', null, null, null, null, 'read', null, JSON.stringify([{ emoji: '🔒', userId: 'user-me' }]), minsAgo10);
  insertMsg.run('m4', 'chat-sarah', 'user-me', 'Great! All contacts can now be added by original phone number or F0UNDR number.', 'text', null, null, null, null, 'read', null, '[]', minsAgo10 - 2 * 60 * 1000);

  insertMsg.run('m5', 'chat-david', 'user-david', 'Hey, you can block/unblock, clear chats, and lock chats with PIN.', 'text', null, null, null, null, 'delivered', null, '[]', hourAgo);
  insertMsg.run('m6', 'chat-david', 'user-me', 'Testing real-time talk and clear chat options!', 'text', null, null, null, null, 'sent', null, '[]', hourAgo - 5 * 60 * 1000);

  insertMsg.run('m7', 'chat-team', 'user-david', 'Welcome to the WhatsApp cross-platform group! Each member is verified with their original phone number.', 'text', null, null, null, null, 'read', null, '[]', dayAgo + 60 * 60 * 1000);
  insertMsg.run('m8', 'chat-team', 'user-sarah', 'One account per original phone number enforced 🔒', 'text', null, null, null, null, 'read', null, JSON.stringify([{ emoji: '🚀', userId: 'user-me' }]), dayAgo + 2 * 60 * 60 * 1000);
  insertMsg.run('m9', 'chat-team', 'user-emma', 'Real-time voice talk, calling, and locked chats are all active.', 'text', null, null, null, null, 'read', null, '[]', now - 3 * 60 * 1000);
}
