import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "../ui/Input";

export function PasswordInput({
  id,
  label,
  error,
  hint,
  required,
  disabled,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      disabled={disabled}
      type={showPassword ? "text" : "password"}
      className={className}
      rightElement={
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus-visible:text-primary-600"
          tabIndex={disabled ? -1 : 0}
        >
          {showPassword ? (
            <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
          ) : (
            <Eye className="h-4.5 w-4.5" aria-hidden="true" />
          )}
        </button>
      }
      {...props}
    />
  );
}
