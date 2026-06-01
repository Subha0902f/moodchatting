import axios, { AxiosInstance, AxiosResponse } from "axios";
import { supabase } from "./supabaseclient";

const getEnvVar = (key: string): string | undefined => {
  try {
    return (import.meta as any).env?.[key] as string | undefined;
  } catch {
    return undefined;
  }
};

const API_BASE_URL =
  (getEnvVar("VITE_API_URL") || "").replace(/\/+$/, "") ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "http://localhost:5000");

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

const getStoredAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

const getAuthToken = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  } catch (error) {
    console.warn("[api] Supabase session lookup failed, continuing without token", error);
  }

  return getStoredAuthToken();
};

export const setAuthToken = (token: string | null) => {
  if (typeof window === "undefined") return;

  if (token) {
    localStorage.setItem("authToken", token);
  } else {
    localStorage.removeItem("authToken");
  }
};

apiClient.interceptors.request.use(async (config: any) => {
  const token = await getAuthToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const method = error.config?.method?.toUpperCase?.() || "REQUEST";
    const url = `${error.config?.baseURL || ""}${error.config?.url || ""}`;
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.error(`[api] ${method} ${url} failed${status ? ` (${status})` : ""}: ${message}`);

    if (error.response?.status === 401) {
      setAuthToken(null);
    }
    return Promise.reject(error);
  }
);

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type ProfileUpdatePayload = {
  name?: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  profilePictureUrl?: string | null;
  bio?: string;
  about?: string;
  phone?: string;
  hashtags?: string[];
};

export type MessagePayload = {
  text: string;
};

export type ModeUpdatePayload = {
  userIds: number[];
};

export const AuthAPI = {
  login: (payload: LoginPayload) => apiClient.post("/auth/login", payload),
  register: (payload: RegisterPayload) => apiClient.post("/auth/register", payload),
  logout: () => apiClient.post("/auth/logout"),
  refresh: () => apiClient.post("/auth/refresh"),
};

export const UserAPI = {
  me: () => apiClient.get("/users/me"),
  list: () => apiClient.get("/users"),
  update: (payload: ProfileUpdatePayload) => apiClient.put("/users/me", payload),
  uploadProfilePicture: async (file: File, userId: string): Promise<string> => {
    const bucket = "profile-pictures";
    const objectPath = `${userId}/profile-picture`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file, { upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(objectPath);

    if (!urlData.publicUrl) throw new Error("Failed to retrieve uploaded profile URL");

    return urlData.publicUrl;
  },
  deleteProfilePicture: async (userId: string): Promise<void> => {
    const bucket = "profile-pictures";
    const objectPath = `${userId}/profile-picture`;
    const { error } = await supabase.storage
      .from(bucket)
      .remove([objectPath]);

    if (error) throw new Error(`Delete failed: ${error.message}`);
  },
};

export const ChatAPI = {
  threads: () => apiClient.get("/chat/threads"),
  threadMessages: (threadId: string | number) => apiClient.get(`/chat/threads/${threadId}/messages`),
  sendMessage: (threadId: string | number, payload: MessagePayload) =>
    apiClient.post(`/chat/threads/${threadId}/messages`, payload),
  createThread: (payload: { participantIds: number[]; title?: string }) =>
    apiClient.post("/chat/threads", payload),
};

export const FriendAPI = {
  list: () => apiClient.get("/friends"),
  add: (friendId: number) => apiClient.post("/friends", { friendId }),
  remove: (friendId: number) => apiClient.delete(`/friends/${friendId}`),
};

export const ModeAPI = {
  list: () => apiClient.get("/modes"),
  get: (modeKey: string) => apiClient.get(`/modes/${modeKey}`),
  update: (modeKey: string, payload: ModeUpdatePayload) =>
    apiClient.put(`/modes/${modeKey}`, payload),
};

export const BlogAPI = {
  list: () => apiClient.get("/blog"),
  get: (postId: string | number) => apiClient.get(`/blog/${postId}`),
  create: (payload: {
    title: string;
    content: string;
    preview: string;
    type: "free" | "paid";
    status: "draft" | "published" | "archived";
    tags: string[];
    read_time: number;
  }) => apiClient.post("/blog", payload),
  save: (postId: string | number) => apiClient.post(`/blog/${postId}/save`),
  unsave: (postId: string | number) => apiClient.delete(`/blog/${postId}/unsave`),
  saved: () => apiClient.get("/blog/saved"),
};

export const NoteAPI = {
  list: (params?: { search?: string }) => apiClient.get("/notes", { params }),
  create: (payload: { title: string; content?: string }) => apiClient.post("/notes", payload),
  update: (noteId: string, payload: { title?: string; content?: string }) =>
    apiClient.put(`/notes/${noteId}`, payload),
  delete: (noteId: string) => apiClient.delete(`/notes/${noteId}`),
};

export type ReminderPayload = {
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  category?: "personal" | "work" | "health" | "shopping" | "finance" | "other";
  priority?: "low" | "medium" | "high";
  isRecurring?: boolean;
  recurrenceType?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  recurrenceEndDate?: string;
  tags?: string[];
};

export const ReminderAPI = {
  list: () => apiClient.get("/reminders"),
  upcoming: (days?: number) => apiClient.get("/reminders/list/upcoming", { params: { days } }),
  stats: () => apiClient.get("/reminders/stats/summary"),
  search: (q: string) => apiClient.get("/reminders/search", { params: { q } }),
  create: (payload: ReminderPayload) => apiClient.post("/reminders", payload),
  chatbotCreate: (message: string) => apiClient.post("/reminders/chatbot/create", { message }),
  update: (reminderId: string, payload: Partial<ReminderPayload>) =>
    apiClient.patch(`/reminders/${reminderId}`, payload),
  complete: (reminderId: string) => apiClient.patch(`/reminders/${reminderId}/complete`),
  delete: (reminderId: string) => apiClient.delete(`/reminders/${reminderId}`),
};

export default apiClient;
