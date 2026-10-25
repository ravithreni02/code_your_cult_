import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UsersRound, Plus, Users, IndianRupee, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

type GL = Database["public"]["Tables"]["labor_groups"]["Row"];

const GroupLabor = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, role } = useAuth();
  const [groups, setGroups] = useState<GL[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ groupName: "", workers: "", price: "" });
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  const fetchGroups = async () => {
    const { data, error } = await supabase.from("labor_groups").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Could not load groups", description: error.message, variant: "destructive" });
    } else {
      setGroups(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) void fetchGroups();
    else setLoading(false);
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please login to create a group", variant: "destructive" });
      return;
    }
    const workers = Number(form.workers);
    const price = Number(form.price);
    if (!Number.isInteger(workers) || workers < 1 || !Number.isFinite(price) || price <= 0) {
      toast({ title: "Enter valid group details", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("labor_groups").insert({
      provider_id: user.id,
      group_name: form.groupName.trim(),
      workers,
      price,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not create group", description: error.message, variant: "destructive" });
      return;
    }
    await fetchGroups();
    setForm({ groupName: "", workers: "", price: "" });
    toast({ title: "Group Added!", description: `"${form.groupName}" listed successfully.` });
  };

  const handleHire = async (g: GL) => {
    if (!user) {
      toast({ title: "Please login to hire a group", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("bookings").insert({
      booker_id: user.id,
      booking_type: "group_labor",
      item_id: g.id,
      item_name: g.group_name,
      price: g.price,
    });
    if (error) {
      toast({ title: "Could not hire group", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Group Hired!", description: `Your request for "${g.group_name}" is pending.` });
  };

  const filteredGroups = groups.filter((group) =>
    group.group_name.toLowerCase().includes(search.trim().toLowerCase())
    && (!availableOnly || group.availability)
  );

  return (
    <div className="container mx-auto py-8 px-4 pb-24 md:pb-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-2">
        <UsersRound className="h-7 w-7 text-primary" />
        Group Labor
      </h1>

      {role === "group_leader" && <Card className="mb-8 max-w-lg rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" /> {t("createGroup")}
          </h2>
          <form onSubmit={handleAdd} className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <UsersRound className="h-4 w-4 text-muted-foreground" /> Group Name
              </Label>
              <Input               placeholder={t("groupName")} value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} required className="rounded-xl h-12 bg-muted/50 border-border/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-muted-foreground" /> Workers
                </Label>
                <Input type="number" placeholder="10" value={form.workers} onChange={(e) => setForm({ ...form, workers: e.target.value })} required className="rounded-xl h-12 bg-muted/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" /> Price (₹)
                </Label>
                <Input type="number" placeholder="4000" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="rounded-xl h-12 bg-muted/50 border-border/50" />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full rounded-2xl text-base font-semibold" disabled={saving}>
              {saving ? t("saving") : t("addGroup")}
            </Button>
          </form>
        </CardContent>
      </Card>}

      {/* List */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            aria-label="Search labor groups"
            placeholder={t("searchGroups")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border/50 bg-muted/50 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-border/50 px-3 text-sm">
          <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
          {t("availableOnly")}
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading && <p className="text-muted-foreground">{t("loading")}</p>}
        {!loading && groups.length === 0 && <p className="text-muted-foreground">{t("noListings")}</p>}
        {!loading && groups.length > 0 && filteredGroups.length === 0 && <p className="text-muted-foreground">{t("noMatches")}</p>}
        {filteredGroups.map((g) => (
          <Card key={g.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <UsersRound className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{g.group_name}</h3>
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {g.workers} workers
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-xl font-extrabold text-primary">₹{g.price}<span className="text-sm font-normal text-muted-foreground">/day</span></span>
                <Button className="rounded-2xl" onClick={() => handleHire(g)} disabled={!g.availability}>Hire Group</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GroupLabor;
