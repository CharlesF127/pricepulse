import React from "react";
import { useNavigate } from "react-router-dom";

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-900 dark:from-[#020617] dark:to-black text-gray-900 dark:text-gray-100">
      {/* Top nav */}
      <header className="border-b border-gray-200/70 dark:border-gray-800 sticky top-0 z-10 bg-white/80 dark:bg-[#020617]/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              P
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-base">PricePulse</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Track your grails like stocks
              </span>
            </div>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-3 py-1.5 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              Get started free
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        <section className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: text */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Live price tracking for sneaker grails
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Never miss a sneaker price drop again.
            </h1>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl">
              PricePulse tracks your GOAT listings in real-time, logs price history,
              and triggers alerts the moment your target size hits your price. Think{" "}
              <span className="font-semibold">stock charts</span> — but for your grails.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                Start tracking for free
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Log in to your dashboard
              </button>
            </div>

            {/* Trust / value bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <p className="font-semibold">Real-time tracking</p>
                <p className="text-gray-500 dark:text-gray-400">
                  Background price checks so you don’t have to refresh GOAT all day.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Smart alerts</p>
                <p className="text-gray-500 dark:text-gray-400">
                  Email + in-browser alerts as soon as your size hits your target.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Clean charts</p>
                <p className="text-gray-500 dark:text-gray-400">
                  24h, 7d, and 30d history so you can buy at the right moment.
                </p>
              </div>
            </div>

            {/* Pro badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs mt-2">
              <span className="font-semibold">Coming soon:</span>
              <span>PricePulse Pro — multi-site, SMS alerts & more</span>
            </div>
          </div>

          {/* Right: "screenshot" card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 via-sky-500/10 to-emerald-400/10 blur-2xl rounded-3xl pointer-events-none" />
            <div className="relative bg-white dark:bg-[#1A1F2C] rounded-3xl shadow-xl border border-gray-200/60 dark:border-gray-800 p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Live Preview
                  </p>
                  <p className="text-sm font-semibold">Your Sneaker Watchlist</p>
                </div>
                <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500">
                  Live
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-900/60 px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                      Jordan 4 Retro &quot;Military Black&quot;
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Size 10 • GOAT • Tracking 7 days
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">$412</p>
                    <p className="text-[11px] text-emerald-400">- $23 today</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-900/60 px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                      Dunk Low &quot;Panda&quot;
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Size 9.5 • GOAT • 30d trend
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">$189</p>
                    <p className="text-[11px] text-red-400">+ $15 this week</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Example alert
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Alert:</span> Military Black (10)
                  hits <span className="font-semibold">$400</span> — You’ll get an
                  email + in-browser notification instantly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/70 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>© {new Date().getFullYear()} PricePulse. All rights reserved.</span>
          <span className="flex gap-3">
            <button
              onClick={() => navigate("/login")}
              className="hover:text-gray-800 dark:hover:text-gray-200"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/register")}
              className="hover:text-gray-800 dark:hover:text-gray-200"
            >
              Get started
            </button>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
