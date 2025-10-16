import User from '../models/user.model.js';

export const searchUsers = async (req, res) => {
    try {
        // Support both q and query parameters for flexibility
        const searchTerm = req.query.q || req.query.query;
        const currentUserId = req.user._id;

        if (!searchTerm) {
            return res.status(400).json({ error: "Search query is required" });
        }

        // Find users by username, excluding current user and existing friends
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ error: "Current user not found" });
        }

        // Find users by username, excluding current user and existing friends
        const users = await User.find({
            $and: [
                { _id: { $ne: currentUserId } }, // Not the current user
                { _id: { $nin: currentUser.friends } }, // Not already friends
                { username: { $regex: searchTerm, $options: 'i' } } // Username matches search term
            ]
        })
            .select('username fullName profilePic')
            .limit(10);



        res.status(200).json(users);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Check if user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if already friends
        if (targetUser.friends.includes(currentUserId)) {
            return res.status(400).json({ error: "Already friends with this user" });
        }

        // Check if request already exists
        const existingRequest = targetUser.friendRequests.find(
            request => request.from.toString() === currentUserId.toString() && request.status === 'pending'
        );

        if (existingRequest) {
            return res.status(400).json({ error: "Friend request already sent" });
        }

        // Add friend request
        targetUser.friendRequests.push({
            from: currentUserId,
            status: 'pending'
        });

        await targetUser.save();

        res.status(200).json({ message: "Friend request sent successfully" });
    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFriendRequests = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const user = await User.findById(currentUserId)
            .populate('friendRequests.from', 'username fullName profilePic')
            .select('friendRequests');

        const pendingRequests = user.friendRequests.filter(
            request => request.status === 'pending'
        );

        res.status(200).json(pendingRequests);
    } catch (error) {
        console.error("Error getting friend requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const handleFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action } = req.body; // 'accept' or 'reject'
        const currentUserId = req.user._id;

        const user = await User.findById(currentUserId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const request = user.friendRequests.id(requestId);
        if (!request) {
            return res.status(404).json({ error: "Friend request not found" });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: "Request already processed" });
        }

        if (action === 'accept') {
            // Add to friends list for both users
            request.status = 'accepted';
            user.friends.push(request.from);

            const otherUser = await User.findById(request.from);
            otherUser.friends.push(currentUserId);
            await otherUser.save();
        } else if (action === 'reject') {
            request.status = 'rejected';
        }

        await user.save();

        res.status(200).json({ message: `Friend request ${action}ed successfully` });
    } catch (error) {
        console.error("Error handling friend request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFriends = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const user = await User.findById(currentUserId)
            .populate('friends', 'username fullName profilePic')
            .select('friends');

        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error getting friends:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}; 