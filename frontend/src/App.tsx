import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AboutPage } from "@/pages/About";
import { AnalyticsPage } from "@/pages/Analytics";
import { CitizenReportPage } from "@/pages/CitizenReport";
import { DashboardPage } from "@/pages/Dashboard";
import { HeatmapPage } from "@/pages/Heatmap";
import { HistoryPage } from "@/pages/History";
import { ImageDetectionPage } from "@/pages/ImageDetection";
import { LiveCameraPage } from "@/pages/LiveCamera";
import { LiveTrackerPage } from "@/pages/LiveTracker";
import { LoginPage } from "@/pages/Login";
import { RegisterPage } from "@/pages/Register";
import { RepairsPage } from "@/pages/Repairs";
import { RiskScorePage } from "@/pages/RiskScore";
import { SettingsPage } from "@/pages/Settings";
import { VideoDetectionPage } from "@/pages/VideoDetection";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="detect/image" element={<ImageDetectionPage />} />
        <Route path="detect/video" element={<VideoDetectionPage />} />
        <Route path="live-camera" element={<LiveCameraPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="live-tracker" element={<LiveTrackerPage />} />
        <Route path="heatmap" element={<HeatmapPage />} />
        <Route path="risk-score" element={<RiskScorePage />} />
        <Route path="repairs" element={<RepairsPage />} />
        <Route path="citizen-report" element={<CitizenReportPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
