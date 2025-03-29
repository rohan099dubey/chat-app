import { Server } from 'socket.io';
import http from "http";
import express from 'express';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://10.1.5.67:5173", "http://localhost:5173"],
    },
});

const getReceiverSocketId = (userId) => { // Fixed typo: getRecieverSocketId -> getReceiverSocketId
    return userSocketMap[userId];
}

//store all the online user here
const userSocketMap = {};

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    //io.emit() it is used to send the message to all the connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { server, app, io, getReceiverSocketId }; // Added getReceiverSocketId to exports