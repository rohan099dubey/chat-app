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

        // ... validation and friend check ...

        // Fetch messages from MongoDB and convert to plain objects
        const messages = await Message.find({ // Find matching messages
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        })
            .lean() // *** ADD .lean() HERE ***
            .sort({ createdAt: 1 }); // Sort the plain objects

        // Process the plain message objects to add file URLs
        const messagesWithUrls = await Promise.all(messages.map(async (message) => {
            // 'message' is now guaranteed to be a plain JS object
            if (message.file && message.file.name) {
                try {
                    const { data } = supabase.storage
                        .from('chat-files')
                        .getPublicUrl(message.file.name);

                    if (data && data.publicUrl) {
                        // Modify the plain object directly - safer
                        message.file.url = data.publicUrl;
                    } else {
                        console.warn(`[GetMessages] Could not get public URL for file: ${message.file.name}`);
                    }
                } catch (error) {
                    console.error(`[GetMessages] Error getting file URL for ${message.file.name}:`, error);
                }
            }
            return message; // Return the plain object (possibly with updated file.url)
        }));

        console.log("[GetMessages] Sending processed plain objects:", JSON.stringify(messagesWithUrls, null, 2));
        res.status(200).json(messagesWithUrls); // Send the array of plain objects

    } catch (error) {
        console.error("[GetMessages] Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const sendMessage = async (req, res) => {
    try {
        // Data from multer: req.file contains file info, req.body contains text fields
        const { text } = req.body;
        const file = req.file; // File object from multer
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        console.log("[SendMessage] Received request:");
        console.log("  Text:", text);
        console.log("  File:", file ? { originalname: file.originalname, mimetype: file.mimetype, size: file.size } : "None"); // Log key file details

        // Check friendship (seems okay)
        const sender = await User.findById(senderId);
        if (!sender || !sender.friends.includes(receiverId)) { // Added check for sender existence
            return res.status(403).json({ error: "You can only chat with your friends" });
        }

        let fileDataForDb = null; // Renamed to avoid confusion with 'file' from req

        if (file) {
            console.log("[SendMessage] Processing attached file...");
            try {
                // --- Use file.mimetype from multer ---
                const fileMimeType = file.mimetype;
                const fileTypeCategory = getFileType(fileMimeType); // Get category (image, audio, etc.)

                console.log(`[SendMessage] File type detected: ${fileMimeType}, Category: ${fileTypeCategory}`);

                // --- Validate Type Category ---
                if (fileTypeCategory === 'unknown') {
                    console.log("[SendMessage] Validation failed: File type not supported");
                    // It's often better to delete the temp file multer might save here if using diskStorage
                    return res.status(400).json({ error: `File type (${fileMimeType}) not supported` });
                }

                // --- Validate Size and Specific MimeType using the utility ---
                // Pass the necessary details from req.file
                validateFile({ type: fileMimeType, size: file.size }); // Use mimetype here
                console.log("[SendMessage] File validation successful (type/size).");

                // --- Compress/Process File using req.file ---
                // Pass the necessary parts of req.file to compressFile
                const processedFileData = await compressFile({
                    buffer: file.buffer, // The raw file data from multer
                    mimetype: file.mimetype,
                    originalname: file.originalname,
                    size: file.size // Pass original size if needed by compressFile logic
                });
                console.log("[SendMessage] File compression/processing successful.");


                // --- Upload to Supabase ---
                const sanitizedName = processedFileData.name.replace(/[^a-zA-Z0-9._-]/g, '_'); // Ensure safe name
                const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${sanitizedName}`; // More robust random part
                const folderPath = `${senderId}`; // Store user-specific
                const supabasePath = `${folderPath}/${filename}`;

                console.log(`[SendMessage] Uploading to Supabase path: ${supabasePath}`);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('chat-files') // Ensure bucket name is correct
                    .upload(supabasePath, processedFileData.buffer, { // Use the potentially compressed buffer
                        contentType: processedFileData.type, // Use the potentially updated mimetype (e.g., image/jpeg)
                        cacheControl: '3600',
                        upsert: false
                    });


                if (uploadError) {
                    console.error("[SendMessage] Supabase upload error:", uploadError);
                    throw new Error("Failed to upload file to storage."); // Throw a generic error
                }
                console.log("[SendMessage] Supabase upload successful:", uploadData);


                // --- Get Public URL ---
                const { data: urlData } = supabase.storage
                    .from('chat-files')
                    .getPublicUrl(supabasePath);

                if (!urlData || !urlData.publicUrl) {
                    console.error("[SendMessage] Failed to get Supabase public URL for path:", supabasePath);
                    throw new Error("Failed to get file URL after upload.");
                }
                console.log("[SendMessage] Supabase public URL:", urlData.publicUrl);

                // Prepare file data for saving in the Message document
                fileDataForDb = {
                    url: urlData.publicUrl, // The accessible URL
                    type: processedFileData.type, // Storing the final MIME type
                    name: supabasePath, // Store the path in Supabase for potential future reference/deletion
                    size: processedFileData.size, // Store the final size (after compression)
                    originalName: file.originalname // Keep the original name for display
                };
                console.log("[SendMessage] File processing complete. Data for DB:", fileDataForDb);

            } catch (error) {
                // Catch errors from validation, compression, or upload
                console.error("[SendMessage] Error during file processing pipeline:", error);
                // Provide specific feedback if it's a validation error we threw
                if (error.message.includes("File type") || error.message.includes("File size")) {
                    return res.status(400).json({ error: error.message });
                }
                // Otherwise, it's likely a server error during processing/upload
                return res.status(500).json({ error: "File processing failed on server." });
            }
        } // End of if(file) block

        // --- Final Validation: Check if message has content ---
        // Use trim() for text validation
        if (!text?.trim() && !fileDataForDb) {
            console.log("[SendMessage] Validation failed: Message has no text and no successfully processed file.");
            return res.status(400).json({ error: "Message cannot be empty (text or valid file required)" });
        }
        console.log("[SendMessage] Final validation passed. Creating message document.");

        // --- Create and Save Message ---
        const newMessage = new Message({
            senderId,
            receiverId,
            text: text?.trim() || "", // Ensure text is at least an empty string
            file: fileDataForDb // Save the processed file data (or null)
        });

        await newMessage.save();
        console.log("[SendMessage] Message saved to DB:", newMessage._id);

        // --- Emit via Socket.IO ---
        // Prepare message payload for socket (potentially exclude raw path 'name' if not needed client-side)
        const messageForSocket = newMessage.toObject(); // Convert Mongoose doc to plain object
        // If you added Supabase URL generation logic in getMessages, ensure consistency here.
        // If not, the URL is already in messageForSocket.file.url


        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            console.log(`[SendMessage] Emitting 'newMessage' to socket ID: ${receiverSocketId}`);
            io.to(receiverSocketId).emit("newMessage", messageForSocket);
        } else {
            console.log(`[SendMessage] Receiver ${receiverId} is not online (no socket ID found).`);
        }

        // --- Send Response ---
        console.log("[SendMessage] Sending success response (201).");
        res.status(201).json(messageForSocket); // Send the saved message data back

    } catch (error) {
        // Catch unexpected errors (e.g., DB connection, friendship check)
        console.error("[SendMessage] Unhandled error in sendMessage controller:", error);
        res.status(500).json({ error: error.message || "Internal server error occurred." });
    }
};
