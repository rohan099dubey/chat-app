import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { supabase } from '../lib/supabase.js';
import { compressFile, getFileType, validateFile } from '../lib/fileUtilities.js';


export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        const user = await User.findById(loggedInUserId)
            .populate('friends', 'username fullName profilePic')
            .select('friends');

        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error in getUserForSidebar :", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        })
            .lean()
            .sort({ createdAt: 1 });


        const messagesWithUrls = await Promise.all(messages.map(async (message) => {
            if (message.file && message.file.name) {
                try {
                    const { data } = supabase.storage
                        .from('chat-files')
                        .getPublicUrl(message.file.name);

                    if (data && data.publicUrl) {
                        message.file.url = data.publicUrl;
                    } else {
                        console.error(`[GetMessages] Could not get public URL for file: ${message.file.name}`);
                    }
                } catch (error) {
                    console.error(`[GetMessages] Error getting file URL for ${message.file.name}:`, error);
                }
            }
            return message;
        }));

        res.status(200).json(messagesWithUrls);

    } catch (error) {
        console.error("[GetMessages] Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const file = req.file;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        const sender = await User.findById(senderId);
        if (!sender || !sender.friends.includes(receiverId)) {
            return res.status(403).json({ error: "You can only chat with your friends" });
        }

        let fileDataForDb = null;

        if (file) {
            try {
                const fileMimeType = file.mimetype;
                const fileTypeCategory = getFileType(fileMimeType);

                if (fileTypeCategory === 'unknown') {
                    return res.status(400).json({ error: `File type (${fileMimeType}) not supported` });
                }

                validateFile({ type: fileMimeType, size: file.size });
                e
                const processedFileData = await compressFile({
                    buffer: file.buffer,
                    mimetype: file.mimetype,
                    originalname: file.originalname,
                    size: file.size
                });

                const sanitizedName = processedFileData.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${sanitizedName}`;
                const folderPath = `${senderId}`; // Store user-specific
                const supabasePath = `${folderPath}/${filename}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('chat-files')
                    .upload(supabasePath, processedFileData.buffer, {
                        contentType: processedFileData.type,
                        cacheControl: '3600',
                        upsert: false
                    });


                if (uploadError) {
                    console.error("[SendMessage] Supabase upload error:", uploadError);
                    throw new Error("Failed to upload file to storage.");
                }

                const { data: urlData } = supabase.storage
                    .from('chat-files')
                    .getPublicUrl(supabasePath);

                if (!urlData || !urlData.publicUrl) {
                    console.error("[SendMessage] Failed to get Supabase public URL for path:", supabasePath);
                    throw new Error("Failed to get file URL after upload.");
                }
                console.log("[SendMessage] Supabase public URL:", urlData.publicUrl);


                fileDataForDb = {
                    url: urlData.publicUrl,
                    type: processedFileData.type,
                    name: supabasePath,
                    size: processedFileData.size,
                    originalName: file.originalname
                };

            } catch (error) {

                console.error("[SendMessage] Error during file processing pipeline:", error);

                if (error.message.includes("File type") || error.message.includes("File size")) {
                    return res.status(400).json({ error: error.message });
                }

                return res.status(500).json({ error: "File processing failed on server." });
            }
        }

        if (!text?.trim() && !fileDataForDb) {
            return res.status(400).json({ error: "Message cannot be empty (text or valid file required)" });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text: text?.trim() || "",
            file: fileDataForDb
        });

        await newMessage.save();

        const messageForSocket = newMessage.toObject();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", messageForSocket);
        } else {
            console.log(`[SendMessage] Receiver ${receiverId} is not online (no socket ID found).`);
        }

        res.status(201).json(messageForSocket);

    } catch (error) {

        console.error("[SendMessage] Unhandled error in sendMessage controller:", error);
        res.status(500).json({ error: error.message || "Internal server error occurred." });
    }
};
