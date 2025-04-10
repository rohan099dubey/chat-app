// frontend/src/components/homePage/chatPage/MessageDisplay.jsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useChatStore } from "../../../store/useChatStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { formatMessageTime, formatFileSize } from "../../../utils/formatters";
import {
  File,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  Mic,
  Pause,
  Play,
  Volume2,
  Check,
  CheckCheck,
} from "lucide-react";
// Removed useParams since we won't fetch based on URL here anymore
// import { useParams } from "react-router-dom";

// Audio Player Component - Separate for better organization
const AudioMessage = ({ file, messageId, isSent }) => {
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    loading: true,
  });

  const audioRef = useRef(null);

  // Format time (1:23)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Toggle play/pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAudioState((prev) => ({ ...prev, isPlaying: true }));
          })
          .catch((error) => {
            console.error("Playback failed:", error);
            setAudioState((prev) => ({ ...prev, isPlaying: false }));
          });
      }
    } else {
      audio.pause();
      setAudioState((prev) => ({ ...prev, isPlaying: false }));
    }
  };

  // Update progress while playing
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentTime = audio.currentTime;
    const duration = audio.duration || 1;
    const progress = (currentTime / duration) * 100;

    setAudioState((prev) => ({
      ...prev,
      currentTime,
      progress,
    }));
  };

  // Generate waveform based on messageId for consistency
  const waveform = useMemo(() => {
    // Use messageId as seed for consistency
    const seed = messageId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Generate bars
    const bars = [];
    const barCount = 40; // More bars for smoother appearance

    for (let i = 0; i < barCount; i++) {
      // Deterministic but varied heights
      const x = Math.sin(seed + i * 0.4) * 10000;
      const randomValue = x - Math.floor(x);

      // Height between 15% and 100%
      const heightPercent = 15 + randomValue * 85;

      bars.push(heightPercent);
    }

    return bars;
  }, [messageId]);

  // Handle audio loaded
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      setAudioState((prev) => ({
        ...prev,
        duration: audio.duration,
        loading: false,
      }));
    };

    const handleEnded = () => {
      setAudioState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        progress: 0,
      }));

      // Reset audio current time to beginning
      audio.currentTime = 0;
    };

    const handleError = () => {
      setAudioState((prev) => ({
        ...prev,
        loading: false,
        error: true,
      }));
    };

    // Add event listeners
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Cleanup
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      if (!audio.paused) {
        audio.pause();
      }
    };
  }, []);

  // File info
  const fileUrl = file.url;
  const fileName = file.originalName || "Voice message";
  const fileSize = file.size ? formatFileSize(file.size) : "";

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-sm ${
        isSent ? "bg-opacity-95" : "bg-opacity-95"
      }`}
    >
      {/* Header with filename */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
            {fileName}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatTime(audioState.duration)}
        </span>
      </div>

      {/* Audio Player */}
      <div className="flex items-center px-3 py-2.5 gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            audioState.isPlaying
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          aria-label={audioState.isPlaying ? "Pause" : "Play"}
        >
          {audioState.loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          ) : audioState.isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        {/* Waveform - non-interactive */}
        <div className="relative flex-grow h-12">
          {/* Static waveform display */}
          <div className="absolute inset-0 flex items-center">
            {waveform.map((height, index) => (
              <div
                key={index}
                className="h-full flex items-center justify-center flex-1 px-0.5"
              >
                <div
                  className={`w-full rounded-sm transition-all duration-200 ${
                    (index / waveform.length) * 100 <= audioState.progress
                      ? "bg-primary dark:bg-primary"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  style={{
                    height: `${height}%`,
                    // Add subtle variation to transition time for more natural feel
                    transitionDuration: `${200 + (index % 5) * 50}ms`,
                  }}
                ></div>
              </div>
            ))}
          </div>

          {/* Progress indicator overlay */}
          {audioState.progress > 0 && (
            <div
              className="absolute top-0 h-full bg-primary bg-opacity-10 dark:bg-opacity-20 pointer-events-none"
              style={{ width: `${audioState.progress}%` }}
            ></div>
          )}
        </div>
      </div>

      {/* Footer with time display and status */}
      <div className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
        <span>{formatTime(audioState.currentTime)}</span>

        <div className="flex items-center">
          {fileSize && <span className="mr-2">{fileSize}</span>}
          {isSent && (
            <span className="flex items-center">
              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
            </span>
          )}
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={fileUrl}
        preload="metadata"
        className="hidden"
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
};

const MessageDisplay = () => {
  // Removed: const { id: chatUserId } = useParams();
  const { messages, isMessageLoading, selectedUser } = useChatStore(); // Removed getMessages dependency here

  //audio player
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // Track state for each audio message
  const [audioStates, setAudioStates] = useState({});
  // Store refs for all audio elements
  const audioRefs = useRef({});

  // Initialize or update audio state for a specific message
  const updateAudioState = (messageId, updates) => {
    setAudioStates((prev) => ({
      ...prev,
      [messageId]: {
        ...(prev[messageId] || {
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          progress: 0,
          playheadPosition: 43, // Default position (6 bars × 7px + 5px gap)
        }),
        ...updates,
      },
    }));
  };

  // Function to toggle play/pause for a specific audio message
  const togglePlayMessage = (messageId) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;

    if (audio.paused) {
      // Stop any other playing audio first
      Object.entries(audioRefs.current).forEach(([id, audioElement]) => {
        if (id !== messageId && !audioElement.paused) {
          audioElement.pause();
          updateAudioState(id, { isPlaying: false });
        }
      });

      // Play this audio
      audio.play();
      updateAudioState(messageId, { isPlaying: true });
    } else {
      audio.pause();
      updateAudioState(messageId, { isPlaying: false });
    }
  };

  // Handle time update to update progress
  const handleTimeUpdate = (messageId) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;

    const currentTime = audio.currentTime;
    const duration = audio.duration || 1; // Prevent division by zero
    const progress = (currentTime / duration) * 100;

    // Calculate playhead position based on progress across the FULL waveform width
    const maxPosition = 185; // Total SVG width
    const playheadPosition = (progress / 100) * maxPosition;

    updateAudioState(messageId, {
      currentTime,
      duration,
      progress,
      playheadPosition,
    });
  };

  // Function to seek within the audio
  const seekAudio = (messageId, event) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;

    const waveformElement = event.currentTarget;
    const rect = waveformElement.getBoundingClientRect();

    // Calculate click position percentage
    const clickPosition = (event.clientX - rect.left) / rect.width;
    const seekTime = clickPosition * audio.duration;

    // Set the audio time
    audio.currentTime = seekTime;
    handleTimeUpdate(messageId); // Update state immediately
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio && !audio.paused) {
          audio.pause();
        }
      });
    };
  }, []);

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
  const renderFileContent = (file, messageId) => {
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
    const isSentByMe = String(messageId) === String(authUser._id);

    // Audio rendering with our custom component
    if (fileType.startsWith("audio/")) {
      return (
        <div className="w-full max-w-[280px] sm:max-w-[320px]">
          <AudioMessage file={file} messageId={messageId} isSent={isSentByMe} />
        </div>
      );
    }

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
                      {renderFileContent(message.file, message._id)}
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
