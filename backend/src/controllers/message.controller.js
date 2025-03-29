import User from "../models/user.model.js"
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import mongoose from "mongoose";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUser = await User.find({
            _id: {
                $ne: loggedInUserId
            }
        }).select("-password");

        res.status(200).json(filteredUser);

    } catch (error) {
        console.log("Error in getUserForSidebar :", error.message);
        res.status(500).json({ error: "Internal server error" })
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        // Ensure valid ObjectIds
        if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        // Check if the user is trying to chat with themselves  
        if (!mongoose.Types.ObjectId.isValid(myId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        if (userToChatId === myId) {
            return res.status(400).json({ error: "You cannot chat with yourself" });
        }
        // Fetch messages between the two users
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        });

        res.status(200).json(messages);

    } catch (error) {
        console.log("Error in getMesagges :", error.message);
        res.status(500).json({ error: "Internal server error" })
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageURL;

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageURL = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageURL,
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);

    } catch (error) {
        console.log("Error in sendMessages:", error.message);
        res.status(500).json({ error: "Internal server error" })
    }
};