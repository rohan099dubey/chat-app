import { create } from 'zustand'
import { axiosInstance } from '../lib/axios.js'
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

// const BASE_URL = "http://10.1.5.67:3000/api";
// const BASE_URL = "http://localhost:3000";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";



export const useAuthStore = create((set, get) => ({

    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check")
            set({ authUser: res.data });
            get().connectSocket();
        } catch (error) {
            set({ authUser: null });
            console.log("Error in checkAuth:", error)
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);

            // If verification is required, don't set the user yet
            if (res.data.requiresVerification) {
                toast.success("Account created! Please verify your email");
                return res.data;
            } else {
                // Legacy flow if verification is not required
                set({ authUser: res.data });
                toast.success("Account created successfully");
                get().connectSocket();
                return res.data;
            }
        } catch (error) {
            const errorMsg = error?.response?.data?.error || error?.response?.data?.message || "Signup failed!";
            toast.error(errorMsg);
            throw new Error(errorMsg);
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            if (!data.email) {
                throw new Error("Email is required");
            }

            if (!data.password) {
                throw new Error("Password is required");
            }

            const res = await axiosInstance.post("/auth/login", data);

            // Check if response indicates user needs to verify email
            if (res.data.isVerified === false) {
                return res.data; // Return data containing email for verification
            }

            set({ authUser: res.data });
            toast.success("Logged in successfully");
            get().connectSocket();
            return res.data;
        } catch (error) {
            const errorMsg = error?.response?.data?.error || error?.response?.data?.message || error.message || "Login failed!";
            toast.error(errorMsg);
            throw new Error(errorMsg);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Logout failed!");
        }
    },

    updateProfile: async (userData) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", userData);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
            return res.data;
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error(error?.response?.data?.error || "Failed to update profile");
            throw error;
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    // Verify OTP for email verification
    verifyOTP: async (email, otp) => {
        try {
            const res = await axiosInstance.post("/auth/verify-otp", { email, otp });
            set({ authUser: res.data });
            get().connectSocket();
            return res.data;
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "OTP verification failed";
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }
    },

    // Resend OTP for email verification
    resendOTP: async (email) => {
        try {
            await axiosInstance.post("/auth/resend-otp", { email });
            return true;
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "Failed to resend OTP";
            throw new Error(errorMsg);
        }
    },

    connectSocket: () => {
        const { authUser } = get();
        if (!authUser) return;

        // Close any existing connection
        if (get().socket) {
            get().socket.disconnect();
        }

        try {
            console.log("Connecting socket for user:", authUser._id);
            const socket = io(BASE_URL, {
                query: { userId: authUser._id },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socket.on("connect", () => {
                console.log("Socket connected successfully");
            });

            socket.on("connect_error", (err) => {
                console.error("Socket connection error:", err);
            });

            set({ socket });

            socket.on("getOnlineUsers", (userIds) => {
                console.log("Online users received:", userIds);
                set({ onlineUsers: userIds });
            });
        } catch (err) {
            console.error("Socket initialization error:", err);
        }
    },

    disconnectSocket: () => {
        if (get().socket?.connected) {
            get().socket.disconnect();
            set({ socket: null });
        }
    },

}))