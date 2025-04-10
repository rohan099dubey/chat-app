// frontend/src/components/homePage/ChatContainer.jsx
import React from "react"; // Removed useEffect
// Removed useParams
import { useChatStore } from "../../store/useChatStore.js";
// Removed useAuthStore (if not used elsewhere here)
import ChatHeader from "./chatPage/ChatHeader.jsx";
import MessageInput from "./chatPage/MessageInput.jsx";
import MessageDisplay from "./chatPage/MessageDisplay.jsx";

const ChatContainer = () => {
  // Removed the useEffect for fetching messages and subscribing/unsubscribing
  // This logic is now handled within useChatStore's setSelectedUser and subscribeToMessages

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />

      {/* Flex-grow container with overflow for messages */}
      <div className="flex-grow overflow-y-auto">
        {/* MessageDisplay will react to changes in the messages state from the store */}
        <MessageDisplay />
      </div>

      {/* Fixed position at bottom for input */}
      <div className="flex-shrink-0 border-t">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatContainer;
