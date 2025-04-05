import Sidebar from "../components/Sidebar";
import ResizableSidebar from "../components/sidebar/ResizableSidebar";
import FriendRequests from "../components/friendRequestPage/FriendRequests";

const FriendRequestsPage = () => {
  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <ResizableSidebar>
              <Sidebar />
            </ResizableSidebar>
            <main className="flex-1 overflow-hidden">
              <FriendRequests />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FriendRequestsPage;
