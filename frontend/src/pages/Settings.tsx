import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/config";


type SettingsResponse = {
  email: string;
  phoneNumber?: string | null;
  emailAlertsEnabled: boolean;
  smsAlertsEnabled: boolean;
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const queryClient = useQueryClient();

  // browser notification pref is still local-only
  const [browserNotifEnabled, setBrowserNotifEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("pp_browser_notif_enabled");
    return stored === "true";
  });

  useEffect(() => {
    if (!token || !userId) {
      navigate("/");
    }
  }, [token, userId, navigate]);

  // Fetch settings from backend
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery<SettingsResponse>({
    queryKey: ["settings", userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
    enabled: !!token && !!userId,
  });

  // Local controlled fields for email/SMS/phone
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(false);

  // Initialize local state when settings load
  useEffect(() => {
    if (settings) {
      setPhoneInput(settings.phoneNumber || "");
      setEmailAlertsEnabled(settings.emailAlertsEnabled);
      setSmsAlertsEnabled(settings.smsAlertsEnabled);
      // If a phone number already exists in backend, lock it by default
      setPhoneLocked(!!settings.phoneNumber);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (body: Partial<SettingsResponse>) => {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
    },
  });

  const handleToggleBrowserNotifications = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }

    if (browserNotifEnabled) {
      setBrowserNotifEnabled(false);
      localStorage.setItem("pp_browser_notif_enabled", "false");
      return;
    }

    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setBrowserNotifEnabled(true);
      localStorage.setItem("pp_browser_notif_enabled", "true");
    } else {
      alert("Notifications are blocked or denied in your browser settings.");
    }
  };

  const handleSavePhoneNumber = () => {
    const raw = phoneInput.trim();
    const normalized = raw.replace(/\s+/g, "");

    // 🔐 Require +1 and 10 digits → +1XXXXXXXXXX
    if (!/^\+1\d{10}$/.test(normalized)) {
      alert("Please enter a valid US phone number in the format +1XXXXXXXXXX (e.g. +15551234567).");
      return;
    }

    updateSettingsMutation.mutate(
      {
        emailAlertsEnabled,
        smsAlertsEnabled,
        phoneNumber: normalized,
      },
      {
        onSuccess: () => {
          setPhoneInput(normalized);
          setPhoneLocked(true); // 🔒 lock after saving
        },
      }
    );
  };

  const handleEditPhoneNumber = () => {
    setPhoneLocked(false); // 🔓 unlock so user can edit
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    navigate("/");
  };

  const userEmail = settings?.email || localStorage.getItem("email") || "Unknown";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your account and notification preferences.
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
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Account section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Account
          </h2>
          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading settings...
            </p>
          ) : error ? (
            <p className="text-sm text-red-500">
              Failed to load settings.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Email</span>
                <span className="text-gray-900 dark:text-gray-100">{userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">User ID</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {userId || "Unknown"}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Notifications section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
          </h2>

          {/* Browser notifications (local only) */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Browser alerts
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Show native push notifications when a price alert is triggered.
              </p>
            </div>
            <button
              onClick={handleToggleBrowserNotifications}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                browserNotifEnabled
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              }`}
            >
              {browserNotifEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          {/* Email + SMS controlled via backend */}
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Email alerts
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive an email when a tracked product hits your target price.
                </p>
              </div>
              <button
                onClick={() => setEmailAlertsEnabled((v) => !v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  emailAlertsEnabled
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                }`}
              >
                {emailAlertsEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    SMS alerts
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get a text when your grails hit your price.
                  </p>
                </div>
                <button
                  onClick={() => setSmsAlertsEnabled((v) => !v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    smsAlertsEnabled
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  }`}
                >
                  {smsAlertsEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <input
                type="tel"
                placeholder="Phone number (e.g. +15551234567)"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                disabled={phoneLocked}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                  ${
                    phoneLocked
                      ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  }`}
              />

              <div className="flex gap-2 mt-2">
                {!phoneLocked ? (
                  <button
                    onClick={handleSavePhoneNumber}
                    disabled={updateSettingsMutation.isPending}
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save phone number"}
                  </button>
                ) : (
                  <button
                    onClick={handleEditPhoneNumber}
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Edit phone number
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Danger / auth section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Security
          </h2>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
          >
            Log out
          </button>
        </section>
      </main>
    </div>
  );
};

export default Settings;
