// frontend/src/components/homePage/chatPage/MessageInput.jsx
import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../../../store/useChatStore.js";
import { toast } from "react-hot-toast";
import { File as FileIcon, Send, Mic, X, Loader2 } from "lucide-react";
import AudioRecorder from "./AudioRecorder.jsx";
import FilePreview from "./FilePreview.jsx";

// --- Add Allowed Types (mirror backend for consistency) ---
const FE_ALLOWED_FILE_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  AUDIO: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4"], // Added mp4 for recordings
  VIDEO: ["video/mp4", "video/webm"],
  DOCUMENT: [
    "text/plain",
    "application/pdf",
    "application/zip",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};

// Flatten allowed types for easier checking and input accept attribute
const ALL_ALLOWED_MIMETYPES = Object.values(FE_ALLOWED_FILE_TYPES).flat();
const ACCEPT_STRING = ALL_ALLOWED_MIMETYPES.join(",");
// --- End Add Allowed Types ---

const MessageInput = () => {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);

  const { sendMessage, selectedUser } = useChatStore();

  // ... useEffect for cleanup ...

  // --- Updated handleFileChange ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // --- Frontend File Type Validation ---
    if (!ALL_ALLOWED_MIMETYPES.includes(file.type)) {
      toast.error(`File type (${file.type}) is not supported.`);
      // Clear the input field value in case the user tries again
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      return;
    }
    // --- End Frontend File Type Validation ---

    // Validate file size (generic 50MB limit - adjust if needed based on backend limits)
    // Consider using specific limits per type like backend if desired
    const MAX_SIZE_MB = 50;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File size should be less than ${MAX_SIZE_MB}MB`);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      return;
    }

    // Clear previous preview if any
    if (filePreview?.preview) {
      URL.revokeObjectURL(filePreview.preview);
    }

    setFilePreview({
      preview: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file, // Store the actual file object
    });
  };
  // --- End Updated handleFileChange ---

  // --- Updated handleAudioRecordComplete ---
  const handleAudioRecordComplete = (audioBlob) => {
    setIsRecording(false);

    const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
    const fileName = `Voice Message ${new Date().toLocaleTimeString()}.${extension}`;

    // --- Use the native File constructor (no name collision now) ---
    const file = new File([audioBlob], fileName, { type: audioBlob.type });
    // --- End Use native File ---

    if (!FE_ALLOWED_FILE_TYPES.AUDIO.includes(file.type)) {
      toast.error(`Recorded audio type (${file.type}) is not supported.`);
      return;
    }

    if (filePreview?.preview) {
      URL.revokeObjectURL(filePreview.preview);
    }

    setFilePreview({
      file: file,
      preview: URL.createObjectURL(file),
      name: fileName,
      type: audioBlob.type,
      size: audioBlob.size,
    });
  };
  // --- End Updated handleAudioRecordComplete ---

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const currentText = text.trim(); // Trim text once
    const currentFile = filePreview?.file;

    if (!currentText && !currentFile) {
      toast.error("Message cannot be empty");
      return;
    }

    if (!selectedUser || !selectedUser._id) {
      toast.error("No user selected to send message to");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();

      if (currentText) {
        formData.append("text", currentText);
      }

      if (currentFile) {
        // Ensure the key is 'file' matching multer.single('file')
        formData.append("file", currentFile, currentFile.name); // Added filename
      }

      console.log("[MessageInput] Sending FormData contents:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]); // Log file object details if present
      }

      await sendMessage(formData); // Pass FormData to store action

      // Clear form after successful send
      setText("");
      if (filePreview?.preview) {
        URL.revokeObjectURL(filePreview.preview);
      }
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    } catch (error) {
      // Error handling is likely done within the sendMessage action now,
      // but keep a fallback here just in case.
      console.error("[MessageInput] Failed to send message:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message || // Include error.message
        "Failed to send message";
      // Avoid duplicate toasts if store action already showed one
      // toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 w-full">
      {/* File Preview */}
      {filePreview && (
        <div className="mb-3">
          <FilePreview
            file={filePreview}
            onRemove={() => {
              if (filePreview?.preview)
                URL.revokeObjectURL(filePreview.preview);
              setFilePreview(null);
              if (fileInputRef.current) fileInputRef.current.value = null;
            }}
          />
        </div>
      )}

      {/* Audio Recorder */}
      {isRecording && (
        // ... (AudioRecorder rendering - seems okay)
        <div className="mb-3">
          <AudioRecorder
            onRecordComplete={handleAudioRecordComplete}
            onCancel={() => setIsRecording(false)}
          />
          {/* Simplified cancel */}
          {/* <button onClick={() => setIsRecording(false)} className="btn btn-circle btn-sm btn-ghost"><X className="w-5 h-5" /></button> */}
        </div>
      )}

      {/* Form */}
      {!isRecording && ( // Hide form while recording UI is active
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* File Input */}
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            // Use dynamically generated accept string
            accept={ACCEPT_STRING}
          />

          {/* Attach File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-circle btn-sm btn-ghost"
            aria-label="Attach file"
            disabled={isUploading || isRecording || !!filePreview} // Disable if preview exists
            title="Attach file"
          >
            <FileIcon className="w-5 h-5" />
          </button>

          {/* Record Audio Button */}
          {!filePreview && ( // Don't show record if file is already selected
            <button
              type="button"
              onClick={() => setIsRecording(true)}
              className="btn btn-circle btn-sm btn-ghost"
              aria-label="Record audio"
              disabled={isUploading || isRecording}
              title="Record audio"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {/* Text Input */}
          <input
            type="text"
            className="input input-bordered w-full"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            disabled={isUploading || isRecording}
          />

          {/* Send Button */}
          <button
            type="submit"
            className="btn btn-circle btn-primary"
            disabled={
              isUploading ||
              isRecording || // Disable while recording UI is active
              (!text.trim() && !filePreview) // Disable if both empty
            }
            title="Send message"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default MessageInput;
