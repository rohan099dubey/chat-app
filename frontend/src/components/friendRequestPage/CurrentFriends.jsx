import React, { useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CurrentFriends = () => {
  const navigate = useNavigate();
  const {
    users: contacts,
    isUsersLoading,
    getUsers: getUserContacts,
    setSelectedUser,
  } = useChatStore();

  useEffect(() => {
    getUserContacts();
  }, [getUserContacts]);

  const handleContactClick = (contact) => {
    setSelectedUser(contact);
    navigate(`/`); // Navigate to home page with chat
  };

  return (
    <div>
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title flex items-center">
            <User className="size-5 mr-2" />
            Your Contacts
            {contacts?.length > 0 && (
              <span className="badge badge-secondary">{contacts.length}</span>
            )}
          </h2>

          {isUsersLoading ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : contacts?.length > 0 ? (
            <div className="space-y-3 mt-4 divide-y">
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => handleContactClick(contact)}
                  className="py-3 flex items-center justify-between cursor-pointer hover:bg-base-200 rounded-lg px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={contact.profilePic || "/profilepic.png"}
                      alt={contact.fullName || "User"}
                      className="size-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{contact.fullName}</p>
                      <p className="text-sm text-gray-500">
                        @{contact.username}
                      </p>
                    </div>
                  </div>

                  {/* Optional: Show online status */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        contact.isOnline ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <span className="text-sm text-gray-500">
                      {contact.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">
              You don't have any contacts yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentFriends;
