import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, LogOut, Globe, Plus, X, Repeat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Language } from "@/i18n/translations";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_META: Record<AppRole, { emoji: string; label: string }> = {
  customer: { emoji: "🌾", label: "Customer (Farmer)" },
  machinery_provider: { emoji: "🚜", label: "Equipment Owner" },
  labor: { emoji: "👷", label: "Labor" },
  group_leader: { emoji: "👥", label: "Group Labor Leader" },
  finance_provider: { emoji: "🏦", label: "Finance Provider" },
};
const ALL_ROLES: AppRole[] = ["customer", "machinery_provider", "labor", "group_leader", "finance_provider"];

const Profile = () => {
  const { user, role, roles, profile, signOut, refreshRoles, clearActiveRole } = useAuth();
  const { lang, setLang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [roleBusy, setRoleBusy] = useState<AppRole | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, phone }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated!" });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSwitchRole = () => {
    clearActiveRole();
    navigate("/select-role");
  };

  const addRole = async (r: AppRole) => {
    if (!user) return;
    if (r === "finance_provider") {
      toast({ title: "Finance provider access requires approval", variant: "destructive" });
      return;
    }
    setRoleBusy(r);
    const { error } = await supabase.rpc("request_role", { requested_role: r });
    setRoleBusy(null);
    if (error) toast({ title: "Couldn't add role", description: error.message, variant: "destructive" });
    else { toast({ title: `Added ${ROLE_META[r].label}` }); await refreshRoles(); }
  };

  const removeRole = async (r: AppRole) => {
    if (!user) return;
    if (roles.length <= 1) { toast({ title: "Can't remove your only role", variant: "destructive" }); return; }
    setRoleBusy(r);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", user.id).eq("role", r);
    setRoleBusy(null);
    if (error) toast({ title: "Couldn't remove role", description: error.message, variant: "destructive" });
    else {
      toast({ title: `Removed ${ROLE_META[r].label}` });
      if (role === r) clearActiveRole();
      await refreshRoles();
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <p className="text-muted-foreground mb-4">Please log in to view your profile.</p>
        <Button className="rounded-2xl" onClick={() => navigate("/auth")}>Login</Button>
      </div>
    );
  }

  const availableToAdd = ALL_ROLES.filter((r) => !roles.includes(r));

  return (
    <div className="container mx-auto py-8 px-4 max-w-lg pb-24 md:pb-8 space-y-6">
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {(profile?.display_name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{profile?.display_name || user.email}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Active: {role ? `${ROLE_META[role].emoji} ${ROLE_META[role].label}` : "None selected"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium"><User className="h-4 w-4 text-muted-foreground" /> Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-xl h-12 bg-muted/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-muted-foreground" /> Email</Label>
            <Input value={user.email || ""} disabled className="rounded-xl h-12 bg-muted/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium"><Phone className="h-4 w-4 text-muted-foreground" /> Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." className="rounded-xl h-12 bg-muted/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4 text-muted-foreground" /> Language</Label>
            <div className="flex gap-2">
              {(["en", "hi", "te"] as Language[]).map((l) => (
                <Button key={l} variant={lang === l ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setLang(l)}>
                  {l === "en" ? "English" : l === "hi" ? "हिंदी" : "తెలుగు"}
                </Button>
              ))}
            </div>
          </div>
          <Button size="lg" className="w-full rounded-2xl text-base font-semibold" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">My Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-lg">{ROLE_META[r].emoji}</span>
                  <span>{ROLE_META[r].label}</span>
                  {role === r && <Badge variant="secondary" className="ml-1 text-[10px]">Active</Badge>}
                </div>
                <Button variant="ghost" size="sm" className="rounded-lg text-destructive hover:bg-destructive/10" onClick={() => removeRole(r)} disabled={roleBusy === r || roles.length <= 1}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {availableToAdd.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-muted-foreground">Add another role</Label>
              <div className="flex flex-wrap gap-2">
                {availableToAdd.map((r) => (
                  <Button key={r} variant="outline" size="sm" className="rounded-xl" onClick={() => addRole(r)} disabled={roleBusy === r}>
                    <Plus className="h-3.5 w-3.5 mr-1" />{ROLE_META[r].emoji} {ROLE_META[r].label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {roles.length > 1 && (
            <Button variant="outline" size="lg" className="w-full rounded-2xl mt-2" onClick={handleSwitchRole}>
              <Repeat className="h-4 w-4 mr-2" /> Switch Role
            </Button>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" size="lg" className="w-full rounded-2xl text-base text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleLogout}>
        <LogOut className="h-5 w-5 mr-2" /> Logout
      </Button>
    </div>
  );
};

export default Profile;
