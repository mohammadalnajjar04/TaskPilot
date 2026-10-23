import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/common/PasswordInput";
import { FormError } from "../../components/common/FormError";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .min(3, "Full name must be at least 3 characters")
      .max(100, "Full name must not exceed 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address")
      .max(150, "Email must not exceed 150 characters"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must not exceed 72 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[0-9]/, "Must include a number")
      .regex(/[^A-Za-z0-9]/, "Must include a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (value) => value.length >= 8 },
  { label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "One number", test: (value) => /[0-9]/.test(value) },
  {
    label: "One special character",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

function PasswordRequirements({ password }) {
  return (
    <ul
      aria-label="Password requirements"
      className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 p-3"
    >
      {PASSWORD_REQUIREMENTS.map(({ label, test }) => {
        const met = test(password);
        return (
          <li key={label} className="flex items-center gap-2 text-sm">
            {met ? (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-emerald-500"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="h-4 w-4 shrink-0 text-gray-300"
                aria-hidden="true"
              />
            )}
            <span className={met ? "text-gray-700" : "text-gray-400"}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

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

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({ control, name: "password" });

  const onSubmit = async (values) => {
    setFormError(null);

    try {
      await registerUser(values.fullName, values.email, values.password);
      toast.success("Account created. Welcome to TaskPilot!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const mapped = getAuthErrorMessage(error);
      const isFieldError = [
        "fullName",
        "email",
        "password",
        "confirmPassword",
      ].includes(mapped.field);

      if (isFieldError) {
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
          Create your account
        </h1>
        <p className="text-sm text-gray-500">
          Start organizing your projects in minutes.
        </p>
      </div>

      {formError && <FormError message={formError} />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          id="register-fullName"
          label="Full name"
          required
          autoComplete="name"
          placeholder="Jane Doe"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <Input
          id="register-email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="space-y-2">
          <PasswordInput
            id="register-password"
            label="Password"
            required
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordRequirements password={password} />
        </div>

        <PasswordInput
          id="register-confirmPassword"
          label="Confirm password"
          required
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
          {!isSubmitting && (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-primary-600 hover:text-primary-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
