// src/components/Navbar.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const {
    data: notifications = [],
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch("`${API_BASE}/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 15000,
  });

  const hasNotifications = notifications.length > 0;
  const notifCount = notifications.length;

  const navLinkClasses = (path: string) =>
    `px-3 py-1.5 rounded-md text-sm ${
      location.pathname === path
        ? "bg-indigo-600 text-white"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    navigate("/");
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-600">PricePulse</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
            Sneaker price intelligence
          </span>
        </div>

        {/* Center: Nav links */}
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className={navLinkClasses("/dashboard")}>
            Dashboard
          </Link>
          <Link to="/alerts" className={navLinkClasses("/alerts")}>
            Alerts
          </Link>
          <button
            onClick={() => navigate("/notifications")}
            className={`${navLinkClasses("/notifications")} relative flex items-center`}
          >
            Notifications
            {hasNotifications && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>
          <Link to="/settings" className={navLinkClasses("/settings")}>
            Settings
          </Link>
        </div>

        {/* Right: Logout */}
        <button
          onClick={handleLogout}
          className="text-xs sm:text-sm px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Log out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
