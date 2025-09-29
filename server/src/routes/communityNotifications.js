import express from 'express';
import CommunityNotification from '../models/CommunityNotification.js';
import Post from '../models/Post.js';

const router = express.Router();

// List notifications for a user (latest 50)
router.get('/', async (req, res) => {
  try {
    const { userId, unread } = req.query;
    if (!userId) return res.status(422).json({ error: 'userId required' });
    const query = { userId: String(userId) };
    if (unread === '1' || unread === 'true') query.read = false;
    const items = await CommunityNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(items);
  } catch (e) {
    console.error('List community notifications error', e);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark single notification as read
router.post('/:id/read', async (req, res) => {
  try {
    const item = await CommunityNotification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) {
    console.error('Mark read error', e);
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

// Mark all as read for a user
router.post('/read-all', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(422).json({ error: 'userId required' });
    await CommunityNotification.updateMany({ userId: String(userId), read: false }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (e) {
    console.error('Mark all read error', e);
    res.status(500).json({ error: 'Failed to mark all read' });
  }
});

// (Optional) delete one
router.delete('/:id', async (req, res) => {
  try {
    await CommunityNotification.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

export default router;
