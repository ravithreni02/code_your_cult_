import { Link, useLocation } from "react-router-dom";
import { Home, Tractor, Users, MessageCircle, User, Sprout, Menu, X, Banknote, UsersRound, Plus, Bell, LogIn, Leaf } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);
    };
    fetchNotifs();
    const channel = supabase
      .channel("notif-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, fetchNotifs)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const mainLinks = [
    { to: "/", icon: Home, label: t("home") },
    { to: "/crop-advisor", icon: Leaf, label: t("agriGenie") },
    { to: "/equipment", icon: Tractor, label: t("equipment") },
    { to: "/labor", icon: Users, label: t("labor") },
    { to: "/community", icon: MessageCircle, label: t("community") },
    { to: "/finance", icon: Banknote, label: t("finance") },
  ];


  // Filter extra links by ACTIVE role only — strict role isolation
  const extraLinks = [
    ...(role === "customer" ? [{ to: "/group-labor", icon: UsersRound, label: t("groupLabor") }] : []),
    ...(role === "machinery_provider" ? [{ to: "/add-equipment", icon: Plus, label: t("addEquipment") }] : []),
    ...(role === "labor" || role === "group_leader" ? [{ to: "/add-labor", icon: Plus, label: t("addLabor") }] : []),
    ...(user ? [{ to: "/dashboard", icon: Bell, label: t("dashboard") }] : []),
  ];

  const profileLink = {
    to: user ? "/profile" : "/auth",
    icon: user ? User : LogIn,
    label: user ? t("profile") : t("login"),
  };

  const bottomLinks = [
    ...mainLinks.slice(0, 4),
    { ...profileLink },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/40 shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-primary shrink-0">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline">AgriSetu</span>
          </Link>

          {/* Desktop Nav Links - centered */}
          <div className="hidden md:flex items-center gap-1 mx-auto">
            {mainLinks.map((l) => {
              const isActive = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
            {extraLinks.map((l) => {
              const isActive = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right side: notification + profile */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user && unreadCount > 0 && (
              <Link to="/dashboard" className="relative p-2 rounded-xl hover:bg-accent transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold h-5 min-w-[20px] rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              </Link>
            )}
            <Link
              to={profileLink.to}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                location.pathname === profileLink.to
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <profileLink.icon className="h-4 w-4" />
              {profileLink.label}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} className="md:hidden min-h-11 min-w-11 p-2 rounded-xl hover:bg-accent transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-card px-4 pb-4 pt-2 animate-fade-in space-y-1">
            {extraLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  location.pathname === l.to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <l.icon className="h-5 w-5" />
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-1.5">
          {bottomLinks.map((l) => {
            const isActive = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] min-h-14 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? "bg-primary/10 shadow-sm" : ""}`}>
                  <l.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-semibold leading-tight">{l.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;
