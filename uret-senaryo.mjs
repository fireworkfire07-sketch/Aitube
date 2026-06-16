// uret-senaryo.mjs
// NatGeo tarzi derin belgesel senaryo: arastir -> kurgu -> sinematik sahne yazimi
// Gerekli: OPENAI_API_KEY + bitkiler.txt

import fs from "node:fs";

const MODEL = "gpt-4o";
const ARASTIRMA_MODEL = "gpt-4o-search-preview";
const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) { console.error("HATA: OPENAI_API_KEY tanimli degil."); process.exit(1); }

const bitkiler = fs.readFileSync("bitkiler.txt", "utf8").split("\n").map(s => s.trim()).filter(Boolean);
let islenmis = [];
if (fs.existsSync("islenmis.txt")) islenmis = fs.readFileSync("islenmis.txt", "utf8").split("\n").map(s => s.trim()).filter(Boolean);
const bitki = bitkiler.find(b => !islenmis.includes(b));
if (!bitki) { console.log("Tum bitkiler islendi."); process.exit(0); }
console.log("Secilen bitki:", bitki, `(${islenmis.length + 1}/${bitkiler.length})`);

async function cagir(model, messages, opts = {}) {
  const body = { model, messages, ...opts };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0,200)}`);
  return (await res.json()).choices?.[0]?.message?.content ?? "";
}

// 1) DERIN ARASTIRMA
async function arastir() {
  try {
    return await cagir(ARASTIRMA_MODEL, [{
      role: "user",
      content: `"${bitki}" hakkinda derin, guvenilir arastirma yap. Su konularda SOMUT, ilginc, az bilinen detaylar bul:
- Botanik ve dogadaki yeri
- Tarih: hangi uygarliklar, hangi yuzyil, arkeolojik bulgular, efsaneler, ticaret yollari
- Bilim: etken maddeler (kimyasal isimleriyle), bilimsel calismalar, etki mekanizmasi
- Anadolu kulturu: yoresel kullanim, gelenek, inanis
- Dunya mutfagi ve kulturlerindeki yeri
- Carpici/sasirtici gercekler, hikayeler
Genel laf degil, SPESIFIK olgular, isimler, tarihler, rakamlar ver. Turkce.`
    }, {
      role: "user",
      content: "(Not: gerceklere dayan, uydurma. Bulamazsan o kismi atla.)"
    }], { web_search_options: {} });
  } catch (e) { console.log("Arastirma atlandi:", e.message); return ""; }
}

// 2) HIKAYE KURGUSU (sahne sahne plan)
async function kurguYap(arastirma) {
  const metin = await cagir(MODEL, [
    { role: "system", content: "Sen odullu bir belgesel yonetmenisin (National Geographic tarzi). Kuru bilgi degil, MERAK ve DUYGU uyandiran bir anlati kurarsin." },
    { role: "user", content: `Bitki: "${bitki}"
ARASTIRMA:
${arastirma.slice(0, 7000)}

Bu bitki uzerine 15-18 dakikalik bir belgeselin SAHNE PLANINI cikar. Toplam 32 sahne.
Belgesel bir HIKAYE gibi aksin: carpici bir aciyla basla, merak uyandirarak ilerle, bilim-tarih-kultur katmanlarini orerek derinlestir, guclu bir kapanisla bitir.
Her sahne icin TEK CUMLELIK bir plan yaz (o sahnede ne anlatilacak).
SADECE JSON don: { "plan": ["sahne 1 plani", "sahne 2 plani", ...] }` }
  ], { temperature: 0.85, max_tokens: 3000, response_format: { type: "json_object" } });
  return JSON.parse(metin.replace(/```json/gi,"").replace(/```/g,"").trim()).plan || [];
}

// 3) SAHNELERI GRUP GRUP, SINEMATIK YAZ (her sahne ~110 kelime)
async function sahneYaz(planGrup, arastirma, oncekiOzet, baslangicNo) {
  const liste = planGrup.map((p, i) => `${baslangicNo + i}. ${p}`).join("\n");
  const metin = await cagir(MODEL, [
    { role: "system", content: "Sen National Geographic belgesellerinin senaristisin. Anlatimın: sinematik, derin, merak uyandiran, akici. Kuru ansiklopedi dili YOK. Tekrar YOK ('Anadolu Anadolu' gibi). Her cumle bir oncekini gelistirir, hikaye akar." },
    { role: "user", content: `Bitki: "${bitki}"
ARASTIRMA (gercek bilgi kaynagin):
${arastirma.slice(0, 5000)}
${oncekiOzet ? "\nONCEKI SAHNELERIN OZETI (tekrar etme, devam ettir):\n" + oncekiOzet : ""}

Su sahne planlarini, her birini DOLU bir belgesel sahnesine donustur:
${liste}

Her sahne icin:
- "anlatim": 100-130 kelimelik, SINEMATIK, anlati diliyle Turkce metin. Somut detay, isim, tarih kullan. Izleyiciyi icine ceken bir ton. Robotik/listeleme degil, akan bir anlati.
- "gorsel": INGILIZCE, cok detayli sinematik belgesel image prompt (isik, atmosfer, kompozisyon, lens hissi). Yazi/metin OLMASIN.

SAGLIK DILI: "tedavi/sifa" gibi kesin iddia YOK; "calismalar gosteriyor, destekleyebilir" kullan.
SADECE JSON don: { "sahneler": [ { "anlatim": "...", "gorsel": "..." } ] }` }
  ], { temperature: 0.85, max_tokens: 4096, response_format: { type: "json_object" } });
  return JSON.parse(metin.replace(/```json/gi,"").replace(/```/g,"").trim()).sahneler || [];
}

(async () => {
  console.log("1/3 Derin arastirma...");
  const arastirma = await arastir();
  console.log("  Arastirma:", arastirma.length, "karakter");

  console.log("2/3 Hikaye kurgusu...");
  const plan = await kurguYap(arastirma);
  console.log("  Plan:", plan.length, "sahne");

  console.log("3/3 Sinematik sahne yazimi...");
  let tumSahneler = [], ozet = "";
  const GRUP = 8;
  for (let i = 0; i < plan.length; i += GRUP) {
    const grup = plan.slice(i, i + GRUP);
    const sahneler = await sahneYaz(grup, arastirma, ozet, i + 1);
    tumSahneler = tumSahneler.concat(sahneler);
    ozet += sahneler.map(s => s.anlatim).join(" ").slice(0, 400) + " ";
    console.log(`  Sahne ${i + 1}-${i + grup.length} yazildi (${sahneler.length})`);
  }

  const baslik = (await cagir(MODEL, [{ role: "user", content: `"${bitki}" uzerine National Geographic tarzi bir belgesel icin merak uyandiran, sik bir Turkce YouTube basligi yaz. SADECE basligi yaz, tirnak koyma.` }], { temperature: 0.9, max_tokens: 60 })).trim().replace(/^"|"$/g, "");

  fs.writeFileSync("senaryo.json", JSON.stringify({ baslik, bitki, arastirma, sahneler: tumSahneler }, null, 2), "utf8");
  console.log(`\nTamam! TOPLAM ${tumSahneler.length} sahne. Baslik: ${baslik}`);
})();
