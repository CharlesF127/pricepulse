import React, { useState } from "react";
import { BarChart2 } from "lucide-react";

type Product = {
  _id: string;
  productName: string;
  url: string;
  history: {
    price: number;
    timestamp: string;
  }[];
};

type ProductsTableProps = {
  products: Product[];
  onSelectProduct: (product: Product) => void;
};

const timeRanges = ["24h", "7d", "30d"];

const ProductsTable: React.FC<ProductsTableProps> = ({ products, onSelectProduct }) => {
  const [selectedRange, setSelectedRange] = useState("24h");

  const filterByTimeRange = (history: Product["history"]) => {
    const now = new Date();
    return history.filter((point) => {
      const time = new Date(point.timestamp).getTime();
      const diffMs = now.getTime() - time;
      if (selectedRange === "24h") return diffMs <= 1000 * 60 * 60 * 24;
      if (selectedRange === "7d") return diffMs <= 1000 * 60 * 60 * 24 * 7;
      if (selectedRange === "30d") return diffMs <= 1000 * 60 * 60 * 24 * 30;
      return true;
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-2">
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
          className="border rounded-md px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
        >
          {timeRanges.map((range) => (
            <option key={range} value={range}>
              Last {range}
            </option>
          ))}
        </select>
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Product Name
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Current Price
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Change
            </th>
            <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {products.map((product) => {
            const filteredHistory = filterByTimeRange(product.history);
            const lastEntry = filteredHistory[filteredHistory.length - 1];
            const previousEntry = filteredHistory[filteredHistory.length - 2];

            const priceChange =
              previousEntry && lastEntry
                ? lastEntry.price - previousEntry.price
                : 0;

            const changeText =
              priceChange > 0
                ? "Price increased"
                : priceChange < 0
                ? "Price dropped"
                : "No change";

            return (
              <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {product.productName}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {lastEntry ? new Date(lastEntry.timestamp).toLocaleString() : "N/A"}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {lastEntry ? `$${lastEntry.price.toFixed(2)}` : "N/A"}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {changeText}
                </td>
                <td className="px-4 sm:px-6 py-4 text-center">
                  <button
                    onClick={() => onSelectProduct(product)}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                    title="View Price Chart"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;
