import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import postsRoute from './routes/posts.js';
import communityNotificationsRoute from './routes/communityNotifications.js';
import fs from 'fs';
import path from 'path';
import messagesRoute from './routes/messages.js';
import Message from './models/Message.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

// --- MongoDB connection ---
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ MongoDB connected successfully');
} catch (err) {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1); // stop server if DB is not available
}

// Optional listeners
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('⚠️ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('🔌 Mongoose disconnected');
});

// --- Ensure uploads directory exists ---
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// --- Middlewares ---
app.use(morgan('dev'));
app.use(cors({ origin: '*' })); // allow all origins
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// --- Routes ---
app.use('/api/posts', postsRoute);
app.use('/api/community-notifications', communityNotificationsRoute);
app.use('/api/messages', messagesRoute);

// --- Socket.IO ---
io.on('connection', (socket) => {
  socket.join('global');

  socket.on('chat:send', async (msg) => {
    // msg: { userId, username, text }
    const saved = await Message.create({ ...msg, room: 'global' });
    io.to('global').emit('chat:new', {
      _id: saved._id,
      ...msg,
      createdAt: saved.createdAt,
    });
  });
});

// --- Health-check endpoint ---
app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  res.json({
    status: state === 1 ? 'connected' : 'not connected',
    readyState: state,
  });
});

// --- Server start ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 API listening on :${PORT}`));
