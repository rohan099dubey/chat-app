import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import useFriendStore from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UserPlus, BellDot } from "lucide-react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const { clearSearchResults, friendRequests, getFriendRequests } =
    useFriendStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    return () => {
      clearSearchResults();
    };
  }, [clearSearchResults]);

  useEffect(() => {
    if (users) {
      const filtered = users.filter((user) => {
        const isOnline = !showOnlineOnly || onlineUsers.includes(user._id);
        return isOnline;
      });

      setFilteredUsers(filtered);
    }
  }, [users, showOnlineOnly, onlineUsers]);

  useEffect(() => {
    getFriendRequests();
  }, [getFriendRequests]);

  return (
    <div className="h-full flex flex-col">
      {/* Header section with controls */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="font-medium">Contacts</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/friend-requests"
              className="btn btn-sm btn-ghost btn-circle relative"
              title="Friend Requests"
            >
              <BellDot className="w-5 h-5" />
              {friendRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
              )}
            </Link>
            <Link
              to="/friend-requests"
              className="btn btn-sm btn-ghost btn-circle"
              title="Find Friends"
            >
              <UserPlus className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Online filter toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-sm checkbox-primary"
            checked={showOnlineOnly}
            onChange={() => setShowOnlineOnly(!showOnlineOnly)}
          />
          <span className="text-sm">Show online users only</span>
        </label>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto p-2">
        {isUsersLoading ? (
          <SidebarSkeleton />
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors rounded-lg
                ${
                  selectedUser?._id === user._id
                    ? "bg-base-300 ring-1 ring-base-300"
                    : ""
                }
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/profilepic.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-base-100"
                  />
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-base-content/70 truncate">
                  @{user.username}
                </div>
                <div className="text-sm text-base-content/60">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center text-base-content/60 py-4">
            {showOnlineOnly ? "No online friends" : "No friends yet"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
