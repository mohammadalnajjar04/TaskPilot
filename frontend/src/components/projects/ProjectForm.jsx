import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { FormError } from "../common/FormError";
import { PROJECT_STATUS_OPTIONS } from "./ProjectStatusBadge";

const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

const PROJECT_STATUSES = [
  "planning",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
];

const projectSchema = z
  .object({
    project_key: z
      .string()
      .trim()
      .toUpperCase()
      .min(1, "Project key is required")
      .regex(
        PROJECT_KEY_PATTERN,
        "Project key must be 2–10 characters, start with a letter, and contain only uppercase letters and digits"
      ),
    project_name: z
      .string()
      .trim()
      .min(1, "Project name is required")
      .min(3, "Project name must be at least 3 characters")
      .max(150, "Project name must not exceed 150 characters"),
    description: z
      .string()
      .trim()
      .max(2000, "Description must not exceed 2000 characters"),
    start_date: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || !Number.isNaN(Date.parse(value)),
        "Start date must be a valid date"
      ),
    end_date: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || !Number.isNaN(Date.parse(value)),
        "End date must be a valid date"
      ),
    status: z.enum(PROJECT_STATUSES, {
      message: "Select a valid project status",
    }),
    progress_percentage: z.coerce
      .number({ invalid_type_error: "Progress percentage is required" })
      .int("Progress percentage must be a whole number")
      .min(0, "Progress percentage must be between 0 and 100")
      .max(100, "Progress percentage must be between 0 and 100"),
  })
  .superRefine((data, ctx) => {
    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      ctx.addIssue({
        path: ["end_date"],
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after the start date",
      });
    }

    if (data.status === "completed" && data.progress_percentage !== 100) {
      ctx.addIssue({
        path: ["progress_percentage"],
        code: z.ZodIssueCode.custom,
        message: "A completed project must have 100% progress",
      });
    }

    if (data.progress_percentage === 100 && data.status !== "completed") {
      ctx.addIssue({
        path: ["progress_percentage"],
        code: z.ZodIssueCode.custom,
        message: "Progress can only be 100% when the project is completed",
      });
    }
  });

const EMPTY_VALUES = {
  project_key: "",
  project_name: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "planning",
  progress_percentage: 0,
};

export function ProjectForm({
  mode = "create",
  initialValues,
  isSubmitting = false,
  onSubmit = () => {},
  onCancel = () => {},
  submitLabel,
}) {
  const [formError, setFormError] = useState(null);
  const hasLoadedInitialValuesRef = useRef(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues:
      mode === "edit" && initialValues ? initialValues : EMPTY_VALUES,
  });

  useEffect(() => {
    if (
      mode === "edit" &&
      initialValues &&
      !hasLoadedInitialValuesRef.current
    ) {
      reset(initialValues);
      hasLoadedInitialValuesRef.current = true;
    }
  }, [mode, initialValues, reset]);

  const descriptionValue = watch("description") ?? "";
  const projectKeyRegistration = register("project_key");

  const handleSubmitForm = handleSubmit((values) => {
    setFormError(null);
    onSubmit(values, { setError, setFormError });
  });

  return (
    <form onSubmit={handleSubmitForm} noValidate className="space-y-5">
      {formError && <FormError message={formError} />}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="project-key"
          label="Project key"
          required
          maxLength={10}
          placeholder="PROJ1"
          hint="2–10 characters — letters and digits only"
          error={errors.project_key?.message}
          {...projectKeyRegistration}
          onChange={(event) => {
            event.target.value = event.target.value.toUpperCase();
            projectKeyRegistration.onChange(event);
          }}
        />

        <Input
          id="project-name"
          label="Project name"
          required
          maxLength={150}
          placeholder="Website redesign"
          error={errors.project_name?.message}
          {...register("project_name")}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="project-start-date"
          label="Start date"
          type="date"
          error={errors.start_date?.message}
          {...register("start_date")}
        />

        <Input
          id="project-end-date"
          label="End date"
          type="date"
          error={errors.end_date?.message}
          {...register("end_date")}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          id="project-status"
          label="Status"
          required
          error={errors.status?.message}
          {...register("status")}
        >
          {PROJECT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Input
          id="project-progress"
          label="Progress (%)"
          type="number"
          min={0}
          max={100}
          step={1}
          inputMode="numeric"
          required
          hint="Whole number from 0 to 100"
          error={errors.progress_percentage?.message}
          {...register("progress_percentage")}
        />
      </div>

      <Textarea
        id="project-description"
        label="Description"
        rows={5}
        maxLength={2000}
        placeholder="What is this project about?"
        hint="Optional. A short summary of the project."
        error={errors.description?.message}
        {...register("description")}
        value={descriptionValue}
      />

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
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
