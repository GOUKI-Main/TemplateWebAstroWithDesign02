import type { BusinessConfig } from "../content/site";

/** Japanese postal-style address line built from site.business.address
 *  (〒postalCode region locality street). Every visible address on the site
 *  goes through here so the footer, BusinessInfo and the contact CTA agree
 *  with each other and with the LocalBusiness JSON-LD they mirror. */
export function formatAddress(
  address: BusinessConfig["address"],
): string | undefined {
  if (!address) return undefined;
  const { postalCode, addressRegion, addressLocality, streetAddress } = address;
  const line = [addressRegion, addressLocality, streetAddress]
    .filter(Boolean)
    .join("");
  return postalCode ? `〒${postalCode} ${line}` : line;
}

/** "+81-3-1234-5678" → "03-1234-5678" for display; tel: links keep the
 *  international form. */
export function displayPhone(telephone: string): string {
  return telephone.replace(/^\+81-?/, "0");
}

const DAYS: Record<string, string> = {
  Mo: "月",
  Tu: "火",
  We: "水",
  Th: "木",
  Fr: "金",
  Sa: "土",
  Su: "日",
  PH: "祝",
};

/** schema.org openingHours ("Mo-Fr 09:00-18:00") → "月〜金 09:00〜18:00".
 *  Same value as the JSON-LD, only spelled for people. */
export function formatHours(spec: string): string {
  return spec
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DAYS[d] ?? d)
    .replace(/([月火水木金土日祝])-([月火水木金土日祝])/g, "$1〜$2")
    .replace(/(\d{2}:\d{2})-(\d{2}:\d{2})/g, "$1〜$2");
}
