import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../../../store/useChatStore.js";
import { toast } from "react-hot-toast";
import { File, Send, Mic, X, Loader2 } from "lucide-react";
import AudioRecorder from "./AudioRecorder.jsx";
import FilePreview from "./FilePreview.jsx";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);

  const { sendMessage, selectedUser } = useChatStore();

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      if (filePreview?.preview) {
        URL.revokeObjectURL(filePreview.preview);
      }
    };
  }, [filePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (generic 50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size should be less than 50MB");
      return;
    }

    setFilePreview({
      preview: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file, // Store the actual file object
    });
  };

  const handleAudioRecordComplete = (audioBlob) => {
    setIsRecording(false);

    // Create consistent file name with extension based on the blob type
    const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
    const fileName = `Voice Message ${new Date().toLocaleTimeString()}.${extension}`;

    // Create proper File object
    const file = new File([audioBlob], fileName, { type: audioBlob.type });

    // Set consistent file preview format
    setFilePreview({
      file: file,
      preview: URL.createObjectURL(file),
      name: fileName,
      type: audioBlob.type,
      size: audioBlob.size,
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    // First, check if we have either text or file
    if (!text.trim() && !filePreview?.file) {
      toast.error("Message cannot be empty");
      return;
    }

    // Check if user is selected
    if (!selectedUser || !selectedUser._id) {
      toast.error("No user selected to send message to");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();

      // Only append text if it's not empty
      if (text.trim()) {
        formData.append("text", text.trim());
      }

      if (filePreview?.file) {
        // IMPORTANT FIX: Just append the file directly, don't recreate it
        formData.append("file", filePreview.file);
      }

      // Debug log
      console.log("Sending message to:", selectedUser._id);
      console.log("FormData contents:");
      for (let pair of formData.entries()) {
        console.log(pair[0], typeof pair[1], pair[1]);
      }

      await sendMessage(formData);

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
      console.error("Failed to send message:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to send message";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 w-full">
      {filePreview && (
        <div className="mb-3">
          <FilePreview
            file={filePreview}
            onRemove={() => setFilePreview(null)}
          />
        </div>
      )}

      {isRecording && (
        <div className="mb-3">
          <AudioRecorder
            onRecordComplete={handleAudioRecordComplete}
            onCancel={() => setIsRecording(false)}
          />
          <button
            onClick={() => setIsRecording(false)}
            className="btn btn-circle btn-sm btn-ghost"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.c,.cpp,.mp3,.wav,.ogg,.webm"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-circle btn-sm btn-ghost"
          aria-label="Attach file"
          disabled={isUploading || isRecording}
        >
          <File className="w-5 h-5" />
        </button>

        {!isRecording && !filePreview && (
          <button
            type="button"
            onClick={() => setIsRecording(true)}
            className="btn btn-circle btn-sm btn-ghost"
            aria-label="Record audio"
            disabled={isUploading}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}

        <input
          type="text"
          className="input input-bordered w-full"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          disabled={isUploading || isRecording}
        />

        <button
          type="submit"
          className="btn btn-circle btn-primary"
          disabled={
            isUploading ||
            (isRecording && !filePreview) ||
            (!text.trim() && !filePreview)
          }
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
