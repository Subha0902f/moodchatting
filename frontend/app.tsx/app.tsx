import Friends from "../pages/friends";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, ThemeProvider } from "../context";
import { useAuth } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import "../pages/theme.css";
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
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#080808", color: "#c8f53d", fontFamily: "sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <SocketProvider
      authToken={session.access_token}
      user={{
        id: session.user.id,
        email: session.user.email || "",
        fullName:
          (session.user.user_metadata?.full_name as string | undefined) ||
          (session.user.user_metadata?.name as string | undefined) ||
          (session.user.user_metadata?.username as string | undefined),
        avatarUrl: session.user.user_metadata?.avatar_url as string | undefined,
      }}
    >
      <MoodChatLayout />
    </SocketProvider>
  );
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#080808", color: "#c8f53d", fontFamily: "sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (session) {
    const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    return <Navigate to={fromPath && fromPath !== "/login" ? fromPath : "/dashboard"} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <Login />
                </RedirectIfAuthed>
              }
            />
            <Route element={<RequireAuth />}>
              <Route path="/friends" element={<Friends />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/modes" element={<Modes />} />
              <Route path="/channels" element={<Chnnels />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notepad" element={<Notepad />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;