
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';


dotenv.config();

// Generate a random 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification - Chat App',
            text: `Your OTP is ${otp} and it will expire in 10 minutes . Please verify your email to continue and Don't share this OTP with anyone.`,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Rate limiting for OTP resend requests
// Simple in-memory store for rate limiting
const resendAttempts = new Map();

export const checkResendLimit = (userId) => {
    const now = Date.now();
    const userAttempts = resendAttempts.get(userId) || {
        count: 0,
        firstAttempt: now,
        lastAttempt: now
    };

    // Reset counter if it's been more than 1 hour since first attempt
    if (now - userAttempts.firstAttempt > 60 * 60 * 1000) {
        userAttempts.count = 0;
        userAttempts.firstAttempt = now;
    }

    // Check if too many attempts (5 per hour)
    if (userAttempts.count >= 5) {
        // Check if last attempt was less than 10 minutes ago
        if (now - userAttempts.lastAttempt < 10 * 60 * 1000) {
            return {
                allowed: false,
                timeRemaining: Math.ceil((10 * 60 * 1000 - (now - userAttempts.lastAttempt)) / 60000)
            };
        }
    }

    // Update attempts
    userAttempts.count++;
    userAttempts.lastAttempt = now;
    resendAttempts.set(userId, userAttempts);

    return { allowed: true };
};