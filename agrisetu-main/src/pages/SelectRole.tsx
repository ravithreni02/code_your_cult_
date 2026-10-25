import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, LogOut } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_META: Record<AppRole, { emoji: string; label: string; desc: string }> = {
  customer: { emoji: "🌾", label: "Customer (Farmer)", desc: "Browse equipment, hire labor, book services" },
  machinery_provider: { emoji: "🚜", label: "Equipment Owner", desc: "List equipment, manage rentals, track earnings" },
  labor: { emoji: "👷", label: "Labor", desc: "Set availability, accept jobs, track earnings" },
  group_leader: { emoji: "👥", label: "Group Labor Leader", desc: "Manage your group's schedule and bookings" },
  finance_provider: { emoji: "🏦", label: "Finance Provider", desc: "Review and approve loan requests" },
};

const SelectRole = () => {
  const { user, roles, role, ready, setActiveRole, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    if (role) navigate("/dashboard", { replace: true });
  }, [user, role, ready, navigate]);

  const handlePick = (r: AppRole) => {
    setActiveRole(r);
    navigate("/dashboard", { replace: true });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  if (!ready || !user) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-lg rounded-2xl border-border/50 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Sprout className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Choose Your Role</CardTitle>
          <CardDescription>How do you want to continue this session?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              No roles assigned to your account. Contact support.
            </p>
          )}
          {roles.map((r) => {
            const m = ROLE_META[r];
            return (
              <button
                key={r}
                onClick={() => handlePick(r)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/30 text-left hover:bg-primary/5 hover:border-primary/40 transition-all"
              >
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">Continue as {m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.desc}</div>
                </div>
              </button>
            );
          })}
          <Button variant="outline" className="w-full rounded-xl mt-4" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectRole;
