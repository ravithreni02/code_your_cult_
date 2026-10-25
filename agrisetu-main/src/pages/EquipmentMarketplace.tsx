import { useCallback, useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Plus, Tractor, MapPin, CheckCircle2, XCircle, Calendar, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type EquipmentRow = Database["public"]["Tables"]["equipment"]["Row"];
type Equipment = EquipmentRow;
type PublicProfile = Database["public"]["Views"]["public_profiles"]["Row"];

const EquipmentMarketplace = () => {
  const [items, setItems] = useState<Equipment[]>([]);
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
    const { data, error } = await supabase.from("equipment").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Could not load equipment", description: error.message, variant: "destructive" });
    } else {
      setItems(data ?? []);
      const ownerIds = [...new Set((data ?? []).map((item) => item.owner_id))];
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase.from("public_profiles").select("*").in("user_id", ownerIds);
        setProviderNames(Object.fromEntries(((profiles ?? []) as PublicProfile[]).map((profile) => [profile.user_id, profile.display_name || "Local equipment provider"])));
        const { data: reviews } = await supabase.from("marketplace_reviews").select("provider_id, rating").in("provider_id", ownerIds);
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
    const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (!availableOnly || item.availability);
  });

  const handleRent = async (item: Equipment) => {
    if (!user) {
      toast({ title: "Please login", description: "You need to login to rent equipment.", variant: "destructive" });
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
      booking_type: "equipment",
      item_name: item.name,
      item_id: item.id,
      price: item.price,
      booking_date: format(date, "yyyy-MM-dd"),
    });
    setBookingLoading(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking Created!", description: `"${item.name}" booked for ${format(date, "PPP")}. Status: Pending.` });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 pb-24 md:pb-8">
      <div className="mb-7 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-amber-50 p-6 md:p-8 border border-primary/10 relative overflow-hidden">
        <Sparkles className="absolute -right-2 -top-3 h-24 w-24 text-primary/10" />
        <div className="relative flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Tractor className="h-7 w-7 text-primary" />
            {t("equipment")}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Rent farm machines near you, when you need them.</p>
        </div>
        {role === "machinery_provider" && (
          <Button asChild className="rounded-2xl">
            <Link to="/add-equipment"><Plus className="h-5 w-5 mr-1" /> Add</Link>
          </Button>
        )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            aria-label="Search equipment"
            placeholder={t("searchEquipment")}
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
          <Card key={index} className="rounded-2xl overflow-hidden animate-pulse">
            <div className="h-48 bg-muted" />
            <CardContent className="p-5 space-y-3">
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-10 rounded-xl bg-muted" />
            </CardContent>
          </Card>
        ))}
        {!loading && (items.length === 0 || filteredItems.length === 0) && (
          <Card className="col-span-full rounded-3xl border-dashed">
            <CardContent className="py-14 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                <Tractor className="h-8 w-8" />
              </div>
              <h2 className="font-bold text-lg">{items.length === 0 ? t("noListings") : t("noMatches")}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t("noResultsHint")}</p>
            </CardContent>
          </Card>
        )}
        {filteredItems.map((eq) => (
          <Card key={eq.id} className="overflow-hidden rounded-2xl border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="relative overflow-hidden">
              <img src={eq.image_url || "/placeholder.svg"} alt={eq.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
              <Badge className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold shadow-md ${
                eq.availability 
                  ? "bg-success text-success-foreground border-0" 
                  : "bg-destructive text-destructive-foreground border-0"
              }`}>
                {eq.availability ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> {t("available")}</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> {t("unavailable")}</>
                )}
              </Badge>
            </div>
            <CardContent className="p-5">
              <h3 className="font-bold text-lg mb-1">{eq.name}</h3>
              <p className="text-muted-foreground text-sm flex items-center gap-1 mb-3">
              <MapPin className="h-3.5 w-3.5" /> {providerNames[eq.owner_id] || "Local equipment provider"} {providerRatings[eq.owner_id] ? `· ${providerRatings[eq.owner_id].toFixed(1)} / 5` : "· New provider"}
              </p>
              {eq.availability && (
                <div className="mb-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("w-full rounded-xl justify-start text-left text-sm", !selectedDate[eq.id] && "text-muted-foreground")}>
                        <Calendar className="h-4 w-4 mr-2" />
                        {selectedDate[eq.id] ? format(selectedDate[eq.id]!, "PPP") : t("pickDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        mode="single"
                        selected={selectedDate[eq.id]}
                        onSelect={(d) => setSelectedDate({ ...selectedDate, [eq.id]: d })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-primary">₹{eq.price}<span className="text-sm font-normal text-muted-foreground">{t("perDay")}</span></span>
                <Button
                  className="rounded-2xl"
                  disabled={!eq.availability || bookingLoading === eq.id}
                  onClick={() => handleRent(eq)}
                >
                  {bookingLoading === eq.id ? "..." : t("rentNow")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EquipmentMarketplace;
