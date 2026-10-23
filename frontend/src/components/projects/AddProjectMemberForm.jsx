import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { FormError } from "../common/FormError";
import {
  ASSIGNABLE_MEMBER_ROLES,
  MEMBER_ROLE_OPTIONS,
} from "./ProjectMemberRoleBadge";

const addMemberSchema = z.object({
  user_id: z
    .string({ required_error: "User ID is required" })
    .trim()
    .min(1, "User ID is required")
    .regex(/^\d+$/, "User ID must be a positive integer")
    .transform((value) => Number(value)),
  member_role: z.enum(ASSIGNABLE_MEMBER_ROLES, {
    message: "Select a valid member role",
  }),
});

const EMPTY_VALUES = {
  user_id: "",
  member_role: "member",
};

export function AddProjectMemberForm({ isSubmitting, onSubmit }) {
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addMemberSchema),
    defaultValues: EMPTY_VALUES,
  });

  const handleSubmitForm = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values, { setError, setFormError });
      reset(EMPTY_VALUES);
    } catch {
      // Field/form errors are mapped by the parent's onError handler.
    }
  });

  return (
    <section
      aria-labelledby="add-member-heading"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2
        id="add-member-heading"
        className="text-lg font-semibold tracking-tight text-gray-900"
      >
        Add a member
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Add a user to this project by their user ID.
      </p>

      <form onSubmit={handleSubmitForm} noValidate className="mt-4">
        {formError && <FormError message={formError} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <Input
            id="member-user-id"
            label="User ID"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            placeholder="e.g. 3"
            error={errors.user_id?.message}
            {...register("user_id")}
          />

          <Select
            id="member-role"
            label="Role"
            required
            error={errors.member_role?.message}
            {...register("member_role")}
          >
            {MEMBER_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add member"}
          </Button>
        </div>
      </form>
    </section>
  );
}
