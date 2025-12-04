import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DashboardSummary from "@/components/DashboardSummary";
import ProductsTable from "@/components/ProductsTable";
import AddProductForm from "@/components/AddProductForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "@/components/ui/sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Chart24Hour from "@/components/Chart24Hour";
import Chart7Day from "@/components/Chart7Day";
import Chart30Day from "@/components/Chart30Day";
import io from "socket.io-client";
import { API_BASE } from "@/config"; // 👈 ADD THIS

export type Product = {
  _id: string;
  productName: string;
  url: string;
  history: {
    price: number;
    timestamp: string;
  }[];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const queryClient = useQueryClient();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("7d");

  // 🔴 NEW: notification badge count
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!token || !userId) {
      navigate("/");
    }
  }, [token, userId, navigate]);

  // 🔔 Load notifications count from backend
  useEffect(() => {
    if (!token) return;

    const fetchNotificationCount = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/notifications`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        setNotificationCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotificationCount();
  }, [token]);

  // Real-time alerts via socket.io
  useEffect(() => {
    const socket = io(API_BASE);

    // Request Notification permission when the component mounts
    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          console.log("✅ Notification permission granted.");
        } else {
          console.log("❌ Notification permission denied or dismissed.");
        }
      });
    }

    socket.on("alertTriggered", (data) => {
      // 1. Show Sonner toast
      toast(`🚨 ${data.productName} hit $${data.triggeredPrice}`);

      // 2. Show native browser notification IF permission is granted
      if (Notification.permission === "granted") {
        new Notification("PricePulse Alert!", {
          body: `${data.productName} is now $${data.triggeredPrice}!`,
          icon: "/favicon.ico",
        });
      }

      // 3. 🔴 Bump notification counter for badge
      setNotificationCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // (You technically don't need this second Notification.useEffect anymore,
  // but I'm leaving it since it was already in your file and doesn't hurt.)
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        console.log("Notification permission:", perm);
      });
    }
  }, []);

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery<Product[], Error>({
    queryKey: ["products", userId],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.status === 404) return [];
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!userId && !!token,
    refetchInterval: 10000,
  });

  const removeProduct = async () => {
    const name = prompt("Enter the product name to remove:");
    if (!name || !userId) return;

    const matching = products.filter((p) => p.productName === name);
    if (matching.length === 0) {
      alert("No product found with that name.");
      return;
    }

    const productToDelete = matching[matching.length - 1];
    const res = await fetch(
      `${API_BASE}/api/products/${productToDelete._id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.ok) {
      alert("Product removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["products", userId] });
    } else {
      alert("Failed to remove product.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <Toaster />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>

          <div className="flex items-center gap-3">
            {/* 🔔 Alerts button */}
            <button
              onClick={() => navigate("/alerts")}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Alerts
            </button>

            {/* 🔔 Notifications button with badge */}
            <button
              onClick={() => navigate("/notifications")}
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span role="img" aria-label="bell">
                🔔
              </span>

              {/* Badge only shows if count > 0 */}
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 text-[0.7rem] font-semibold text-white px-1">
                  {notificationCount}
                </span>
              )}
            </button>

            <AddProductForm />

            <button
              onClick={removeProduct}
              className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
            >
              Remove Product
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        ) : error ? (
          <p className="text-red-500">Failed to load products</p>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-4">
              You're not tracking any products yet.
            </p>
            <AddProductForm />
          </div>
        ) : (
          <>
            <DashboardSummary products={products} />

            <div className="mt-6">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Products</TabsTrigger>
                  <TabsTrigger value="priceDrops">Price Drops</TabsTrigger>
                  <TabsTrigger value="priceIncreases">
                    Price Increases
                  </TabsTrigger>
                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <ProductsTable
                    products={products}
                    onSelectProduct={setSelectedProduct}
                  />
                </TabsContent>
                <TabsContent value="priceDrops">
                  <p className="text-center p-4 text-gray-500 dark:text-gray-400">
                    Filter showing only products with price drops
                  </p>
                </TabsContent>
                <TabsContent value="priceIncreases">
                  <p className="text-center p-4 text-gray-500 dark:text-gray-400">
                    Filter showing only products with price increases
                  </p>
                </TabsContent>
                <TabsContent value="alerts">
                  <p className="text-center p-4 text-gray-500 dark:text-gray-400">
                    Filter showing only products with active alerts
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            <div className="mt-10 space-y-4">
              <div className="flex gap-3 justify-center">
                {["24h", "7d", "30d"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf as any)}
                    className={`px-3 py-1 text-sm rounded ${
                      timeframe === tf
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    {tf === "24h"
                      ? "24 Hours"
                      : tf === "7d"
                      ? "7 Days"
                      : "30 Days"}
                  </button>
                ))}
              </div>

              {selectedProduct ? (
                timeframe === "24h" ? (
                  <Chart24Hour
                    productName={selectedProduct.productName}
                    history={selectedProduct.history}
                  />
                ) : timeframe === "7d" ? (
                  <Chart7Day
                    productName={selectedProduct.productName}
                    history={selectedProduct.history}
                  />
                ) : (
                  <Chart30Day
                    productName={selectedProduct.productName}
                    history={selectedProduct.history}
                  />
                )
              ) : (
                <p className="text-center mt-8 text-gray-500 dark:text-gray-400">
                  Click the graph icon to see a price chart for that product.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
