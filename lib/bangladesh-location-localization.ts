import type { Language } from "@/components/language-context";

const bengaliCharacters: Record<string, string> = {
  "অ": "o",
  "আ": "a",
  "ই": "i",
  "ঈ": "i",
  "উ": "u",
  "ঊ": "u",
  "ঋ": "ri",
  "এ": "e",
  "ঐ": "oi",
  "ও": "o",
  "ঔ": "ou",
  "ক": "k",
  "খ": "kh",
  "গ": "g",
  "ঘ": "gh",
  "ঙ": "ng",
  "চ": "ch",
  "ছ": "chh",
  "জ": "j",
  "ঝ": "jh",
  "ঞ": "ny",
  "ট": "t",
  "ঠ": "th",
  "ড": "d",
  "ঢ": "dh",
  "ণ": "n",
  "ত": "t",
  "থ": "th",
  "দ": "d",
  "ধ": "dh",
  "ন": "n",
  "প": "p",
  "ফ": "ph",
  "ব": "b",
  "ভ": "bh",
  "ম": "m",
  "য": "j",
  "র": "r",
  "ল": "l",
  "শ": "sh",
  "ষ": "sh",
  "স": "s",
  "হ": "h",
  "ড়": "r",
  "ঢ়": "rh",
  "য়": "y",
  "ৎ": "t",
  "ং": "ng",
  "ঃ": "h",
  "ঁ": "n",
  "া": "a",
  "ি": "i",
  "ী": "i",
  "ু": "u",
  "ূ": "u",
  "ৃ": "ri",
  "ে": "e",
  "ৈ": "oi",
  "ো": "o",
  "ৌ": "ou",
};

const bengaliConsonants = new Set(
  "কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎ",
);

const englishLocationNames: Record<string, string> = {
  "কুমিল্লা": "Cumilla",
  "ফেনী": "Feni",
  "ব্রাহ্মণবাড়িয়া": "Brahmanbaria",
  "রাঙ্গামাটি": "Rangamati",
  "নোয়াখালী": "Noakhali",
  "চাঁদপুর": "Chandpur",
  "লক্ষ্মীপুর": "Lakshmipur",
  "চট্টগ্রাম": "Chattogram",
  "কক্সবাজার": "Cox's Bazar",
  "খাগড়াছড়ি": "Khagrachhari",
  "বান্দরবান": "Bandarban",
  "সিরাজগঞ্জ": "Sirajganj",
  "পাবনা": "Pabna",
  "বগুড়া": "Bogura",
  "রাজশাহী": "Rajshahi",
  "নাটোর": "Natore",
  "জয়পুরহাট": "Joypurhat",
  "চাঁপাইনবাবগঞ্জ": "Chapainawabganj",
  "নওগাঁ": "Naogaon",
  "যশোর": "Jashore",
  "সাতক্ষীরা": "Satkhira",
  "মেহেরপুর": "Meherpur",
  "নড়াইল": "Narail",
  "চুয়াডাঙ্গা": "Chuadanga",
  "কুষ্টিয়া": "Kushtia",
  "মাগুরা": "Magura",
  "খুলনা": "Khulna",
  "বাগেরহাট": "Bagerhat",
  "ঝিনাইদহ": "Jhenaidah",
  "ঝালকাঠি": "Jhalokati",
  "পটুয়াখালী": "Patuakhali",
  "পিরোজপুর": "Pirojpur",
  "বরিশাল": "Barishal",
  "ভোলা": "Bhola",
  "বরগুনা": "Barguna",
  "সিলেট": "Sylhet",
  "মৌলভীবাজার": "Moulvibazar",
  "হবিগঞ্জ": "Habiganj",
  "সুনামগঞ্জ": "Sunamganj",
  "নরসিংদী": "Narsingdi",
  "গাজীপুর": "Gazipur",
  "শরীয়তপুর": "Shariatpur",
  "নারায়ণগঞ্জ": "Narayanganj",
  "টাঙ্গাইল": "Tangail",
  "কিশোরগঞ্জ": "Kishoreganj",
  "মানিকগঞ্জ": "Manikganj",
  "ঢাকা": "Dhaka",
  "মুন্সিগঞ্জ": "Munshiganj",
  "রাজবাড়ী": "Rajbari",
  "মাদারীপুর": "Madaripur",
  "গোপালগঞ্জ": "Gopalganj",
  "ফরিদপুর": "Faridpur",
  "পঞ্চগড়": "Panchagarh",
  "দিনাজপুর": "Dinajpur",
  "লালমনিরহাট": "Lalmonirhat",
  "নীলফামারী": "Nilphamari",
  "গাইবান্ধা": "Gaibandha",
  "ঠাকুরগাঁও": "Thakurgaon",
  "রংপুর": "Rangpur",
  "কুড়িগ্রাম": "Kurigram",
  "শেরপুর": "Sherpur",
  "ময়মনসিংহ": "Mymensingh",
  "জামালপুর": "Jamalpur",
  "নেত্রকোণা": "Netrokona",
  "দেবিদ্বার": "Debidwar",
  "সাভার": "Savar",
};

export function localizeBangladeshLocation(name: string, language: Language) {
  if (language === "bn") return name;
  const englishName = englishLocationNames[name.trim()];
  if (englishName) return englishName;

  const characters = Array.from(name.trim());
  let result = "";
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (bengaliConsonants.has(character)) {
      result += bengaliCharacters[character];
      const next = characters[index + 1];
      if (next === "্") {
        index += 1;
      } else if (next && bengaliCharacters[next] && "ািীুূৃেৈোৌ".includes(next)) {
        result += bengaliCharacters[next];
        index += 1;
      } else if (next && bengaliConsonants.has(next)) {
        result += "a";
      }
      continue;
    }
    result += bengaliCharacters[character] ?? character;
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}
