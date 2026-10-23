export function Textarea({
  id,
  label,
  error,
  hint,
  required,
  disabled,
  rows = 4,
  maxLength,
  value,
  className = "",
  ...props
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const length = maxLength ? String(value ?? "").length : null;

  const baseClasses =
    "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";
  const stateClasses = error
    ? "border-red-300 focus:border-red-500 focus:ring-red-500/30"
    : "border-gray-300 hover:border-gray-400 focus:border-primary-500 focus:ring-primary-500/40";

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${baseClasses} ${stateClasses} ${className}`}
        {...(value !== undefined ? { value } : {})}
        {...props}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {error ? (
            <p id={`${id}-error`} className="text-sm text-red-600">
              {error}
            </p>
          ) : hint ? (
            <p id={`${id}-hint`} className="text-xs text-gray-500">
              {hint}
            </p>
          ) : null}
        </div>
        {length !== null && (
          <p className="shrink-0 text-xs tabular-nums text-gray-400">
            {length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
