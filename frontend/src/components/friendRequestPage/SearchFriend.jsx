import React from "react";
import { UserPlus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import useFriendStore from "../../store/useFriendStore";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const SearchFriend = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const {
    searchResults,
    isLoading,
    getFriends,
    getFriendRequests,
    searchUsers,
    sendFriendRequest,
    clearSearchResults,
  } = useFriendStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        await Promise.all([getFriends(), getFriendRequests()]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();

    return () => clearSearchResults();
  }, [authUser, navigate, getFriends, getFriendRequests, clearSearchResults]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      toast.error("Please enter a username to search");
      return;
    }

    setIsSearching(true);
    try {
      await searchUsers(searchTerm);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    setIsSending(true);
    try {
      await sendFriendRequest(userId);
    } catch (error) {
      console.error("Failed to send friend request:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title flex items-center">
            <UserPlus className="size-5 mr-2" />
            Find new friends
          </h2>

          <form onSubmit={handleSearch} className="flex gap-2 mt-4">
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || isSearching || !searchTerm.trim()}
            >
              {isSearching ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Search className="size-5" />
              )}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium text-lg">Search Results</h3>
              <div className="max-h-60 overflow-y-auto divide-y">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profilePic || "/profilepic.png"}
                        alt={user.fullName || "User"}
                        className="size-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{user.fullName}</p>{" "}
                        <p className="text-sm text-gray-500">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSendRequest(user._id)}
                      disabled={isSending || isLoading}
                    >
                      {isSending ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        "Send Request"
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchTerm && searchResults.length === 0 && !isSearching && (
            <div className="alert alert-info mt-4">
              <span>No users found with that username.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFriend;
