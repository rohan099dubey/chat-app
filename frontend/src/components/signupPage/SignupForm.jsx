import React, { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { Mail, Lock, Eye, EyeOff, Loader2, User, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../lib/axios";

const SignupForm = () => {
  const navigate = useNavigate();
  const { signup, isSigningUp } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [usernameStatus, setUsernameStatus] = useState({
    isValid: false,
    message: "",
    isChecking: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Check username availability when username changes
    if (name === "username") {
      checkUsername(value);
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const checkUsername = async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus({
        isValid: false,
        message: "Username must be at least 3 characters",
        isChecking: false,
      });
      return;
    }

    // Basic validation for letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus({
        isValid: false,
        message: "Username can only contain letters, numbers, and underscores",
        isChecking: false,
      });
      return;
    }

    setUsernameStatus((prev) => ({ ...prev, isChecking: true }));

    try {
      const res = await axiosInstance.get(
        `/auth/check-username?username=${username}`
      );
      setUsernameStatus({
        isValid: res.data.isAvailable,
        message: res.data.message,
        isChecking: false,
      });
    } catch (error) {
      setUsernameStatus({
        isValid: false,
        message: error.response?.data?.error || "Error checking username",
        isChecking: false,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!usernameStatus.isValid) {
      toast.error("Please choose a valid username");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await signup(formData);
      
      // Check if we need to verify email
      if (result.requiresVerification) {
        // Redirect to OTP verification page with email
        navigate("/verify-otp", { state: { email: formData.email } });
      } else {
        // Traditional flow if OTP is not required
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error creating account");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* fullName */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Full Name</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="size-5 text-base-content/40" />
          </div>
          <input
            type="text"
            className={`input input-bordered w-full pl-10`}
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleInputChange}
            name="fullName"
          />
        </div>
      </div>

      {/* username */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Username</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserPlus className="size-5 text-base-content/40" />
          </div>
          <input
            type="text"
            className={`input input-bordered w-full pl-10 ${
              usernameStatus.isValid
                ? "border-success"
                : formData.username
                ? "border-error"
                : ""
            }`}
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
            name="username"
          />
        </div>
        {formData.username && (
          <p
            className={`mt-1 text-sm ${
              usernameStatus.isValid ? "text-success" : "text-error"
            }`}
          >
            {usernameStatus.message}
          </p>
        )}
      </div>

      {/* email */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Email</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="size-5 text-base-content/40" />
          </div>
          <input
            type="email"
            className={`input input-bordered w-full pl-10 ${
              formData.email && !validateEmail(formData.email)
                ? "border-error"
                : ""
            }`}
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleInputChange}
            name="email"
          />
        </div>
        {formData.email && !validateEmail(formData.email) && (
          <p className="mt-1 text-sm text-error">
            Please enter a valid email address
          </p>
        )}
      </div>

      {/* password */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Password</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="size-5 text-base-content/40" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            className={`input input-bordered w-full pl-10 ${
              formData.password && formData.password.length < 6
                ? "border-error"
                : ""
            }`}
            placeholder="******"
            value={formData.password}
            onChange={handleInputChange}
            name="password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-5 text-base-content/40" />
            ) : (
              <Eye className="size-5 text-base-content/40" />
            )}
          </button>
        </div>
        {formData.password && formData.password.length < 6 && (
          <p className="mt-1 text-sm text-error">
            Password must be at least 6 characters
          </p>
        )}
      </div>

      {/* confirm password */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Confirm Password</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="size-5 text-base-content/40" />
          </div>
          <input
            type="password"
            className={`input input-bordered w-full pl-10 ${
              formData.confirmPassword &&
              formData.password !== formData.confirmPassword
                ? "border-error"
                : ""
            }`}
            placeholder="******"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            name="confirmPassword"
          />
        </div>
        {formData.confirmPassword &&
          formData.password !== formData.confirmPassword && (
            <p className="mt-1 text-sm text-error">Passwords do not match</p>
          )}
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading || isSigningUp || !usernameStatus.isValid}
      >
        {loading || isSigningUp ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Loading....
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
};

export default SignupForm;
