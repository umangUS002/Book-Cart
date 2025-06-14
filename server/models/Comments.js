import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    book: {type: mongoose.Schema.Types.ObjectId, ref: 'book', required: true},
    name: {type: String, required: true},
    content: {type: String, required: true},
    isApproved: {type: Boolean, default: false},
}, {timestamps: true});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;