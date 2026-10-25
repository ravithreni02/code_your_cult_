import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";
import VoiceCommand from "@/components/VoiceCommand";
import Footer from "@/components/Footer";
import Home from "./pages/Home";
import EquipmentMarketplace from "./pages/EquipmentMarketplace";
import LaborMarketplace from "./pages/LaborMarketplace";
import AddEquipment from "./pages/AddEquipment";
import AddLabor from "./pages/AddLabor";
import GroupLabor from "./pages/GroupLabor";
import Finance from "./pages/Finance";
import CropAdvisor from "./pages/CropAdvisor";
import Community from "./pages/Community";
import Dashboard from "./pages/Dashboard";
import DashboardBookings from "./pages/DashboardBookings";
import DashboardNotifications from "./pages/DashboardNotifications";
import Auth from "./pages/Auth";
import SelectRole from "./pages/SelectRole";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import RoleRoute from "@/components/RoleRoute";
import OfflineBanner from "@/components/OfflineBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <OfflineBanner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/equipment" element={<EquipmentMarketplace />} />
              <Route path="/labor" element={<LaborMarketplace />} />
              <Route path="/add-equipment" element={<RoleRoute allow={["machinery_provider"]}><AddEquipment /></RoleRoute>} />
              <Route path="/add-labor" element={<RoleRoute allow={["labor", "group_leader"]}><AddLabor /></RoleRoute>} />
              <Route path="/group-labor" element={<GroupLabor />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/crop-advisor" element={<CropAdvisor />} />
              <Route path="/community" element={<Community />} />
              <Route path="/dashboard" element={<RoleRoute><Dashboard /></RoleRoute>} />
              <Route path="/dashboard/bookings" element={<RoleRoute><DashboardBookings /></RoleRoute>} />
              <Route path="/dashboard/notifications" element={<RoleRoute><DashboardNotifications /></RoleRoute>} />
              <Route path="/dashboard/availability" element={<RoleRoute allow={["labor", "group_leader", "machinery_provider"]}><Dashboard /></RoleRoute>} />
              <Route path="/dashboard/equipment" element={<RoleRoute allow={["machinery_provider"]}><Dashboard /></RoleRoute>} />
              <Route path="/dashboard/browse" element={<RoleRoute allow={["customer"]}><Dashboard /></RoleRoute>} />
              <Route path="/dashboard/group" element={<RoleRoute allow={["group_leader"]}><Dashboard /></RoleRoute>} />
              <Route path="/dashboard/requests" element={<RoleRoute allow={["finance_provider"]}><Dashboard /></RoleRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/select-role" element={<SelectRole />} />
              <Route path="/profile" element={<RoleRoute><Profile /></RoleRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
            <Chatbot />
            <VoiceCommand />
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
