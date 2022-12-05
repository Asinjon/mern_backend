import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const conversationRoutes = express.Router();

conversationRoutes.post("/", async (request, response) => {
    const newConversation = new Conversation({
        members: [request.body.senderId, request.body.receiverId],
    });
    try {
        const savedConversation = await newConversation.save();
        response.status(200).json(savedConversation);
    } catch (error) {
        response.status(500).json({message:error.message});
    }
});

conversationRoutes.get("/:userId", async (request, response) => {
    console.log("conversationRoutes.get");
    try {
        const conversation = await Conversation.find({
            members: {$in: [request.params.userId]}
        });
        response.status(200).json(conversation);
    } catch (error) {
        console.log("error in conversations get");
        response.status(500).json({message:error.message});
    }
});

conversationRoutes.post("/delete", async (request, response) => {
    const convId = request.body.id;
    console.log("id in deleting conversation: " + convId);
    try {
        const conversation = await Conversation.findByIdAndDelete(convId);
        console.log("conversation delete:", JSON.stringify(conversation));
        if (Object.keys(conversation).length > 0) {
            const deletedMessages = await Message.deleteMany({ conversationId: convId});
            console.log("Deleted messages: " + JSON.stringify(deletedMessages));
            response.json({isDeleted: true});
        }
        else response.json({isDeleted: false});
    } catch (error) {
        console.log("error in conversations delete:", error);
    }
});

export default conversationRoutes;