import express from "express";
const postRoutes = express.Router();
import Post from "../models/Post.js";

postRoutes.post("/create", async(request, response) => {
    const {text, img, id, creatorUsername} = request.body;
    try {
        const post = new Post({
            creatorId: id,
            creatorUsername,
            text,
            img
        });

        const newPost = await post.save();
        response.json({newPost});
    } catch (error) {
        console.log("error:", error);
    }
});

postRoutes.post("/like", async (request, response) => {
    try {
        const newPost = await Post.findByIdAndUpdate(request.body.postId, { "$push": { "likes": request.body.creatorId } },
        { "new": true, "upsert": true });
        console.log("new post:", newPost);
        response.send(newPost);
    } catch (error) {
        console.log("error:", error);
    }
});

postRoutes.get("/:userId", async(request, response) => {
    try {
        const posts = await Post.find({creatorId: request.params.userId});
        response.send(posts);
    } catch (error) {
        console.log("error:", error);
    }
});

postRoutes.get("/", async (request, response) => {
    try {
        const posts = await Post.find();
        response.send(posts);
    } catch (error) {
        console.log("error:", error);
    }
});

postRoutes.post("/:postId", async(request, response) => {
    try {
        const post = await Post.findById(request.params.postId);
        response.send(post);
    } catch (error) {
        console.log("error:", error);
    }
});

export default postRoutes;