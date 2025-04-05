import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import useFriendStore from "../../store/useFriendStore.js";
import { useParams } from "react-router-dom";

import ChatHeader from "./chatPage/ChatHeader.jsx";
import MessageInput from "./chatPage/MessageInput.jsx";
import MessageSkeleton from "../skeletons/MessageSkeleton.jsx";
import { formatMessageTime } from "../../utils/formatters.js";
import { File, Download } from "lucide-react";

const ChatContainer = () => {
  const { id: chatUserId } = useParams();
  const {
    messages,
    getMessages,
    isMessageLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const { friends } = useFriendStore();
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (chatUserId) {
      getMessages(chatUserId);
    }
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
    };
  }, [getMessages, chatUserId]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

        // Adjust max-width for different screen sizes
        if (isMobile) {
          container.style.maxWidth = "100%";
        } else if (isTablet) {
          container.style.maxWidth = "80%";
        } else {
          container.style.maxWidth = "60%";
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper function to handle file opening in new tab
  const openFileInNewTab = (file) => {
    if (file.type.startsWith("image/")) {
      window.open(file.url, "_blank");
    } else if (file.type === "application/pdf") {
      window.open(`${file.url}#view=FitH`, "_blank");
    } else if (file.type === "text/plain") {
      window.open(file.url, "_blank");
    } else {
      // Use Google Docs Viewer for other document types
      const encodedUrl = encodeURIComponent(file.url);
      window.open(
        `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
        "_blank"
      );
    }
  };

  if (isMessageLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Select a Friend to Chat
          </h2>
          <p className="text-gray-500">
            Choose a Contact from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 mx-auto w-full"
      >
        {messages?.map((message, index) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="size-8 sm:size-10 rounded-full border">
                <im
                  g
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/profilepic.png"
                      : selectedUser.profilePic || "/profilepic.png"
                  }
                  alt="profile pic"
                  className="object-cover"
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
                  {message.file?.type?.startsWith("image/") ? (
                    <div className="relative group cursor-pointer max-w-[200px] sm:max-w-[300px]">
                      <img
                        src={message.file.url}
                        alt="Attachment"
                        className="rounded-md hover:opacity-90 transition-opacity max-w-full"
                        onClick={() => openFileInNewTab(message.file)}
                        onError={(e) => {
                          console.error("Image load error");
                          e.target.src =
                            "https://via.placeholder.com/200x200?text=Image+Error";
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <a
                          href={message.file.url}
                          download={message.file.originalName}
                          className="btn btn-circle btn-xs bg-black/50 hover:bg-black/70 border-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="h-3 w-3 text-white" />
                        </a>
                      </div>
                    </div>
                  ) : message.file?.type?.startsWith("audio/") ? (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {message.file.originalName}
                        </span>
                        <a
                          href={message.file.url}
                          download={message.file.originalName}
                          className="btn btn-circle btn-xs bg-base-300 hover:bg-base-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="h-3 w-3" />
                        </a>
                      </div>
                      <audio
                        controls
                        className="w-full max-w-[240px] sm:max-w-[300px]"
                      >
                        <source
                          src={message.file.url}
                          type={message.file.type}
                        />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : (
                    <div className="flex items-center w-full gap-2 p-2 bg-base-200 rounded-lg">
                      <File className="w-4 h-4 sm:w-5 sm:h-5" />
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => openFileInNewTab(message.file)}
                      >
                        <span className="text-sm font-medium truncate block">
                          {message.file.originalName}
                        </span>
                        <span className="text-xs text-base-content/60">
                          {(message.file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                      <a
                        href={message.file.url}
                        download={message.file.originalName}
                        className="btn btn-circle btn-xs sm:btn-sm bg-base-300 hover:bg-base-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      </a>
                    </div>
                  )}
                </div>
              )}
              {message.text && (
                <p className="break-words whitespace-pre-wrap">
                  {message.text}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
