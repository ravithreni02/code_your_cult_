import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sprout, Droplets, IndianRupee, TrendingUp, MapPin, SlidersHorizontal, CloudSun, Sparkles, Loader2, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { STATES, districtsOf, recommend, soilProfile, type AdvisorResult } from "@/lib/agrigenie";

const CROP_EMOJI: Record<string, string> = {
  rice: "🌾", maize: "🌽", chickpea: "🌱", kidneybeans: "🌱", pigeonpeas: "🌱", mothbeans: "🌱",
  mungbean: "🌱", blackgram: "🌱", lentil: "🌱", pomegranate: "🍎", banana: "🍌", mango: "🥭",
  grapes: "🍇", watermelon: "🍉", muskmelon: "🍈", apple: "🍏", orange: "🍊", papaya: "🍐",
  coconut: "🥥", cotton: "🧵", jute: "🪢", coffee: "☕",
};

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CropAdvisor = () => {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const initialState = STATES.find((s) => s === params.get("state")) ?? STATES[0];
  const [state, setState] = useState(initialState);
  const districts = useMemo(() => districtsOf(state), [state]);
  const [district, setDistrict] = useState(
    districtsOf(initialState).find((d) => d === params.get("district")) ?? districtsOf(initialState)[0]
  );
  const [soilOverride, setSoilOverride] = useState({ N: "", P: "", K: "", ph: "" });
  const [w, setW] = useState({ confidence: 0.4, yield: 0.15, water: 0.3, profit: 0.15 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdvisorResult | null>(null);

  const defaults = useMemo(() => soilProfile(state, district), [state, district]);

  const onState = (s: string) => {
    setState(s);
    setDistrict(districtsOf(s)[0]);
    setResult(null);
  };

  const run = async () => {
    setLoading(true);
    try {
      const res = await recommend({
        state,
        district,
        N: Number(soilOverride.N) || undefined,
        P: Number(soilOverride.P) || undefined,
        K: Number(soilOverride.K) || undefined,
        ph: Number(soilOverride.ph) || undefined,
        weights: w,
      });
      setResult(res);
    } catch (e) {
      toast({ title: "Could not generate recommendations", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Auto-run when the voice assistant navigates here with a state + district
  const runRef = useRef(run);
  runRef.current = run;
  const autoKey = `${params.get("auto")}:${params.get("state")}:${params.get("district")}`;
  const autoDone = useRef("");
  useEffect(() => {
    if (params.get("auto") !== "1" || !params.get("state") || !params.get("district")) return;
    if (autoDone.current === autoKey) return;
    autoDone.current = autoKey;
    runRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoKey]);



  const sliders: { key: keyof typeof w; label: string; icon: typeof TrendingUp }[] = [
    { key: "confidence", label: "Suitability", icon: Sprout },
    { key: "yield", label: "Yield", icon: TrendingUp },
    { key: "water", label: "Water saving", icon: Droplets },
    { key: "profit", label: "Profit", icon: IndianRupee },
  ];

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-12 space-y-6">
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" /> AgriGenie AI
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Smart Crop Advisor</h1>
        <p className="text-muted-foreground">
          Multi-objective crop recommendations balancing suitability, yield, irrigation need and net profit — using live
          climate data for your district.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Inputs */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Your Farm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">State</Label>
                <Select value={state} onValueChange={onState}>
                  <SelectTrigger className="rounded-xl h-12 bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">District</Label>
                <Select value={district} onValueChange={(d) => { setDistrict(d); setResult(null); }}>
                  <SelectTrigger className="rounded-xl h-12 bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" /> Soil Test <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {(["N", "P", "K", "ph"] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{k === "ph" ? "pH" : k}</Label>
                  <Input
                    inputMode="decimal"
                    placeholder={String(defaults[k])}
                    value={soilOverride[k]}
                    onChange={(e) => setSoilOverride({ ...soilOverride, [k]: e.target.value })}
                    className="rounded-xl h-11 bg-muted/50 border-border/50"
                  />
                </div>
              ))}
              <p className="col-span-2 text-xs text-muted-foreground">
                Leave blank to use regional soil averages for {district}.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> What matters most?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {sliders.map(({ key, label, icon: Icon }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-muted-foreground" />{label}</span>
                    <span className="text-muted-foreground tabular-nums">{Math.round(w[key] * 100)}%</span>
                  </div>
                  <Slider value={[w[key]]} min={0} max={1} step={0.05} onValueChange={([v]) => setW({ ...w, [key]: v })} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Button size="lg" className="w-full rounded-2xl h-14 text-base font-semibold" onClick={run} disabled={loading}>
            {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analysing…</> : <><Sprout className="h-5 w-5 mr-2" /> Get Recommendations</>}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {!result && !loading && (
            <Card className="rounded-2xl border-dashed border-border/60 shadow-none">
              <CardContent className="py-16 text-center space-y-3">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sprout className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Pick your state and district, set your priorities, then tap <strong>Get Recommendations</strong>.
                </p>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="rounded-2xl border-border/50 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CloudSun className="h-8 w-8 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Live weather</p>
                      <p className="font-semibold">{result.climate.temperature}°C · {result.climate.humidity}% RH</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border/50 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Droplets className="h-8 w-8 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Rain (37 days)</p>
                      <p className="font-semibold">{result.climate.rainfall37d} mm</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border/50 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <FlaskConical className="h-8 w-8 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Soil N-P-K · pH</p>
                      <p className="font-semibold">{result.soil.N}-{result.soil.P}-{result.soil.K} · {result.soil.ph}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="rounded-full">Rainfall: {result.climate.category}</Badge>
                <Badge variant={result.climate.risk === "low" ? "secondary" : "destructive"} className="rounded-full">
                  Water risk: {result.climate.risk}
                </Badge>
                {result.climate.source !== "live" && (
                  <Badge variant="outline" className="rounded-full">Offline estimate</Badge>
                )}
              </div>

              {result.noVerified && (
                <p className="text-sm rounded-xl bg-destructive/10 text-destructive p-3">
                  None of the candidate crops could be confirmed as commercially grown in {state} from government
                  production records — treat these results with caution.
                </p>
              )}

              {result.results.map((r, i) => (
                <Card key={r.crop} className={`rounded-2xl shadow-sm transition-shadow hover:shadow-md ${i === 0 ? "border-primary/50 bg-primary/5" : "border-border/50"}`}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                          {CROP_EMOJI[r.crop] ?? "🌱"}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold leading-tight">{title(r.crop)}</h3>
                          <p className="text-xs text-muted-foreground">Match {r.confidence >= 0.01 ? r.confidence.toFixed(2) : "<0.01"}% · driver: {r.driver}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {i === 0 && <Badge className="rounded-full">Top pick</Badge>}
                        {r.growth === "grown" && <Badge variant="secondary" className="rounded-full text-[10px]">Grown in {state}</Badge>}
                        {r.growth === "unverifiable" && <Badge variant="outline" className="rounded-full text-[10px]">Unverified</Badge>}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-muted/50 p-3">
                        <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-sm font-semibold">{r.yieldTHa} t/ha</p>
                        <p className="text-[11px] text-muted-foreground">Est. yield</p>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <Droplets className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-sm font-semibold">{r.irrigationMm} mm</p>
                        <p className="text-[11px] text-muted-foreground">Irrigation</p>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <IndianRupee className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className={`text-sm font-semibold ${r.profitInr < 0 ? "text-destructive" : ""}`}>
                          ₹{Math.abs(r.profitInr).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{r.profitInr < 0 ? "Est. loss/ha" : "Est. profit/ha"}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{r.explanation}</p>
                  </CardContent>
                </Card>
              ))}

              {result.suppressed && (
                <p className="text-xs text-muted-foreground">
                  Note: the highest raw statistical match was <strong>{title(result.rawTop)}</strong> ({result.rawTopConf}%),
                  but it does not appear in government production records for {state} and was excluded.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropAdvisor;
