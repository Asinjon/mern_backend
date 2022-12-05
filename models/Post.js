import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    creatorId: { type: String, required: true},
    creatorUsername: { type: String, required: true},
    text: {type: String, required: true},
    img: {type: String},
    likes: {type: Array}
}, {timestamps: true});

const Post = new mongoose.model("Post", postSchema);

export default Post;