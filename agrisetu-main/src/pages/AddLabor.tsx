import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Users, User, Wrench, IndianRupee } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const AddLabor = () => {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agrisetu.labor-draft") || "{\"name\":\"\",\"skill\":\"\",\"wage\":\"\",\"availability\":true}");
    } catch {
      return { name: "", skill: "", wage: "", availability: true };
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem("agrisetu.labor-draft", JSON.stringify(form));
  }, [form]);

  if (!user || (role !== "labor" && role !== "group_leader")) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <p className="text-muted-foreground mb-4">{t("loginToPost")}</p>
        <Button className="rounded-2xl" onClick={() => navigate("/")}>{t("home")}</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wage = Number(form.wage);
    if (!form.name.trim() || !form.skill.trim() || !Number.isFinite(wage) || wage <= 0) {
      toast({ title: "Enter a valid wage", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("labor_profiles").insert({
      provider_id: user.id,
      name: form.name.trim(),
      skill: form.skill.trim(),
      wage,
      availability: form.availability,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not list labor", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Labor Added!", description: `${form.name} has been listed.` });
    setForm({ name: "", skill: "", wage: "", availability: true });
    localStorage.removeItem("agrisetu.labor-draft");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-lg pb-24 md:pb-8">
      <Card className="rounded-3xl border-border/50 shadow-lg shadow-primary/5 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("addLabor")}</CardTitle>
          <CardDescription>{t("hireLabor")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" /> Full Name
              </Label>
              <Input id="name" placeholder="e.g. Ramesh Verma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-xl h-12 bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill" className="flex items-center gap-2 text-sm font-medium">
                <Wrench className="h-4 w-4 text-muted-foreground" /> Skill
              </Label>
              <Input id="skill" placeholder="e.g. Harvesting" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} required className="rounded-xl h-12 bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wage" className="flex items-center gap-2 text-sm font-medium">
                <IndianRupee className="h-4 w-4 text-muted-foreground" /> Daily Wage (₹)
              </Label>
              <Input id="wage" type="number" min="1" placeholder="e.g. 500" value={form.wage} onChange={(e) => setForm({ ...form, wage: e.target.value })} required className="rounded-xl h-12 bg-muted/50 border-border/50" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <Label className="font-medium">{t("available")}</Label>
              <Switch checked={form.availability} onCheckedChange={(v) => setForm({ ...form, availability: v })} />
            </div>
            <Button type="submit" size="lg" className="w-full rounded-2xl text-base font-semibold" disabled={saving}>
              {saving ? t("saving") : t("addLabor")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddLabor;
