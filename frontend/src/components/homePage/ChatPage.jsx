import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import Sidebar from "../Sidebar.jsx";
import ChatHeader from "./chatPage/ChatHeader.jsx";
import MessageInput from "./chatPage/MessageInput.jsx";
import MessageDisplay from "./chatPage/MessageDisplay.jsx";
import MessageSkeleton from "../skeletons/MessageSkeleton.jsx";

const ChatPage = () => {
  const { authUser } = useAuthStore();
  const {
    getMessages,
    selectedUser,
    setSelectedUser,
    getUsers,
    users,
    isMessageLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const navigate = useNavigate();
  const { id } = useParams();
  const containerRef = useRef(null);

  // Auth check and load users
  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    // Load users/contacts
    getUsers();
  }, [authUser, navigate, getUsers]);

  // Set selected user and load messages when id changes
  useEffect(() => {
    if (id && users.length > 0) {
      const user = users.find((user) => user._id === id);
      if (user) {
        setSelectedUser(user);
        getMessages(id);
      }
    }
  }, [id, users, setSelectedUser, getMessages]);

  // Subscribe to new messages and clean up on unmount
  useEffect(() => {
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
    };
  }, [subscribeToMessages, unsubscribeFromMessages]);

  // Handle window resize for responsive layout
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

  if (!authUser) {
    return null;
  }

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

      <div ref={containerRef} className="flex-1 overflow-auto">
        <MessageDisplay />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatPage;
