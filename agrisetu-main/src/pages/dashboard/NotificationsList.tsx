import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const NotificationsList = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel("notifs-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Bell className="h-6 w-6 text-primary" /> Notifications
      </h1>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              No notifications yet
            </CardContent>
          </Card>
        ) : notifications.map((n) => (
          <Card
            key={n.id}
            onClick={() => !n.read && markRead(n.id)}
            className={`rounded-2xl cursor-pointer transition-all ${
              n.read ? "border-border/50 bg-card" : "border-primary/20 bg-primary/5"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NotificationsList;
