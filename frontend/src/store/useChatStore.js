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
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            const errorMessage = error?.response?.data?.message || "Failed to fetch users";
            console.error(errorMessage);
            toast.error(errorMessage);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessageLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response.data.message || "getMessages");
        } finally {
            set({ isMessageLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();

        // Add selected user check
        if (!selectedUser) {
            toast.error("Please select a user to send message");
            return;
        }

        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Message not sent!");
            throw error;
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();

        if (!selectedUser) {
            console.error("No selected user to subscribe to messages.");
            return;
        }

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {

            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (!isMessageSentFromSelectedUser) {
                return;
            }

            if (newMessage.senderId !== selectedUser._id) return; // Ignore messages not for the selected user

            // Check if the new message is already in the messages array    
            set({
                messages: [...get().messages, newMessage],
            })
        })
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),
}))