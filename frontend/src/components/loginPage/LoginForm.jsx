import React, { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email) {
      toast.error("Email is required");
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!formData.password) {
      toast.error("Password is required");
      return;
    }

    setLoading(true);
    try {
      await login(formData);
      navigate("/");
    } catch (error) {
      // Error is already handled in the store
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Email</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-base-content/40" />
          </div>
          <input
            type="email"
            name="email"
            className={`input input-bordered w-full pl-10 ${
              formData.email && !validateEmail(formData.email)
                ? "border-error"
                : ""
            }`}
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        {formData.email && !validateEmail(formData.email) && (
          <p className="text-sm text-error mt-1">
            Please enter a valid email address
          </p>
        )}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Password</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-base-content/40" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            className={`input input-bordered w-full pl-10`}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-base-content/40" />
            ) : (
              <Eye className="h-5 w-5 text-base-content/40" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading || isLoggingIn}
      >
        {loading || isLoggingIn ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading...
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
};

export default LoginForm;
