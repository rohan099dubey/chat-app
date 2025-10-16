import React from "react";
import { Camera } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

const UserAvatar = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      // Create an image element for compression
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        const maxDimension = 800;

        if (width > height && width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with reduced quality
        const compressedImage = canvas.toDataURL("image/jpeg", 0.8);
        setSelectedImg(compressedImage);

        try {
          // Send to backend for Supabase upload
          await updateProfile({ profilePic: compressedImage });
          toast.success("Profile picture updated successfully");
        } catch (error) {
          toast.error("Failed to update profile picture");
          setSelectedImg(null);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <img
          src={selectedImg || authUser.profilePic || "/pofilepic.png"}
          alt="Profile"
          className="size-32 rounded-full object-cover border-4 "
        />
        <label
          htmlFor="avatar-upload"
          className={`
        absolute bottom-0 right-0 
        bg-base-content hover:scale-105
        p-2 rounded-full cursor-pointer 
        transition-all duration-200
        ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
      `}
        >
          <Camera className="w-5 h-5 text-base-200" />
          <input
            type="file"
            id="avatar-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUpdatingProfile}
          />
        </label>
      </div>
      <p className="text-sm text-zinc-400">
        {isUpdatingProfile
          ? "Uploading..."
          : "Click the camera icon to update your photo"}
      </p>
    </div>
  );
};

export default UserAvatar;
