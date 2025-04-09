// ChatContainer.jsx - Updated version
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import ChatHeader from "./chatPage/ChatHeader.jsx";
import MessageInput from "./chatPage/MessageInput.jsx";
import MessageDisplay from "./chatPage/MessageDisplay.jsx";

const ChatContainer = () => {
  const { id: chatUserId } = useParams();
  const {
    getMessages,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    setSelectedUser,
  } = useChatStore();

  // Load messages and set up subscriptions when component mounts
  useEffect(() => {
    console.log("ChatContainer mounted with chatUserId:", chatUserId);

    if (chatUserId && selectedUser) {
      // Make sure we get messages for this user
      getMessages(chatUserId);

      // Set up real-time message subscription
      subscribeToMessages();
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [
    chatUserId,
    selectedUser,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />

      {/* Flex-grow container with overflow for messages */}
      <div className="flex-grow overflow-y-auto">
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
