import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
      Loading...
    </div>
  );
}

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
