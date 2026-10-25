import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, CalendarCheck, User, Settings, Bell, Tractor, Users, UsersRound,
  Banknote, Search, LogOut, Sprout, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ComponentType } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  unreadCount?: number;
}

type SidebarIcon = ComponentType<{ className?: string }>;
const roleSidebarItems: Record<string, { to: string; icon: SidebarIcon; label: string }[]> = {
  customer: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/dashboard/bookings", icon: CalendarCheck, label: "My Bookings" },
    { to: "/dashboard/browse", icon: Search, label: "Browse & Book" },
    { to: "/dashboard/notifications", icon: Bell, label: "Notifications" },
    { to: "/profile", icon: User, label: "Profile" },
  ],
  machinery_provider: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/dashboard/equipment", icon: Tractor, label: "My Equipment" },
    { to: "/dashboard/availability", icon: CalendarCheck, label: "Availability" },
    { to: "/dashboard/bookings", icon: CalendarCheck, label: "Bookings" },
    { to: "/dashboard/notifications", icon: Bell, label: "Notifications" },
    { to: "/profile", icon: User, label: "Profile" },
  ],
  labor: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/dashboard/availability", icon: CalendarCheck, label: "Availability" },
    { to: "/dashboard/bookings", icon: CalendarCheck, label: "My Bookings" },
    { to: "/dashboard/notifications", icon: Bell, label: "Notifications" },
    { to: "/profile", icon: User, label: "Profile" },
  ],
  group_leader: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/dashboard/group", icon: UsersRound, label: "Group Schedule" },
    { to: "/dashboard/bookings", icon: CalendarCheck, label: "Bookings" },
    { to: "/dashboard/notifications", icon: Bell, label: "Notifications" },
    { to: "/profile", icon: User, label: "Profile" },
  ],
  finance_provider: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/dashboard/requests", icon: Banknote, label: "Loan Requests" },
    { to: "/dashboard/notifications", icon: Bell, label: "Notifications" },
    { to: "/profile", icon: User, label: "Profile" },
  ],
};

const DashboardLayout = ({ children, unreadCount = 0 }: DashboardLayoutProps) => {
  const { role, signOut, profile } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const items = (roleSidebarItems[role || "customer"] || roleSidebarItems.customer).map((item) => ({
    ...item,
    label: item.label === "Dashboard" ? t("dashboard") : item.label === "Notifications" ? t("notifications") : item.label,
  }));

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-border/40 bg-card transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
        <div className="flex items-center justify-between p-3 border-b border-border/40">
          {!collapsed && (
            <span className="text-sm font-bold text-primary flex items-center gap-2">
              <Sprout className="h-4 w-4" /> AgriSetu
            </span>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.to;
            const isNotif = item.label === "Notifications";
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && isNotif && unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] text-[10px] rounded-full px-1.5">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border/40">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full"
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="h-1 bg-gradient-to-r from-primary via-emerald-500 to-amber-400" />
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
