import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot
} from 'recharts';

type HistoryPoint = {
  price: number;
  timestamp: string;
};

interface PriceChartProps {
  productName: string;
  history: HistoryPoint[];
  timeframe: '24h' | '7d' | '30d';
}

const PriceChart: React.FC<PriceChartProps> = ({ productName, history, timeframe }) => {
  const now = new Date();
  let cutoffDate = new Date();

  switch (timeframe) {
    case '24h':
      cutoffDate.setHours(now.getHours() - 24);
      break;
    case '7d':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      cutoffDate.setDate(now.getDate() - 30);
      break;
  }

  const filteredData = history
    .map((point) => ({
      date: new Date(point.timestamp),
      price: point.price,
    }))
    .filter((point) => point.date >= cutoffDate);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Price History: {productName}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {filteredData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip
                  labelFormatter={(value) =>
                    `Date: ${new Date(value as string).toLocaleDateString()}`
                  }
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#6b46c1"
                  fill="#6b46c1"
                  fillOpacity={0.2}
                  activeDot={{ r: 5 }}
                  dot={{ r: 3 }} // 📍 Dot for each data point
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No price history available in this timeframe.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceChart;
