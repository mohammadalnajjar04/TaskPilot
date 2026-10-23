import { Link } from "react-router-dom";
import { Bell, FolderKanban, LayoutDashboard, ListTodo, Tags } from "lucide-react";

import { Logo } from "../common/Logo";
import { NavigationItem } from "./NavigationItem";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
        <Link
          to="/dashboard"
          aria-label="TaskPilot dashboard"
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
        >
          <Logo />
        </Link>
      </div>

      <div className="shrink-0 px-6 pb-2 pt-5">
        <p className="px-0 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Menu
        </p>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 pb-4"
      >
        {NAV_ITEMS.map((item) => (
          <NavigationItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="shrink-0 border-t border-gray-200 px-6 py-4">
        <p className="text-xs leading-relaxed text-gray-400">
          Plan. Track. Ship.
        </p>
      </div>
    </aside>
  );
}
