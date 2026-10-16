import { describe, expect, it } from "vitest";
import { displayPhone, formatAddress, formatHours } from "./format";

// These strings are what visitors read next to the LocalBusiness JSON-LD built
// from the same site.business values, so the conversions are pinned here.

describe("formatAddress", () => {
  it("orders a Japanese address region → locality → street", () => {
    expect(
      formatAddress({
        streetAddress: "神宮前1-2-3",
        addressLocality: "渋谷区",
        addressRegion: "東京都",
        postalCode: "150-0001",
        addressCountry: "JP",
      }),
    ).toBe("〒150-0001 東京都渋谷区神宮前1-2-3");
  });

  it("returns undefined without an address", () => {
    expect(formatAddress(undefined)).toBeUndefined();
  });
});

describe("displayPhone", () => {
  it("turns the +81 form into the domestic one", () => {
    expect(displayPhone("+81-3-1234-5678")).toBe("03-1234-5678");
    expect(displayPhone("03-1234-5678")).toBe("03-1234-5678");
  });
});

describe("formatHours", () => {
  it("spells schema.org day ranges and times in Japanese", () => {
    expect(formatHours("Mo-Fr 09:00-18:00")).toBe("月〜金 09:00〜18:00");
    expect(formatHours("Sa 10:00-17:00")).toBe("土 10:00〜17:00");
    expect(formatHours("Mo,We,Fr 10:00-12:00")).toBe("月,水,金 10:00〜12:00");
  });
});
