// src/pages/Alerts.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Product = {
  _id: string;
  productName: string;
};

type Alert = {
  _id: string;
  productId: Product | string;
  targetPriceLow?: number | null;
  targetPriceHigh?: number | null;
  triggered: boolean;
};

const API_BASE = "`${API_BASE}";

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const queryClient = useQueryClient();

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [targetPriceLow, setTargetPriceLow] = useState<string>("");
  const [targetPriceHigh, setTargetPriceHigh] = useState<string>("");

  // For editing an alert
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLow, setEditLow] = useState<string>("");
  const [editHigh, setEditHigh] = useState<string>("");

  useEffect(() => {
    if (!token || !userId) {
      navigate("/");
    }
  }, [token, userId, navigate]);

  // 🔹 Fetch products (for dropdown)
  const {
    data: products = [],
    isLoading: productsLoading,
  } = useQuery<Product[]>({
    queryKey: ["products", userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/products?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!token && !!userId,
  });

  // 🔹 Fetch alerts
  const {
    data: alerts = [],
    isLoading: alertsLoading,
    error: alertsError,
  } = useQuery<Alert[]>({
    queryKey: ["alerts", userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/alerts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    enabled: !!token && !!userId,
  });

  // 🔹 Create alert
  const createAlertMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProductId || (!targetPriceLow && !targetPriceHigh)) {
        throw new Error("Missing product or target price");
      }

      const body: any = {
        productId: selectedProductId,
      };

      if (targetPriceLow) body.targetPriceLow = Number(targetPriceLow);
      if (targetPriceHigh) body.targetPriceHigh = Number(targetPriceHigh);

      const res = await fetch(`${API_BASE}/api/alerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || "Failed to create alert");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", userId] });
      setTargetPriceLow("");
      setTargetPriceHigh("");
      // keep selectedProductId as-is so user can add multiple fast
    },
  });

  // 🔹 Delete alert
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/alerts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || "Failed to delete alert");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", userId] });
    },
  });

  // 🔹 Update alert
  const updateAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const body: any = {};
      if (editLow !== "") body.targetPriceLow = Number(editLow);
      if (editHigh !== "") body.targetPriceHigh = Number(editHigh);

      const res = await fetch(`${API_BASE}/api/alerts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || "Failed to update alert");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", userId] });
      setEditingId(null);
      setEditLow("");
      setEditHigh("");
    },
  });

  const handleStartEdit = (alert: Alert) => {
    setEditingId(alert._id);
    setEditLow(
      alert.targetPriceLow !== undefined && alert.targetPriceLow !== null
        ? String(alert.targetPriceLow)
        : ""
    );
    setEditHigh(
      alert.targetPriceHigh !== undefined && alert.targetPriceHigh !== null
        ? String(alert.targetPriceHigh)
        : ""
    );
  };

  const resolveProductName = (alert: Alert) => {
    if (typeof alert.productId === "object" && alert.productId !== null) {
      return (alert.productId as Product).productName;
    }
    const found = products.find((p) => p._id === alert.productId);
    return found ? found.productName : "Unknown product";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Alerts
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create and manage price alerts for your tracked products.
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

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Create Alert */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create a new alert
          </h2>

          {productsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You don't have any tracked products yet. Add one on the
              Dashboard first.
            </p>
          ) : (
            <form
              className="grid gap-4 sm:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                createAlertMutation.mutate();
              }}
            >
              {/* Product select */}
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.productName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Low */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Price (Low)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetPriceLow}
                  onChange={(e) => setTargetPriceLow(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm px-2 py-1.5"
                />
              </div>

              {/* Target High */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Price (High)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetPriceHigh}
                  onChange={(e) => setTargetPriceHigh(e.target.value)}
                  placeholder="optional"
                  className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm px-2 py-1.5"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={createAlertMutation.isPending}
                  className="px-4 py-1.5 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {createAlertMutation.isPending
                    ? "Creating..."
                    : "Create Alert"}
                </button>
              </div>

              {createAlertMutation.isError && (
                <p className="text-sm text-red-500 sm:col-span-3">
                  {(createAlertMutation.error as Error).message}
                </p>
              )}
            </form>
          )}
        </section>

        {/* Existing Alerts */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your alerts
          </h2>

          {alertsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading alerts...
            </p>
          ) : alertsError ? (
            <p className="text-sm text-red-500">
              Failed to load alerts.
            </p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You don't have any alerts yet.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const isEditing = editingId === alert._id;
                const productName = resolveProductName(alert);

                return (
                  <div
                    key={alert._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {productName}
                      </p>
                      {!isEditing ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Low:{" "}
                          {alert.targetPriceLow != null
                            ? `$${alert.targetPriceLow}`
                            : "—"}{" "}
                          | High:{" "}
                          {alert.targetPriceHigh != null
                            ? `$${alert.targetPriceHigh}`
                            : "—"}{" "}
                          | Status:{" "}
                          {alert.triggered ? "Triggered" : "Active"}
                        </p>
                      ) : (
                        <div className="mt-1 flex gap-2 text-xs">
                          <div>
                            <span className="block text-gray-500 dark:text-gray-400">
                              Low
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={editLow}
                              onChange={(e) => setEditLow(e.target.value)}
                              className="w-24 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-1 py-0.5 text-xs"
                            />
                          </div>
                          <div>
                            <span className="block text-gray-500 dark:text-gray-400">
                              High
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={editHigh}
                              onChange={(e) => setEditHigh(e.target.value)}
                              className="w-24 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-1 py-0.5 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <button
                          onClick={() => handleStartEdit(alert)}
                          className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              updateAlertMutation.mutate(alert._id)
                            }
                            disabled={updateAlertMutation.isPending}
                            className="px-2 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditLow("");
                              setEditHigh("");
                            }}
                            className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() =>
                          deleteAlertMutation.mutate(alert._id)
                        }
                        disabled={deleteAlertMutation.isPending}
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

export default AlertsPage;
