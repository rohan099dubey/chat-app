import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { supabase } from '../lib/supabase.js';
import { compressFile, getFileType, validateFile } from '../lib/fileUtilities.js';

export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // Get user with friends populated
        const user = await User.findById(loggedInUserId)
            .populate('friends', 'username fullName profilePic')
            .select('friends');

        res.status(200).json(user.friends);
    } catch (error) {
        console.log("Error in getUserForSidebar :", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        // Validate User IDs
        if (!mongoose.Types.ObjectId.isValid(userToChatId) || !mongoose.Types.ObjectId.isValid(myId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        // Check if users are friends
        const currentUser = await User.findById(myId);
        if (!currentUser.friends.includes(userToChatId)) {
            return res.status(403).json({ error: "You can only chat with your friends" });
        }

        // Fetch messages from MongoDB
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        }).sort({ createdAt: 1 });

        // Process messages with files
        const messagesWithFiles = await Promise.all(messages.map(async (message) => {
            if (message.file && message.file.name) {
                try {
                    const { data } = supabase.storage
                        .from('chat-files')
                        .getPublicUrl(message.file.name);

                    if (data && data.publicUrl) {
                        return {
                            ...message,
                            file: {
                                ...message.file,
                                url: data.publicUrl
                            }
                        };
                    }
                } catch (error) {
                    console.error("Error getting file URL:", error);
                }
            }
            return message;
        }));

        res.status(200).json(messagesWithFiles);
    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        console.log("Request file:", req.file);

        const { text } = req.body;
        const file = req.file;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        // Check if users are friends
        const sender = await User.findById(senderId);
        if (!sender.friends.includes(receiverId)) {
            return res.status(403).json({ error: "You can only chat with your friends" });
        }

        let fileData = null;

        if (file) {
            try {
                const fileType = getFileType(file.type);
                if (fileType === 'unknown') {
                    return res.status(400).json({ error: "File type not supported" });
                }

                validateFile(file);

                const { buffer, type, name, size } = await compressFile(file);
                const sanitizedName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${sanitizedName}`;

                const folderPath = `${senderId}`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-files')
                    .upload(`${folderPath}/${filename}`, buffer, {
                        contentType: f,
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    throw uploadError;
                }

                const { data } = supabase.storage
                    .from('chat-files')
                    .getPublicUrl(`${folderPath}/${filename}`);

                if (!data || !data.publicUrl) {
                    throw new Error("Failed to get file URL");
                }

                fileData = {
                    url: data.publicUrl,
                    type,
                    name: `${folderPath}/${filename}`,
                    size,
                    originalName: name
                };

            } catch (error) {
                console.error("Error processing file:", error);
                return res.status(500).json({ error: error.message || "File processing failed" });
            }
        }

        if (!text && !fileData) {
            return res.status(400).json({ error: "Message cannot be empty" });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text: text || "",
            file: fileData
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);

    } catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};