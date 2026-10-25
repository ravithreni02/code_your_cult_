import { STATES, districtsOf } from "@/lib/agrigenie";
import type { Language } from "@/i18n/translations";

/* ------------------------------------------------------------------ *
 * Lightweight Indic -> Latin transliteration (Devanagari + Telugu)
 * Used so that speech recognised in Hindi/Telugu script can still be
 * matched against the Latin state/district names in the dataset.
 * ------------------------------------------------------------------ */

const CONSONANTS = [
  "k", "kh", "g", "gh", "n", "ch", "chh", "j", "jh", "n", "t", "th", "d", "dh", "n",
  "t", "th", "d", "dh", "n", "p", "ph", "b", "bh", "m", "y", "r", "r", "l", "l", "l",
  "v", "sh", "sh", "s", "h",
];
const VOWELS: Record<number, string> = {
  0x05: "a", 0x06: "aa", 0x07: "i", 0x08: "ii", 0x09: "u", 0x0a: "uu", 0x0b: "ri",
  0x0f: "e", 0x10: "ai", 0x13: "o", 0x14: "au", 0x12: "o", 0x0e: "e",
};
const MATRAS: Record<number, string> = {
  0x3e: "aa", 0x3f: "i", 0x40: "ii", 0x41: "u", 0x42: "uu", 0x43: "ri",
  0x46: "e", 0x47: "e", 0x48: "ai", 0x4a: "o", 0x4b: "o", 0x4c: "au",
};

export function transliterate(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    let base = -1;
    if (code >= 0x0900 && code <= 0x097f) base = 0x0900;
    else if (code >= 0x0c00 && code <= 0x0c7f) base = 0x0c00;
    if (base === -1) {
      out += ch;
      continue;
    }
    const off = code - base;
    if (off >= 0x15 && off <= 0x39) {
      out += (CONSONANTS[off - 0x15] ?? "") + "a";
    } else if (VOWELS[off]) {
      out += VOWELS[off];
    } else if (MATRAS[off]) {
      // replace the inherent "a" produced by the preceding consonant
      out = out.replace(/a$/, "") + MATRAS[off];
    } else if (off === 0x4d) {
      out = out.replace(/a$/, ""); // virama / halant
    } else if (off === 0x02 || off === 0x01 || off === 0x03) {
      out += "n";
    } else {
      out += " ";
    }
  }
  return out;
}

const skeleton = (s: string) =>
  transliterate(s.toLowerCase())
    .replace(/[^a-z]/g, "")
    .replace(/[aeiou]/g, "");

/* ------------------------------------------------------------------ *
 * Place detection
 * ------------------------------------------------------------------ */

const STATE_SYNONYMS: Record<string, string[]> = {
  Telangana: ["telangana", "telengana"],
  "Andhra Pradesh": ["andhra", "andra"],
  "Uttar Pradesh": ["up", "uttarpradesh"],
  "Madhya Pradesh": ["mp", "madhyapradesh"],
  "Tamil Nadu": ["tamilnadu", "tamil nadu"],
};

export interface Place {
  state?: string;
  district?: string;
}

const matchIn = (haystackSkel: string, candidates: string[]) => {
  let best: string | null = null;
  for (const c of candidates) {
    const s = skeleton(c);
    if (s.length >= 3 && haystackSkel.includes(s)) {
      if (!best || s.length > skeleton(best).length) best = c;
    }
  }
  return best;
};

export function detectPlace(text: string, known: Place = {}): Place {
  const skel = skeleton(text);
  let state = known.state;

  const direct = matchIn(skel, STATES);
  if (direct) state = direct;
  else {
    for (const [st, alts] of Object.entries(STATE_SYNONYMS)) {
      if (!STATES.includes(st)) continue;
      if (alts.some((a) => skeleton(a).length >= 2 && skel.includes(skeleton(a)))) {
        state = st;
        break;
      }
    }
  }

  let district: string | undefined;
  if (state) district = matchIn(skel, districtsOf(state)) ?? undefined;
  if (!district) {
    // search every state's districts, adopt its state too
    for (const st of STATES) {
      const d = matchIn(skel, districtsOf(st));
      if (d) {
        district = d;
        if (!state) state = st;
        break;
      }
    }
  }
  return { state, district };
}

/* ------------------------------------------------------------------ *
 * Intents
 * ------------------------------------------------------------------ */

export type IntentName =
  | "agrigenie"
  | "equipment"
  | "labor"
  | "community"
  | "finance"
  | "home"
  | "dashboard"
  | "login"
  | "help"
  | "unknown";

interface IntentDef {
  name: IntentName;
  route: string;
  keywords: string[]; // matched against transliterated latin text
}

/** Extensible intent table — add a row to teach the assistant a new command. */
export const INTENTS: IntentDef[] = [
  {
    name: "agrigenie",
    route: "/crop-advisor",
    keywords: [
      "agrigenie", "agri genie", "crop", "advisor", "advice", "seed", "sowing", "soil",
      "फसल", "सलाह", "अग्रिजिनी", "मिट्टी", "बुवाई",
      "పంట", "సలహా", "అగ్రిజెనీ", "నేల", "విత్తు",
      "phasal", "salaah", "pnt", "salaha", "agrijeni", "agrijini",
    ],
  },
  {
    name: "equipment",
    route: "/equipment",
    keywords: [
      "equipment", "machine", "machinery", "tractor", "rent", "harvester", "implement",
      "मशीन", "उपकरण", "ट्रैक्टर", "किराया", "यंत्र",
      "యంత్రం", "పరికరాలు", "ట్రాక్టర్", "అద్దె", "మిషన్",
    ],
  },
  {
    name: "labor",
    route: "/labor",
    keywords: [
      "labor", "labour", "worker", "workers", "hire", "coolie", "manpower",
      "मजदूर", "मज़दूर", "श्रमिक", "कामगार", "काम",
      "కార్మిక", "కూలీ", "పనివా", "కార్మికులు",
    ],
  },
  {
    name: "community",
    route: "/community",
    keywords: [
      "community", "post", "forum", "discussion", "feed",
      "समुदाय", "पोस्ट", "चर्चा",
      "సమాజ", "పోస్ట్", "చర్చ",
    ],
  },
  {
    name: "finance",
    route: "/finance",
    keywords: [
      "finance", "loan", "credit", "money", "subsidy", "kisan card",
      "ऋण", "कर्ज", "लोन", "पैसा", "वित्त",
      "రుణ", "అప్పు", "ఆర్థిక", "డబ్బు",
    ],
  },
  {
    name: "dashboard",
    route: "/dashboard",
    keywords: [
      "dashboard", "booking", "bookings", "my account",
      "डैशबोर्ड", "बुकिंग", "खाता",
      "డాష్", "బుకింగ్", "ఖాతా",
    ],
  },
  {
    name: "login",
    route: "/auth",
    keywords: [
      "login", "log in", "sign in", "sign up", "register", "account",
      "लॉगिन", "पंजीकरण", "साइन",
      "లాగిన్", "నమోదు", "సైన్",
    ],
  },
  {
    name: "home",
    route: "/",
    keywords: ["home", "start", "main page", "होम", "मुख्य", "హోమ్", "ముఖ్య"],
  },
  {
    name: "help",
    route: "",
    keywords: ["help", "hello", "hi ", "namaste", "मदद", "नमस्ते", "సహాయ", "నమస్కారం", "హాయ్"],
  },
];

export function detectIntent(text: string): IntentName {
  const lower = ` ${text.toLowerCase()} `;
  const skel = skeleton(text);
  let best: { name: IntentName; score: number } = { name: "unknown", score: 0 };
  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      const k = kw.toLowerCase();
      const hit = lower.includes(k) || (skeleton(k).length >= 3 && skel.includes(skeleton(k)));
      if (hit && k.length > best.score) best = { name: intent.name, score: k.length };
    }
  }
  return best.name;
}

export const routeOf = (name: IntentName) => INTENTS.find((i) => i.name === name)?.route ?? "/";

/* ------------------------------------------------------------------ *
 * Multilingual replies
 * ------------------------------------------------------------------ */

type Phrase = Record<Language, string>;

export const SPEECH_LOCALE: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
};

const P = (en: string, hi: string, te: string): Phrase => ({ en, hi, te });

export const PHRASES = {
  greeting: P(
    "Hi! I'm your AgriSetu assistant. Speak or type — try \"Go to AgriGenie\".",
    "नमस्ते! मैं आपका AgriSetu सहायक हूँ। बोलिए या लिखिए — जैसे \"अग्रिजिनी खोलो\"।",
    "నమస్కారం! నేను మీ AgriSetu సహాయకుడిని. మాట్లాడండి లేదా టైప్ చేయండి — ఉదా: \"అగ్రిజెనీకి వెళ్ళు\"."
  ),
  help: P(
    "You can say: \"Go to AgriGenie\", \"Show equipment near me\", \"I need labor\", \"Open community\", \"I need a loan\".",
    "आप कह सकते हैं: \"अग्रिजिनी खोलो\", \"मशीन दिखाओ\", \"मजदूर चाहिए\", \"समुदाय खोलो\", \"लोन चाहिए\"।",
    "మీరు ఇలా చెప్పవచ్చు: \"అగ్రిజెనీకి వెళ్ళు\", \"యంత్రాలు చూపించు\", \"కార్మికులు కావాలి\", \"సమాజం తెరవండి\", \"రుణం కావాలి\"."
  ),
  unknown: P(
    "Sorry, I didn't get that. Try: AgriGenie, equipment, labor, community or finance.",
    "माफ़ कीजिए, समझ नहीं आया। कहिए: अग्रिजिनी, मशीन, मजदूर, समुदाय या लोन।",
    "క్షమించండి, అర్థం కాలేదు. చెప్పండి: అగ్రిజెనీ, యంత్రాలు, కార్మికులు, సమాజం లేదా రుణం."
  ),
  askState: P(
    "Which state is your farm in?",
    "आपका खेत किस राज्य में है?",
    "మీ పొలం ఏ రాష్ట్రంలో ఉంది?"
  ),
  askDistrict: P(
    "Which district?",
    "कौन सा जिला?",
    "ఏ జిల్లా?"
  ),
  districtFallback: P(
    "I don't have soil data for that district yet — using the nearest available district in the same state.",
    "उस जिले का मिट्टी डेटा अभी नहीं है — उसी राज्य के निकटतम उपलब्ध जिले का उपयोग कर रहा हूँ।",
    "ఆ జిల్లా నేల డేటా ఇంకా లేదు — అదే రాష్ట్రంలో అందుబాటులో ఉన్న జిల్లాను వాడుతున్నాను."
  ),
  openingEquipment: P(
    "Opening the equipment marketplace 🚜",
    "उपकरण बाज़ार खोल रहा हूँ 🚜",
    "పరికరాల మార్కెట్ తెరుస్తున్నాను 🚜"
  ),
  openingLabor: P(
    "Opening the labor marketplace 👷",
    "मजदूर बाज़ार खोल रहा हूँ 👷",
    "కార్మికుల మార్కెట్ తెరుస్తున్నాను 👷"
  ),
  openingCommunity: P("Opening community 💬", "समुदाय खोल रहा हूँ 💬", "సమాజం తెరుస్తున్నాను 💬"),
  openingFinance: P("Opening finance 💰", "वित्त खोल रहा हूँ 💰", "ఆర్థిక విభాగం తెరుస్తున్నాను 💰"),
  openingHome: P("Going home 🏠", "होम पर ले जा रहा हूँ 🏠", "హోమ్‌కి వెళ్తున్నాను 🏠"),
  openingDashboard: P("Opening your dashboard 📊", "डैशबोर्ड खोल रहा हूँ 📊", "డాష్‌బోర్డ్ తెరుస్తున్నాను 📊"),
  openingLogin: P("Opening login 🔐", "लॉगिन खोल रहा हूँ 🔐", "లాగిన్ తెరుస్తున్నాను 🔐"),
  openingAgriGenie: P(
    "Opening AgriGenie 🌱 Which state and district should I check?",
    "अग्रिजिनी खोल रहा हूँ 🌱 कौन सा राज्य और जिला देखूँ?",
    "అగ్రిజెనీ తెరుస్తున్నాను 🌱 ఏ రాష్ట్రం, ఏ జిల్లా చూడాలి?"
  ),
  micUnsupported: P(
    "Voice input isn't supported in this browser — please type your command.",
    "इस ब्राउज़र में आवाज़ समर्थित नहीं है — कृपया कमांड टाइप करें।",
    "ఈ బ్రౌజర్‌లో వాయిస్ మద్దతు లేదు — దయచేసి కమాండ్ టైప్ చేయండి."
  ),
  micError: P(
    "I couldn't hear you. Please try again or type.",
    "आवाज़ सुनाई नहीं दी। फिर कोशिश करें या टाइप करें।",
    "వినిపించలేదు. మళ్ళీ ప్రయత్నించండి లేదా టైప్ చేయండి."
  ),
  listening: P("Listening…", "सुन रहा हूँ…", "వింటున్నాను…"),
};

export const say = (p: Phrase, lang: Language) => p[lang] ?? p.en;

export const loadingAdvice = (state: string, district: string, lang: Language) =>
  ({
    en: `Getting crop recommendations for ${district}, ${state} 🌱`,
    hi: `${district}, ${state} के लिए फसल सुझाव ला रहा हूँ 🌱`,
    te: `${district}, ${state} కోసం పంట సిఫారసులు తెస్తున్నాను 🌱`,
  })[lang];

/* ------------------------------------------------------------------ *
 * Conversation engine — intent + slot filling
 * ------------------------------------------------------------------ */

export interface AssistantState {
  pending?: "agrigenie";
  place: Place;
  askedDistrict?: number;
}

export interface AssistantReply {
  text: string;
  navigate?: string;
  state: AssistantState;
}

const adviceReply = (state: string, district: string, lang: Language, prefix = ""): AssistantReply => ({
  text: prefix + loadingAdvice(state, district, lang),
  navigate: `/crop-advisor?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&auto=1`,
  state: { place: { state, district } },
});

export function handleUtterance(
  text: string,
  lang: Language,
  prev: AssistantState
): AssistantReply {
  const place = { ...prev.place, ...detectPlace(text, prev.place) };
  const intent = detectIntent(text);

  // Continue an in-progress AgriGenie flow when the user only supplies a place
  const inAgriFlow = prev.pending === "agrigenie" || intent === "agrigenie";

  if (inAgriFlow) {
    if (place.state && place.district) return adviceReply(place.state, place.district, lang);

    if (!place.state) {
      return {
        text:
          intent === "agrigenie" && prev.pending !== "agrigenie"
            ? say(PHRASES.openingAgriGenie, lang)
            : say(PHRASES.askState, lang),
        navigate: intent === "agrigenie" && prev.pending !== "agrigenie" ? "/crop-advisor" : undefined,
        state: { pending: "agrigenie", place, askedDistrict: prev.askedDistrict },
      };
    }

    const asked = prev.askedDistrict ?? 0;
    const available = districtsOf(place.state);
    // The user named a district we have no soil profile for — fall back gracefully
    if (asked >= 1 && available.length) {
      return adviceReply(place.state, available[0], lang, say(PHRASES.districtFallback, lang) + " ");
    }
    return {
      text: say(PHRASES.askDistrict, lang),
      navigate: prev.pending !== "agrigenie" ? "/crop-advisor" : undefined,
      state: { pending: "agrigenie", place, askedDistrict: asked + 1 },
    };
  }


  const map: Partial<Record<IntentName, Phrase>> = {
    equipment: PHRASES.openingEquipment,
    labor: PHRASES.openingLabor,
    community: PHRASES.openingCommunity,
    finance: PHRASES.openingFinance,
    home: PHRASES.openingHome,
    dashboard: PHRASES.openingDashboard,
    login: PHRASES.openingLogin,
  };

  if (map[intent]) {
    return { text: say(map[intent]!, lang), navigate: routeOf(intent), state: { place } };
  }
  if (intent === "help") return { text: say(PHRASES.help, lang), state: { place } };
  return { text: say(PHRASES.unknown, lang), state: { place } };
}
