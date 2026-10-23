export function Select({
  id,
  label,
  error,
  hint,
  required,
  disabled,
  className = "",
  children,
  ...props
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const baseClasses =
    "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";
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
      <select
        id={id}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${baseClasses} ${stateClasses} ${className}`}
        {...props}
      >
        {children}
      </select>
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
  );
}
