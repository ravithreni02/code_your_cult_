import { Link } from "react-router-dom";
import { Tractor, Users, Banknote, MessageCircle, UsersRound, Sprout, ArrowRight, Leaf, Sun, Search, CalendarCheck, CircleCheck, ShieldCheck, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const Home = () => {
  const { t } = useLanguage();

  const features = [
    { to: "/crop-advisor", icon: Leaf, label: t("agriGenie"), desc: t("farmerTools"), color: "bg-primary/10 text-primary" },
    { to: "/equipment", icon: Tractor, label: t("equipment"), desc: t("rentEquipment"), color: "bg-accent text-accent-foreground" },
    { to: "/labor", icon: Users, label: t("labor"), desc: t("hireLabor"), color: "bg-secondary text-secondary-foreground" },
    { to: "/community", icon: MessageCircle, label: t("community"), desc: t("farmerTools"), color: "bg-primary/10 text-primary" },
    { to: "/finance", icon: Banknote, label: t("finance"), desc: t("farmerTools"), color: "bg-accent text-accent-foreground" },
    { to: "/group-labor", icon: UsersRound, label: t("groupLabor"), desc: t("hireGroup"), color: "bg-secondary text-secondary-foreground" },
  ];

  const steps = [
    { icon: Search, label: t("stepSearch"), description: t("stepSearchText"), color: "bg-sky-100 text-sky-700" },
    { icon: CalendarCheck, label: t("stepBook"), description: t("stepBookText"), color: "bg-amber-100 text-amber-700" },
    { icon: CircleCheck, label: t("stepGrow"), description: t("stepGrowText"), color: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="min-h-screen overflow-hidden pb-20 md:pb-0">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#14532d] via-primary to-[#65a30d] text-primary-foreground">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-[8%] animate-float"><Leaf className="h-20 w-20" /></div>
          <div className="absolute top-20 right-[12%] animate-sway"><Sprout className="h-16 w-16" /></div>
          <div className="absolute bottom-10 left-1/3 animate-float"><Sun className="h-24 w-24" /></div>
          <div className="absolute bottom-20 right-[8%] animate-sway"><Tractor className="h-20 w-20" /></div>
        </div>
        <div className="absolute inset-0 opacity-20 field-pattern" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-sm font-semibold border border-white/20">
              <Sprout className="h-4 w-4" />
              {t("trustedByFarmers")}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-5 leading-[1.08] tracking-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-10 leading-relaxed max-w-2xl mx-auto">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl px-8 min-h-14 text-base font-bold shadow-xl shadow-black/10" asChild>
                <Link to="/equipment">
                  <Tractor className="h-5 w-5 mr-2" />
                  {t("rentEquipment")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/40 hover:bg-white/20 rounded-2xl px-8 min-h-14 text-base font-bold" asChild>
                <Link to="/labor">
                  <Users className="h-5 w-5 mr-2" />
                  {t("hireLabor")}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-3xl mx-auto">
          {[
            { label: t("farmers"), value: "500+" },
            { label: t("equipmentCount"), value: "120+" },
            { label: t("workersCount"), value: "300+" },
          ].map((s) => (
            <Card key={s.label} className="text-center glass-card rounded-2xl lift-on-hover">
              <CardContent className="p-4 md:p-6">
                <p className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto py-14 px-4">
        <div className="text-center mb-10">
          <p className="text-primary text-sm font-bold uppercase tracking-[0.18em] mb-3">{t("quickStart")}</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{t("whatCanYouDo")}</h2>
          <p className="text-muted-foreground">{t("quickStartSubtitle")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-16">
          {steps.map((step, index) => (
            <div key={step.label} className="relative flex md:block items-center gap-4 rounded-2xl bg-card p-5 border border-border/60 lift-on-hover">
              <div className={`h-14 w-14 rounded-2xl ${step.color} flex items-center justify-center shrink-0`}>
                <step.icon className="h-7 w-7" />
              </div>
              <div className="mt-0 md:mt-4">
                <p className="text-xs font-bold text-muted-foreground mb-1">0{index + 1}</p>
                <h3 className="font-bold text-lg">{step.label}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && <ArrowRight className="hidden md:block absolute -right-7 top-10 h-5 w-5 text-primary/50 z-10" />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 max-w-5xl mx-auto mb-8">
          <div className="h-px bg-border flex-1" />
          <h2 className="text-xl md:text-2xl font-bold">{t("exploreServices")}</h2>
          <div className="h-px bg-border flex-1" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {features.map((f) => (
            <Link key={f.to} to={f.to} className="group">
              <Card className="h-full rounded-2xl border-border/50 shadow-sm lift-on-hover cursor-pointer overflow-hidden">
                <CardContent className="flex flex-col items-center text-center gap-3 p-5 md:p-7">
                  <div className={`h-14 w-14 rounded-2xl ${f.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                    <f.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg">{f.label}</h3>
                    <p className="text-muted-foreground text-xs md:text-sm mt-1">{f.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-5 max-w-5xl mx-auto">
          <Card className="rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 border-amber-200/70">
            <CardContent className="p-6 md:p-8 flex gap-5 items-start">
              <div className="h-14 w-14 rounded-2xl bg-amber-400/20 text-amber-700 flex items-center justify-center shrink-0 animate-float">
                <Sun className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] font-bold text-amber-700 mb-2">{t("seasonalTip")}</p>
                <p className="text-lg font-bold text-amber-950 leading-relaxed">{t("seasonalTipText")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl bg-primary text-primary-foreground border-0 overflow-hidden relative">
            <CardContent className="p-6 md:p-8 relative z-10">
              <ShieldCheck className="h-8 w-8 mb-4 opacity-90" />
              <h3 className="text-xl font-bold mb-2">{t("trustedByFarmers")}</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed">{t("trustedByFarmersText")}</p>
              <div className="flex items-center gap-1 mt-5 text-primary-foreground/80">
                {[1, 2, 3, 4, 5].map((star) => <span key={star} className="text-amber-300">★</span>)}
                <span className="text-xs ml-2">4.8/5</span>
              </div>
            </CardContent>
            <Quote className="absolute -right-2 -bottom-4 h-28 w-28 opacity-10" />
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
