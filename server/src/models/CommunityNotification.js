import mongoose from 'mongoose';

// Community-scoped notification: triggered when someone comments on a user's post
// Naming intentionally specific so it won't clash with any global notification system
const CommunityNotificationSchema = new mongoose.Schema({
  userId: { type: String, index: true, required: true }, // owner to notify
  actorId: { type: String, required: true }, // commenter id
  actorName: { type: String },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
  postSnippet: { type: String }, // small snippet of post text
  commentSnippet: { type: String },
  read: { type: Boolean, default: false },
}, { timestamps: true });

CommunityNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('CommunityNotification', CommunityNotificationSchema);
