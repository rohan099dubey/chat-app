import React from "react";
import { Mail, User, User2 } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
const UserInfo = () => {
  const { authUser } = useAuthStore();
  return (
    <div>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-sm text-zinc-400 font-medium flex items-center gap-2">
            <User2 className="w-4 h-4" />
            Username
          </div>
          <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
            {authUser?.username}
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="text-sm text-zinc-400 font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            Full Name
          </div>
          <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
            {authUser?.fullName}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="text-sm text-zinc-400 font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </div>
          <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
            {authUser?.email}
          </p>
        </div>
      </div>
      <div className="mt-6 bg-base-300 rounded-xl p-6">
        <h2 className="text-lg font-medium  mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 ">
            <span>Member Since</span>
            <span>{authUser.createdAt.split("T")[0]}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-zinc-700">
            <span>Total Friends</span>
            <span>{authUser.friends.length}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Account Status</span>
            <span className="text-green-500">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
