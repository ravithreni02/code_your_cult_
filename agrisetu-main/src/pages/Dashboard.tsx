import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import CustomerDashboard from "./dashboard/CustomerDashboard";
import LaborDashboard from "./dashboard/LaborDashboard";
import EquipmentOwnerDashboard from "./dashboard/EquipmentOwnerDashboard";
import GroupLeaderDashboard from "./dashboard/GroupLeaderDashboard";
import FinanceProviderDashboard from "./dashboard/FinanceProviderDashboard";

const Dashboard = () => {
  const { user, role, roles, ready } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    if (!role && roles.length > 1) { navigate("/select-role", { replace: true }); return; }
  }, [user, role, roles, ready, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    const channel = supabase
      .channel("dash-notif-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, fetchUnread)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!ready) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  }

  if (!user || (!role && roles.length > 1)) return null;

  const renderDashboard = () => {
    switch (role) {
      case "machinery_provider":
        return <EquipmentOwnerDashboard />;
      case "labor":
        return <LaborDashboard />;
      case "group_leader":
        return <GroupLeaderDashboard />;
      case "finance_provider":
        return <FinanceProviderDashboard />;
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <DashboardLayout unreadCount={unreadCount}>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Dashboard;
