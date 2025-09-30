import { Router } from 'express';
import Message from '../models/Message.js';


const r = Router();


r.get('/', async (_req,res) => {
const last = await Message.find({ room: 'global' }).sort({ createdAt: -1 }).limit(50);
res.json(last.reverse());
});


export default r;
