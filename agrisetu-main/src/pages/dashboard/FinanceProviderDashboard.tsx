import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote, Clock, CheckCircle, IndianRupee } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FinanceRequest = Database["public"]["Tables"]["finance_requests"]["Row"];

const FinanceProviderDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FinanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("finance_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setRequests(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const pending = requests.filter(r => r.status === "pending").length;
  const totalAmount = requests.reduce((s, r) => s + Number(r.amount), 0);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 pb-24 md:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Banknote className="h-6 w-6 text-primary" /> Finance Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">Review loan requests from farmers</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Requests", value: requests.length, icon: Banknote, color: "text-primary" },
          { label: "Pending", value: pending, icon: Clock, color: "text-yellow-600" },
          { label: "Total Amount", value: `₹${totalAmount.toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600" },
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

      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" /> Loan Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No loan requests yet</p>
          ) : requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">₹{Number(r.amount).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{r.duration} months • {new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <Badge className={`rounded-full text-[10px] px-2 py-0.5 ${
                r.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                {r.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceProviderDashboard;
