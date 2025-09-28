import mongoose from 'mongoose';


const PostSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	username: String,
	category: { type: String, enum: ['general','flood','heatwave','earthquake'], default: 'general' },
	text: { type: String, required: true },
	imageUrl: String,
	status: { type: String, enum: ['approved','pending','rejected'], default: 'approved' },
	blocked: { type: Boolean, default: false }, // custom rule-based block visible only to owner
	moderationReason: String, // store human / rule explanation
	resolved: { type: Boolean, default: false },
	resolvedAt: Date,
	upvotes: { type: Number, default: 0 },
	commentsCount: { type: Number, default: 0 }
    ,
	moderation: {
		// Store latest AI moderation snapshot
		reason: String,
		scores: { type: mongoose.Schema.Types.Mixed },
		model: String,
		blocked: { type: Boolean, default: false }
	}
}, { timestamps: true });


export default mongoose.model('Post', PostSchema);