import mongoose from 'mongoose';


const CommentSchema = new mongoose.Schema({
postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
username: String,
text: { type: String, required: true },
isSolution: { type: Boolean, default: false }
}, { timestamps: true });


export default mongoose.model('Comment', CommentSchema);