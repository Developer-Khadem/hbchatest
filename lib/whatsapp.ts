import { storeInfo } from "@/lib/site-data";

export function getWhatsAppUrl(message?: string) {
  const phoneDigits = storeInfo.phone.replace(/\D/g, "");
  const phone = phoneDigits.startsWith("880")
    ? phoneDigits
    : `880${phoneDigits.replace(/^0/, "")}`;
  const url = new URL(`https://wa.me/${phone}`);

  if (message) url.searchParams.set("text", message);

  return url.toString();
}
