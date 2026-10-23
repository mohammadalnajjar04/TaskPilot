import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { GuestRoute } from "./GuestRoute";
import { RouteLoader } from "../components/common/RouteLoader";
import { NotFoundPage } from "../pages/errors/NotFoundPage";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const ProjectsPage = lazy(() => import("../pages/projects/ProjectsPage"));
const ProjectCreatePage = lazy(() =>
  import("../pages/projects/ProjectCreatePage")
);
const ProjectEditPage = lazy(() => import("../pages/projects/ProjectEditPage"));
const ProjectDetailsPage = lazy(() =>
  import("../pages/projects/ProjectDetailsPage")
);
const ProjectMembersPage = lazy(() =>
  import("../pages/projects/ProjectMembersPage")
);
const TasksPage = lazy(() => import("../pages/tasks/TasksPage"));
const TaskCreatePage = lazy(() => import("../pages/tasks/TaskCreatePage"));
const TaskDetailsPage = lazy(() => import("../pages/tasks/TaskDetailsPage"));
const TaskEditPage = lazy(() => import("../pages/tasks/TaskEditPage"));
const CategoriesPage = lazy(() => import("../pages/categories/CategoriesPage"));
const NotificationsPage = lazy(() =>
  import("../pages/notifications/NotificationsPage")
);

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<ProjectCreatePage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
            <Route
              path="/projects/:projectId/edit"
              element={<ProjectEditPage />}
            />
            <Route
              path="/projects/:projectId/members"
              element={<ProjectMembersPage />}
            />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/new" element={<TaskCreatePage />} />
            <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
            <Route path="/tasks/:taskId/edit" element={<TaskEditPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
