import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowRight } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/common/PasswordInput";
import { FormError } from "../../components/common/FormError";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(150, "Email must not exceed 150 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password must not exceed 72 characters"),
});

function getAuthErrorMessage(error) {
  if (!error?.response) {
    if (error?.code === "ECONNABORTED") {
      return {
        field: null,
        message: "The request timed out. Please try again.",
      };
    }
    return {
      field: null,
      message: "Network error. Please check your connection and try again.",
    };
  }

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;
  const message =
    errorBody?.message || "Something went wrong. Please try again.";

  switch (code) {
    case "VALIDATION_ERROR": {
      const detail = errorBody?.details?.[0];
      if (detail) return { field: detail.field, message: detail.message };
      return { field: null, message };
    }
    case "INVALID_CREDENTIALS":
      return { field: null, message: "Invalid email or password." };
    case "ACCOUNT_DISABLED":
      return {
        field: null,
        message: "Your account has been disabled. Contact support for help.",
      };
    case "RATE_LIMIT_EXCEEDED":
      return {
        field: null,
        message: "Too many attempts. Please try again in a few minutes.",
      };
    case "EMAIL_ALREADY_EXISTS":
      return { field: "email", message: "This email is already registered." };
    default:
      return { field: null, message };
  }
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    setFormError(null);

    try {
      await login(values.email, values.password);
      toast.success("Welcome back!");
      const destination = location.state?.from?.pathname;
      navigate(destination || "/dashboard", { replace: true });
    } catch (error) {
      const mapped = getAuthErrorMessage(error);
      if (mapped.field === "email" || mapped.field === "password") {
        setError(mapped.field, { type: "server", message: mapped.message });
      } else {
        setFormError(mapped.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Sign in
        </h1>
        <p className="text-sm text-gray-500">
          Welcome back. Enter your credentials to continue.
        </p>
      </div>

      {formError && <FormError message={formError} />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          id="login-email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordInput
          id="login-password"
          label="Password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
          {!isSubmitting && (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-primary-600 hover:text-primary-700"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
