import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js"
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase.js";
import { validateUsername } from "../lib/validators.js";
import jwt from "jsonwebtoken";
import sharp from 'sharp';


export const signup = async (req, res) => {
    try {
        const { fullName, username, email, password, confirmPassword } = req.body;

        // Validate username
        const validation = await validateUsername(username);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
        }

        // Check if username exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken" });
        }

        // Check if email exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        if (!fullName || !username || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "15d" }
        );

        res.cookie("jwt", token, {
            maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development",
        });

        res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            username: newUser.username,
            email: newUser.email,
            profilePic: newUser.profilePic,
        });
    } catch (error) {
        console.log("Error in signup controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid Credentials" })
        }

        generateToken(user._id, res)

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        })


    } catch (error) {
        console.log("ERROR in log-in controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 })
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("ERROR in log-out controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userID = req.user._id;

        if (!profilePic) {
            return res.status(400).json({ message: "Profile picture not provided" });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(profilePic.split(',')[1], 'base64');

        // Generate unique filename
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const folderPath = `profile-pics/${userID}`;


        const compressedBuffer = await sharp(buffer)
            .resize({ width: 1024, height: 1024, fit: 'inside' }) // Resize to fit within 1024x1024
            .jpeg({ quality: 60 }) // Compress to JPEG with 60% quality
            .toBuffer();

        // Upload to Supabase
        const { error: uploadError } = await supabase.storage
            .from('profile-pics')
            .upload(`${folderPath}/${filename}`, compressedBuffer, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return res.status(500).json({ error: "Failed to upload profile picture" });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('profile-pics')
            .getPublicUrl(`${folderPath}/${filename}`);

        // Update user profile in database
        const updatedUser = await User.findByIdAndUpdate(
            userID,
            { profilePic: publicUrl },
            { new: true }
        ).select("-password");

        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("Error in update profile controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("ERROR in check-Auth controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const checkUsername = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        // Validate username format and content
        const validation = await validateUsername(username);
        if (!validation.isValid) {
            return res.status(400).json({
                error: validation.message,
                isAvailable: false
            });
        }

        // Check if username exists
        const existingUser = await User.findOne({ username });
        res.status(200).json({
            isAvailable: !existingUser,
            message: existingUser ? 'Username is taken' : 'Username is available'
        });
    } catch (error) {
        console.log("Error in checkUsername: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};




