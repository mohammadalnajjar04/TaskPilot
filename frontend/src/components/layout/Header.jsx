import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu } from "lucide-react";

import { notificationService } from "../../services/notificationService";

import { NAV_ITEMS } from "./Sidebar";
import { UserMenu } from "./UserMenu";

function getPageTitle(pathname) {
  const match = NAV_ITEMS.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to)
  );
  return match ? match.label : "TaskPilot";
}

export function Header({ onOpenMobileMenu, isMobileMenuOpen = false }) {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () =>
      notificationService.unreadCount().then((result) => result.unread_count),
    retry: false,
  });

  const unreadCount = unreadCountQuery.data ?? 0;

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            aria-expanded={isMobileMenuOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="truncate text-lg font-semibold tracking-tight text-gray-900">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/notifications"
            aria-label="View notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
                title={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
                <span className="sr-only">
                  {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
                </span>
              </span>
            )}
          </Link>
          <div className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
