import express from 'express'
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import friendRoutes from "./routes/friend.route.js";
import { server, app } from './lib/socket.js';
import { connectDB } from './lib/db.js';
import { scheduleCleanupJob } from './utils/cleanup.js';

dotenv.config();

const PORT = process.env.PORT

app.use(express.json({ limit: '50MB' }));
app.use(express.urlencoded({ limit: '50MB', extended: true }));
app.use(cookieParser());

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL // e.g., "https://panchayat-frontend.onrender.com"
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // allow requests with no origin (like mobile apps or CURL)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);

app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes);
app.use("/api/contacts", friendRoutes);
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: Date.now() });
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

server.listen(PORT, () => {
    console.log("running Server on PORT:" + PORT)
    connectDB();
    // Start the cleanup job for unverified users
    scheduleCleanupJob();
})