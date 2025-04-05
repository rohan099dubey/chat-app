import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/homePage/NoChatSelected";
import { useAuthStore } from "../store/useAuthStore";
import ResizableSidebar from "../components/sidebar/ResizableSidebar";
import ChatPage from "../components/homePage/ChatPage";
// import ChatContainer from "../components/homePage/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  console.log("authuser ", authUser);
  console.log("selectedUser ", selectedUser);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <ResizableSidebar>
              <Sidebar />
            </ResizableSidebar>
            <main className="flex-1 overflow-hidden">
              {!selectedUser ? <NoChatSelected /> : <ChatPage />}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
