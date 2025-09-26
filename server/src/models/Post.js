import mongoose from 'mongoose';


const PostSchema = new mongoose.Schema({
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
username: String,
category: { type: String, enum: ['general','flood','heatwave','earthquake'], default: 'general' },
text: { type: String, required: true },
imageUrl: String,
status: { type: String, enum: ['approved','pending','rejected'], default: 'approved' },
resolved: { type: Boolean, default: false },
resolvedAt: Date,
upvotes: { type: Number, default: 0 },
commentsCount: { type: Number, default: 0 }
}, { timestamps: true });


export default mongoose.model('Post', PostSchema);