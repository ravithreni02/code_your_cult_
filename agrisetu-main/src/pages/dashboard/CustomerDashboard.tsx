import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Search, Clock, CheckCircle, Tractor, Users, UsersRound, ArrowRight, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("booker_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setBookings(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel("customer-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const pending = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const completed = bookings.filter((b) => b.status === "completed").length;

  if (loading) return <div className="p-8 text-center text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 space-y-6 max-w-7xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground p-6 md:p-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm text-primary-foreground/75 mb-2">AgriSetu farmer desk</p>
          <h1 className="text-2xl md:text-3xl font-bold">Plan today’s farm work</h1>
          <p className="text-primary-foreground/80 text-sm mt-2 max-w-xl">Keep bookings, workers and equipment in one place so the next field task is always clear.</p>
        </div>
        <MapPin className="absolute right-5 bottom-4 h-24 w-24 text-white/10" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: bookings.length, icon: CalendarCheck, color: "text-primary" },
          { label: "Pending", value: pending, icon: Clock, color: "text-yellow-600" },
          { label: "Confirmed", value: confirmed, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Completed", value: completed, icon: CheckCircle, color: "text-primary" },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Start a farm task</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: "/equipment", icon: Tractor, label: "Rent Equipment", color: "bg-primary/10 text-primary" },
            { to: "/labor", icon: Users, label: "Hire Labor", color: "bg-emerald-100 text-emerald-700" },
            { to: "/group-labor", icon: UsersRound, label: "Group Labor", color: "bg-violet-100 text-violet-700" },
          ].map((a) => (
            <Link key={a.to} to={a.to}>
              <Card className="rounded-2xl border-border/50 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={`h-12 w-12 rounded-2xl ${a.color} flex items-center justify-center`}>
                    <a.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">{a.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" /> Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-80 overflow-y-auto">
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No bookings yet. Start by renting equipment or hiring labor!</p>
            </div>
          ) : bookings.slice(0, 10).map((b) => (
            <div key={b.id} className="p-3 rounded-xl bg-muted/40">
              <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{b.item_name}</p>
                <p className="text-xs text-muted-foreground">{b.booking_type} • {b.booking_date || "No date"}</p>
                {b.price && <p className="text-xs font-medium text-primary">₹{b.price}</p>}
              </div>
              <Badge className={`rounded-full text-[10px] px-2 py-0.5 ${statusColors[b.status]}`}>
                {b.status}
              </Badge>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {["pending", "confirmed", "completed"].map((step, index) => (
                  <div key={step} className="flex items-center gap-1 flex-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${["pending", "confirmed", "completed"].indexOf(b.status) >= index ? "bg-primary" : "bg-border"}`} />
                    {index < 2 && <span className={`h-0.5 flex-1 ${["pending", "confirmed", "completed"].indexOf(b.status) > index ? "bg-primary" : "bg-border"}`} />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Requested</span><span>Accepted</span><span>Done</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDashboard;
