import { useEffect, useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import OtpVerificationForm from "../components/otpVerification/OtpVerificationForm";
import AuthImagePattern from "../components/skeletons/AuthImagePattern";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const { verifyOTP } = useAuthStore();

  // We won't do automatic verification checks anymore to avoid generating unwanted OTPs
  const checkVerificationStatus = async (email) => {
    // This function is now a no-op to prevent automatic OTP generation
    // We'll let the user manually verify or resend OTP instead
    setChecking(false);
  };

  useEffect(() => {
    // Get email from location state or redirect to login
    if (location.state?.email) {
      const userEmail = location.state.email;
      setEmail(userEmail);
      // Check if user is already verified when page loads
      checkVerificationStatus(userEmail);
    } else {
      navigate("/login");
    }
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        {checking ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p>Checking verification status...</p>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-8">
            {/* LOGO */}
            <div className="text-center mb-8">
              <div className="flex flex-col items-center gap-2 group">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <MessageSquare className="size-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mt-2">Verify Your Email</h1>
                <p className="text-base-content/60">
                  Enter the 6-digit OTP sent to your email
                </p>
              </div>
            </div>

            {/* OTP verification form */}
            <OtpVerificationForm email={email} />
          </div>
        )}
      </div>

      {/* right Side */}
      <AuthImagePattern
        title="Almost there!"
        subtitle="Verify your email to complete your registration and start connecting with friends."
      />
    </div>
  );
};

export default OtpVerificationPage;
