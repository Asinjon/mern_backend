import express from "express";
import Message from "../models/Message.js";

const messageRoutes = express.Router();

messageRoutes.post("/", async (request, response) => {
    const message = new Message(request.body);
    try {
        const savedMessage = await message.save();
        response.status(200).json(savedMessage);
    } catch (error) {
        response.status(500).send(error);
    }
});

messageRoutes.get("/:conversationId", async (request, response) => {
    try {
        const messages = await Message.find({
            conversationId: request.params.conversationId
        });
        response.status(200).json(messages);
    } catch (error) {
        response.status(500).send(error);
    }
});

export default messageRoutes;