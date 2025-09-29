import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { moderateText } from '../moderation.js'; // still used for comments fallback
import { compositeModerate } from '../services/aiModeration.js';

const router = express.Router();

// Simple connectivity / health check
router.get('/ping', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Ensure uploads directory exists (defensive if index didn't run yet)
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// File upload setup with custom storage (keep original name sanitized)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + safe);
  },
});
const upload = multer({ storage });

// -------------------------
// Create a new post
// -------------------------
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('\n[POST /api/posts] content-type:', req.headers['content-type']);
    // Frontend sends FormData with key 'payload' containing JSON
    let parsed = req.body;
    if (req.body.payload) {
      try {
        parsed = JSON.parse(req.body.payload);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in payload' });
      }
    }

    const { userId, username, text, category } = parsed || {};
    if (!text || !userId) {
      return res.status(422).json({ error: 'text and userId are required' });
    }

  const mod = await compositeModerate(text);

    // Fallback: if no single file captured but array exists
    let fileRef = req.file;
    if (!fileRef && Array.isArray(req.files) && req.files.length) {
      fileRef = req.files[0];
    }

    let imageUrl;
    if (fileRef) {
      imageUrl = `/uploads/${path.basename(fileRef.path)}`;
    } else if (parsed.imageBase64) {
      try {
        const base64 = parsed.imageBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
        const buf = Buffer.from(base64, 'base64');
        const fname = `${Date.now()}-b64.png`;
        const outPath = path.join(UPLOADS_DIR, fname);
        fs.writeFileSync(outPath, buf);
        imageUrl = `/uploads/${fname}`;
        console.log('Saved base64 image ->', outPath);
      } catch (e) {
        console.warn('Failed to persist base64 image:', e.message);
      }
    }

    console.log('Body keys:', Object.keys(parsed));
    console.log('File received:', !!fileRef, 'imageUrl decided:', imageUrl);

    const post = await Post.create({
      userId: String(userId),
      username,
      text,
      category: category && ['general','flood','heatwave','earthquake'].includes(category) ? category : 'general',
      status: mod.approved ? 'approved' : 'rejected',
      blocked: !!mod.blocked,
      moderationReason: mod.reason,
      moderation: {
        reason: mod.reason,
        scores: mod.ai?.scores || {},
        model: mod.ai?.model,
        blocked: !!mod.blocked
      },
      imageUrl,
    });

    res.json({ post, moderation: mod });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// -------------------------
// List posts
// -------------------------
router.get('/', async (req, res) => {
  try {
    const { mine, userId, category } = req.query;
    const query = {};
    const mineFlag = mine === 'true' || mine === '1';

    if (mineFlag && userId) {
      // userId stored as plain string (Firebase UID)
      query.userId = String(userId);
    } else {
      // public feed: only approved & not blocked
      query.status = 'approved';
      query.blocked = { $ne: true };
    }
    if (category && category !== 'all') {
      query.category = category;
    }

    const posts = await Post.find(query).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// -------------------------
// Get single post (+ comments)
// -------------------------
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const comments = await Comment.find({ postId: post._id }).sort({ createdAt: 1 });
    res.json({ post, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// -------------------------
// Add comment
// -------------------------
router.post('/:id/comments', async (req, res) => {
  try {
    const { text, userId, username } = req.body || {};
    if (!text || !userId) return res.status(422).json({ error: 'text and userId required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

  const mod = await compositeModerate(text);
    if (!mod.approved) {
      return res.status(400).json({ error: 'Comment rejected by moderation', moderation: mod });
    }

  const comment = await Comment.create({ postId: post._id, userId: String(userId), username, text });
    await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });
    res.json({ comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// helper to turn /uploads/xyz into absolute file path safely
function localFile(p) {
  if (!p) return null;
  if (!p.startsWith('/uploads/')) return null; // only local managed paths
  return path.join(process.cwd(), p.replace(/^\//, ''));
}

// -------------------------
// Resolve post (PATCH + POST for client compatibility)
// -------------------------
async function resolveHandler(req, res) {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resolve post' });
  }
}
router.patch('/:id/resolve', resolveHandler);
router.post('/:id/resolve', resolveHandler);
// -------------------------
// Update post (text/category and optional image replacement)
// -------------------------
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    let parsed = req.body;
    if (req.body.payload) {
      try { parsed = JSON.parse(req.body.payload); } catch { return res.status(400).json({ error: 'Invalid JSON in payload' }); }
    }
    const { userId, text, category } = parsed || {};
    if (!userId) return res.status(422).json({ error: 'userId required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
  if (String(post.userId) !== String(userId)) return res.status(403).json({ error: 'Not owner' });

    let updates = {};
    if (text) updates.text = text;
    if (category && ['general','flood','heatwave','earthquake'].includes(category)) updates.category = category;

    // Optional re-moderate text if changed
    if (text && text !== post.text) {
      const mod = await compositeModerate(text);
      updates.status = mod.approved ? 'approved' : 'rejected';
      updates.blocked = !!mod.blocked;
      updates.moderationReason = mod.reason;
      updates.moderation = {
        reason: mod.reason,
        scores: mod.ai?.scores || {},
        model: mod.ai?.model,
        blocked: !!mod.blocked
      };
      updates._moderation = mod; // temp attach to respond later
    }

    // Image replacement
    let fileRef = req.file;
    if (!fileRef && Array.isArray(req.files) && req.files.length) fileRef = req.files[0];
    if (fileRef) {
      const oldAbs = localFile(post.imageUrl);
      if (oldAbs) fs.unlink(oldAbs, () => {});
      updates.imageUrl = `/uploads/${path.basename(fileRef.path)}`;
    } else if (parsed.imageBase64) {
      try {
        const base64 = parsed.imageBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
        const buf = Buffer.from(base64, 'base64');
        const fname = `${Date.now()}-edit.png`;
        const outPath = path.join(UPLOADS_DIR, fname);
        fs.writeFileSync(outPath, buf);
        const oldAbs = localFile(post.imageUrl);
        if (oldAbs) fs.unlink(oldAbs, () => {});
        updates.imageUrl = `/uploads/${fname}`;
      } catch (e) {
        console.warn('Failed to persist base64 replacement image:', e.message);
      }
    }

    const updated = await Post.findByIdAndUpdate(post._id, updates, { new: true });
    res.json({ post: updated, moderation: updates._moderation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// -------------------------
// Delete post
// -------------------------
router.delete('/:id', async (req, res) => {
  try {
    console.log('[DELETE route] id=', req.params.id, 'query.userId=', req.query.userId, 'body.userId=', req.body?.userId);
    const { userId } = req.query; // allow via query or body
    const bodyUser = req.body?.userId;
    const owner = userId || bodyUser;
    if (!owner) return res.status(422).json({ error: 'userId required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
  if (String(post.userId) !== String(owner)) return res.status(403).json({ error: 'Not owner' });

    // remove image file
    const imgPath = localFile(post.imageUrl);
    if (imgPath) fs.unlink(imgPath, () => {});
    await Comment.deleteMany({ postId: post._id });
    await Post.deleteOne({ _id: post._id });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Fallback: some environments block DELETE – provide POST based delete
router.post('/:id/delete', async (req, res) => {
  try {
    console.log('[POST delete fallback] id=', req.params.id, 'body.userId=', req.body?.userId, 'query.userId=', req.query.userId);
    const owner = req.body?.userId || req.query.userId;
    if (!owner) return res.status(422).json({ error: 'userId required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
  if (String(post.userId) !== String(owner)) return res.status(403).json({ error: 'Not owner' });
    const imgPath = localFile(post.imageUrl);
    if (imgPath) fs.unlink(imgPath, () => {});
    await Comment.deleteMany({ postId: post._id });
    await Post.deleteOne({ _id: post._id });
    res.json({ ok: true, via: 'post-delete-endpoint' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});
// (Upvote route already defined earlier in file)
// -------------------------
// Upvote post
// -------------------------
router.post('/:id/upvote', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(422).json({ error: 'userId required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const already = post.likedBy.includes(userId);
    let update;
    if (already) {
      update = {
        $inc: { upvotes: post.upvotes > 0 ? -1 : 0 },
        $pull: { likedBy: userId }
      };
    } else {
      update = {
        $inc: { upvotes: 1 },
        $addToSet: { likedBy: userId }
      };
    }
    const updated = await Post.findByIdAndUpdate(post._id, update, { new: true });
    res.json({ post: updated, liked: !already });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

export default router;
