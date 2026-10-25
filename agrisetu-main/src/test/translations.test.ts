import { describe, expect, it } from "vitest";
import { translations } from "@/i18n/translations";

describe("AgriSetu translations", () => {
  it("keeps the farmer-first home experience available in every supported language", () => {
    const requiredKeys = [
      "quickStart",
      "stepSearch",
      "stepBook",
      "stepGrow",
      "seasonalTip",
      "trustedByFarmers",
      "pickDate",
      "noResultsHint",
    ];

    for (const language of ["en", "hi", "te"] as const) {
      for (const key of requiredKeys) {
        expect(translations[language][key], `${language}.${key}`).toBeTruthy();
      }
    }
  });

  it("falls back to English-compatible values for shared navigation concepts", () => {
    expect(translations.hi.home).toBe("होम");
    expect(translations.te.equipment).toBe("పరికరాలు");
    expect(translations.en.offlineMessage).toContain("offline");
  });
});
