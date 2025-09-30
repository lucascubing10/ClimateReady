import mongoose from 'mongoose';


const MessageSchema = new mongoose.Schema({
room: { type: String, default: 'global' },
userId: { type: String }, // dummy ok until auth arrives
username: { type: String, required: true },
text: { type: String, required: true }
}, { timestamps: true });


export default mongoose.model('Message', MessageSchema);