import React from "react";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Mic, StopCircle, AlertCircle, Loader2 } from "lucide-react";

import { formatTime } from "../../../utils/formatters";

const AudioRecorder = ({ onRecordComplete, onCancel }) => {
  const [recording, setRecording] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const MAX_RECORDING_TIME = 45; // 45 seconds

  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, []);

  // Check browser support
  const checkBrowserSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Your browser doesn't support audio recording");
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    if (!checkBrowserSupport()) {
      onCancel();
      return;
    }

    try {
      setPermissionDenied(false);
      chunksRef.current = [];

      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false, // Explicitly set video to false
      });

      console.log("Microphone access granted!");
      streamRef.current = stream;

      // Determine the correct MIME type based on browser support
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Use the same mime type for the Blob
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorder.start();
      setRecording(true);
      setAudioTime(0);

      timerRef.current = setInterval(() => {
        setAudioTime((prev) => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);

      // Handle permission denied error specifically
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setPermissionDenied(true);
        toast.error(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else {
        toast.error("Cannot access microphone: " + err.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      try {
        mediaRecorderRef.current.stop();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.error("Error stopping recording:", err);
      }

      if (timerRef.current) clearInterval(timerRef.current);
      setRecording(false);
    }
  };

  const handleComplete = () => {
    if (audioBlob) {
      onRecordComplete(audioBlob);
    }
  };

  const handleCancel = () => {
    stopRecording();
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setAudioBlob(null);
    setPermissionDenied(false);
    onCancel();
  };

  // Render permission denied message
  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 bg-base-200 rounded-lg text-center">
        <AlertCircle className="text-error w-8 h-8" />
        <div>
          <h3 className="font-medium">Microphone Access Denied</h3>
          <p className="text-sm text-base-content/70">
            Please enable microphone access in your browser settings
          </p>
        </div>
        <button onClick={handleCancel} className="btn btn-sm btn-error mt-2">
          Cancel
        </button>
      </div>
    );
  }

  // Effect to start recording immediately when component mounts
  useEffect(() => {
    if (!recording && !audioURL) {
      startRecording();
    }
  }, []);

  return (
    <div className="flex flex-col gap-2 p-3 bg-base-200 rounded-lg">
      {recording ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="animate-pulse text-error">
                <Mic className="w-5 h-5" />
              </div>
              <span>
                Recording: {formatTime(audioTime)} /{" "}
                {formatTime(MAX_RECORDING_TIME)}
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="btn btn-circle btn-sm btn-error"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full bg-base-300 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{
                width: `${(audioTime / MAX_RECORDING_TIME) * 100}%`,
              }}
            ></div>
          </div>
        </>
      ) : audioURL ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Preview</span>
            <div className="flex gap-2">
              <button
                onClick={handleComplete}
                className="btn btn-sm btn-primary"
              >
                Send
              </button>
              <button onClick={handleCancel} className="btn btn-sm btn-ghost">
                Cancel
              </button>
            </div>
          </div>
          <audio controls className="w-full">
            <source src={audioURL} type={audioBlob?.type || "audio/webm"} />
          </audio>
        </>
      ) : (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <span className="ml-2">Initializing microphone...</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
