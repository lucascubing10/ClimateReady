import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { moderateText } from '../moderation.js';


const r = Router();
const upload = multer({ dest: 'uploads/' });


const PostDto = z.object({
username: z.string().min(1),
userId: z.string().min(1),
category: z.enum(['general','flood','heatwave','earthquake']),
text: z.string().min(1)
});


// List posts with filters
r.get('/', async (req,res) => {
const { category, mine, userId } = req.query;
const q = {};
if (category && category !== 'all') q.category = category;
if (mine === '1' && userId) q.userId = userId;
const posts = await Post.find(q).sort({ createdAt: -1 }).limit(100);
res.json(posts);
});


// Get one
r.get('/:id', async (req,res) => {
const post = await Post.findById(req.params.id);
if (!post) return res.status(404).json({ message: 'Not found' });
const comments = await Comment.find({ postId: post._id }).sort({ createdAt: 1 });
res.json({ post, comments });
});


// Create with optional image
r.post('/', upload.single('image'), async (req,res) => {
try {
const parsed = PostDto.parse(JSON.parse(req.body.payload));
const mod = await moderateText(parsed.text);
const post = await Post.create({ ...parsed, status: mod.approved ? 'approved' : 'pending', imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined });
res.json({ post, moderation: mod });
} catch (e) {
console.error(e);
res.status(400).json({ message: 'Invalid payload' });
}
});


// Add comment
r.post('/:id/comments', async (req,res) => {
const { userId, username, text } = req.body;
if (!text) return res.status(400).json({ message: 'Text required' });
const c = await Comment.create({ postId: req.params.id, userId, username, text });
await Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
res.json(c);
});


export default r;