import { useCallback, useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Plus, Users, Star, CheckCircle2, XCircle, Calendar, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Labor = Database["public"]["Tables"]["labor_profiles"]["Row"];
type PublicProfile = Database["public"]["Views"]["public_profiles"]["Row"];

const LaborMarketplace = () => {
  const [items, setItems] = useState<Labor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Record<string, Date | undefined>>({});
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [providerNames, setProviderNames] = useState<Record<string, string>>({});
  const [providerRatings, setProviderRatings] = useState<Record<string, number>>({});

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase.from("labor_profiles").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Could not load labor listings", description: error.message, variant: "destructive" });
    } else {
      setItems(data ?? []);
      const providerIds = [...new Set((data ?? []).map((item) => item.provider_id))];
      if (providerIds.length > 0) {
        const { data: profiles } = await supabase.from("public_profiles").select("*").in("user_id", providerIds);
        setProviderNames(Object.fromEntries(((profiles ?? []) as PublicProfile[]).map((profile) => [profile.user_id, profile.display_name || "Local farm worker"])));
        const { data: reviews } = await supabase.from("marketplace_reviews").select("provider_id, rating").in("provider_id", providerIds);
        const grouped = new Map<string, number[]>();
        (reviews ?? []).forEach((review) => grouped.set(review.provider_id, [...(grouped.get(review.provider_id) ?? []), review.rating]));
        setProviderRatings(Object.fromEntries([...grouped.entries()].map(([id, values]) => [id, values.reduce((sum, value) => sum + value, 0) / values.length])));
      }
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const filteredItems = items.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(query) || item.skill.toLowerCase().includes(query);
    return matchesSearch && (!availableOnly || item.availability);
  });

  const handleHire = async (item: Labor) => {
    if (!user) {
      toast({ title: "Please login", description: "You need to login to hire labor.", variant: "destructive" });
      return;
    }
    const date = selectedDate[item.id];
    if (!date) {
      toast({ title: "Select a date", description: "Please pick a booking date.", variant: "destructive" });
      return;
    }
    setBookingLoading(item.id);
    const { error } = await supabase.from("bookings").insert({
      booker_id: user.id,
      booking_type: "labor",
      item_name: item.name,
      item_id: item.id,
      price: item.wage,
      booking_date: format(date, "yyyy-MM-dd"),
    });
    setBookingLoading(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Hire Request Sent!", description: `Requested ${item.name} for ${format(date, "PPP")}. Status: Pending.` });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 pb-24 md:pb-8">
      <div className="mb-7 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-sky-50 p-6 md:p-8 border border-primary/10">
        <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            {t("labor")}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Find skilled farm workers who understand your season.</p>
        </div>
        {(role === "labor" || role === "group_leader") && (
          <Button asChild className="rounded-2xl">
            <Link to="/add-labor"><Plus className="h-5 w-5 mr-1" /> Add</Link>
          </Button>
        )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            aria-label="Search labor"
            placeholder={t("searchLabor")}
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
        {loading && Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="rounded-2xl animate-pulse">
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-4"><div className="h-14 w-14 rounded-2xl bg-muted" /><div className="space-y-2 flex-1"><div className="h-5 w-2/3 rounded bg-muted" /><div className="h-4 w-1/2 rounded bg-muted" /></div></div>
              <div className="h-10 rounded-xl bg-muted" />
            </CardContent>
          </Card>
        ))}
        {!loading && (items.length === 0 || filteredItems.length === 0) && (
          <Card className="col-span-full rounded-3xl border-dashed">
            <CardContent className="py-14 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center"><Users className="h-8 w-8" /></div>
              <h2 className="font-bold text-lg">{items.length === 0 ? t("noListings") : t("noMatches")}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t("noResultsHint")}</p>
            </CardContent>
          </Card>
        )}
        {filteredItems.map((lb) => (
          <Card key={lb.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-xl font-bold text-primary">
                  {lb.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{lb.name}</h3>
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-primary fill-primary" /> {lb.skill}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{providerNames[lb.provider_id] || "Local farm worker"} {providerRatings[lb.provider_id] ? `· ${providerRatings[lb.provider_id].toFixed(1)} / 5` : "· New provider"}</p>
                </div>
                <Badge className={`rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0 ${
                  lb.availability 
                    ? "bg-success text-success-foreground border-0" 
                    : "bg-destructive text-destructive-foreground border-0"
                }`}>
                  {lb.availability ? <><CheckCircle2 className="h-3 w-3 mr-0.5" /> {t("free")}</> : <><XCircle className="h-3 w-3 mr-0.5" /> {t("busy")}</>}
                </Badge>
              </div>
              {lb.availability && (
                <div className="mb-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("w-full rounded-xl justify-start text-left text-sm", !selectedDate[lb.id] && "text-muted-foreground")}>
                        <Calendar className="h-4 w-4 mr-2" />
                        {selectedDate[lb.id] ? format(selectedDate[lb.id]!, "PPP") : t("pickDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        mode="single"
                        selected={selectedDate[lb.id]}
                        onSelect={(d) => setSelectedDate({ ...selectedDate, [lb.id]: d })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-xl font-extrabold text-primary">₹{lb.wage}<span className="text-sm font-normal text-muted-foreground">{t("perDay")}</span></span>
                <Button
                  className="rounded-2xl"
                  disabled={!lb.availability || bookingLoading === lb.id}
                  onClick={() => handleHire(lb)}
                >
                  {bookingLoading === lb.id ? "..." : t("hire")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LaborMarketplace;
