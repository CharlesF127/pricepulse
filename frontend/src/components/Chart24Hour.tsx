import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HistoryPoint {
  price: number;
  timestamp: string;
}

interface ChartProps {
  productName: string;
  history: HistoryPoint[];
}

const Chart24Hour: React.FC<ChartProps> = ({ productName, history }) => {
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setHours(now.getHours() - 23, 0, 0, 0); // ⏳ Last 24 hours

  const filteredData = history
    .map((point) => {
      const date = new Date(point.timestamp);
      return isNaN(date.getTime()) ? null : {
        date: date.toISOString(), // Store as ISO string
        price: point.price,
      };
    })
    .filter((point): point is { date: string; price: number } => {
      return point !== null && new Date(point.date) >= cutoffDate;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="col-span-4 w-full">
      <CardHeader>
        <CardTitle>24-Hour Price History: {productName}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {filteredData.length === 0 ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            No price data available in the past 24 hours.
          </p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(iso) => {
                    const d = new Date(iso);
                    return d.toLocaleTimeString([], { hour: "numeric", hour12: true });
                  }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(val) => `$${val}`}
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  labelFormatter={(iso) =>
                    `Time: ${new Date(iso as string).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`
                  }
                  formatter={(val: number) => [`$${val.toFixed(2)}`, "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#6b46c1"
                  fill="#6b46c1"
                  fillOpacity={0.2}
                  activeDot={{ r: 5 }}
                  dot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Chart24Hour;
