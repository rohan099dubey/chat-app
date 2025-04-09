import { Server } from 'socket.io';
import http from "http";
import express from 'express';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
    },
});

const getReceiverSocketId = (userId) => { // Fixed typo: getRecieverSocketId -> getReceiverSocketId
    return userSocketMap.get(userId);
}

//store all the online user here
const userSocketMap = new Map(); // Use Map instead of object

io.on("connection", (socket) => {

    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap.set(userId, socket.id);
        io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
    }

    socket.on("disconnect", () => {
        for (const [key, value] of userSocketMap.entries()) {
            if (value === socket.id) {
                userSocketMap.delete(key);
                break;
            }
        }
        io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
    });
});

export { server, app, io, getReceiverSocketId }; // Added getReceiverSocketId to exports