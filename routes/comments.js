import express from "express";
import Comment from "../models/Comment.js";

const commentRoutes = express.Router();

commentRoutes.post("/create", async (request, response) => {
    console.log("data: " + JSON.stringify(request.body));
    try {
        const newComment = new Comment(request.body);
        const savedComment = await newComment.save();
        response.send(savedComment);
    } catch (error) {
        console.log("error: " + error);
    }
});

commentRoutes.get("/", async (request, response) => {
    try {
        const comments = await Comment.find({});
        response.send(comments);
    } catch (error) {
        console.log("error: " + error);
    }
});

export default commentRoutes;