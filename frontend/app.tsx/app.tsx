import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider, ThemeProvider } from "../context";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/auth/login.tsx";
import Dashboard from "../pages/dashboard.tsx";
import Profile from "../pages/profile.tsx";
import Blog from "../pages/blog.tsx";
import Chat from "../pages/chat.tsx";
import Modes from "../pages/modes.tsx";
import Chnnels from "../pages/channels.tsx";
import Settings from "../pages/settings.tsx";
import Notepad from "../pages/notepad.tsx";
import MoodChatLayout from "../layouts/mainlayout.tsx";

function RequireAuth() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#080808", color: "#c8f53d", fontFamily: "sans-serif" }}>
        Loading...
      </div>
    );
  }

  return session ? <MoodChatLayout /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/modes" element={<Modes />} />
              <Route path="/channels" element={<Chnnels />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notepad" element={<Notepad />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
