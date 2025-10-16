import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sharp from 'sharp';
import nodemailer from 'nodemailer';
import User from "../models/user.model.js"
import { generateToken } from "../lib/utils.js";
import { supabase } from "../lib/supabase.js";
import { validateUsername } from "../lib/validators.js";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Helps in some environments
    }
});

// Verify transporter connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log('SMTP server connection error:', error);
    } else {
        console.log('SMTP server connection established');
    }
});



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

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_expiation = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        const newUser = new User({
            fullName,
            username,
            email,
            password, // Assign plain password and let pre-save hook hash it
            otp,
            otp_expiation, // Using the field name from your model
            isVerified: false,
        });

        await newUser.save();

        // Send verification email with OTP
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your email",
            text: `Your OTP is ${otp} and it will expire in 10 minutes. Please verify your email to continue and don't share this OTP with anyone.`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #4f46e5;">Verify Your Email</h2>
                <p>Hello ${fullName},</p>
                <p>Thank you for signing up! Please use the following OTP code to verify your email address:</p>
                <div style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; text-align: center; font-size: 24px; letter-spacing: 4px; margin: 20px 0;">
                    <strong>${otp}</strong>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p><strong>Note:</strong> Do not share this OTP with anyone for security reasons.</p>
                <p>If you did not sign up for an account, please ignore this email.</p>
                <p>Thanks,<br>The Chat App Team</p>
            </div>
            `
        });

        res.status(201).json({
            message: "User registered successfully",
            email: newUser.email,
            requiresVerification: true
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

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({
                message: "Please verify your email before logging in",
                isVerified: false,
                email: user.email
            });
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

// Verify OTP endpoint
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // If user is already verified, send success response with their data
        if (user.isVerified) {
            // Generate token for already verified user
            generateToken(user._id, res);

            // Return success with user data
            return res.status(200).json({
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                profilePic: user.profilePic,
                alreadyVerified: true,
                message: "Email is already verified"
            });
        }

        // Check if OTP is correct - ensure both are strings and trimmed
        const storedOTP = String(user.otp || '').trim();
        const submittedOTP = String(otp || '').trim();

        if (!storedOTP || storedOTP !== submittedOTP) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Check if OTP is expired
        if (!user.otp_expiation || user.otp_expiation < Date.now()) {
            return res.status(400).json({ message: "OTP has expired or is invalid" });
        }

        // Verify the user
        user.isVerified = true;
        user.otp = undefined;
        user.otp_expiation = undefined;
        await user.save();

        // Generate token
        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
            message: "Email verified successfully"
        });
    } catch (error) {
        console.log("Error in verifyOTP controller: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Resend OTP endpoint with rate limiting
const resendLimiter = new Map(); // Store email -> last resend time

export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check if user is already verified
        if (user.isVerified) {
            return res.status(200).json({
                message: "Email is already verified",
                isVerified: true
            });
        }

        // Rate limiting: Allow resend only once every 60 seconds
        const lastResendTime = resendLimiter.get(email) || 0;
        const now = Date.now();
        const timeElapsed = now - lastResendTime;

        if (lastResendTime && timeElapsed < 60000) { // 60000ms = 1 minute
            const timeLeft = Math.ceil((60000 - timeElapsed) / 1000);
            return res.status(429).json({
                message: `Please wait ${timeLeft} seconds before requesting another OTP`
            });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_expiration = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        // Update user
        user.otp = otp;
        user.otp_expiation = otp_expiration;
        await user.save();

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your email",
            text: `Your new OTP is ${otp} and it will expire in 10 minutes. Please verify your email to continue and Don't share this OTP with anyone.`,
        });

        // Update rate limiter
        resendLimiter.set(email, now);

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.log("Error in resendOTP controller: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};


