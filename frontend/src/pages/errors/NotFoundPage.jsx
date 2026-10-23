import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-bold text-gray-300">404</p>
      <h1 className="text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="text-sm text-gray-500">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        Go back home
      </Link>
    </div>
  );
}
