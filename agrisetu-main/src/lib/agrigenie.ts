import raw from "@/data/agrigenie.json";

type Bench = { yield: number; water: number; cost: number; temp: number; rain: number; price: number };
type NB = { prior: number; mean: number[]; var: number[] };

const data = raw as unknown as {
  features: string[];
  nb: Record<string, NB>;
  bounds: Record<string, [number, number]>;
  benchmarks: Record<string, Bench>;
  soil: Record<string, Record<string, [number, number, number, number]>>;
  coords: Record<string, [number, number]>;
  grown: Record<string, string[]>;
};

export const FEATURES = data.features;
export const STATES = Object.keys(data.soil).sort();
export const districtsOf = (state: string) => Object.keys(data.soil[state] ?? {}).sort();

const DISTRICT_ALIASES: Record<string, string> = {
  ahilyanagar: "ahmednagar", ahmedabad: "ahmadabad", "alluri sitharama raju": "visakhapatnam",
  ananthapuramu: "anantapur", annamayya: "chittoor", arvalli: "aravallis", bandipora: "bandipore",
  dangs: "the dangs", "east singhbum": "east singhbhum", "kaimur (bhabua)": "kaimur",
  "khandwa (east nimar)": "khandwa", "khargone (west nimar)": "khargone", "kotputli-behror": "jaipur",
  mauganj: "rewa", narsimhapur: "narsinghpur", "north 24 parganas": "north twenty four parganas",
  palnadu: "guntur", pratapgarh: "pratapgarh uttar pradesh", "sarangarh-bilaigarh": "raigarh",
  "south 24 parganas": "south twenty four parganas", "sri potti sriramulu nellore": "spsr nellore",
  vijayanagara: "ballari",
};

const CROP_TO_APY: Record<string, string> = {
  rice: "Rice", maize: "Maize", chickpea: "Gram", pigeonpeas: "Arhar/Tur", mothbeans: "Moth",
  mungbean: "Moong(Green Gram)", blackgram: "Urad", lentil: "Masoor", banana: "Banana",
  coconut: "Coconut", cotton: "Cotton(lint)", jute: "Jute", apple: "Apple", mango: "Mango",
  grapes: "Grapes", orange: "Orange", papaya: "Papaya", pomegranate: "Pomegranate",
};

const SPECIAL_STATES: Record<string, string[]> = {
  watermelon: ["UTTAR PRADESH", "ANDHRA PRADESH", "TAMIL NADU", "MADHYA PRADESH", "KARNATAKA", "ODISHA", "WEST BENGAL", "TELANGANA", "HARYANA", "MAHARASHTRA", "CHHATTISGARH", "BIHAR", "RAJASTHAN", "PUNJAB", "TRIPURA"],
  coffee: ["KARNATAKA", "KERALA", "TAMIL NADU", "ANDHRA PRADESH", "ODISHA", "ASSAM", "MEGHALAYA", "MANIPUR", "MIZORAM", "NAGALAND"],
  kidneybeans: ["MAHARASHTRA", "KARNATAKA", "TAMIL NADU", "KERALA", "HIMACHAL PRADESH", "UTTARAKHAND", "JAMMU AND KASHMIR", "GUJARAT", "WEST BENGAL"],
  muskmelon: ["UTTAR PRADESH", "ANDHRA PRADESH", "MADHYA PRADESH", "PUNJAB", "HARYANA", "CHHATTISGARH", "TAMIL NADU", "MAHARASHTRA", "TELANGANA", "RAJASTHAN"],
};

export const NARRATIVES: Record<string, { positive: string; negative: string }> = {
  N: { positive: "The local soil Nitrogen level provides an excellent macronutrient baseline for canopy growth.", negative: "Nitrogen limitations may require targeted top-dressing adjustments." },
  P: { positive: "Ample Phosphorus ensures strong seedling root structural development.", negative: "Suboptimal soil Phosphorus may delay maturity." },
  K: { positive: "Robust Potassium availability enhances disease resistance.", negative: "Low Potassium levels can impact overall cell wall stability." },
  temperature: { positive: "Current ambient seasonal temperatures align with the ideal metabolic window.", negative: "Severe temperature anomalies could induce thermal stress." },
  humidity: { positive: "Prevailing relative humidity matches necessary atmospheric vapour pressure.", negative: "Imbalanced humidity increases fungal pathogen risks." },
  ph: { positive: "The current soil pH guarantees ideal nutrient bioavailability.", negative: "Imbalanced soil pH limits chemical uptake." },
  rainfall: { positive: "Excellent natural rainfall volumes fulfil seasonal requirements.", negative: "Insufficient rainfall creates a moisture deficit." },
};

export interface Climate {
  temperature: number; humidity: number; rainfall37d: number; normal37d: number;
  pctDeparture: number; category: string; risk: "low" | "moderate" | "high"; source: string;
}

export interface Recommendation {
  crop: string; confidence: number; yieldTHa: number; waterMm: number; irrigationMm: number;
  profitInr: number; driver: string; explanation: string;
  growth: "grown" | "not_grown" | "unverifiable"; score: number;
}

function clip(feature: string, v: number) {
  const [lo, hi] = data.bounds[feature];
  return Math.min(Math.max(v, lo), hi);
}

export function soilProfile(state: string, district: string) {
  const s = data.soil[state] ?? {};
  const p = s[district] ?? Object.values(s)[0] ?? [50, 30, 50, 6.5];
  return { N: p[0], P: p[1], K: p[2], ph: p[3] };
}

export async function fetchClimate(district: string): Promise<Climate> {
  const key = DISTRICT_ALIASES[district.trim().toLowerCase()] ?? district.trim().toLowerCase();
  const fallback: Climate = {
    temperature: 27, humidity: 65, rainfall37d: 150, normal37d: 150, pctDeparture: 0,
    category: "Unknown", risk: "low", source: "fallback (offline estimate)",
  };
  const c = data.coords[key];
  if (!c) return fallback;
  try {
    const [lat, lon] = c;
    const liveUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&daily=precipitation_sum&past_days=30&forecast_days=7&timezone=auto`;
    const normUrl = `https://power.larc.nasa.gov/api/temporal/climatology/point?latitude=${lat}&longitude=${lon}&community=AG&parameters=T2M,PRECTOTCORR&format=JSON&start=2010&end=2023`;
    const [liveRes, normRes] = await Promise.all([fetch(liveUrl), fetch(normUrl).catch(() => null)]);
    const live = await liveRes.json();
    const temperature = live.current.temperature_2m;
    const humidity = live.current.relative_humidity_2m;
    const rainfall37d = Math.round(
      (live.daily.precipitation_sum as (number | null)[]).reduce((a, b) => a + (b ?? 0), 0) * 10,
    ) / 10;
    let normal37d = rainfall37d;
    if (normRes?.ok) {
      const n = await normRes.json();
      normal37d = Math.round(n.properties.parameter.PRECTOTCORR.ANN * 365 * (37 / 365) * 10) / 10;
    }
    const pct = normal37d > 0 ? ((rainfall37d - normal37d) / normal37d) * 100 : 0;
    return {
      temperature, humidity, rainfall37d, normal37d,
      pctDeparture: Math.round(pct * 10) / 10,
      category: pct > 50 ? "Excess" : pct < -30 ? "Deficient" : "Normal",
      risk: pct < -30 ? "high" : pct < -10 ? "moderate" : "low",
      source: "live",
    };
  } catch {
    return fallback;
  }
}

/** Gaussian Naive Bayes trained on the AgriGenie crop dataset. */
function classify(x: number[]): { crop: string; confidence: number }[] {
  const logs = Object.entries(data.nb).map(([crop, p]) => {
    let ll = Math.log(p.prior);
    for (let i = 0; i < x.length; i++) {
      const v = p.var[i];
      ll += -0.5 * Math.log(2 * Math.PI * v) - ((x[i] - p.mean[i]) ** 2) / (2 * v);
    }
    return { crop, ll };
  });
  const max = Math.max(...logs.map((l) => l.ll));
  const exps = logs.map((l) => ({ crop: l.crop, e: Math.exp(l.ll - max) }));
  const sum = exps.reduce((a, b) => a + b.e, 0);
  return exps
    .map((e) => ({ crop: e.crop, confidence: (e.e / sum) * 100 }))
    .sort((a, b) => b.confidence - a.confidence);
}

function growthStatus(state: string, crop: string): Recommendation["growth"] {
  const S = state.toUpperCase().trim();
  if (SPECIAL_STATES[crop]) return SPECIAL_STATES[crop].includes(S) ? "grown" : "not_grown";
  const apy = CROP_TO_APY[crop];
  if (!apy) return "unverifiable";
  return (data.grown[S] ?? []).includes(apy) ? "grown" : "not_grown";
}

export interface AdvisorInput {
  state: string; district: string;
  N?: number; P?: number; K?: number; ph?: number;
  weights: { confidence: number; yield: number; water: number; profit: number };
  topN?: number;
}

export interface AdvisorResult {
  results: Recommendation[]; soil: { N: number; P: number; K: number; ph: number };
  usedFallbackSoil: boolean; climate: Climate; rawTop: string; rawTopConf: number;
  suppressed: boolean; noVerified: boolean;
}

export async function recommend(input: AdvisorInput): Promise<AdvisorResult> {
  const { state, district, weights } = input;
  const profile = soilProfile(state, district);
  const soil = {
    N: input.N && input.N > 0 ? input.N : profile.N,
    P: input.P && input.P > 0 ? input.P : profile.P,
    K: input.K && input.K > 0 ? input.K : profile.K,
    ph: input.ph && input.ph > 0 ? input.ph : profile.ph,
  };
  const climate = await fetchClimate(district);
  const vals = [soil.N, soil.P, soil.K, climate.temperature, climate.humidity, soil.ph, climate.rainfall37d];
  const x = FEATURES.map((f, i) => clip(f, vals[i]));
  const ranked = classify(x);
  const rawTop = ranked[0].crop;
  const rawTopConf = Math.round(ranked[0].confidence * 100) / 100;

  // Gaussian NB is very peaked: a hard probability cut-off leaves a single crop.
  // Keep a proper shortlist so the multi-objective scoring has something to rank.
  let cands = ranked.filter((r) => r.confidence >= 0.01).slice(0, 10);
  if (cands.length < 5) cands = ranked.slice(0, 5);


  const benchList = Object.values(data.benchmarks);
  const maxWater = Math.max(...benchList.map((b) => b.water));
  const minYield = Math.min(...benchList.map((b) => b.yield));
  const maxYield = Math.max(...benchList.map((b) => b.yield));
  const profits = benchList.map((b) => b.yield * 1000 * b.price - b.cost);
  const minProfit = Math.min(...profits);
  const maxProfit = Math.max(...profits);

  const wTotal = weights.confidence + weights.yield + weights.water + weights.profit || 1;

  const rows: Recommendation[] = cands.map(({ crop, confidence }) => {
    const b = data.benchmarks[crop];
    const yf = Math.min(
      Math.max(
        1.15 -
          (Math.abs(climate.temperature - b.temp) / Math.max(b.temp, 1) +
            Math.abs(climate.rainfall37d - b.rain) / Math.max(b.rain, 1)) /
            4,
        0.4,
      ),
      1.15,
    );
    const estYield = b.yield * yf;
    const irrigation = Math.max(b.water - climate.rainfall37d, 0);
    const profit = estYield * 1000 * b.price - b.cost;

    // Feature driver: the worst-fitting feature if the crop is meaningfully off-profile,
    // otherwise the best-fitting feature (so the narrative matches the verdict).
    const nb = data.nb[crop];
    const zs = FEATURES.map((_, i) => Math.abs(x[i] - nb.mean[i]) / Math.sqrt(nb.var[i] || 1e-6));
    const worst = zs.indexOf(Math.max(...zs));
    const bestFit = zs.indexOf(Math.min(...zs));
    const positive = zs[worst] <= 1.5;
    const driverIdx = positive ? bestFit : worst;
    const driver = FEATURES[driverIdx];


    let sWater = 1 - irrigation / maxWater;
    if (climate.risk !== "low") sWater *= climate.risk === "moderate" ? 0.7 : 0.4;
    const score =
      (weights.confidence * (confidence / 100) +
        weights.yield * ((estYield - minYield) / (maxYield - minYield)) +
        weights.water * sWater +
        weights.profit * ((profit - minProfit) / (maxProfit - minProfit))) /
      wTotal;

    return {
      crop,
      confidence: Math.round(confidence * 10000) / 10000,
      yieldTHa: Math.round(estYield * 100) / 100,
      waterMm: b.water,
      irrigationMm: Math.round(irrigation * 10) / 10,
      profitInr: Math.round(profit),
      driver,
      explanation: NARRATIVES[driver][positive ? "positive" : "negative"],
      growth: growthStatus(state, crop),
      score: Math.round(score * 10000) / 10000,
    };
  });

  const verified = rows.filter((r) => r.growth !== "not_grown");
  const noVerified = verified.length === 0;
  const pool = noVerified ? rows : verified;
  const results = pool.sort((a, b) => b.score - a.score).slice(0, input.topN ?? 5);

  return {
    results,
    soil,
    usedFallbackSoil: !input.N,
    climate,
    rawTop,
    rawTopConf,
    suppressed: !results.some((r) => r.crop === rawTop),
    noVerified,
  };
}
