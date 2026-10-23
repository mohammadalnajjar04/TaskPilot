import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { FormError } from "../common/FormError";
import {
  ASSIGNABLE_MEMBER_ROLES,
  MEMBER_ROLE_OPTIONS,
} from "./ProjectMemberRoleBadge";

const editRoleSchema = z.object({
  member_role: z.enum(ASSIGNABLE_MEMBER_ROLES, {
    message: "Select a valid member role",
  }),
});

export function EditProjectMemberRoleForm({
  userId,
  currentRole,
  isSubmitting,
  onSubmit,
  onCancel,
}) {
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editRoleSchema),
    defaultValues: { member_role: currentRole },
  });

  const handleSubmitForm = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values, { setError, setFormError });
    } catch {
      // Field/form errors are mapped by the parent's onError handler.
    }
  });

  return (
    <form onSubmit={handleSubmitForm} noValidate>
      {formError && <FormError message={formError} />}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:flex-1">
          <Select
            id={`member-role-${userId}`}
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
        <div className="flex shrink-0 gap-2">
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
