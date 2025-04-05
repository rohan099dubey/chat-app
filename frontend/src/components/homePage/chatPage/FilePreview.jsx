import React from "react";
import { formatFileSize } from "../../../utils/formatters.js";
import {
  X,
  AudioWaveform as Audio,
  Video,
  FileText,
  Image,
} from "lucide-react";

const FilePreview = ({ file, onRemove }) => {
  // Extract file type from MIME type
  const fileType = file.type?.split("/")[0] || "application";

  // Choose appropriate icon based on file type
  let PreviewComponent;
  if (fileType === "image") {
    PreviewComponent = (
      <div className="relative w-24 h-24 flex-shrink-0">
        <img
          src={file.preview}
          alt="Preview"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
    );
  } else if (fileType === "audio") {
    PreviewComponent = <Audio className="w-8 h-8 text-primary" />;
  } else if (fileType === "video") {
    PreviewComponent = <Video className="w-8 h-8 text-primary" />;
  } else if (fileType === "application" || fileType === "text") {
    PreviewComponent = <FileText className="w-8 h-8 text-primary" />;
  } else {
    PreviewComponent = <FileText className="w-8 h-8 text-primary" />;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
      <div className="flex-shrink-0">{PreviewComponent}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-base-content/60">
          {formatFileSize(file.size)}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="btn btn-ghost btn-circle btn-sm hover:bg-base-300"
        aria-label="Remove file"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FilePreview;
