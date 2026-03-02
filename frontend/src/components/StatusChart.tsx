import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Status } from "../api";

interface StatusChartProps {
  statusCounts: Record<Status, number>;
}

const COLORS = {
  OPEN: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  RESOLVED: "#10b981",
  CLOSED: "#6b7280"
};

export const StatusChart: React.FC<StatusChartProps> = ({ statusCounts }) => {
  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace("_", " "),
    value: count,
    color: COLORS[status as Status]
  }));

  const pieData = data.map((item) => ({
    name: item.name,
    value: item.value
  }));

  return (
    <div className="charts-container">
      <div className="chart-card">
        <h3>Issues by Status (Bar)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "8px",
                color: "#f9fafb"
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-card">
        <h3>Status Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[Object.keys(statusCounts)[index] as Status]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "8px",
                color: "#f9fafb"
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
