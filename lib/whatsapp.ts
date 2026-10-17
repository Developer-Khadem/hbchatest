import { storeInfo } from "@/lib/site-data";

export function getWhatsAppUrl(message?: string) {
  const phone = `88${storeInfo.phone.replace(/\D/g, "").replace(/^0/, "")}`;
  const url = new URL(`https://wa.me/${phone}`);

  if (message) url.searchParams.set("text", message);

  return url.toString();
}
