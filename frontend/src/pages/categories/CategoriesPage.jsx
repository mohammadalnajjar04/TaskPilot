import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, SearchX, Tags } from "lucide-react";
import { toast } from "react-hot-toast";

import { categoryService } from "../../services/categoryService";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { CategoryCard } from "../../components/categories/CategoryCard";
import {
  CategoryForm,
  DEFAULT_CATEGORY_COLOR,
} from "../../components/categories/CategoryForm";
import { CategoriesSkeleton } from "../../components/categories/CategoriesSkeleton";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];

function mapCategoryFormErrors(error, { setError, setFormError }) {
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

  switch (code) {
    case "CATEGORY_ALREADY_EXISTS":
      setError("category_name", {
        type: "server",
        message: "A category with this name already exists.",
      });
      return;
    case "FORBIDDEN":
      setFormError("You don't have permission to modify this category.");
      return;
    case "CATEGORY_NOT_FOUND":
      setFormError("This category no longer exists.");
      return;
    case "VALIDATION_ERROR": {
      const details = Array.isArray(errorBody?.details) ? errorBody.details : [];
      let mappedAny = false;
      for (const detail of details) {
        if (detail?.field === "category_name" || detail?.field === "color") {
          setError(detail.field, {
            type: "server",
            message: detail.message,
          });
          mappedAny = true;
        }
      }
      if (!mappedAny) setFormError(fallbackMessage);
      return;
    }
    default:
      setFormError(fallbackMessage);
  }
}

function getDeleteErrorMessage(error) {
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Network error. Please check your connection and try again.";
  }

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;

  if (code === "CATEGORY_NOT_FOUND") {
    return "This category no longer exists.";
  }
  if (code === "FORBIDDEN") {
    return "You don't have permission to delete this category.";
  }
  return errorBody?.message || "Something went wrong. Please try again.";
}

function toFormValues(category) {
  return {
    category_name: category.category_name ?? "",
    color: category.color || DEFAULT_CATEGORY_COLOR,
  };
}

function buildPayload(values) {
  return {
    category_name: String(values.category_name).trim(),
    color: String(values.color).trim(),
  };
}

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.list().then((result) => result.categories),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => categoryService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully.");
      setIsFormOpen(false);
      setEditingCategory(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ categoryId, payload }) =>
      categoryService.update(categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully.");
      setIsFormOpen(false);
      setEditingCategory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId) => categoryService.delete(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Category deleted successfully.");
    },
    onError: (error) => {
      toast.error(getDeleteErrorMessage(error));
    },
  });

  const openCreateForm = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleCreate = (values, helpers) => {
    return createMutation.mutateAsync(buildPayload(values), {
      onError: (error) => mapCategoryFormErrors(error, helpers),
    });
  };

  const handleUpdate = (categoryId) => (values, helpers) => {
    return updateMutation.mutateAsync(
      { categoryId, payload: buildPayload(values) },
      { onError: (error) => mapCategoryFormErrors(error, helpers) }
    );
  };

  const handleDelete = (category) => {
    const confirmed = window.confirm(
      `Delete category "${category.category_name}"?`
    );
    if (confirmed) {
      deleteMutation.mutate(category.category_id);
    }
  };

  const visibleCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = query
      ? categoriesQuery.data.filter((category) =>
          category.category_name.toLowerCase().includes(query)
        )
      : categoriesQuery.data;

    const sorted = [...filtered];
    switch (sortBy) {
      case "oldest":
        sorted.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "name-asc":
        sorted.sort((a, b) =>
          a.category_name.localeCompare(b.category_name)
        );
        break;
      case "name-desc":
        sorted.sort((a, b) =>
          b.category_name.localeCompare(a.category_name)
        );
        break;
      case "newest":
      default:
        sorted.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }
    return sorted;
  }, [categoriesQuery.data, searchTerm, sortBy]);

  if (categoriesQuery.isLoading) {
    return <CategoriesSkeleton />;
  }

  if (categoriesQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <ErrorState
          title="Couldn't load categories"
          description="Something went wrong while loading your categories. Please try again."
          onRetry={() => categoriesQuery.refetch()}
        />
      </div>
    );
  }

  const isEditing = Boolean(editingCategory);
  const hasNoCategories = categoriesQuery.data.length === 0;
  const hasNoMatches = !hasNoCategories && visibleCategories.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Categories
          </h1>
          <p className="text-sm text-gray-500">
            Organize your tasks with reusable categories.
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Category
        </Button>
      </header>

      {isFormOpen && (
        <CategoryForm
          key={editingCategory?.category_id ?? "new"}
          mode={isEditing ? "edit" : "create"}
          initialValues={isEditing ? toFormValues(editingCategory) : undefined}
          isSubmitting={
            isEditing ? updateMutation.isPending : createMutation.isPending
          }
          onSubmit={
            isEditing ? handleUpdate(editingCategory.category_id) : handleCreate
          }
          onCancel={closeForm}
        />
      )}

      {hasNoCategories ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Create your first category to start organizing your tasks."
          action={
            <Button onClick={openCreateForm}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Category
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="sm:max-w-xs sm:flex-1">
              <Input
                id="category-search"
                label="Search categories"
                type="search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="sm:w-52">
              <Select
                id="category-sort"
                label="Sort by"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {hasNoMatches ? (
            <EmptyState
              icon={SearchX}
              title="No matching categories"
              description="Try a different search term or clear the search."
            />
          ) : (
            <section aria-labelledby="categories-list-heading">
              <h2 id="categories-list-heading" className="sr-only">
                Categories
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCategories.map((category) => (
                  <li key={category.category_id}>
                    <CategoryCard
                      category={category}
                      isDeleting={
                        deleteMutation.isPending &&
                        deleteMutation.variables === category.category_id
                      }
                      onEdit={() => openEditForm(category)}
                      onDelete={() => handleDelete(category)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default CategoriesPage;
