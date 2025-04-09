import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export const useFriendStore = create((set, get) => ({
    friends: [],
    friendRequests: [],
    searchResults: [],
    isLoading: false,
    error: null,

    getUserContacts: async () => {
        try {
            set({ isLoading: true, error: null });
            const res = await axiosInstance.get('/contacts/userContacts');
            set({ friends: res.data });
            return res.data;
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to get friends';
            console.error('Error getting friends:', errorMsg);
            set({ error: errorMsg });
            toast.error(errorMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    searchUsers: async (query) => {
        if (!query || query.trim().length === 0) {
            toast.error('Please enter a search term');
            return;
        }

        try {
            set({ isLoading: true, error: null });
            console.log('Searching for users with query:', query);
            const encodedQuery = encodeURIComponent(query);
            const res = await axiosInstance.get(`/contacts/search?q=${encodedQuery}`);
            console.log('Search results:', res.data);
            set({ searchResults: res.data });

            if (res.data.length === 0) {
                toast.info('No users found');
            }

            return res.data;
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to search users';
            console.error('Error searching users:', errorMsg);
            set({ error: errorMsg });
            toast.error(errorMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    sendFriendRequest: async (userId) => {
        try {
            set({ isLoading: true, error: null });
            const res = await axiosInstance.post(`/contacts/request/${userId}`);
            set((state) => ({
                searchResults: state.searchResults.filter(user => user._id !== userId)
            }));
            toast.success(res.data?.message || 'Friend request sent!');
            return true;
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to send friend request';
            console.error('Error sending friend request:', errorMsg);
            set({ error: errorMsg });
            toast.error(errorMsg);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    getFriendRequests: async () => {
        try {
            set({ isLoading: true, error: null });
            const res = await axiosInstance.get('/contacts/requests');
            set({ friendRequests: res.data });
            return res.data;
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to get friend requests';
            console.error('Error getting friend requests:', errorMsg);
            set({ error: errorMsg });
            toast.error(errorMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    handleFriendRequest: async (requestId, action) => {
        try {
            set({ isLoading: true, error: null });
            const res = await axiosInstance.put(`/contacts/request/${requestId}`, { action });

            // Update requests list
            const updatedRequests = get().friendRequests.filter(req => req._id !== requestId);
            set({ friendRequests: updatedRequests });

            // Refresh friends list after accepting a request
            if (action === 'accept') {
                await get().getUserContacts();
            }

            toast.success(res.data?.message || `Friend request ${action}ed successfully`);
            return true;
        } catch (error) {
            const errorMsg = error.response?.data?.error || `Failed to ${action} friend request`;
            console.error(`Error ${action}ing friend request:`, errorMsg);
            set({ error: errorMsg });
            toast.error(errorMsg);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    clearSearchResults: () => {
        set({ searchResults: [] });
    },

    clearError: () => {
        set({ error: null });
    }
}));
