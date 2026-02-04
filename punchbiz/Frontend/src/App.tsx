import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CowManagement from "./pages/CowManagement";
import HeatDetection from "./pages/HeatDetection";
import Settings from "./pages/Settings";
import AIChat from "./pages/AIChat";
import StaffAttendance from "./pages/StaffAttendance";
import BreedingCalendar from "./pages/BreedingCalendar";
import Analytics from "./pages/Analytics";
import SensorDashboard from "./pages/SensorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/cows" element={<ProtectedRoute><CowManagement /></ProtectedRoute>} />
                <Route path="/heat" element={<ProtectedRoute><HeatDetection /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
                <Route path="/staff" element={<ProtectedRoute><StaffAttendance /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><BreedingCalendar /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/sensors" element={<ProtectedRoute><SensorDashboard /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
