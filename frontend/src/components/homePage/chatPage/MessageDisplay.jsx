// MessageDisplay.jsx - Updated version
import React, { useRef, useEffect } from "react";
import { useChatStore } from "../../../store/useChatStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { formatMessageTime } from "../../../utils/formatters";
import { File, Download } from "lucide-react";
import { useParams } from "react-router-dom";

const MessageDisplay = () => {
  const { id: chatUserId } = useParams();
  const { messages, isMessageLoading, selectedUser, getMessages } =
    useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // Debug logs to help identify issues
  useEffect(() => {
    console.log("MessageDisplay - Current messages:", messages);
    console.log("MessageDisplay - Selected user:", selectedUser);
    console.log("MessageDisplay - Messages loading:", isMessageLoading);
  }, [messages, selectedUser, isMessageLoading]);

  // Fetch messages when component mounts or user changes
  useEffect(() => {
    if (chatUserId && selectedUser) {
      console.log("Fetching messages for user:", chatUserId);
      getMessages(chatUserId);
    }
  }, [chatUserId, selectedUser, getMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  if (isMessageLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {Array.isArray(messages) && messages.length > 0 ? (
        messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="size-8 sm:size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/profilepic.png"
                      : selectedUser?.profilePic || "/profilepic.png"
                  }
                  alt="profile pic"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col gap-2 max-w-[85vw] sm:max-w-[70vw] md:max-w-[60vw]">
              {message.file && (
                <div className="flex items-center gap-2">
                  {/* File display logic here (keeping your existing code) */}
                </div>
              )}
              {message.text && (
                <p className="break-words whitespace-pre-wrap">
                  {message.text}
                </p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-8">
          No messages yet. Start the conversation!
        </div>
      )}
      <div ref={messageEndRef} />
    </div>
  );
};

export default MessageDisplay;
