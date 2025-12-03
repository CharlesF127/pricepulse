// src/pages/Notifications.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "`${API_BASE}";

type NotificationItem = {
  _id: string;
  productName: string;
  triggeredPrice: number;
  timestamp: string;
  // read?: boolean; // you can add this later if/when backend supports it
};

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !userId) {
      navigate("/");
    }
  }, [token, userId, navigate]);

  // 🔹 Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!token && !!userId,
  });

  // 🔹 Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || "Failed to delete notification");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View price alerts that have been triggered for your products.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent notifications
          </h2>

          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading notifications...
            </p>
          ) : error ? (
            <p className="text-sm text-red-500">
              Failed to load notifications.
            </p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You don&apos;t have any notifications yet. When your alerts fire,
              they&apos;ll show up here.
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const date = new Date(n.timestamp);
                const formatted = date.toLocaleString();

                return (
                  <div
                    key={n._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {n.productName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Triggered price:{" "}
                        <span className="font-semibold">${n.triggeredPrice}</span>{" "}
                        • {formatted}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          deleteNotificationMutation.mutate(n._id)
                        }
                        disabled={deleteNotificationMutation.isPending}
                        className="px-2 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default NotificationsPage;
