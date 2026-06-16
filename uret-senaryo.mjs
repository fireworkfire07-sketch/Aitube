// uret-senaryo.mjs
// Once bitkiyi internetten ARASTIRIR, sonra arastirmaya dayali 58 sahnelik senaryo yazar
// Gerekli: OPENAI_API_KEY + bitkiler.txt

import fs from "node:fs";

const MODEL = "gpt-4o";
const ARASTIRMA_MODEL = "gpt-4o-search-preview";
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) { console.error("HATA: OPENAI_API_KEY tanimli degil."); process.exit(1); }

const bitkiler = fs.readFileSync("bitkiler.txt", "utf8")
  .split("\n").map(s => s.trim()).filter(Boolean);

let islenmis = [];
if (fs.existsSync("islenmis.txt")) {
  islenmis = fs.readFileSync("islenmis.txt", "utf8").split("\n").map(s => s.trim()).filter(Boolean);
}

const bitki = bitkiler.find(b => !islenmis.includes(b));
if (!bitki) { console.log("Tum bitkiler islendi."); process.exit(0); }
console.log("Secilen bitki:", bitki, `(${islenmis.length + 1}/${bitkiler.length})`);

// === 1) ARASTIRMA ===
async function arastir() {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: ARASTIRMA_MODEL,
      web_search_options: {},
      messages: [{
        role: "user",
        content: `"${bitki}" bitkisi/baharati hakkinda guvenilir kaynaklardan kapsamli arastirma yap ve Turkce ozetle. Sunlari topla:
1) Botanik kimligi, nerede yetisir.
2) Tarihsel kullanim: insanlik bunu ilk ne zaman/nerede kullandi, eski uygarliklar, Anadolu'daki yeri.
3) Etken maddeler (bilimsel isimleriyle) ve bunlarin vucuttaki olasi etkileri (calismalardan).
4) Mutfak kullanimi (Anadolu ve dunya).
5) Farkli kulturlerdeki adi ve kullanimi.
6) Ilginc/az bilinen gercekler.
Maddeler halinde, gercek ve dogru bilgi ver.`
      }]
    })
  });
  if (!res.ok) {
    console.log("Arastirma basarisiz, arastirmasiz devam ediliyor.", res.status);
    return "";
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// === 2) SENARYO: bolumlu uretim (toplam 58 sahne ~ 15-20 dk) ===
const bolumler = [
  { ad: "CENGEL", konu: "Guclu bir merak sorusuyla carpici giris.", sahne: 5 },
  { ad: "BITKI NEDIR", konu: "Botanik kimligi, nerede yetisir, gorunumu.", sahne: 8 },
  { ad: "ATALARIMIZ VE TARIH", konu: "Ilk kullanim, arkeoloji, eski uygarliklar, Anadolu'ya gelis.", sahne: 10 },
  { ad: "BILIM VE ETKEN MADDELER", konu: "Aktif bilesikler isimleriyle, vucutta ne yapar.", sahne: 11 },
  { ad: "MUTFAK", konu: "Anadolu ve dunya mutfaginda kullanimi.", sahne: 10 },
  { ad: "KULTUR VE DUNYA", konu: "Farkli kulturlerdeki adi/kullanimi, ilginc detaylar.", sahne: 9 },
  { ad: "KAPANIS", konu: "Tatmin edici kapanis + kisa 'doktorunuza danisin' notu.", sahne: 5 }
];

const sistemMesaji = "Sen Anadolu bitkileri uzerine uzman bir belgesel senaristisin. Sana verilen ARASTIRMA NOTUNA sadik kalarak, bilimsel olarak dogru yazarsin. Sadece istenen JSON formatinda yanit verirsin.";

async function bolumUret(bolum, arastirma, oncekiOzet, deneme = 1) {
  const mesaj = `Bitki: "${bitki}"

ARASTIRMA NOTU (bunu temel al, uydurma):
${arastirma.slice(0, 6000)}

Simdi belgesel senaryosunun "${bolum.ad}" bolumunu yaz. Bu bolumun konusu: ${bolum.konu}
${oncekiOzet ? "Onceki bolumlerde anlatilan (tekrar etme): " + oncekiOzet : ""}

Bu bolum icin TAM ${bolum.sahne} sahne yaz. Her sahne:
- "anlatim": ~50-60 kelimelik akici, sicak, belgesel tadinda Turkce anlatim.
- "gorsel": INGILIZCE, sinematik belgesel image prompt. Yazi OLMASIN.

SAGLIK DILI: "tedavi/sifa" gibi kesin iddia YOK; "destekleyebilir, yardimci olabilir" kullan.

SADECE su JSON: { "sahneler": [ { "anlatim": "...", "gorsel": "..." } ] }`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: sistemMesaji }, { role: "user", content: mesaj }],
      temperature: 0.8, max_tokens: 4500,
      response_format: { type: "json_object" }
    })
  });
  if (res.status === 429 && deneme <= 4) {
    await new Promise(r => setTimeout(r, deneme * 20000));
    return bolumUret(bolum, arastirma, oncekiOzet, deneme + 1);
  }
  if (!res.ok) throw new Error(`OpenAI hatasi ${res.status}: ${await res.text()}`);
  const data = await res.json();
  let metin = (data.choices?.[0]?.message?.content ?? "").replace(/```json/gi, "").replace(/```/g, "").trim();
  return (JSON.parse(metin).sahneler) || [];
}

(async () => {
  console.log("Arastiriliyor...");
  const arastirma = await arastir();
  console.log("Arastirma tamam (" + arastirma.length + " karakter).");

  let tumSahneler = [], ozet = "";
  for (const bolum of bolumler) {
    console.log(`Uretiliyor: ${bolum.ad}...`);
    const sahneler = await bolumUret(bolum, arastirma, ozet);
    tumSahneler = tumSahneler.concat(sahneler);
    ozet += `${bolum.ad}: ${sahneler.map(s => s.anlatim).join(" ").slice(0, 150)}... `;
    console.log(`  ${bolum.ad} -> ${sahneler.length} sahne`);
  }

  const baslikRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: `"${bitki}" hakkindaki Anadolu bitki belgeseli icin merak uyandiran Turkce YouTube basligi yaz. SADECE basligi yaz.` }],
      temperature: 0.9, max_tokens: 60
    })
  });
  const baslik = ((await baslikRes.json()).choices?.[0]?.message?.content ?? `${bitki} Belgeseli`).trim().replace(/^"|"$/g, "");

  fs.writeFileSync("senaryo.json", JSON.stringify({ baslik, bitki, arastirma, sahneler: tumSahneler }, null, 2), "utf8");
  console.log(`\nTamam! TOPLAM ${tumSahneler.length} sahne. Baslik: ${baslik}`);
})();
