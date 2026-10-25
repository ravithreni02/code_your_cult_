import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Banknote, ShieldCheck, IndianRupee, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Finance = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agrisetu.finance-draft") || "{\"amount\":\"\",\"duration\":\"\"}");
    } catch {
      return { amount: "", duration: "" };
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("agrisetu.finance-draft", JSON.stringify(form));
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please login", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("finance_requests").insert({
      user_id: user.id,
      amount: Number(form.amount),
      duration: Number(form.duration),
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Loan Application Submitted!", description: `Amount: ₹${form.amount}, Duration: ${form.duration} months.` });
      setForm({ amount: "", duration: "" });
      localStorage.removeItem("agrisetu.finance-draft");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-lg pb-24 md:pb-8">
      <Card className="rounded-3xl border-border/50 shadow-lg shadow-primary/5 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Banknote className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("finance")}</CardTitle>
          <CardDescription>{t("farmerTools")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2 text-sm font-medium">
                <IndianRupee className="h-4 w-4 text-muted-foreground" /> Loan Amount (₹)
              </Label>
              <Input id="amount" type="number" placeholder="e.g. 50000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="rounded-xl h-12 bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" /> Duration (months)
              </Label>
              <Input id="duration" type="number" placeholder="e.g. 12" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required className="rounded-xl h-12 bg-muted/50 border-border/50" />
            </div>
            <Button type="submit" size="lg" className="w-full rounded-2xl text-base font-semibold" disabled={loading}>
              {loading ? t("saving") : t("finance")}
            </Button>
          </form>
          <div className="mt-6 flex items-center gap-2 text-muted-foreground text-sm bg-muted/50 rounded-xl p-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <span>Your information is secure and confidential.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finance;
