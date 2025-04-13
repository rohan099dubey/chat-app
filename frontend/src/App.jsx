import Navbar from "./components/Navbar";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore.js";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import SignUpPage from "./pages/SignUpPage";
import FriendRequestsPage from "./pages/FriendRequestsPage";
import OtpVerificationPage from "./pages/OtpVerificationPage";

import { useEffect } from "react";
import { useThemeStore } from "./store/useThemeStore.js";
import ProfilePage from "./pages/ProfilePage";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />

        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />

        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />

        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />

        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />

        <Route
          path="/friend-requests"
          element={authUser ? <FriendRequestsPage /> : <Navigate to="/login" />}
        />

        <Route
          path="/verify-otp"
          element={!authUser ? <OtpVerificationPage /> : <Navigate to="/" />}
        />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
