import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider, useUI } from "./context/UIContext";
import DashboardPage from "./pages/DashboardPage";
import FeedPage from "./pages/FeedPage";
import GroupsPage from "./pages/GroupsPage";
import HabitsPage from "./pages/HabitsPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";

function ToastHost() {
  const ui = useUI();
  if (!ui.toast) return null;
  return <div className="toast">{ui.toast.message}</div>;
}

// PUBLIC_INTERFACE
export default function App() {
  /** App entry: providers + router. */
  return (
    <UIProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToastHost />
          <Routes>
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<AppShell />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="habits" element={<HabitsPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="feed" element={<FeedPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route index element={<Navigate to="/app/dashboard" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </UIProvider>
  );
}
