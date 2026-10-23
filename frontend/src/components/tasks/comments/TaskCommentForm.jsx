import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "../../ui/Button";
import { Textarea } from "../../ui/Textarea";
import { FormError } from "../../common/FormError";

const commentSchema = z.object({
  comment_text: z.string().trim().min(1, "Comment text is required"),
});

export function TaskCommentForm({
  id = "comment-text",
  initialText = "",
  label = "Comment",
  hint = "Press Ctrl+Enter to submit.",
  submitLabel = "Add comment",
  isSubmitting = false,
  onSubmit = () => {},
  onCancel,
}) {
  const [formError, setFormError] = useState(null);
  const formRef = useRef(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { comment_text: initialText },
  });

  useEffect(() => {
    reset({ comment_text: initialText });
  }, [initialText, reset]);

  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const handleFormSubmit = handleSubmit((values) => {
    setFormError(null);
    onSubmit(values.comment_text, { setError, setFormError, reset });
  });

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} noValidate className="space-y-3">
      {formError && <FormError message={formError} />}

      <Textarea
        id={id}
        label={label}
        rows={3}
        hint={hint}
        error={errors.comment_text?.message}
        placeholder="Write a comment..."
        disabled={isSubmitting}
        onKeyDown={handleKeyDown}
        {...register("comment_text")}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
