// Chart7Day.tsx
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

const Chart7Day: React.FC<ChartProps> = ({ productName, history }) => {
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - 6);

  const dailyMap = new Map<string, number>();
  history.forEach((point) => {
    const date = new Date(point.timestamp);
    if (!isNaN(date.getTime()) && date >= cutoffDate) {
      const key = date.toISOString().split("T")[0]; // yyyy-mm-dd
      if (!dailyMap.has(key)) {
        dailyMap.set(key, point.price);
      }
    }
  });

  const filteredData = Array.from(dailyMap.entries())
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="col-span-4 w-full">
      <CardHeader>
        <CardTitle className="text-lg">7-Day Price History: {productName}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {filteredData.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No data from the past 7 days.
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
                    const date = new Date(iso);
                    return date.toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  labelFormatter={(iso) =>
                    `Date: ${new Date(iso as string).toLocaleDateString()}`
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

export default Chart7Day;