import UserInfo from "../components/profilePage/UserInfo";
import UserAvatar from "../components/profilePage/UserAvatar";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  return (
    <div className="h-screen flex items-center justify-center pt-20">
      <div className="max-w-2xl w-full p-6 bg-base-300 rounded-xl shadow-lg space-y-8">
        <div className="flex justify-start">
          <Link to="/">
            <ArrowLeftIcon className="w-6 h-6 text-primary" />
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="mt-2 text-base-content">Your profile information</p>
        </div>

        {/* avatar upload section */}
        <UserAvatar />

        <UserInfo />
      </div>
    </div>
  );
};
export default ProfilePage;
