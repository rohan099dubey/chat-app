import express from 'express';
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    handleFriendRequest,
    getFriends
} from '../controllers/friend.controller.js';

const router = express.Router();

// All routes are protected
router.use(protectRoute);

// Search users
router.get('/search', searchUsers);

// Get friends list
router.get('/userContacts', getFriends);

// Get friend requests
router.get('/requests', getFriendRequests);

// Send friend request
router.post('/request/:userId', sendFriendRequest);

// Handle friend request (accept/reject)
router.put('/request/:requestId', handleFriendRequest);

export default router; 