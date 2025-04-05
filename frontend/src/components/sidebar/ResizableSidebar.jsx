import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const ResizableSidebar = ({ children }) => {
  // Persist sidebar state in localStorage
  const [isOpen, setIsOpen] = useLocalStorage("sidebarOpen", true);
  const [width, setWidth] = useLocalStorage("sidebarWidth", 320);
  const [isResizing, setIsResizing] = useState(false);

  // Constants for sidebar constraints
  const MIN_WIDTH = 280;
  const MAX_WIDTH = 600;

  const handleResizeStart = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  const handleResize = (e) => {
    if (isResizing && isOpen) {
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
      setWidth(newWidth);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [setIsOpen]);

  // Handle resize events
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", handleResizeEnd);
      document.body.classList.add("select-none"); // Prevent text selection while resizing
    }

    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", handleResizeEnd);
      document.body.classList.remove("select-none");
    };
  }, [isResizing]);

  return (
    <aside
      className={`
        relative flex-shrink-0
        transition-all duration-300 ease-in-out
        border-r border-base-300 bg-base-100
        ${isOpen ? "" : "-translate-x-full"}
        ${isResizing ? "transition-none" : ""}
      `}
      style={{
        width: isOpen ? width : 0,
        minWidth: isOpen ? width : 0,
      }}
    >
      {/* Main content */}
      <div className="h-full w-full overflow-hidden">{children}</div>

      {/* Resize handle */}
      {isOpen && (
        <div
          className={`
            absolute right-0 top-0 w-1 h-full
            cursor-col-resize hover:bg-primary/20
            ${isResizing ? "bg-primary" : ""}
          `}
          onMouseDown={handleResizeStart}
          onDoubleClick={() => setWidth(320)} // Reset to default width
        />
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          absolute -right-4 top-1/2 -translate-y-1/2
          flex items-center justify-center
          w-8 h-16 
          bg-base-100 
          border border-base-300
          rounded-r-lg
          shadow-md
          hover:bg-base-200
          transition-all duration-300
          ${isOpen ? "" : "translate-x-4"}
        `}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        <div
          className={`
          transition-transform duration-300
          ${isOpen ? "rotate-0" : "rotate-180"}
        `}
        >
          <ChevronLeft
            size={20}
            className="text-base-content/70 hover:text-base-content"
          />
        </div>
      </button>
    </aside>
  );
};

export default ResizableSidebar;
