import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Activity, AlertCircle } from 'lucide-react';

type Product = {
  _id: string;
  productName: string;
  url: string;
  history: {
    price: number;
    timestamp: string;
  }[];
};

type DashboardSummaryProps = {
  products: Product[];
};

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ products }) => {
  const totalTracked = products.length;

  const priceDrops = products.filter((product) => {
    const h = product.history;
    return h.length >= 2 && h[h.length - 1].price < h[h.length - 2].price;
  });

  const priceIncreases = products.filter((product) => {
    const h = product.history;
    return h.length >= 2 && h[h.length - 1].price > h[h.length - 2].price;
  });

  const activeAlerts = priceDrops.length + priceIncreases.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 🟢 Tracked Products */}
      <Card className="bg-white dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Tracked Products
          </CardTitle>
          <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalTracked}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            +{priceDrops.length + priceIncreases.length} updated today
          </p>
        </CardContent>
      </Card>

      {/* 🔻 Price Drops */}
      <Card className="bg-white dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Price Decreases
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-green-500 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{priceDrops.length}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Based on last update</p>
        </CardContent>
      </Card>

      {/* 🔺 Price Increases */}
      <Card className="bg-white dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Price Increases
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-red-500 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{priceIncreases.length}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Based on last update</p>
        </CardContent>
      </Card>

      {/* ⚠️ Active Alerts */}
      <Card className="bg-white dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Active Alerts
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeAlerts}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {priceDrops.length} drops, {priceIncreases.length} increases
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
