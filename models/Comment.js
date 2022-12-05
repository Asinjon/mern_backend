import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    text: { type: String, required: true},
    username: { type: String, required: true },
    creatorId: { type: String, required: true },
    creatorImg: { type: String, required: true },
    postId: { type: String, required: true }
}, {timestamps: true});

const Comment = new mongoose.model("Comment", commentSchema);

export default Comment;