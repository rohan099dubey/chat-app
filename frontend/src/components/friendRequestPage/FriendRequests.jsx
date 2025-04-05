import SearchFriend from "./SearchFriend";
import PendingRequests from "./PendingRequests";
import CurrentFriends from "./CurrentFriends";

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const FriendRequestsPage = () => {
  return (
    <div className="container mx-auto max-w-3xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Friend Requests</h1>
        <Link to="/" className="btn btn-ghost btn-sm mr-4">
          <ArrowLeft className="size-5" />
        </Link>
      </div>

      <SearchFriend />

      <PendingRequests />

      <CurrentFriends />
    </div>
  );
};

export default FriendRequestsPage;
