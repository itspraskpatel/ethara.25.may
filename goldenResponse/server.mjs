import { createServer } from 'node:http';
import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import next from 'next';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production' && process.env.npm_lifecycle_event !== 'start';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number.parseInt(process.env.PORT || '3001', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const boardPresence = new Map();
const socketBuckets = new Map();
const socketWindowMs = 60_000;
const socketLimit = 120;

function hourlyLogFile(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');

  return path.join(process.cwd(), 'LOG', `${year}-${month}-${day}-${hour}.log`);
}

function log(level, event, meta = {}) {
  try {
    mkdirSync(path.join(process.cwd(), 'LOG'), { recursive: true });
    appendFileSync(
      hourlyLogFile(),
      `${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...meta })}\n`,
      'utf8',
    );
  } catch (error) {
    console.error('logger_write_failed', error);
  }
}

function isSafeId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(value);
}

function normalizeDisplayName(value) {
  if (typeof value !== 'string') return 'Anonymous wanderer';
  return value.trim().slice(0, 80) || 'Anonymous wanderer';
}

function getIp(socket) {
  const forwarded = socket.handshake.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return socket.handshake.address || '0.0.0.0';
}

function checkSocketRateLimit(ipAddress) {
  const now = Date.now();
  const bucket = socketBuckets.get(ipAddress);

  if (!bucket || bucket.resetAt <= now) {
    socketBuckets.set(ipAddress, { count: 1, resetAt: now + socketWindowMs });
    return true;
  }

  if (bucket.count >= socketLimit) return false;

  bucket.count += 1;
  return true;
}

function roomName(boardId) {
  return `board:${boardId}`;
}

function ensureBoard(boardId) {
  const existing = boardPresence.get(boardId);
  if (existing) return existing;

  const users = new Map();
  boardPresence.set(boardId, users);
  return users;
}

function emitUserCount(io, boardId) {
  const users = boardPresence.get(boardId);
  io.to(roomName(boardId)).emit('whiteboard:user-count', { count: users?.size || 0 });
}

function sanitizeElementPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.id !== 'string' || payload.id.length > 128) return null;
  if (typeof payload.tool !== 'string' || payload.tool.length > 32) return null;

  return payload;
}

function cleanupSocketBuckets() {
  const now = Date.now();

  for (const [key, bucket] of socketBuckets.entries()) {
    if (bucket.resetAt <= now) socketBuckets.delete(key);
  }
}

setInterval(cleanupSocketBuckets, 120_000).unref?.();

app.prepare().then(() => {
  const httpServer = createServer((request, response) => {
    handle(request, response);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 256_000,
    pingInterval: 25_000,
    pingTimeout: 20_000,
    transports: ['websocket', 'polling'],
  });

  io.use((socket, nextMiddleware) => {
    const ipAddress = getIp(socket);

    if (!checkSocketRateLimit(ipAddress)) {
      log('warn', 'socket_rate_limited', { ipAddress });
      nextMiddleware(new Error('Rate limit exceeded'));
      return;
    }

    nextMiddleware();
  });

  io.on('connection', (socket) => {
    const auth = socket.handshake.auth || {};
    const boardId = auth.boardId;
    const browserId = auth.browserId;
    const displayName = normalizeDisplayName(auth.displayName);
    const ipAddress = getIp(socket);

    if (!isSafeId(boardId) || !isSafeId(browserId)) {
      log('warn', 'socket_rejected_invalid_identity', { ipAddress, boardId, browserId });
      socket.disconnect(true);
      return;
    }

    const room = roomName(boardId);
    const users = ensureBoard(boardId);
    const currentUser = users.get(browserId) || { displayName, sockets: new Set() };

    currentUser.displayName = displayName;
    currentUser.sockets.add(socket.id);
    users.set(browserId, currentUser);

    socket.data.boardId = boardId;
    socket.data.browserId = browserId;
    socket.data.displayName = displayName;
    socket.join(room);

    log('info', 'socket_joined_board', { boardId, browserId, ipAddress });
    emitUserCount(io, boardId);

    socket.to(room).emit('whiteboard:user-joined', { browserId, displayName });

    socket.on('whiteboard:element:add', (payload) => {
      const safePayload = sanitizeElementPayload(payload);
      if (!safePayload) return;
      socket.to(room).emit('whiteboard:element:add', safePayload);
    });

    socket.on('whiteboard:element:remove', (payload) => {
      if (!payload || typeof payload.id !== 'string') return;
      socket.to(room).emit('whiteboard:element:remove', { id: payload.id });
    });

    socket.on('whiteboard:clear', () => {
      socket.to(room).emit('whiteboard:clear');
    });

    socket.on('whiteboard:cursor', (payload) => {
      if (!payload || typeof payload.x !== 'number' || typeof payload.y !== 'number') return;
      socket.to(room).emit('whiteboard:cursor', {
        browserId,
        displayName,
        x: payload.x,
        y: payload.y,
        color: typeof payload.color === 'string' ? payload.color.slice(0, 24) : '#111827',
      });
    });

    socket.on('disconnect', (reason) => {
      const activeBoardId = socket.data.boardId;
      const activeBrowserId = socket.data.browserId;
      const activeUsers = boardPresence.get(activeBoardId);

      if (!activeUsers) return;

      const user = activeUsers.get(activeBrowserId);
      user?.sockets.delete(socket.id);

      if (!user || user.sockets.size === 0) {
        activeUsers.delete(activeBrowserId);
        socket.to(roomName(activeBoardId)).emit('whiteboard:user-left', { browserId: activeBrowserId });
      }

      if (activeUsers.size === 0) {
        boardPresence.delete(activeBoardId);
      }

      log('info', 'socket_left_board', { boardId: activeBoardId, browserId: activeBrowserId, reason });
      emitUserCount(io, activeBoardId);
    });
  });

  httpServer.listen(port, hostname, () => {
    log('init', 'whiteboard_server_started', { hostname, port, dev });
    console.log(`Whiteboard server ready on http://${hostname}:${port}`);
  });
});

