import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import postsRoute from './routes/posts.js';
import messagesRoute from './routes/messages.js';
import Message from './models/Message.js';


const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*'} });


await mongoose.connect(process.env.MONGODB_URI);


app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || '*'}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));


app.use('/api/posts', postsRoute);
app.use('/api/messages', messagesRoute);


io.on('connection', (socket) => {
socket.join('global');


socket.on('chat:send', async (msg) => {
// msg: { userId, username, text }
const saved = await Message.create({ ...msg, room: 'global' });
io.to('global').emit('chat:new', { _id: saved._id, ...msg, createdAt: saved.createdAt });
});
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`API listening on :${PORT}`));