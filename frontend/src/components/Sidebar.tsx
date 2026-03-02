import React from "react";
import { Logo } from "./Logo";

type View =
  | { type: "list" }
  | { type: "detail"; id: number }
  | { type: "new" }
  | { type: "users" }
  | { type: "assignments" }
  | { type: "history" };

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  currentUserName?: string;
  currentUserRole?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUserName,
  currentUserRole,
  onLogout
}) => {
  const isActive = (viewType: string) => {
    return currentView.type === viewType ? "active" : "";
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Logo />
      </div>
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${isActive("list")}`}
          onClick={() => onNavigate({ type: "list" })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
          </svg>
          <span>Dashboard</span>
        </button>
        <button
          className={`nav-item ${isActive("history")}`}
          onClick={() => onNavigate({ type: "history" })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 3 3 21 21 21"></polyline>
            <path d="M7 17l4-4 4 4 4-8"></path>
          </svg>
          <span>History</span>
        </button>
        {currentUserRole === "ADMIN" && (
          <>
            <button
              className={`nav-item ${isActive("users")}`}
              onClick={() => onNavigate({ type: "users" })}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="16" y1="11" x2="22" y2="11" />
              </svg>
              <span>Employees</span>
            </button>
            <button
              className={`nav-item ${isActive("assignments")}`}
              onClick={() => onNavigate({ type: "assignments" })}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6" />
                <path d="M12 9v6" />
                <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
              </svg>
              <span>Assignments</span>
            </button>
          </>
        )}
        <button
          className={`nav-item ${isActive("new")}`}
          onClick={() => onNavigate({ type: "new" })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Issue</span>
        </button>
        {onLogout && currentUserName && (
          <button className="nav-item" onClick={onLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        )}
      </nav>
    </aside>
  );
};
