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
            set({ messages: [], isMessageLoading: false });
            return;
        }

        console.log(`[ChatStore] Fetching messages for user ID: ${userId}`);
        set({ isMessageLoading: true, messages: [] });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            console.log("[ChatStore] Messages received:", res.data);
            set({ messages: res.data });
        } catch (error) {
            console.error("[ChatStore] Error fetching messages:", error);
            toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to get messages");
            set({ messages: [] });
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

            console.log("[ChatStore] Sending message to user:", selectedUser._id);
            const res = await axiosInstance.post(
                `/messages/send/${selectedUser._id}`,
                messageData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 60000,
                }
            );
            console.log("[ChatStore] Message sent successfully:", res.data);
            set({ messages: [...messages, res.data] });
            return res.data;
        } catch (error) {
            console.error("[ChatStore] Send message error details:", {
                status: error?.response?.status,
                data: error?.response?.data,
                message: error?.message
            });
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error.message || "Message not sent!";
            toast.error(errorMessage);
            throw error;
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        console.log("[ChatStore] Attempting to subscribe for user:", selectedUser?._id);
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) {
            console.error("[ChatStore] Socket not available for subscription");
            return;
        }

        socket.off("newMessage");
        console.log("[ChatStore] Removed previous 'newMessage' listener.");

        socket.on("newMessage", (newMessage) => {
            console.log("[ChatStore] Received new message via socket:", newMessage);

            const currentSelectedUser = get().selectedUser;
            const currentUser = useAuthStore.getState().authUser;

            if (!currentUser) {
                console.error("[ChatStore] Current auth user not available in socket handler");
                return;
            }
            if (!currentSelectedUser) {
                console.log("[ChatStore] No user selected when message received, ignoring.");
                return;
            }

            const isSenderCurrentUser = newMessage.senderId === currentUser._id;
            const isReceiverCurrentUser = newMessage.receiverId === currentUser._id;
            const isSenderSelectedUser = newMessage.senderId === currentSelectedUser._id;
            const isReceiverSelectedUser = newMessage.receiverId === currentSelectedUser._id;

            const isRelevantMessage =
                (isSenderCurrentUser && isReceiverSelectedUser) ||
                (isReceiverCurrentUser && isSenderSelectedUser);

            if (isRelevantMessage) {
                console.log("[ChatStore] Adding relevant message to state:", newMessage);
                const isDuplicate = get().messages.some(msg => msg._id === newMessage._id);
                if (!isDuplicate) {
                    set(state => ({
                        messages: [...state.messages, newMessage]
                    }));
                } else {
                    console.log("[ChatStore] Duplicate message detected, not adding:", newMessage._id);
                }
            } else {
                console.log("[ChatStore] Received message not relevant to current chat.");
            }
        });
        console.log("[ChatStore] Added 'newMessage' listener for user:", selectedUser._id);
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.off("newMessage");
            console.log("[ChatStore] Unsubscribed from 'newMessage'.");
        }
    },

    setSelectedUser: (newUser) => {
        const previousUser = get().selectedUser;
        console.log(`[ChatStore] setSelectedUser called. Previous: ${previousUser?._id}, New: ${newUser?._id}`);

        if (newUser?._id !== previousUser?._id) {
            set({ selectedUser: newUser });
            console.log("[ChatStore] Updated selectedUser state.");

            if (newUser?._id) {
                console.log("[ChatStore] Triggering getMessages for new user.");
                get().getMessages(newUser._id);
            } else {
                console.log("[ChatStore] No new user selected, clearing messages.");
                set({ messages: [] });
            }

            setTimeout(() => {
                console.log("[ChatStore] Re-subscribing to messages after user change.");
                get().unsubscribeFromMessages();
                if (newUser?._id) {
                    get().subscribeToMessages();
                }
            }, 0);
        } else {
            console.log("[ChatStore] Selected user is the same, no action taken.");
        }
    },

    clearMessages: () => {
        console.log("[ChatStore] Clearing messages.");
        set({ messages: [] });
    }
}));