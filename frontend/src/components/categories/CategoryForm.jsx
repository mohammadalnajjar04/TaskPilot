import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { FormError } from "../common/FormError";
import { CategoryColorPreview } from "./CategoryColorPreview";

export const DEFAULT_CATEGORY_COLOR = "#2563EB";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const categorySchema = z.object({
  category_name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(80, "Category name must not exceed 80 characters"),
  color: z
    .string()
    .trim()
    .regex(
      HEX_COLOR_PATTERN,
      "Color must be a valid hex value like #2563EB"
    ),
});

const CREATE_VALUES = {
  category_name: "",
  color: DEFAULT_CATEGORY_COLOR,
};

export function CategoryForm({
  mode = "create",
  initialValues,
  isSubmitting = false,
  onSubmit = () => {},
  onCancel = () => {},
}) {
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: mode === "edit" && initialValues ? initialValues : CREATE_VALUES,
  });

  const colorValue = watch("color") ?? "";
  const normalizedColor = HEX_COLOR_PATTERN.test(colorValue)
    ? colorValue
    : "#000000";

  const handleSubmitForm = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values, { setError, setFormError });
    } catch {
      // Field/form errors are mapped by the parent's onError handler.
    }
  });

  return (
    <section
      aria-labelledby="category-form-heading"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2
        id="category-form-heading"
        className="text-lg font-semibold tracking-tight text-gray-900"
      >
        {mode === "edit" ? "Edit category" : "New category"}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {mode === "edit"
          ? "Update the name and color for this category."
          : "Create a category to organize your tasks."}
      </p>

      <form onSubmit={handleSubmitForm} noValidate className="mt-4 space-y-5">
        {formError && <FormError message={formError} />}

        <Input
          id="category-name"
          label="Category name"
          required
          maxLength={80}
          placeholder="e.g. Design"
          hint="2–80 characters"
          error={errors.category_name?.message}
          {...register("category_name")}
        />

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-gray-700">Color</span>
          <div className="flex items-center gap-3">
            <CategoryColorPreview
              color={colorValue}
              label={`Color preview, currently ${colorValue || "unset"}`}
            />
            <input
              id="category-color-picker"
              type="color"
              aria-label="Choose a color"
              value={normalizedColor}
              onChange={(event) =>
                setValue("color", event.target.value.toUpperCase(), {
                  shouldValidate: true,
                })
              }
              className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-gray-300 bg-white p-1"
            />
            <div className="min-w-0 flex-1">
              <Input
                id="category-color"
                aria-label="Color hex value"
                placeholder="#2563EB"
                error={errors.color?.message}
                {...register("color")}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "edit"
                ? "Save changes"
                : "Create category"}
          </Button>
        </div>
      </form>
    </section>
  );
}
