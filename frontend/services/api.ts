import axios, { AxiosInstance, AxiosResponse } from "axios";
import { supabase } from "./supabaseclient";

const API_BASE_URL = "http://localhost:5000";

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
  const storedToken = getStoredAuthToken();
  if (storedToken) return storedToken;

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
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
  avatarUrl?: string;
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

export default apiClient;
