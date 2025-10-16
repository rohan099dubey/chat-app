import User from '../models/user.model.js';
import { validateProfileImage } from '../lib/fileUtilities.js';
import { supabase } from '../lib/supabase.js';

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, bio, profilePic } = req.body;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (fullName) user.fullName = fullName;
        if (bio !== undefined) user.bio = bio;
        if (profilePic) {
            try {

                validateProfileImage(profilePic);

                // Extract base64 data and create buffer
                const base64Data = profilePic.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');

                // Create filename with userId to ensure uniqueness
                const filename = `${userId}/profile-${Date.now()}.jpg`;

                // Upload to Supabase
                const { error: uploadError } = await supabase.storage
                    .from('profile-pics')
                    .upload(filename, buffer, {
                        contentType: 'image/jpeg',
                        upsert: true // Replace if exists
                    });

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('profile-pics')
                    .getPublicUrl(filename);

                if (!urlData || !urlData.publicUrl) {
                    throw new Error("Failed to get profile picture URL");
                }

                // Update user's profile pic URL
                user.profilePic = urlData.publicUrl;

            } catch (error) {
                console.error("Error processing profile picture:", error);
                return res.status(400).json({ error: "Failed to process profile picture" });
            }
        }

        // Save user
        await user.save();

        // Return updated user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json(userResponse);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}; 