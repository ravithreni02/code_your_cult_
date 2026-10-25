import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { CalendarCheck, Clock, CheckCircle, Tractor, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type Availability = Database["public"]["Tables"]["availability"]["Row"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const EquipmentOwnerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    const [bRes, aRes] = await Promise.all([
      supabase.from("bookings").select("*").eq("provider_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("availability").select("*").eq("user_id", user.id),
    ]);
    setBookings(bRes.data || []);
    const avMap: Record<string, boolean> = {};
    (aRes.data || []).forEach((a: Availability) => { avMap[a.date] = a.is_available; });
    setAvailability(avMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (!user) return;
    const channel = supabase
      .channel("equip-dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "availability" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleDate = async (date: Date) => {
    if (!user) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const current = availability[dateStr];
    if (current === undefined) {
      await supabase.from("availability").insert({ user_id: user.id, date: dateStr, is_available: true });
    } else if (current) {
      await supabase.from("availability").update({ is_available: false }).eq("user_id", user.id).eq("date", dateStr);
    } else {
      await supabase.from("availability").delete().eq("user_id", user.id).eq("date", dateStr);
    }
    fetchData();
  };

  const handleBookingAction = async (id: string, status: "confirmed" | "rejected") => {
    await supabase.from("bookings").update({ status }).eq("id", id);
    fetchData();
  };

  const getDateModifiers = () => {
    const available: Date[] = [];
    const unavailable: Date[] = [];
    Object.entries(availability).forEach(([dateStr, isAvail]) => {
      const d = new Date(dateStr + "T00:00:00");
      if (isAvail) available.push(d);
      else unavailable.push(d);
    });
    return { available, unavailable };
  };

  const { available, unavailable } = getDateModifiers();

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 pb-24 md:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tractor className="h-6 w-6 text-primary" /> Equipment Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Manage your equipment & rentals</p>
        </div>
        <Button asChild className="rounded-2xl">
          <Link to="/add-equipment"><Plus className="h-5 w-5 mr-1" /> Add Equipment</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", value: bookings.filter(b => b.status === "pending").length, icon: Clock, color: "text-yellow-600" },
          { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Total Rentals", value: bookings.length, icon: CalendarCheck, color: "text-primary" },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/50">
            <CardContent className="p-4 text-center">
              <s.icon className={`h-6 w-6 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Availability Calendar */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" /> Equipment Availability
            </CardTitle>
            <p className="text-xs text-muted-foreground">Click dates to set availability</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Available</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-destructive" /> Unavailable</span>
            </div>
            <CalendarUI
              mode="single"
              onSelect={(d) => d && toggleDate(d)}
              modifiers={{ available, unavailable }}
              modifiersClassNames={{
                available: "bg-emerald-100 text-emerald-800 font-bold",
                unavailable: "bg-destructive/20 text-destructive font-bold",
              }}
              className={cn("p-3 pointer-events-auto w-full")}
            />
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" /> Rental Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No rental requests yet</p>
            ) : bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{b.item_name}</p>
                  <p className="text-xs text-muted-foreground">{b.booking_date || "No date"} • {b.booking_type}</p>
                  {b.price && <p className="text-xs font-medium text-primary">₹{b.price}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`rounded-full text-[10px] px-2 py-0.5 ${statusColors[b.status]}`}>
                    {b.status}
                  </Badge>
                  {b.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 rounded-lg text-xs px-2" onClick={() => handleBookingAction(b.id, "confirmed")}>Accept</Button>
                      <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs px-2" onClick={() => handleBookingAction(b.id, "rejected")}>Reject</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EquipmentOwnerDashboard;
