import React from "react";
import { Status, Issue } from "../api";

interface StatsCardsProps {
  issues: Issue[];
  statusCounts: Record<Status, number>;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ issues, statusCounts }) => {
  const totalIssues = issues.length;
  const criticalIssues = issues.filter((i) => i.priority === "CRITICAL").length;
  const highPriorityIssues = issues.filter((i) => i.priority === "HIGH").length;
  const inProgressIssues = statusCounts.IN_PROGRESS;

  const stats = [
    {
      label: "Total Issues",
      value: totalIssues,
      icon: "📊",
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.1)"
    },
    {
      label: "Critical",
      value: criticalIssues,
      icon: "🚨",
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.1)"
    },
    {
      label: "High Priority",
      value: highPriorityIssues,
      icon: "⚠️",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)"
    },
    {
      label: "In Progress",
      value: inProgressIssues,
      icon: "⚡",
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)"
    }
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card" style={{ borderLeftColor: stat.color }}>
          <div className="stat-icon" style={{ backgroundColor: stat.bg }}>
            <span style={{ fontSize: "24px" }}>{stat.icon}</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
