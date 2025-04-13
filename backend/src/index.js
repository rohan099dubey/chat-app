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
app.use(cors(
    {
        origin: "http://localhost:5173",
        credentials: true,
    }
))

app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes);
app.use("/api/contacts", friendRoutes);


server.on('error', (err) => {
    console.error('Server error:', err);
});

server.listen(PORT, () => {
    console.log("running Server on PORT:" + PORT)
    connectDB();
    // Start the cleanup job for unverified users
    scheduleCleanupJob();
})