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

const getReceiverSocketId = (userId) => {
    return userSocketMap.get(userId);
}

const userSocketMap = new Map();

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

    // 📞 Handle call initiation
    socket.on("call-user", ({ to, from }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("incoming-call", { from });
        }
    });

    // ✅ Accept call
    socket.on("call-accepted", ({ to }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-accepted");
        }
    });

    // 📤 Send SDP offer
    socket.on("webrtc-offer", ({ to, sdp }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc-offer", { sdp });
        }
    });

    // 📥 Send SDP answer
    socket.on("webrtc-answer", ({ to, sdp }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc-answer", { sdp });
        }
    });

    // ❄️ ICE Candidate exchange
    socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc-ice-candidate", { candidate });
        }
    });

    // 🚫 End call
    socket.on("end-call", ({ to }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-ended");
        }
    });

});

export { server, app, io, getReceiverSocketId }; // Added getReceiverSocketId to exports