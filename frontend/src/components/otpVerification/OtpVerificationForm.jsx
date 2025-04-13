import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { useAuthStore } from "../../store/useAuthStore";

const OtpVerificationForm = ({ email }) => {
  const navigate = useNavigate();
  // Use the specific functions from the auth store
  const { verifyOTP, resendOTP } = useAuthStore();
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setVerifying(true);
    try {
      console.log("Submitting OTP verification:", { email, otp });
      
      // Use the auth store's verifyOTP function instead of direct API call
      const userData = await verifyOTP(email.trim(), otp.trim());
      
      // Handle already verified users
      if (userData.alreadyVerified) {
        toast.success("Your email is already verified");
      } else {
        toast.success("Email verified successfully");
      }
      
      // Redirect to home page
      navigate("/", { replace: true });
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error(error.message || "Failed to verify OTP");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    try {
      console.log("Requesting OTP resend for:", email);
      
      // Use the resendOTP function from the auth store
      // This is a deliberate action by the user to resend an OTP
      await resendOTP(email.trim());
      toast.success("New OTP sent successfully");
      setCountdown(60); // Set countdown to 60 seconds
    } catch (error) {
      console.error("OTP resend error:", error);
      
      if (error.response?.status === 429) {
        // Rate limited
        toast.error(error.response.data.message);
        // Extract the wait time from the error message if available
        const waitTime = error.response.data.message.match(/\d+/);
        if (waitTime) {
          setCountdown(parseInt(waitTime[0]));
        } else {
          setCountdown(60);
        }
      } else if (error.response?.data?.isVerified) {
        // User is already verified
        toast.success("Your email is already verified");
        // Use the auth store's verifyOTP function to get authenticated
        try {
          await verifyOTP(email.trim(), "000000"); // Dummy OTP for verified users
          navigate("/", { replace: true });
        } catch (authError) {
          console.error("Error authenticating verified user:", authError);
        }
      } else {
        toast.error(error.message || "Failed to resend OTP");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="otp" className="block text-sm font-medium">
          Enter OTP
        </label>
        <input
          id="otp"
          type="text"
          value={otp}
          onChange={(e) => {
            // Only allow digits
            const value = e.target.value.replace(/\D/g, '');
            setOtp(value.slice(0, 6));
          }}
          className="input input-bordered w-full text-center text-xl tracking-widest"
          placeholder="******"
          maxLength={6}
          autoComplete="one-time-code"
        />
        <p className="text-xs text-base-content/60">
          A 6-digit OTP has been sent to <span className="font-semibold">{email}</span>
        </p>
      </div>

      <button
        type="submit"
        disabled={verifying || otp.length !== 6}
        className="btn btn-primary w-full"
      >
        {verifying ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Email"
        )}
      </button>

      <div className="text-center">
        <p className="text-sm">
          Didn't receive the OTP?{" "}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending || countdown > 0}
            className="text-primary inline-flex items-center gap-1"
          >
            {resending ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              <>
                <RefreshCw className="size-3" />
                Resend OTP
              </>
            )}
          </button>
        </p>
      </div>
    </form>
  );
};

export default OtpVerificationForm;
