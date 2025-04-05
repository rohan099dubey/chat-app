import { create } from "zustand";
import toast from 'react-hot-toast'
import { axiosInstance } from '../lib/axios.js'
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessageLoading: false,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/contacts/userContacts");
            set({ users: res.data });
        } catch (error) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch friends";
            console.error("Error fetching friends:", errorMessage);
            toast.error(errorMessage);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        if (!userId) {
            console.error("No user ID provided to getMessages");
            return;
        }

        set({ isMessageLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to get messages");
        } finally {
            set({ isMessageLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();

        if (!selectedUser) {
            toast.error("Please select a user to send message");
            return;
        }

        try {
            if (!(messageData instanceof FormData)) {
                throw new Error("Message data must be FormData");
            }

            // Debug logs to verify data
            console.log("Selected user:", selectedUser._id);

            const res = await axiosInstance.post(
                `/messages/send/${selectedUser._id}`,
                messageData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 60000, // Increased timeout for file uploads
                }
            );

            // Log successful response
            console.log("Message sent successfully:", res.data);

            // Update messages state with the new message
            set({ messages: [...messages, res.data] });
            return res.data;
        } catch (error) {
            console.error("Send message error details:", {
                status: error?.response?.status,
                data: error?.response?.data,
                message: error?.message
            });

            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error.message ||
                "Message not sent!";
            toast.error(errorMessage);
            throw error;
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) {
            console.error("Socket not available");
            return;
        }

        // Remove any existing listeners to avoid duplicates
        socket.off("newMessage");

        // Add new listener
        socket.on("newMessage", (newMessage) => {
            // Add logging to debug message reception
            console.log("Received new message:", newMessage);

            const currentUser = useAuthStore.getState().authUser;

            // Check if message is from or to the selected user and current user
            const isSenderCurrentUser = newMessage.senderId === currentUser._id;
            const isReceiverCurrentUser = newMessage.receiverId === currentUser._id;
            const isSenderSelectedUser = newMessage.senderId === selectedUser._id;
            const isReceiverSelectedUser = newMessage.receiverId === selectedUser._id;

            const isRelevantMessage =
                (isSenderCurrentUser && isReceiverSelectedUser) ||
                (isReceiverCurrentUser && isSenderSelectedUser);

            if (isRelevantMessage) {
                // Debug message
                console.log("Adding message to state:", newMessage);

                // Check for duplicate message
                const state = get();
                const isDuplicate = state.messages.some(msg => msg._id === newMessage._id);

                if (!isDuplicate) {
                    set(state => ({
                        messages: [...state.messages, newMessage]
                    }));
                }
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.off("newMessage");
        }
    },

    setSelectedUser: (selectedUser) => {
        set({ selectedUser });

        // Re-subscribe to messages when selected user changes
        setTimeout(() => {
            get().subscribeToMessages();
        }, 0);
    },

    clearMessages: () => {
        set({ messages: [] });
    }
}));