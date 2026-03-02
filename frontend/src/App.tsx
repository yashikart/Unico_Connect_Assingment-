import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  getIssues,
  getIssue,
  getProjects,
  getUsers,
  createIssue,
  updateIssue,
  addComment,
  Issue,
  IssueDetail,
  Project,
  User,
  Priority,
  Status,
  login,
  AuthUser,
  createUser,
  updateUser,
  deleteUser,
  UserCreateInput,
  UserUpdateInput,
  aiParseIssue,
  aiSuggestTriage,
  uploadAttachment,
  Attachment as IssueAttachment,
  getRecentActivity,
  RecentActivityItem
} from "./api";
import { Sidebar } from "./components/Sidebar";
import { StatsCards } from "./components/StatsCards";
import { StatusChart } from "./components/StatusChart";

type View =
  | { type: "list" }
  | { type: "detail"; id: number }
  | { type: "new" }
  | { type: "users" }
  | { type: "assignments" }
  | { type: "history" };

const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statuses: Status[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export const App: React.FC = () => {
  const getInitialTheme = (): "light" | "dark" => {
    try {
      const stored = window.localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch {
      // ignore
    }
    return "light";
  };

  // Initialize view from localStorage or default to list
  const getInitialView = (): View => {
    const stored = window.localStorage.getItem("currentView");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as View;
        // Validate the view structure
        if (parsed.type === "list" || parsed.type === "new" || parsed.type === "users" || parsed.type === "assignments" || parsed.type === "history") {
          return parsed;
        }
        if (parsed.type === "detail" && typeof parsed.id === "number") {
          return parsed;
        }
      } catch {
        // Invalid stored view, use default
      }
    }
    return { type: "list" };
  };

  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const [view, setView] = useState<View>(getInitialView);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState("admin@unico.local");
  const [authPassword, setAuthPassword] = useState("admin123");

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  const [filters, setFilters] = useState<{
    project_id?: number;
    priority?: Priority;
    status?: Status;
    assignee_id?: number;
    search?: string;
    completion?: "COMPLETED" | "INCOMPLETE";
  }>({});

  const [searchInput, setSearchInput] = useState("");

  const [selectedIssue, setSelectedIssue] = useState<IssueDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [newIssueError, setNewIssueError] = useState<string | null>(null);
  const [newIssueLoading, setNewIssueLoading] = useState(false);
  const [aiParseLoading, setAiParseLoading] = useState(false);
  const [aiTriageLoading, setAiTriageLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const [newEmployeeError, setNewEmployeeError] = useState<string | null>(null);
  const [newEmployeeLoading, setNewEmployeeLoading] = useState(false);
  const [newEmployeeSuccess, setNewEmployeeSuccess] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState<UserCreateInput>({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE"
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState<UserUpdateInput>({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE"
  });
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [deleteUserLoading, setDeleteUserLoading] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIssueIds, setReadNotificationIssueIds] = useState<number[]>([]);
  const [showEmployeeNotifications, setShowEmployeeNotifications] = useState(false);
  const [readEmployeeNotificationIssueIds, setReadEmployeeNotificationIssueIds] = useState<number[]>([]);

  // Initialize employeesTab from localStorage or default to "list"
  const getInitialEmployeesTab = (): "list" | "create" => {
    const stored = window.localStorage.getItem("employeesTab");
    if (stored === "list" || stored === "create") {
      return stored;
    }
    return "list";
  };
  const [employeesTab, setEmployeesTab] = useState<"list" | "create">(getInitialEmployeesTab);
  const newIssueFormRef = useRef<HTMLFormElement | null>(null);
  const issueTableRef = useRef<HTMLDivElement | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);


  const handleLogout = () => {
    setCurrentUser(null);
    window.localStorage.removeItem("currentUser");
    // Reset view to dashboard on logout
    setView({ type: "list" });
    window.localStorage.setItem("currentView", JSON.stringify({ type: "list" }));
  };

  // Load lookup data once
  useEffect(() => {
    getProjects().then(setProjects).catch(() => {
      // simple ignore; real app would show error
    });
    getUsers().then(setUsers).catch(() => {
      // simple ignore; real app would show error
    });
    // try restore user from localStorage
    const stored = window.localStorage.getItem("currentUser");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        setCurrentUser(parsed);
      } catch {
        window.localStorage.removeItem("currentUser");
      }
    }
    const storedRead = window.localStorage.getItem("readIssueNotifications");
    if (storedRead) {
      try {
        const parsed = JSON.parse(storedRead) as number[];
        setReadNotificationIssueIds(parsed);
      } catch {
        window.localStorage.removeItem("readIssueNotifications");
      }
    }
    // Restore employee notifications
    const storedEmployeeRead = window.localStorage.getItem("readEmployeeNotifications");
    if (storedEmployeeRead) {
      try {
        const parsed = JSON.parse(storedEmployeeRead) as number[];
        setReadEmployeeNotificationIssueIds(parsed);
      } catch {
        window.localStorage.removeItem("readEmployeeNotifications");
      }
    }
    // Restore employeesTab from localStorage
    const storedTab = window.localStorage.getItem("employeesTab");
    if (storedTab === "list" || storedTab === "create") {
      setEmployeesTab(storedTab);
    }
  }, []);

  // Load recent activity (comments + attachments) for admin notifications
  useEffect(() => {
    if (!currentUser || currentUser.role !== "ADMIN") return;
    getRecentActivity(20)
      .then((items) => {
        setRecentActivity(items);
        setActivityError(null);
      })
      .catch((err: any) => {
        setActivityError(err.message || "Failed to load recent activity");
      });
  }, [currentUser]);

  // Persist view state to localStorage whenever it changes
  useEffect(() => {
    window.localStorage.setItem("currentView", JSON.stringify(view));
  }, [view]);

  // Persist employeesTab state to localStorage whenever it changes
  useEffect(() => {
    window.localStorage.setItem("employeesTab", employeesTab);
  }, [employeesTab]);

  // Persist employee notification state to localStorage
  useEffect(() => {
    window.localStorage.setItem("readEmployeeNotifications", JSON.stringify(readEmployeeNotificationIssueIds));
  }, [readEmployeeNotificationIssueIds]);

  // Load issues whenever filters change
  useEffect(() => {
    if (view.type !== "list" && view.type !== "assignments") return;
    setIssuesLoading(true);
    setIssuesError(null);
    // For employees, automatically filter by their assignee_id
    const employeeFilters = currentUser?.role === "EMPLOYEE" 
      ? { ...filters, assignee_id: currentUser.id }
      : filters;
    getIssues(employeeFilters)
      .then((data) => setIssues(data))
      .catch((err) => setIssuesError(err.message || "Failed to load issues"))
      .finally(() => setIssuesLoading(false));
  }, [filters, view.type, currentUser]);

  // Load issue detail
  useEffect(() => {
    if (view.type !== "detail") return;
    setDetailLoading(true);
    setDetailError(null);
    setSelectedIssue(null);
    getIssue(view.id)
      .then((data) => setSelectedIssue(data))
      .catch((err) => setDetailError(err.message || "Failed to load issue"))
      .finally(() => setDetailLoading(false));
  }, [view]);

  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0
    };
    for (const issue of issues) {
      counts[issue.status] += 1;
    }
    return counts;
  }, [issues]);

  const criticalIssues = useMemo(() => {
    return issues.filter((issue) => issue.priority === "CRITICAL" && (issue.status === "OPEN" || issue.status === "IN_PROGRESS"));
  }, [issues]);

  const highPriorityIssues = useMemo(() => {
    return issues.filter((issue) => issue.priority === "HIGH" && (issue.status === "OPEN" || issue.status === "IN_PROGRESS"));
  }, [issues]);

  const recentNewIssues = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return issues.filter((issue) => {
      const created = new Date(issue.created_at).getTime();
      return now - created < oneDayMs;
    });
  }, [issues]);

  const unreadRecentIssues = useMemo(
    () => recentNewIssues.filter((issue) => !readNotificationIssueIds.includes(issue.id)),
    [recentNewIssues, readNotificationIssueIds]
  );

  // Employee notifications: issues assigned to them that were recently updated
  const employeeIssues = useMemo(() => {
    if (!currentUser || currentUser.role !== "EMPLOYEE") return [];
    return issues.filter((issue) => issue.assignee_id === currentUser.id);
  }, [issues, currentUser]);

  const employeeStatusCounts = useMemo(() => {
    const counts: Record<Status, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0
    };
    for (const issue of employeeIssues) {
      counts[issue.status] += 1;
    }
    return counts;
  }, [employeeIssues]);

  const recentlyUpdatedEmployeeIssues = useMemo(() => {
    if (!currentUser || currentUser.role !== "EMPLOYEE") return [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return employeeIssues.filter((issue) => {
      const updated = new Date(issue.updated_at).getTime();
      const created = new Date(issue.created_at).getTime();
      // Show if updated in last 24h (and not just created)
      return now - updated < oneDayMs && updated > created + 60000; // At least 1 minute after creation
    });
  }, [employeeIssues]);

  const unreadEmployeeNotifications = useMemo(
    () => recentlyUpdatedEmployeeIssues.filter((issue) => !readEmployeeNotificationIssueIds.includes(issue.id)),
    [recentlyUpdatedEmployeeIssues, readEmployeeNotificationIssueIds]
  );

  const handleGenerateFieldsWithAI = async () => {
    if (!newIssueFormRef.current) return;
    setAiError(null);
    setAiSuggestion(null);
    const formEl = newIssueFormRef.current;
    const freeTextEl = formEl.elements.namedItem("ai_free_text") as HTMLTextAreaElement | null;
    const freeText = freeTextEl?.value.trim() || "";
    if (!freeText) {
      setAiError("Please enter a rough description for AI to parse.");
      return;
    }
    setAiParseLoading(true);
    try {
      const result = await aiParseIssue({ free_text: freeText });
      const titleEl = formEl.elements.namedItem("title") as HTMLInputElement | null;
      const descEl = formEl.elements.namedItem("description") as HTMLTextAreaElement | null;
      const projectEl = formEl.elements.namedItem("project_id") as HTMLSelectElement | null;
      const priorityEl = formEl.elements.namedItem("priority") as HTMLSelectElement | null;
      const statusEl = formEl.elements.namedItem("status") as HTMLSelectElement | null;
      const assigneeEl = formEl.elements.namedItem("assignee_id") as HTMLSelectElement | null;

      if (titleEl && result.title) titleEl.value = result.title;
      if (descEl && result.description) descEl.value = result.description;
      if (projectEl && result.project_id) projectEl.value = String(result.project_id);
      if (priorityEl && result.priority) priorityEl.value = result.priority;

      // For admins, we can also prefill status and assignee
      if ((!currentUser || currentUser.role !== "EMPLOYEE") && statusEl && result.status) {
        statusEl.value = result.status;
      }
      if ((!currentUser || currentUser.role !== "EMPLOYEE") && assigneeEl && result.assignee_id) {
        assigneeEl.value = String(result.assignee_id);
      }
    } catch (err: any) {
      setAiError(err.message || "AI could not parse this issue.");
    } finally {
      setAiParseLoading(false);
    }
  };

  const handleSuggestTriageWithAI = async () => {
    if (!newIssueFormRef.current) return;
    setAiError(null);
    setAiSuggestion(null);
    const formEl = newIssueFormRef.current;
    const titleEl = formEl.elements.namedItem("title") as HTMLInputElement | null;
    const descEl = formEl.elements.namedItem("description") as HTMLTextAreaElement | null;
    const projectEl = formEl.elements.namedItem("project_id") as HTMLSelectElement | null;

    const title = titleEl?.value.trim() || "";
    const description = descEl?.value.trim() || "";
    const projectId = projectEl?.value ? Number(projectEl.value) : 0;

    if (!title || !description || !projectId) {
      setAiError("Please fill Title, Description, and Project before asking AI for triage.");
      return;
    }

    setAiTriageLoading(true);
    try {
      const result = await aiSuggestTriage({ title, description, project_id: projectId });
      const priorityEl = formEl.elements.namedItem("priority") as HTMLSelectElement | null;
      const assigneeEl = formEl.elements.namedItem("assignee_id") as HTMLSelectElement | null;

      if (priorityEl && result.priority) {
        priorityEl.value = result.priority;
      }
      if (assigneeEl && result.assignee_id) {
        assigneeEl.value = String(result.assignee_id);
      }
      if (result.rationale) {
        setAiSuggestion(result.rationale);
      }
    } catch (err: any) {
      setAiError(err.message || "AI could not suggest triage for this issue.");
    } finally {
      setAiTriageLoading(false);
    }
  };

  const handleCreateIssueSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setAiError(null);
    setAiSuggestion(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const projectId = Number(formData.get("project_id") || 0);
    const priority = formData.get("priority") as Priority;
    const isEmployee = currentUser?.role === "EMPLOYEE";

    let status = formData.get("status") as Status | null;
    const assigneeIdRaw = formData.get("assignee_id");

    // For employees, force status to OPEN and auto-assign to the employee
    let assigneeId: number | undefined;
    if (isEmployee && currentUser) {
      status = "OPEN";
      assigneeId = currentUser.id;
    } else {
      assigneeId = assigneeIdRaw ? Number(assigneeIdRaw) : undefined;
    }

    if (!title || !description || !projectId || !priority || (!isEmployee && !status)) {
      setNewIssueError("All required fields must be filled.");
      return;
    }

    setNewIssueError(null);
    setNewIssueLoading(true);
    try {
      await createIssue({
        title,
        description,
        project_id: projectId,
        priority,
        status: (status || "OPEN") as Status,
        assignee_id: assigneeId
      });
      setView({ type: "list" });
      // refresh list
      setFilters({ ...filters });
    } catch (err: any) {
      setNewIssueError(err.message || "Failed to create issue");
    } finally {
      setNewIssueLoading(false);
    }
  };

  const handleStatusChange = async (issueId: number, newStatus: Status) => {
    try {
      await updateIssue(issueId, { status: newStatus });
      if (view.type === "detail") {
        setView({ type: "detail", id: issueId });
      } else {
        setFilters({ ...filters });
      }
    } catch (err) {
      // could show toast
    }
  };

  const handleAddComment = async () => {
    if (!selectedIssue) return;
    const body = commentText.trim();
    if (!body) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    const authorId = currentUser?.id ?? users[0]?.id;
    if (!authorId) {
      setCommentError("No users available to attach as author.");
      return;
    }
    setCommentError(null);
    setCommentLoading(true);
    try {
      await addComment(selectedIssue.id, { body, author_id: authorId });
      setCommentText("");
      setView({ type: "detail", id: selectedIssue.id });
    } catch (err: any) {
      setCommentError(err.message || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCreateEmployee: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setNewEmployeeError(null);
    setNewEmployeeSuccess(null);
    setNewEmployeeLoading(true);
    try {
      if (!employeeForm.name || !employeeForm.email || !employeeForm.password) {
        setNewEmployeeError("Name, email, and password are required.");
        setNewEmployeeLoading(false);
        return;
      }
      await createUser(employeeForm);
      const employeeName = employeeForm.name; // Store name before clearing form
      const refreshed = await getUsers();
      setUsers(refreshed);
      setEmployeeForm({ name: "", email: "", password: "", role: "EMPLOYEE" });
      setNewEmployeeSuccess(`Employee "${employeeName}" created successfully!`);
      setEmployeesTab("list"); // Switch to list tab to show the new employee
      // Clear success message after 3 seconds
      setTimeout(() => {
        setNewEmployeeSuccess(null);
      }, 3000);
    } catch (err: any) {
      setNewEmployeeError(err.message || "Failed to create employee");
    } finally {
      setNewEmployeeLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password
      role: user.role || "EMPLOYEE"
    });
    setEditUserError(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditUserForm({ name: "", email: "", password: "", role: "EMPLOYEE" });
    setEditUserError(null);
  };

  const handleUpdateUser: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setEditUserError(null);
    setEditUserLoading(true);
    try {
      // Only include fields that have changed or are required
      const updateData: UserUpdateInput = {};
      if (editUserForm.name && editUserForm.name !== editingUser.name) {
        updateData.name = editUserForm.name;
      }
      if (editUserForm.email && editUserForm.email !== editingUser.email) {
        updateData.email = editUserForm.email;
      }
      if (editUserForm.password && editUserForm.password.trim() !== "") {
        updateData.password = editUserForm.password;
      }
      if (editUserForm.role && editUserForm.role !== editingUser.role) {
        updateData.role = editUserForm.role;
      }

      await updateUser(editingUser.id, updateData);
      const refreshed = await getUsers();
      setUsers(refreshed);
      setNewEmployeeSuccess(`User "${editUserForm.name || editingUser.name}" updated successfully!`);
      handleCancelEdit();
      setTimeout(() => {
        setNewEmployeeSuccess(null);
      }, 3000);
    } catch (err: any) {
      setEditUserError(err.message || "Failed to update user");
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleteUserLoading(user.id);
    try {
      await deleteUser(user.id);
      const refreshed = await getUsers();
      setUsers(refreshed);
      setNewEmployeeSuccess(`User "${user.name}" deleted successfully!`);
      setTimeout(() => {
        setNewEmployeeSuccess(null);
      }, 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    } finally {
      setDeleteUserLoading(null);
    }
  };

  const markAllNotificationsRead = () => {
    if (unreadRecentIssues.length === 0) return;
    const updated = Array.from(
      new Set([...readNotificationIssueIds, ...unreadRecentIssues.map((i) => i.id)])
    );
    setReadNotificationIssueIds(updated);
    window.localStorage.setItem("readIssueNotifications", JSON.stringify(updated));
    setShowNotifications(false);
  };

  const markAllEmployeeNotificationsRead = () => {
    if (unreadEmployeeNotifications.length === 0) return;
    const updated = Array.from(
      new Set([...readEmployeeNotificationIssueIds, ...unreadEmployeeNotifications.map((i) => i.id)])
    );
    setReadEmployeeNotificationIssueIds(updated);
    window.localStorage.setItem("readEmployeeNotifications", JSON.stringify(updated));
    setShowEmployeeNotifications(false);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleInlineAssigneeChange = async (issueId: number, newAssigneeId: number | "") => {
    try {
      await updateIssue(issueId, { assignee_id: newAssigneeId === "" ? null : newAssigneeId });
      setFilters({ ...filters });
    } catch (err) {
      // TODO: add toast
    }
  };

  const handleCompletionChange = async (issue: Issue, completion: "COMPLETED" | "INCOMPLETE") => {
    const newStatus: Status =
      completion === "COMPLETED" ? "RESOLVED" : "OPEN";
    try {
      await updateIssue(issue.id, { status: newStatus });
      setFilters({ ...filters });
    } catch (err) {
      // TODO: add toast
    }
  };

  const handleDownloadCsv = () => {
    if (!visibleIssues.length) return;

    const header = [
      "ID",
      "Title",
      "Project",
      "Priority",
      "Status",
      "Completion",
      "Assignee",
      "Created At",
      "Updated At"
    ];

    const rows = visibleIssues.map((issue) => {
      const project = projects.find((p) => p.id === issue.project_id);
      const assignee = users.find((u) => u.id === issue.assignee_id);
      const completion =
        issue.status === "RESOLVED" || issue.status === "CLOSED" ? "COMPLETED" : "INCOMPLETE";

      return [
        issue.id,
        issue.title,
        project?.name ?? "",
        issue.priority,
        issue.status,
        completion,
        assignee?.name ?? "",
        issue.created_at,
        issue.updated_at
      ];
    });

    const escape = (value: unknown) => {
      const str = String(value ?? "");
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "issues.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoginSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await login({ email: authEmail, password: authPassword });
      setCurrentUser(res.user);
      window.localStorage.setItem("currentUser", JSON.stringify(res.user));
    } catch (err: any) {
      setAuthError(err.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const renderStatusCounts = () => (
    <div className="status-bar">
      {statuses.map((s) => (
        <div key={s} className="status-chip">
          <span className="status-label">{s.replace("_", " ")}</span>
          <span className="status-count">{statusCounts[s]}</span>
        </div>
      ))}
    </div>
  );

  const hasActiveFilters = () => {
    return !!(
      filters.project_id ||
      filters.priority ||
      filters.status ||
      filters.assignee_id ||
      filters.search ||
      filters.completion
    );
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput("");
  };

  // Apply completion filter on top of server-side filters
  const visibleIssues = useMemo(() => {
    if (!filters.completion) return issues;
    if (filters.completion === "COMPLETED") {
      return issues.filter((issue) => issue.status === "RESOLVED" || issue.status === "CLOSED");
    }
    // INCOMPLETE
    return issues.filter((issue) => issue.status === "OPEN" || issue.status === "IN_PROGRESS");
  }, [issues, filters.completion]);

  const renderFilters = () => (
    <div className="filters-grid">
      <div className="filter-group">
        <label className="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
          Project
        </label>
        <select
          value={filters.project_id ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              project_id: e.target.value ? Number(e.target.value) : undefined
            })
          }
          className="filter-select"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Priority
        </label>
        <select
          value={filters.priority ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              priority: (e.target.value || undefined) as Priority | undefined
            })
          }
          className="filter-select"
        >
          <option value="">All Priorities</option>
          {priorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Status
        </label>
        <select
          value={filters.status ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              status: (e.target.value || undefined) as Status | undefined
            })
          }
          className="filter-select"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" />
          </svg>
          Completion
        </label>
        <select
          value={filters.completion ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              completion: (e.target.value || undefined) as "COMPLETED" | "INCOMPLETE" | undefined
            })
          }
          className="filter-select"
        >
          <option value="">All</option>
          <option value="COMPLETED">Completed</option>
          <option value="INCOMPLETE">Incomplete</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Assignee
        </label>
        <select
          value={filters.assignee_id ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              assignee_id: e.target.value ? Number(e.target.value) : undefined
            })
          }
          className="filter-select"
        >
          <option value="">All Assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group filter-search">
        <label className="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          Search
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilters({ ...filters, search: searchInput || undefined });
          }}
          className="search-form-inline"
        >
          <input
            type="text"
            placeholder="Search title or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </form>
      </div>

      {hasActiveFilters() && (
        <button className="clear-filters-btn" onClick={clearFilters}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Clear All
        </button>
      )}
    </div>
  );

  const renderIssueTable = () => {
    const employeeUsers = users.filter((u) => (u.role || "").toUpperCase() === "EMPLOYEE");
    const coreAssignees = employeeUsers
      .filter((u) => !u.name.toLowerCase().startsWith("emp"))
      .slice(0, 5);

    return (
      <div className="card" ref={issueTableRef}>
        <div className="card-header">
          <div>
            <h2>All Issues</h2>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn-secondary" type="button" onClick={handleDownloadCsv}>
              Download CSV
            </button>
            <button className="btn-primary" onClick={() => setView({ type: "new" })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Issue
            </button>
          </div>
        </div>
        {/* Quick priority filter for this table */}
        <div className="filters-inline">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Priority
              </label>
              <select
                value={filters.priority || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priority: (e.target.value || undefined) as Priority | undefined
                  })
                }
                className="filter-select"
              >
                <option value="">All Priorities</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
        </div>
        {issuesLoading && <div className="loading">Loading issues...</div>}
        {issuesError && <div className="error" style={{ marginBottom: "1rem" }}>{issuesError}</div>}
        {!issuesLoading && !issuesError && visibleIssues.length === 0 && (
          <div className="empty-state">
            <p>No issues found. Create your first issue to get started!</p>
          </div>
        )}
        {!issuesLoading && !issuesError && visibleIssues.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Name</th>
                  <th>Assignee</th>
                  <th>Completion</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {visibleIssues.map((issue) => {
                  const project = projects.find((p) => p.id === issue.project_id);
                  const assignee = users.find((u) => u.id === issue.assignee_id);
                  const completion =
                    issue.status === "RESOLVED" || issue.status === "CLOSED"
                      ? "COMPLETED"
                      : "INCOMPLETE";
                  return (
                    <tr key={issue.id}>
                      <td>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => setView({ type: "detail", id: issue.id })}
                        >
                          {issue.title}
                        </button>
                      </td>
                      <td>{project?.name ?? "Unknown"}</td>
                      <td>
                        <span className={`priority-badge priority-${issue.priority}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td>{assignee?.name ?? "Unassigned"}</td>
                      <td>{completion === "COMPLETED" ? "Completed" : "Incomplete"}</td>
                      <td>
                        <span className={`status-badge status-${issue.status}`}>
                          {issue.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="muted">
                        {new Date(issue.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderHistory = () => {
    const isEmployee = currentUser?.role === "EMPLOYEE";
    const sourceIssues = isEmployee
      ? issues.filter((i) => i.assignee_id === currentUser?.id)
      : issues;

    const sorted = [...sourceIssues].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return (
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Issue History</h2>
            <p className="muted">
              {isEmployee
                ? "All issues assigned to you, with their current status and last activity."
                : "All issues in the system, ordered by most recently updated."}
            </p>
          </div>
        </div>
        {issuesLoading && <div className="loading">Loading issues...</div>}
        {issuesError && <div className="error" style={{ marginBottom: "1rem" }}>{issuesError}</div>}
        {!issuesLoading && !issuesError && sorted.length === 0 && (
          <div className="empty-state">
            <p className="muted">
              {isEmployee ? "No issues have been assigned to you yet." : "No issues have been created yet."}
            </p>
          </div>
        )}
        {!issuesLoading && !issuesError && sorted.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Active?</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((issue) => {
                  const project = projects.find((p) => p.id === issue.project_id);
                  const isActive =
                    issue.status === "OPEN" || issue.status === "IN_PROGRESS";
                  return (
                    <tr
                      key={issue.id}
                      onClick={() => setView({ type: "detail", id: issue.id })}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <strong>{issue.title}</strong>
                      </td>
                      <td>{project?.name ?? "Unknown"}</td>
                      <td>
                        <span className={`priority-badge priority-${issue.priority}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${issue.status}`}>
                          {issue.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        {isActive ? (
                          <span className="status-badge status-OPEN">Active</span>
                        ) : (
                          <span className="status-badge status-CLOSED">Closed</span>
                        )}
                      </td>
                      <td className="muted">
                        {new Date(issue.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderAssignments = () => {
    const employeeUsers = users.filter((u) => (u.role || "").toUpperCase() === "EMPLOYEE");
    const coreAssignees = employeeUsers
      .filter((u) => !u.name.toLowerCase().startsWith("emp"))
      .slice(0, 5);

    return (
      <div>
        <div className="page-header">
          <div className="page-header-main">
            <h1>Assignments</h1>
            <p className="page-subtitle">Assign issues to team members and track completion</p>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              className="btn-icon"
              onClick={toggleTheme}
              title="Toggle dark mode"
            >
              {theme === "light" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.536-7.536L17.121 5.88M6.88 17.12 5.464 18.536m12.657 0L17.12 17.12M6.88 6.88 5.464 5.464" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            {currentUser && (
              <div className="user-chip">
                <span>{currentUser.name}</span>
                <span className="user-chip-role">{currentUser.role}</span>
              </div>
            )}
            <button className="btn-primary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Manage Assignments</h2>
              <p className="muted">Choose an assignee and completion status for each issue.</p>
            </div>
          </div>
          <div className="filters-inline">{renderFilters()}</div>
          {issuesLoading && <div className="loading">Loading issues...</div>}
          {issuesError && <div className="error" style={{ marginBottom: "1rem" }}>{issuesError}</div>}
          {!issuesLoading && !issuesError && visibleIssues.length === 0 && (
            <div className="empty-state">
              <p>No issues to assign yet. Create an issue first.</p>
            </div>
          )}
          {!issuesLoading && !issuesError && visibleIssues.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Project</th>
                    <th>Name</th>
                    <th>Assignee</th>
                    <th>Completion</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleIssues.map((issue) => {
                    const project = projects.find((p) => p.id === issue.project_id);
                    const assignee = users.find((u) => u.id === issue.assignee_id);
                    const completion =
                      issue.status === "RESOLVED" || issue.status === "CLOSED"
                        ? "COMPLETED"
                        : "INCOMPLETE";
                    return (
                      <tr key={issue.id}>
                        <td>
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => setView({ type: "detail", id: issue.id })}
                          >
                            {issue.title}
                          </button>
                        </td>
                        <td>{project?.name ?? "Unknown"}</td>
                        <td>
                          {assignee?.name ?? "Unassigned"}
                        </td>
                        <td>
                          <select
                            value={issue.assignee_id ?? ""}
                            onChange={(e) =>
                              handleInlineAssigneeChange(
                                issue.id,
                                e.target.value ? Number(e.target.value) : ""
                              )
                            }
                          >
                            <option value="">Unassigned</option>
                            {coreAssignees.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={completion}
                            onChange={(e) =>
                              handleCompletionChange(
                                issue,
                                e.target.value as "COMPLETED" | "INCOMPLETE"
                              )
                            }
                          >
                            <option value="INCOMPLETE">Incomplete</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </td>
                        <td>
                          <span className={`status-badge status-${issue.status}`}>
                            {issue.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="muted">
                          {new Date(issue.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmployeeDashboard = () => {
    return (
      <>
        <div className="page-header">
          <div className="page-header-main">
            <h1>My Dashboard</h1>
            <p className="page-subtitle">
              Track issues assigned to you
              {currentUser && (
                <span> · Signed in as <strong>{currentUser.name}</strong></span>
              )}
            </p>
          </div>
          <div className="page-header-actions">
            {currentUser?.role === "EMPLOYEE" && (
              <div className="notif-wrapper">
                <button
                  type="button"
                  className="notif-bell-btn"
                  onClick={() => setShowEmployeeNotifications((prev) => !prev)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 18.5C15 19.8807 13.8807 21 12.5 21C11.1193 21 10 19.8807 10 18.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 10.5C18 7.46243 15.7614 5 12.5 5C9.23858 5 7 7.46243 7 10.5C7 13.182 6.33923 14.3959 5.73223 15.1036C5.2856 15.6296 5.06229 15.8926 5.06988 16.1205C5.07846 16.3819 5.23918 16.6174 5.49099 16.7342C5.7038 16.8333 6.03756 16.8333 6.70509 16.8333H18.2949C18.9624 16.8333 19.2962 16.8333 19.509 16.7342C19.7608 16.6174 19.9215 16.3819 19.9301 16.1205C19.9377 15.8926 19.7144 15.6296 19.2678 15.1036C18.6608 14.3959 18 13.182 18 10.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  {unreadEmployeeNotifications.length > 0 && (
                    <span className="notif-badge">{unreadEmployeeNotifications.length}</span>
                  )}
                </button>
                {showEmployeeNotifications && (
                  <div className="notif-panel">
                    <div className="notif-header-row">
                      <h4>Issue Updates (last 24h)</h4>
                      {unreadEmployeeNotifications.length > 0 && (
                        <button
                          type="button"
                          className="notif-clear-btn"
                          onClick={markAllEmployeeNotificationsRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {unreadEmployeeNotifications.length === 0 ? (
                      <p className="muted" style={{ margin: 0 }}>No updates.</p>
                    ) : (
                      <ul className="notif-list">
                        {unreadEmployeeNotifications.slice(0, 6).map((issue) => {
                          const project = projects.find((p) => p.id === issue.project_id);
                          return (
                            <li
                              key={issue.id}
                              className="notif-item"
                              onClick={() => {
                                setShowEmployeeNotifications(false);
                                setView({ type: "detail", id: issue.id });
                              }}
                            >
                              <span className="notif-item-title">{issue.title}</span>
                              <span className="notif-item-sub">
                                {project?.name ?? "Unknown project"} · Status: {issue.status.replace("_", " ")} ·{" "}
                                {new Date(issue.updated_at).toLocaleString()}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
            {currentUser && (
              <div className="user-chip">
                <span>{currentUser.name}</span>
                <span className="user-chip-role">{currentUser.role}</span>
              </div>
            )}
            <button className="btn-primary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <StatsCards issues={employeeIssues} statusCounts={employeeStatusCounts} />
        <StatusChart statusCounts={employeeStatusCounts} />
        <div className="card">
          <div className="card-header">
            <div>
              <h2>My Assigned Issues</h2>
              <p className="muted">Issues assigned to you</p>
            </div>
            <button className="btn-primary" onClick={() => setView({ type: "new" })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Issue
            </button>
          </div>
          {issuesLoading && <div className="loading">Loading issues...</div>}
          {issuesError && <div className="error" style={{ marginBottom: "1rem" }}>{issuesError}</div>}
          {!issuesLoading && !issuesError && employeeIssues.length === 0 && (
            <div className="empty-state">
              <p>No issues assigned to you. Create your first issue to get started!</p>
            </div>
          )}
          {!issuesLoading && !issuesError && employeeIssues.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Project</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeIssues.map((issue) => {
                    const project = projects.find((p) => p.id === issue.project_id);
                    return (
                      <tr key={issue.id} onClick={() => setView({ type: "detail", id: issue.id })}>
                        <td><strong>{issue.title}</strong></td>
                        <td>{project?.name ?? "Unknown"}</td>
                        <td><span className={`priority-badge priority-${issue.priority}`}>{issue.priority}</span></td>
                        <td><span className={`status-badge status-${issue.status}`}>{issue.status.replace("_", " ")}</span></td>
                        <td className="muted">{new Date(issue.updated_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderIssueDetail = () => {
    if (detailLoading) {
      return (
        <div className="card">
          <div className="loading">Loading issue...</div>
        </div>
      );
    }
    if (detailError) {
      return (
        <div className="card">
          <p className="error">{detailError}</p>
          <button className="btn-primary" onClick={() => setView({ type: "list" })}>Back to Dashboard</button>
        </div>
      );
    }
    if (!selectedIssue) return null;

    const project = projects.find((p) => p.id === selectedIssue.project_id);
    const assignee = users.find((u) => u.id === selectedIssue.assignee_id);

    return (
      <div>
        <div className="page-header">
          <button className="btn-primary" onClick={() => setView({ type: "list" })} style={{ marginBottom: "1rem" }}>
            ← Back to Dashboard
          </button>
          <h1>{selectedIssue.title}</h1>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <span className={`status-badge status-${selectedIssue.status}`} style={{ marginRight: "1rem" }}>
                {selectedIssue.status.replace("_", " ")}
              </span>
              <span className={`priority-badge priority-${selectedIssue.priority}`}>
                {selectedIssue.priority}
              </span>
            </div>
            <label>
              Change Status:{" "}
              <select
                value={selectedIssue.status}
                onChange={(e) => handleStatusChange(selectedIssue.id, e.target.value as Status)}
                style={{ marginLeft: "0.5rem" }}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="muted" style={{ marginBottom: "0.5rem" }}>
              <strong>Project:</strong> {project?.name ?? "Unknown"} • <strong>Assignee:</strong>{" "}
              {assignee?.name ?? "Unassigned"}
            </p>
            <p className="muted">
              <strong>Created:</strong> {new Date(selectedIssue.created_at).toLocaleString()} • <strong>Updated:</strong>{" "}
              {new Date(selectedIssue.updated_at).toLocaleString()}
            </p>
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "0.75rem", fontSize: "1.125rem" }}>Description</h3>
            <p style={{ lineHeight: "1.8", color: "var(--gray-700)" }}>{selectedIssue.description}</p>
          </div>
          <hr />
          <h3 style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>Comments</h3>
          {selectedIssue.comments.length === 0 && (
            <div className="empty-state">
              <p className="muted">No comments yet. Be the first to comment!</p>
            </div>
          )}
          <ul className="comments">
            {selectedIssue.comments.map((c) => {
              const author = users.find((u) => u.id === c.author_id);
              return (
                <li key={c.id}>
                  <div className="comment-meta">
                    <span><strong>{author?.name ?? "Unknown"}</strong></span>
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, color: "var(--gray-700)" }}>{c.body}</p>
                </li>
              );
            })}
          </ul>
          <div className="comment-form">
            <textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
            />
            {commentError && <p className="error">{commentError}</p>}
            <div className="comment-actions-row">
              <button className="btn-primary" disabled={commentLoading} onClick={handleAddComment}>
                {commentLoading ? "Adding..." : "Add Comment"}
              </button>
              <label className="comment-file-label">
                <span>Add files (images, PDFs, etc.)</span>
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !selectedIssue) return;
                    setAttachmentError(null);
                    setAttachmentUploading(true);
                    try {
                      await uploadAttachment(selectedIssue.id, file);
                      setView({ type: "detail", id: selectedIssue.id });
                    } catch (err: any) {
                      setAttachmentError(err.message || "Failed to upload file");
                    } finally {
                      setAttachmentUploading(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
            {attachmentError && <p className="error">{attachmentError}</p>}
            {attachmentUploading && <p className="muted">Uploading...</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderNewIssueForm = () => {
    const isEmployee = currentUser?.role === "EMPLOYEE";

    return (
      <div>
        <div className="page-header">
          <button
            className="btn-primary"
            onClick={() => setView({ type: "list" })}
            style={{ marginBottom: "1rem" }}
          >
            ← Back to Dashboard
          </button>
          <h1>{isEmployee ? "Submit an Issue" : "Create New Issue"}</h1>
          <p className="page-subtitle">
            {isEmployee
              ? "Describe the problem you’re facing. The admin team will triage and assign it."
              : "Fill in the details to create a new issue."}
          </p>
        </div>
        <div className="card">
          <form className="form" onSubmit={handleCreateIssueSubmit} ref={newIssueFormRef}>
            {isEmployee && (
              <>
                <label>
                  Rough description for AI (optional)
                  <textarea
                    name="ai_free_text"
                    rows={3}
                    placeholder="Paste any raw notes or a long description here. AI can turn this into structured fields."
                  />
                </label>
                <div className="ai-actions-row">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleGenerateFieldsWithAI}
                    disabled={aiParseLoading || aiTriageLoading}
                  >
                    {aiParseLoading ? "Generating with AI..." : "Generate fields with AI"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleSuggestTriageWithAI}
                    disabled={aiParseLoading || aiTriageLoading}
                  >
                    {aiTriageLoading ? "Asking AI for triage..." : "Suggest priority & assignee"}
                  </button>
                </div>
              </>
            )}
            <label>
              Title
              <input name="title" type="text" required />
            </label>
            <label>
              Description
              <textarea name="description" rows={4} required />
            </label>
            <label>
              Project
              <select name="project_id" required defaultValue="">
                <option value="" disabled>
                  Select project
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select name="priority" required defaultValue="MEDIUM">
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            {!isEmployee && (
              <>
                <label>
                  Status
                  <select name="status" required defaultValue="OPEN">
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Assignee
                  <select name="assignee_id" defaultValue="">
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {isEmployee && (
              <p className="muted">
                Status will start as <strong>OPEN</strong> and the issue will be assigned to you. An admin can
                reassign it later if needed.
              </p>
            )}

            {aiError && <p className="error">{aiError}</p>}
            {aiSuggestion && (
              <p className="muted">
                <strong>AI rationale:</strong> {aiSuggestion}
              </p>
            )}

            {newIssueError && <p className="error">{newIssueError}</p>}
            <button
              type="submit"
              className="btn-primary"
              disabled={newIssueLoading}
              style={{ alignSelf: "flex-start" }}
            >
              {newIssueLoading ? "Submitting..." : isEmployee ? "Submit Issue" : "Create Issue"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderEmployees = () => (
    <div>
      <div className="page-header">
        <div className="page-header-main">
          <h1>Employees</h1>
          <p className="page-subtitle">Manage logins for your team members</p>
        </div>
      </div>
      {newEmployeeSuccess && (
        <div className="toast toast-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{newEmployeeSuccess}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setNewEmployeeSuccess(null)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${employeesTab === "list" ? "tab-active" : ""}`}
            onClick={() => setEmployeesTab("list")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Existing Users
          </button>
          <button
            className={`tab ${employeesTab === "create" ? "tab-active" : ""}`}
            onClick={() => setEmployeesTab("create")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create New Employee Login
          </button>
        </div>
        <div className="tab-content">
          {employeesTab === "list" && (
            <div>
              <h2 style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>Existing Users</h2>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th style={{ width: "120px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn-icon btn-edit"
                              onClick={() => handleEditUser(u)}
                              title="Edit user"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-delete"
                              onClick={() => handleDeleteUser(u)}
                              disabled={deleteUserLoading === u.id}
                              title="Delete user"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {editingUser && (
                <div className="modal-overlay" onClick={handleCancelEdit}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>Edit User</h2>
                      <button type="button" className="modal-close" onClick={handleCancelEdit}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    <form className="form" onSubmit={handleUpdateUser}>
                      <label>
                        Name
                        <input
                          type="text"
                          value={editUserForm.name}
                          onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                          required
                        />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          value={editUserForm.email}
                          onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                          required
                        />
                      </label>
                      <label>
                        Password (leave blank to keep current)
                        <input
                          type="password"
                          value={editUserForm.password}
                          onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                          placeholder="Leave blank to keep current password"
                        />
                      </label>
                      <label>
                        Role
                        <select
                          value={editUserForm.role}
                          onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                          required
                        >
                          <option value="EMPLOYEE">EMPLOYEE</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </label>
                      {editUserError && <p className="error">{editUserError}</p>}
                      <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={editUserLoading}>
                          {editUserLoading ? "Updating..." : "Update User"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          {employeesTab === "create" && (
            <div>
              <h2 style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>Create New Employee Login</h2>
              <form className="form" onSubmit={handleCreateEmployee}>
                <label>
                  Name
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={employeeForm.password}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                    required
                  />
                </label>
                {newEmployeeError && <p className="error">{newEmployeeError}</p>}
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={newEmployeeLoading}
                  style={{ width: "auto", alignSelf: "flex-start" }}
                >
                  {newEmployeeLoading ? "Creating..." : "Create Employee Login"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="login-root">
      <div className="login-card">
        <h1>Unico Connect Issue Tracker</h1>
        <p className="page-subtitle">Sign in to continue</p>
        <form className="form" onSubmit={handleLoginSubmit}>
          <label>
            Email
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
            />
          </label>
          {authError && <p className="error">{authError}</p>}
          <button type="submit" className="btn-primary" disabled={authLoading}>
            {authLoading ? "Signing in..." : "Sign In"}
          </button>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Demo admin: <code>admin@unico.local</code> / <code>admin123</code>
          </p>
        </form>
      </div>
    </div>
  );

  if (!currentUser) {
    return renderLogin();
  }

  return (
    <div className="app-root">
      <Sidebar
        currentView={view}
        onNavigate={setView}
        currentUserName={currentUser.name}
        currentUserRole={currentUser.role}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <div className="content-wrapper">
          {view.type === "list" && (
            <>
              {currentUser?.role === "EMPLOYEE" ? renderEmployeeDashboard() : (
                <>
                  <div className="page-header">
                    <div className="page-header-main">
                      <h1>Dashboard</h1>
                      <p className="page-subtitle">
                        Track and manage all your project issues
                        {currentUser && (
                          <span> · Signed in as <strong>{currentUser.name}</strong></span>
                        )}
                      </p>
                    </div>
                    <div className="page-header-actions">
                  {currentUser?.role === "ADMIN" && (
                    <div className="notif-wrapper">
                      <button
                        type="button"
                        className="notif-bell-btn"
                        onClick={() => setShowNotifications((prev) => !prev)}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M15 18.5C15 19.8807 13.8807 21 12.5 21C11.1193 21 10 19.8807 10 18.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M18 10.5C18 7.46243 15.7614 5 12.5 5C9.23858 5 7 7.46243 7 10.5C7 13.182 6.33923 14.3959 5.73223 15.1036C5.2856 15.6296 5.06229 15.8926 5.06988 16.1205C5.07846 16.3819 5.23918 16.6174 5.49099 16.7342C5.7038 16.8333 6.03756 16.8333 6.70509 16.8333H18.2949C18.9624 16.8333 19.2962 16.8333 19.509 16.7342C19.7608 16.6174 19.9215 16.3819 19.9301 16.1205C19.9377 15.8926 19.7144 15.6296 19.2678 15.1036C18.6608 14.3959 18 13.182 18 10.5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                        {unreadRecentIssues.length > 0 && (
                          <span className="notif-badge">{unreadRecentIssues.length}</span>
                        )}
                      </button>
                      {showNotifications && (
                        <div className="notif-panel">
                          <div className="notif-header-row">
                            <h4>New issues (last 24h)</h4>
                            {unreadRecentIssues.length > 0 && (
                              <button
                                type="button"
                                className="notif-clear-btn"
                                onClick={markAllNotificationsRead}
                              >
                                Mark all read
                              </button>
                            )}
                          </div>
                          {unreadRecentIssues.length === 0 ? (
                            <p className="muted" style={{ margin: 0 }}>No new issues.</p>
                          ) : (
                            <ul className="notif-list">
                              {unreadRecentIssues.slice(0, 4).map((issue) => {
                                const project = projects.find((p) => p.id === issue.project_id);
                                return (
                                  <li
                                    key={issue.id}
                                    className="notif-item"
                                    onClick={() => {
                                      setShowNotifications(false);
                                      setView({ type: "detail", id: issue.id });
                                    }}
                                  >
                                    <span className="notif-item-title">{issue.title}</span>
                                    <span className="notif-item-sub">
                                      {project?.name ?? "Unknown project"} ·{" "}
                                      {new Date(issue.created_at).toLocaleString()}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          <hr style={{ margin: "0.75rem 0" }} />
                          <div className="notif-header-row">
                            <h4>Messages from employees</h4>
                          </div>
                          {activityError && (
                            <p className="error" style={{ marginTop: 0 }}>{activityError}</p>
                          )}
                          {recentActivity.length === 0 ? (
                            <p className="muted" style={{ margin: 0 }}>No messages yet.</p>
                          ) : (
                            <ul className="notif-list">
                              {recentActivity.slice(0, 6).map((item) => (
                                <li
                                  key={`${item.type}-${item.id}`}
                                  className="notif-item"
                                  onClick={() => {
                                    setShowNotifications(false);
                                    setView({ type: "detail", id: item.issue_id });
                                  }}
                                >
                                  <span className="notif-item-title">
                                    {item.type === "comment" ? "Comment" : "Attachment"} · {item.issue_title}
                                  </span>
                                  <span className="notif-item-sub">
                                    {item.project_name ?? "Unknown project"}
                                    {item.author_name ? ` · ${item.author_name}` : ""}
                                    {" · "}
                                    {new Date(item.created_at).toLocaleString()}
                                  </span>
                                  <span className="notif-item-sub">
                                    {item.preview}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={toggleTheme}
                    title="Toggle dark mode"
                  >
                    {theme === "light" ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.536-7.536L17.121 5.88M6.88 17.12 5.464 18.536m12.657 0L17.12 17.12M6.88 6.88 5.464 5.464" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    )}
                  </button>
                      {currentUser && (
                        <div className="user-chip">
                          <span>{currentUser.name}</span>
                          <span className="user-chip-role">{currentUser.role}</span>
                        </div>
                      )}
                      <button className="btn-primary" onClick={handleLogout}>
                        Logout
                      </button>
                    </div>
                  </div>
                  {(criticalIssues.length > 0 || highPriorityIssues.length > 0) && (
                    <div className="priority-alerts">
                      {criticalIssues.length > 0 && (
                        <div className="priority-alert priority-alert-critical">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <div>
                            <strong>{criticalIssues.length} Critical Issue{criticalIssues.length !== 1 ? "s" : ""}</strong>
                            <span>Requires immediate attention</span>
                          </div>
                          <button
                            type="button"
                            className="priority-alert-btn"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            project_id: undefined,
                            status: undefined,
                            assignee_id: undefined,
                            completion: undefined,
                            search: undefined,
                            priority: "CRITICAL",
                          }));
                          if (issueTableRef.current) {
                            issueTableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                          >
                            View All
                          </button>
                        </div>
                      )}
                      {highPriorityIssues.length > 0 && (
                        <div className="priority-alert priority-alert-high">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <div>
                            <strong>{highPriorityIssues.length} High Priority Issue{highPriorityIssues.length !== 1 ? "s" : ""}</strong>
                            <span>Needs attention soon</span>
                          </div>
                          <button
                            type="button"
                            className="priority-alert-btn"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            project_id: undefined,
                            status: undefined,
                            assignee_id: undefined,
                            completion: undefined,
                            search: undefined,
                            priority: "HIGH",
                          }));
                          if (issueTableRef.current) {
                            issueTableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                          >
                            View All
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <StatsCards issues={issues} statusCounts={statusCounts} />
                  <StatusChart statusCounts={statusCounts} />
                  {renderIssueTable()}
                </>
              )}
            </>
          )}
          {view.type === "history" && renderHistory()}
          {view.type === "detail" && renderIssueDetail()}
          {view.type === "new" && renderNewIssueForm()}
          {view.type === "users" && renderEmployees()}
          {view.type === "assignments" && renderAssignments()}
        </div>
      </main>
    </div>
  );
};

