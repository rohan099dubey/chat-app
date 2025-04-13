import cron from 'node-cron';
import User from '../models/user.model.js';

// Function to delete unverified users
export const cleanupUnverifiedUsers = async () => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Find and delete unverified users older than 24 hours
        const result = await User.deleteMany({
            isVerified: false,
            createdAt: { $lt: twentyFourHoursAgo }
        });
        
        console.log(`Cleanup job completed: ${result.deletedCount} unverified users deleted`);
    } catch (error) {
        console.error('Error in cleanup job:', error);
    }
};

// Schedule the cleanup job to run every day at midnight
export const scheduleCleanupJob = () => {
    // Runs at 00:00 every day
    cron.schedule('0 0 * * *', cleanupUnverifiedUsers);
    console.log('Scheduled cleanup job for unverified users');
};
