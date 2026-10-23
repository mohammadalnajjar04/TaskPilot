import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { projectService } from "../../services/projectService";
import { categoryService } from "../../services/categoryService";
import { taskService } from "../../services/taskService";

import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { FormError } from "../common/FormError";
import { TASK_STATUS_OPTIONS } from "./TaskStatusBadge";
import {
  TASK_URGENCY_OPTIONS,
  TASK_IMPORTANCE_OPTIONS,
} from "./TaskPriorityBadge";

const TASK_STATUSES = TASK_STATUS_OPTIONS.map((option) => option.value);
const URGENCY_PRIORITIES = TASK_URGENCY_OPTIONS.map((option) => option.value);
const AGILE_IMPORTANCES = TASK_IMPORTANCE_OPTIONS.map(
  (option) => option.value
);

export const TASK_FORM_DEFAULTS = {
  project_id: "",
  category_id: "",
  assigned_to: "",
  parent_task_id: "",
  title: "",
  description: "",
  status: "backlog",
  urgency_priority: "important_not_urgent",
  agile_importance: "medium",
  start_date: "",
  due_date: "",
  estimated_minutes: "",
  actual_minutes: "0",
  progress_percentage: "0",
};

const TASK_FORM_FIELDS = [
  "project_id",
  "category_id",
  "assigned_to",
  "parent_task_id",
  "title",
  "description",
  "status",
  "urgency_priority",
  "agile_importance",
  "start_date",
  "due_date",
  "estimated_minutes",
  "actual_minutes",
  "progress_percentage",
];

const sectionHeadingClasses =
  "text-sm font-semibold uppercase tracking-wide text-gray-500";

function optionalIdField(label) {
  return z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^[1-9]\d*$/.test(value),
      `${label} must be a positive integer`
    );
}

export const taskFormSchema = z
  .object({
    project_id: z
      .string()
      .trim()
      .min(1, "Project is required")
      .refine(
        (value) => /^[1-9]\d*$/.test(value),
        "Project must be a positive integer"
      ),
    category_id: optionalIdField("Category"),
    assigned_to: optionalIdField("Assignee"),
    parent_task_id: optionalIdField("Parent task"),
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title must not exceed 150 characters"),
    description: z
      .string()
      .trim()
      .max(2000, "Description must not exceed 2000 characters"),
    status: z.enum(TASK_STATUSES, { message: "Select a valid status" }),
    urgency_priority: z.enum(URGENCY_PRIORITIES, {
      message: "Select a valid priority",
    }),
    agile_importance: z.enum(AGILE_IMPORTANCES, {
      message: "Select a valid importance",
    }),
    start_date: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || !Number.isNaN(Date.parse(value)),
        "Start date must be a valid date"
      ),
    due_date: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || !Number.isNaN(Date.parse(value)),
        "Due date must be a valid date"
      ),
    estimated_minutes: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^[1-9]\d*$/.test(value),
        "Estimated time must be a positive whole number"
      ),
    actual_minutes: z
      .string()
      .trim()
      .refine(
        (value) => /^\d+$/.test(value),
        "Actual time must be a non-negative whole number"
      ),
    progress_percentage: z
      .string()
      .trim()
      .refine(
        (value) => /^\d+$/.test(value) && Number(value) <= 100,
        "Progress must be a whole number between 0 and 100"
      ),
  })
  .superRefine((data, ctx) => {
    if (data.start_date && data.due_date && data.due_date < data.start_date) {
      ctx.addIssue({
        path: ["due_date"],
        code: z.ZodIssueCode.custom,
        message: "Due date must be on or after the start date",
      });
    }

    const progressIsValid =
      /^\d+$/.test(data.progress_percentage) &&
      Number(data.progress_percentage) <= 100;

    if (
      data.status === "done" &&
      progressIsValid &&
      Number(data.progress_percentage) !== 100
    ) {
      ctx.addIssue({
        path: ["progress_percentage"],
        code: z.ZodIssueCode.custom,
        message: "A done task must have 100% progress",
      });
    }

    if (
      progressIsValid &&
      Number(data.progress_percentage) === 100 &&
      data.status !== "done"
    ) {
      ctx.addIssue({
        path: ["progress_percentage"],
        code: z.ZodIssueCode.custom,
        message: "Progress can only be 100% when the task is done",
      });
    }
  });

export function buildTaskPayload(values) {
  const numericOrNull = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  };

  const dateOrNull = (value) => (value ? String(value).slice(0, 10) : null);

  return {
    project_id: Number(values.project_id),
    category_id: numericOrNull(values.category_id),
    assigned_to: numericOrNull(values.assigned_to),
    parent_task_id: numericOrNull(values.parent_task_id),
    title: String(values.title).trim(),
    description: String(values.description ?? "").trim(),
    status: values.status,
    urgency_priority: values.urgency_priority,
    agile_importance: values.agile_importance,
    start_date: dateOrNull(values.start_date),
    due_date: dateOrNull(values.due_date),
    estimated_minutes: numericOrNull(values.estimated_minutes),
    actual_minutes: Number(values.actual_minutes),
    progress_percentage: Number(values.progress_percentage),
  };
}

export function mapTaskErrors(error, { setError, setFormError }) {
  if (!error?.response) {
    setFormError(
      error?.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : "Network error. Please check your connection and try again."
    );
    return;
  }

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;
  const fallbackMessage =
    errorBody?.message || "Something went wrong. Please try again.";
  const message = errorBody?.message || fallbackMessage;

  switch (code) {
    case "VALIDATION_ERROR": {
      const details = Array.isArray(errorBody?.details)
        ? errorBody.details
        : [];
      let mappedAny = false;
      for (const detail of details) {
        if (detail?.field && TASK_FORM_FIELDS.includes(detail.field)) {
          setError(detail.field, {
            type: "server",
            message: detail.message,
          });
          mappedAny = true;
        }
      }
      if (mappedAny) return;
      setFormError(fallbackMessage);
      return;
    }
    case "ASSIGNEE_NOT_FOUND":
    case "ASSIGNEE_NOT_IN_PROJECT":
      setError("assigned_to", { type: "server", message });
      return;
    case "PARENT_TASK_NOT_FOUND":
    case "PARENT_TASK_NOT_IN_PROJECT":
    case "CIRCULAR_PARENT_TASK":
      setError("parent_task_id", { type: "server", message });
      return;
    case "INVALID_PROGRESS":
      setError("progress_percentage", { type: "server", message });
      return;
    case "INVALID_DATES":
      setError("due_date", { type: "server", message });
      return;
    case "PROJECT_NOT_FOUND":
    case "CATEGORY_NOT_FOUND":
    case "FORBIDDEN":
    case "TASK_NOT_FOUND":
    case "INVALID_STATUS_TRANSITION":
      setFormError(message);
      return;
    default:
      setFormError(fallbackMessage);
  }
}

export function TaskForm({
  initialValues,
  isSubmitting = false,
  onSubmit = () => {},
  onCancel = () => {},
  submitLabel,
  currentTaskId,
}) {
  const [formError, setFormError] = useState(null);
  const hasLoadedInitialValuesRef = useRef(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: initialValues || TASK_FORM_DEFAULTS,
  });

  useEffect(() => {
    if (initialValues && !hasLoadedInitialValuesRef.current) {
      reset(initialValues);
      hasLoadedInitialValuesRef.current = true;
    }
  }, [initialValues, reset]);

  const watchedProjectId = watch("project_id");
  const descriptionValue = watch("description") ?? "";
  const statusValue = watch("status");
  const progressValue = watch("progress_percentage") ?? "0";

  const lastProjectIdRef = useRef(watchedProjectId);
  useEffect(() => {
    if (lastProjectIdRef.current !== watchedProjectId) {
      setValue("assigned_to", "");
      setValue("parent_task_id", "");
      lastProjectIdRef.current = watchedProjectId;
    }
  }, [watchedProjectId, setValue]);

  const selectedProjectIdNum = /^[1-9]\d*$/.test(watchedProjectId)
    ? Number(watchedProjectId)
    : NaN;
  const hasSelectedProject =
    Number.isInteger(selectedProjectIdNum) && selectedProjectIdNum > 0;

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list().then((result) => result.projects),
    retry: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.list().then((result) => result.categories),
    retry: false,
  });

  const membersQuery = useQuery({
    queryKey: ["project-members", selectedProjectIdNum],
    queryFn: () =>
      projectService
        .listMembers(selectedProjectIdNum)
        .then((result) => result.members),
    enabled: hasSelectedProject,
    retry: false,
  });

  const projectQuery = useQuery({
    queryKey: ["project", selectedProjectIdNum],
    queryFn: () =>
      projectService.get(selectedProjectIdNum).then((result) => result.project),
    enabled: hasSelectedProject,
    retry: false,
  });

  const parentTasksQuery = useQuery({
    queryKey: ["tasks", { project_id: selectedProjectIdNum }],
    queryFn: () =>
      taskService
        .list({ project_id: selectedProjectIdNum })
        .then((result) => result.tasks),
    enabled: hasSelectedProject,
    retry: false,
  });

  const projectOptions = useMemo(
    () =>
      (projectsQuery.data ?? []).map((project) => ({
        value: String(project.project_id),
        label: `${project.project_key} — ${project.project_name}`,
      })),
    [projectsQuery.data]
  );

  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((category) => ({
        value: String(category.category_id),
        label: category.category_name,
      })),
    [categoriesQuery.data]
  );

  const memberOptions = useMemo(() => {
    const seen = new Map();

    (membersQuery.data ?? []).forEach((member) => {
      if (member.user_id != null && !seen.has(Number(member.user_id))) {
        const nameOrEmail = member.full_name || member.email;
        seen.set(
          Number(member.user_id),
          nameOrEmail
            ? `User ${member.user_id} – ${nameOrEmail}`
            : `User ${member.user_id}`
        );
      }
    });

    const project = projectQuery.data;
    if (project?.owner_id != null && !seen.has(Number(project.owner_id))) {
      seen.set(Number(project.owner_id), `Owner-${project.owner_id}`);
    }

    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [membersQuery.data, projectQuery.data]);

  const parentTaskOptions = useMemo(
    () =>
      (parentTasksQuery.data ?? [])
        .filter(
          (task) =>
            task.task_id != null && Number(task.task_id) !== Number(currentTaskId)
        )
        .map((task) => ({
          value: String(task.task_id),
          label: `#${task.task_id} ${task.title}`,
        })),
    [parentTasksQuery.data, currentTaskId]
  );

  const handleSubmitForm = handleSubmit((values) => {
    setFormError(null);
    onSubmit(values, { setError, setFormError });
  });

  const progressHint =
    statusValue === "done"
      ? "Done tasks are always saved at 100% progress."
      : Number(progressValue) === 100
        ? "Progress can only be 100% when the task is done."
        : "Whole number from 0 to 100.";

  return (
    <form onSubmit={handleSubmitForm} noValidate className="space-y-6">
      {formError && <FormError message={formError} />}

      <section aria-labelledby="task-basics-heading" className="space-y-5">
        <h2
          id="task-basics-heading"
          className={sectionHeadingClasses}
        >
          Task details
        </h2>

        <Input
          id="task-title"
          label="Title"
          required
          maxLength={150}
          placeholder="e.g. Design the onboarding flow"
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          id="task-description"
          label="Description"
          rows={5}
          maxLength={2000}
          placeholder="Describe what needs to be done."
          hint="Optional. A short summary of the task."
          error={errors.description?.message}
          {...register("description")}
          value={descriptionValue}
        />
      </section>

      <section aria-labelledby="task-assignment-heading" className="space-y-5">
        <h2
          id="task-assignment-heading"
          className={sectionHeadingClasses}
        >
          Assignment
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select
            id="task-project"
            label="Project"
            required
            hint={
              projectsQuery.isLoading ? "Loading projects..." : "Required."
            }
            disabled={projectsQuery.isLoading}
            error={errors.project_id?.message}
            {...register("project_id")}
          >
            <option value="">Select a project</option>
            {projectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            id="task-category"
            label="Category"
            hint={
              categoriesQuery.isLoading
                ? "Loading categories..."
                : "Optional."
            }
            disabled={categoriesQuery.isLoading}
            error={errors.category_id?.message}
            {...register("category_id")}
          >
            <option value="">No category</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            id="task-assignee"
            label="Assignee"
            hint={
              !hasSelectedProject
                ? "Select a project to choose an assignee."
                : membersQuery.isLoading
                  ? "Loading assignees..."
                  : "Optional."
            }
            disabled={!hasSelectedProject || membersQuery.isLoading}
            error={errors.assigned_to?.message}
            {...register("assigned_to")}
          >
            <option value="">Unassigned</option>
            {memberOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            id="task-parent"
            label="Parent task"
            hint={
              !hasSelectedProject
                ? "Select a project to choose a parent task."
                : parentTasksQuery.isLoading
                  ? "Loading tasks..."
                  : "Optional."
            }
            disabled={!hasSelectedProject || parentTasksQuery.isLoading}
            error={errors.parent_task_id?.message}
            {...register("parent_task_id")}
          >
            <option value="">No parent task</option>
            {parentTaskOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section aria-labelledby="task-status-heading" className="space-y-5">
        <h2
          id="task-status-heading"
          className={sectionHeadingClasses}
        >
          Status &amp; priorities
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            id="task-status"
            label="Status"
            required
            error={errors.status?.message}
            {...register("status")}
          >
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            id="task-urgency"
            label="Priority"
            required
            error={errors.urgency_priority?.message}
            {...register("urgency_priority")}
          >
            {TASK_URGENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            id="task-importance"
            label="Importance"
            required
            error={errors.agile_importance?.message}
            {...register("agile_importance")}
          >
            {TASK_IMPORTANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section aria-labelledby="task-schedule-heading" className="space-y-5">
        <h2
          id="task-schedule-heading"
          className={sectionHeadingClasses}
        >
          Schedule
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            id="task-start-date"
            label="Start date"
            type="date"
            error={errors.start_date?.message}
            {...register("start_date")}
          />

          <Input
            id="task-due-date"
            label="Due date"
            type="date"
            error={errors.due_date?.message}
            {...register("due_date")}
          />
        </div>
      </section>

      <section aria-labelledby="task-tracking-heading" className="space-y-5">
        <h2
          id="task-tracking-heading"
          className={sectionHeadingClasses}
        >
          Estimates &amp; progress
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Input
            id="task-estimated-minutes"
            label="Estimated time (min)"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            hint="Optional."
            error={errors.estimated_minutes?.message}
            {...register("estimated_minutes")}
          />

          <Input
            id="task-actual-minutes"
            label="Actual time (min)"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            required
            hint="Non-negative whole number."
            error={errors.actual_minutes?.message}
            {...register("actual_minutes")}
          />

          <Input
            id="task-progress"
            label="Progress (%)"
            type="number"
            min={0}
            max={100}
            step={1}
            inputMode="numeric"
            required
            hint={progressHint}
            error={errors.progress_percentage?.message}
            {...register("progress_percentage")}
          />
        </div>
      </section>

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
