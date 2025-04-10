// frontend/src/components/homePage/chatPage/MessageDisplay.jsx
import React, { useRef, useEffect } from "react";
import { useChatStore } from "../../../store/useChatStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { formatMessageTime, formatFileSize } from "../../../utils/formatters";
import { File, Image as ImageIcon, Music, Video, FileText } from "lucide-react";
// Removed useParams since we won't fetch based on URL here anymore
// import { useParams } from "react-router-dom";

const MessageDisplay = () => {
  // Removed: const { id: chatUserId } = useParams();
  const { messages, isMessageLoading, selectedUser } = useChatStore(); // Removed getMessages dependency here
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // Debug logs to help identify issues
  useEffect(() => {
    console.log("MessageDisplay - Rendering with messages:", messages);
    console.log("MessageDisplay - Selected user:", selectedUser);
    console.log("MessageDisplay - Messages loading:", isMessageLoading);
  }, [messages, selectedUser, isMessageLoading]);

  // REMOVED the useEffect hook that fetched messages based on chatUserId and selectedUser
  // useEffect(() => {
  //   if (chatUserId && selectedUser) {
  //     console.log("Fetching messages for user:", chatUserId);
  //     getMessages(chatUserId);
  //   }
  // }, [chatUserId, selectedUser, getMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    console.log("MessageDisplay - Scrolling to bottom due to message change."); // Debug log
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({
        behavior: "smooth", // Changed from "auto" for better UX, keep as "auto" if preferred
        block: "end",
      });
    }
  }, [messages]); // Only depends on messages now

  if (isMessageLoading) {
    console.log("MessageDisplay - Showing loading spinner."); // Debug log
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  // Ensure selectedUser is available before rendering messages for that user
  if (!selectedUser) {
    console.log("MessageDisplay - No selected user, showing placeholder."); // Debug log
    return (
      <div className="text-center text-gray-500 p-8 flex items-center justify-center h-full">
        Select a chat to start messaging.
      </div>
    );
  }

  // --- Add Check for Auth User ---
  if (!authUser) {
    // Optionally show a loading state or just prevent rendering messages
    console.log("MessageDisplay - Auth user not available yet.");
    return <div className="p-4 text-center">Loading user info...</div>; // Or null, or a spinner
  }
  // --- End Check ---

  // --- Helper function to render file based on type (Download buttons REMOVED) ---
  const renderFileContent = (file) => {
    if (!file || !file.type || !file.url) {
      return (
        <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg text-error-content">
          <File className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm italic">Invalid file data</span>
        </div>
      );
    }

    const fileType = file.type;
    const fileUrl = file.url;
    const fileName = file.originalName || "file";
    const fileSize = file.size ? formatFileSize(file.size) : "";

    // Image rendering
    if (fileType.startsWith("image/")) {
      return (
        <div className="relative max-w-[250px] sm:max-w-[350px]">
          <img
            src={fileUrl}
            alt={fileName}
            className="rounded-md object-cover max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(fileUrl, "_blank")}
            onError={(e) => {
              console.error("Image load error:", fileUrl);
              e.target.src = "/placeholder-image.png";
              e.target.alt = "Image failed to load";
              e.target.style.cursor = "default";
              e.target.onclick = null;
            }}
          />
        </div>
      );
    }

    // Audio rendering
    if (fileType.startsWith("audio/")) {
      return (
        <div className="w-full max-w-[300px] p-2 bg-base-200 rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Music className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate" title={fileName}>
                {fileName}
              </span>
            </div>
          </div>
          <audio controls className="w-full">
            <source src={fileUrl} type={fileType} />
            Your browser does not support the audio element. ({fileName})
          </audio>
          {fileSize && (
            <span className="text-xs text-base-content/60 self-end">
              {fileSize}
            </span>
          )}
        </div>
      );
    }

    // Video rendering
    if (fileType.startsWith("video/")) {
      return (
        <div className="w-full max-w-[350px] p-2 bg-base-200 rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Video className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate" title={fileName}>
                {fileName}
              </span>
            </div>
          </div>
          <video controls className="w-full rounded">
            <source src={fileUrl} type={fileType} />
            Your browser does not support the video tag. ({fileName})
          </video>
          {fileSize && (
            <span className="text-xs text-base-content/60 self-end">
              {fileSize}
            </span>
          )}
        </div>
      );
    }

    // Default/Document rendering
    let IconComponent = FileText;
    if (fileType === "application/pdf") IconComponent = FileText; // Could use specific PDF icon
    if (
      fileType.startsWith("application/msword") ||
      fileType.startsWith(
        "application/vnd.openxmlformats-officedocument.wordprocessingml"
      )
    )
      IconComponent = FileText; // Word icon?
    // Add more specific icons if desired

    return (
      <div className="flex items-center w-full max-w-[300px] gap-3 p-3 bg-base-200 rounded-lg">
        <IconComponent className="w-5 h-5 flex-shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium truncate block hover:underline"
            title={`View ${fileName}`}
          >
            {fileName}
          </a>
          {fileSize && (
            <span className="text-xs text-base-content/60">{fileSize}</span>
          )}
        </div>
      </div>
    );
  };
  // --- End Helper function ---

  return (
    <div className="p-4 space-y-4 min-h-0">
      {Array.isArray(messages) && messages.length > 0 && authUser?._id
        ? messages.map((message) => {
            // --- Log the values right before comparison ---
            console.log(
              `Msg ID: ${message._id}, Sender ID: ${
                message.senderId
              } (Type: ${typeof message.senderId}), AuthUser ID: ${
                authUser._id
              } (Type: ${typeof authUser._id}), CreatedAt: ${message.createdAt}`
            );
            // --- End Log ---

            const isSentByMe =
              String(message.senderId) === String(authUser._id);

            return (
              <div
                key={message._id}
                className={`chat ${isSentByMe ? "chat-end" : "chat-start"}`}
              >
                {/* Avatar */}
                <div className="chat-image avatar">
                  <div className="size-8 sm:size-10 rounded-full border">
                    <img
                      src={
                        isSentByMe
                          ? authUser.profilePic || "/profilepic.png"
                          : selectedUser?.profilePic || "/profilepic.png"
                      }
                      alt="profile pic"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                {/* Header */}
                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">
                    {/* Ensure formatMessageTime is called */}
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                {/* Bubble */}
                <div className="chat-bubble flex flex-col gap-1 max-w-[85vw] sm:max-w-[70vw] md:max-w-[60vw]">
                  {message.file && (
                    <div className="mt-1 mb-1">
                      {renderFileContent(message.file)}
                    </div>
                  )}
                  {message.text && (
                    <p className="break-words whitespace-pre-wrap">
                      {message.text}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        : !isMessageLoading && (
            <div className="text-center text-gray-500 py-8">
              No messages yet with {selectedUser?.fullName}. Start the
              conversation!
            </div>
          )}
      <div ref={messageEndRef} style={{ height: "1px" }} />
    </div>
  );
};

export default MessageDisplay;
