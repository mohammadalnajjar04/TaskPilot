const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const DEFAULT_PREVIEW_COLOR = "#2563EB";

export function CategoryColorPreview({ color, label }) {
  const resolved = color && HEX_COLOR_PATTERN.test(color) ? color : DEFAULT_PREVIEW_COLOR;

  return (
    <span
      role="img"
      aria-label={label || "Category color"}
      className="inline-block h-5 w-5 shrink-0 rounded-full border border-gray-200"
      style={{ backgroundColor: resolved }}
    />
  );
}
