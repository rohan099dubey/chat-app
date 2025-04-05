import React from "react";
import { Check, X } from "lucide-react";
import useFriendStore from "../../store/useFriendStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const PendingRequests = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const {
    friendRequests,
    isLoading,
    getFriends,
    getFriendRequests,
    handleFriendRequest,
    clearSearchResults,
  } = useFriendStore();

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        await Promise.all([getFriendRequests()]);
        console.log("Friend requests loaded:", friendRequests);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();

    return () => clearSearchResults();
  }, [authUser, navigate, getFriendRequests, clearSearchResults]);

  const handleRequestAction = async (requestId, action) => {
    try {
      await handleFriendRequest(requestId, action);
      // Refresh the requests after handling
      await getFriendRequests();
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
    }
  };

  return (
    <div>
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title">
            Pending Requests
            {friendRequests.length > 0 && (
              <span className="badge badge-primary">
                {friendRequests.length}
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : friendRequests.length > 0 ? (
            <div className="space-y-3 mt-4 divide-y">
              {friendRequests.map((request) => (
                <div
                  key={request._id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={request.from?.profilePic || "/profilepic.png"}
                      alt={request.from?.fullName || "User"}
                      className="size-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{request.from?.fullName}</p>
                      <p className="text-sm text-gray-500">
                        @{request.from?.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-success btn-sm btn-circle"
                      onClick={() => handleRequestAction(request._id, "accept")}
                      title="Accept"
                      disabled={isLoading}
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      className="btn btn-error btn-sm btn-circle"
                      onClick={() => handleRequestAction(request._id, "reject")}
                      title="Reject"
                      disabled={isLoading}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">
              No pending friend requests
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingRequests;
