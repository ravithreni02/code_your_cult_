import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sprout, Mail, Lock, User, Phone, MapPin } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roles: { value: AppRole; label: string; emoji: string; desc: string }[] = [
  { value: "customer", label: "Customer (Farmer)", emoji: "🌾", desc: "Rent equipment, hire labor" },
  { value: "machinery_provider", label: "Equipment Owner", emoji: "🚜", desc: "List & rent out machinery" },
  { value: "labor", label: "Labor", emoji: "👷", desc: "Offer your skills, get bookings" },
  { value: "group_leader", label: "Group Labor Leader", emoji: "👥", desc: "Manage a group of workers" },
  { value: "finance_provider", label: "Finance Provider", emoji: "🏦", desc: "Offer loans to farmers" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang, setLang } = useLanguage();
  const { user, ready } = useAuth();

  // If already signed in (e.g. returning from Google OAuth redirect), go to role selection.
  useEffect(() => {
    if (ready && user) navigate("/select-role", { replace: true });
  }, [ready, user, navigate]);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  // Customer is auto-granted server-side; default extra selection is empty.
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleRole = (r: AppRole) => {
    setSelectedRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  };

  const validate = (): string | null => {
    if (!email.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email";
    if (!password || password.length < 6) return "Password must be at least 6 characters";
    if (mode === "register") {
      if (!displayName.trim()) return "Name is required";
      if (phone && !/^\+?[0-9\s\-()]{7,15}$/.test(phone)) return "Enter a valid phone number";
    }
    return null;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: "Check your details", description: err, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        // Always include customer; merge with extra selections.
        const allRoles: AppRole[] = Array.from(new Set<AppRole>(["customer", ...selectedRoles]));
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              phone,
              location,
              roles: allRoles,
            },
            emailRedirectTo: `${window.location.origin}/select-role`,
          },
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "Welcome to AgriSetu 🌱" });
        // After signup, send to role selector (it auto-redirects if only 1 role)
        navigate("/select-role", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!" });
        // After login, role selector decides where to go
        navigate("/select-role", { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      const msg =
        message.includes("Invalid login")
          ? "Wrong email or password"
          : message.includes("already registered")
            ? "This email is already registered. Try signing in."
            : message;
      toast({ title: "Authentication error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/select-role` },
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md rounded-2xl border-border/50 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Sprout className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">
            {mode === "login" ? "Welcome Back" : "Join AgriSetu"}
          </CardTitle>
          <CardDescription>
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </CardDescription>
          <div className="flex items-center justify-center gap-2 pt-3">
            {([
              { code: "en", label: "English" },
              { code: "hi", label: "हिंदी" },
              { code: "te", label: "తెలుగు" },
            ] as const).map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  lang === l.code
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border/50 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-muted-foreground" /> Full Name
                  </Label>
                  <Input id="name" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="rounded-xl h-12 bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4 text-muted-foreground" /> Phone (optional)
                  </Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-12 bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> Location (optional)
                  </Label>
                  <Input id="location" placeholder="Village, District" value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl h-12 bg-muted/50 border-border/50" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email
              </Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl h-12 bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4 text-muted-foreground" /> Password
              </Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="rounded-xl h-12 bg-muted/50 border-border/50" />
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  Add extra roles <span className="text-xs font-normal text-muted-foreground">(Customer included by default)</span>
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.filter((r) => r.value !== "customer").map((r) => {
                    const checked = selectedRoles.includes(r.value);
                    return (
                      <label
                        key={r.value}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm font-medium cursor-pointer transition-all ${
                          checked
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleRole(r.value)} />
                        <span className="text-lg">{r.emoji}</span>
                        <span className="flex-1">
                          <span className="block">{r.label}</span>
                          <span className="block text-xs opacity-70 font-normal">{r.desc}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full rounded-2xl text-base font-semibold" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button variant="outline" size="lg" className="w-full rounded-2xl text-base" onClick={handleGoogleLogin}>
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-primary font-semibold hover:underline"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
