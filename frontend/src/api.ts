export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Project {
  id: number;
  name: string;
  code?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface Comment {
  id: number;
  body: string;
  author_id: number;
  created_at: string;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  project_id: number;
  priority: Priority;
  status: Status;
  assignee_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface IssueDetail extends Issue {
  comments: Comment[];
}

const BASE_URL = "/api";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getProjects() {
  return request<Project[]>(`${BASE_URL}/projects/`);
}

export function getUsers() {
  return request<User[]>(`${BASE_URL}/users/`);
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export function createUser(data: UserCreateInput) {
  return request<User>(`${BASE_URL}/users/`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateUser(id: number, data: UserUpdateInput) {
  return request<User>(`${BASE_URL}/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export function deleteUser(id: number) {
  return request<void>(`${BASE_URL}/users/${id}`, {
    method: "DELETE"
  });
}

export interface IssueFilters {
  project_id?: number;
  priority?: Priority;
  status?: Status;
  assignee_id?: number;
  search?: string;
}

export function getIssues(filters: IssueFilters = {}) {
  const params = new URLSearchParams();
  if (filters.project_id) params.set("project_id", String(filters.project_id));
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.status) params.set("status", filters.status);
  if (filters.assignee_id) params.set("assignee_id", String(filters.assignee_id));
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  const url = `${BASE_URL}/issues/${query ? `?${query}` : ""}`;
  return request<Issue[]>(url);
}

export function getIssue(id: number) {
  return request<IssueDetail>(`${BASE_URL}/issues/${id}`);
}

export interface IssueCreateInput {
  title: string;
  description: string;
  project_id: number;
  priority: Priority;
  status: Status;
  assignee_id?: number | null;
}

export function createIssue(data: IssueCreateInput) {
  return request<Issue>(`${BASE_URL}/issues/`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export type IssueUpdateInput = Partial<IssueCreateInput>;

export function updateIssue(id: number, data: IssueUpdateInput) {
  return request<Issue>(`${BASE_URL}/issues/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export interface CommentCreateInput {
  body: string;
  author_id: number;
}

export function addComment(issueId: number, data: CommentCreateInput) {
  return request<Comment>(`${BASE_URL}/issues/${issueId}/comments`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export interface Attachment {
  id: number;
  issue_id: number;
  filename: string;
  content_type: string;
  url: string;
  uploaded_at: string;
}

export async function uploadAttachment(issueId: number, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/issues/${issueId}/attachments`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed with status ${res.status}`);
  }
  return res.json() as Promise<Attachment>;
}

export interface RecentActivityItem {
  id: number;
  type: "comment" | "attachment";
  issue_id: number;
  issue_title: string;
  project_name?: string | null;
  author_name?: string | null;
  filename?: string | null;
  created_at: string;
  preview: string;
}

export function getRecentActivity(limit = 20) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request<RecentActivityItem[]>(`${BASE_URL}/issues/activity/recent?${params.toString()}`);
}

export interface AIParseIssueRequest {
  free_text: string;
}

export interface AIParseIssueResponse {
  title: string;
  description: string;
  project_id?: number | null;
  priority: Priority;
  status: Status;
  assignee_id?: number | null;
}

export function aiParseIssue(data: AIParseIssueRequest) {
  return request<AIParseIssueResponse>(`${BASE_URL}/ai/parse-issue`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export interface AITriageRequest {
  title: string;
  description: string;
  project_id: number;
}

export interface AITriageResponse {
  priority: Priority;
  assignee_id?: number | null;
  rationale: string;
}

export function aiSuggestTriage(data: AITriageRequest) {
  return request<AITriageResponse>(`${BASE_URL}/ai/suggest-triage`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function login(data: LoginInput) {
  return request<{ user: AuthUser }>(`${BASE_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}
