// uret-senaryo.mjs
// Anadolu bitki belgeseli — BOLUMLU senaryo uretici (OpenAI)
// Her bolum ayri uretilir, sonra birlestirilir -> 10-15 dk dolu senaryo
// Gerekli: OPENAI_API_KEY + bitkiler.txt

import fs from "node:fs";

const MODEL = "gpt-4o";
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("HATA: OPENAI_API_KEY tanimli degil.");
  process.exit(1);
}

// 1) Siradaki bitki
const bitkiler = fs.readFileSync("bitkiler.txt", "utf8")
  .split("\n").map(s => s.trim()).filter(Boolean);

let islenmis = [];
if (fs.existsSync("islenmis.txt")) {
  islenmis = fs.readFileSync("islenmis.txt", "utf8")
    .split("\n").map(s => s.trim()).filter(Boolean);
}

const bitki = bitkiler.find(b => !islenmis.includes(b));
if (!bitki) {
  console.log("Tum bitkiler islendi. Liste bitti.");
  process.exit(0);
}
console.log("Secilen bitki:", bitki, `(${islenmis.length + 1}/${bitkiler.length})`);

// 2) Bolumler (her biri ayri uretilir, toplam ~42 sahne = 12-15 dk)
const bolumler = [
  { ad: "CENGEL", konu: "Guclu bir merak sorusuyla videoyu acan carpici giris.", sahne: 4 },
  { ad: "BITKI NEDIR", konu: "Botanik kimligi, nerede ve hangi iklimde yetisir, gorunumu, ailesi.", sahne: 6 },
  { ad: "ATALARIMIZ VE TARIH", konu: "Insanlik bu bitkiyi ilk ne zaman, nerede kullandi? Arkeolojik/tarihsel izler, eski uygarliklar, Orta Asya'dan Anadolu'ya gelis, gelenekteki yeri.", sahne: 7 },
  { ad: "BILIM VE ETKEN MADDELER", konu: "Icindeki aktif bilesikler isimleriyle, vucutta ne yapar, nelere iyi gelebilir. Bilimsel olarak dogru.", sahne: 8 },
  { ad: "MUTFAK", konu: "Anadolu mutfaginda ve dunyada nasil kullanilir, hangi yemeklerde, neden.", sahne: 7 },
  { ad: "KULTUR VE DUNYA", konu: "Ayni bitkinin farkli kulturlerdeki adi ve kullanimi, ilginc detaylar.", sahne: 6 },
  { ad: "KAPANIS", konu: "Akilda kalici, tatmin edici kapanis. Son sahnede kisa 'doktorunuza danisin' notu.", sahne: 4 }
];

const sistemMesaji = "Sen Anadolu bitkileri ve baharatlari uzerine uzman, bilimsel olarak dogru calisan bir belgesel senaristisin. Sadece istenen JSON formatinda yanit verirsin.";

// 3) Tek bolum uret
async function bolumUret(bolum, oncekiOzet, deneme = 1) {
  const kullaniciMesaji = `Bitki: "${bitki}"
Belgesel video senaryosunun "${bolum.ad}" bolumunu yaziyorsun.
Bu bolumun konusu: ${bolum.konu}

${oncekiOzet ? "Onceki bolumlerde su anlatildi (tekrar etme): " + oncekiOzet : ""}

Bu bolum icin TAM ${bolum.sahne} sahne yaz. Her sahne:
- "anlatim": ~45-55 kelimelik, akici, sicak, merak uyandiran, belgesel tadinda Turkce anlatim (seslendirilecek).
- "gorsel": o sahneye uygun, INGILIZCE, sinematik belgesel tarzi gorsel betimleme (image prompt). Gorselde yazi OLMASIN. Gercekci, sicak isikli belgesel estetigi.

SAGLIK DILI: "tedavi eder, iyilestirir, sifa" gibi kesin iddialar KULLANMA. "destekleyebilir, yardimci olabilir" gibi temkinli dil kullan.

SADECE su JSON formatinda yanit ver:
{ "sahneler": [ { "anlatim": "...", "gorsel": "..." } ] }`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: sistemMesaji },
        { role: "user", content: kullaniciMesaji }
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })
  });

  if (res.status === 429 && deneme <= 4) {
    const bekle = deneme * 20;
    console.log(`429 rate limit. ${bekle}sn bekleniyor... (deneme ${deneme})`);
    await new Promise(r => setTimeout(r, bekle * 1000));
    return bolumUret(bolum, oncekiOzet, deneme + 1);
  }
  if (!res.ok) throw new Error(`OpenAI hatasi ${res.status}: ${await res.text()}`);
  const data = await res.json();
  let metin = (data.choices?.[0]?.message?.content ?? "").replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(metin);
  return parsed.sahneler || [];
}

// 4) Tum bolumleri sirayla uret ve birlestir
(async () => {
  let tumSahneler = [];
  let ozet = "";

  for (const bolum of bolumler) {
    console.log(`Uretiliyor: ${bolum.ad} bolumu...`);
    const sahneler = await bolumUret(bolum, ozet);
    tumSahneler = tumSahneler.concat(sahneler);
    // sonraki bolum icin kisa ozet
    ozet += `${bolum.ad}: ${sahneler.map(s => s.anlatim).join(" ").slice(0, 200)}... `;
    console.log(`  ${bolum.ad} -> ${sahneler.length} sahne`);
  }

  // baslik uret
  const baslikRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: `"${bitki}" hakkindaki Anadolu bitki belgeseli icin merak uyandiran, tiklanasi bir Turkce YouTube basligi yaz. SADECE basligi yaz, baska hicbir sey yazma.` }],
      temperature: 0.9,
      max_tokens: 60
    })
  });
  const baslikData = await baslikRes.json();
  const baslik = (baslikData.choices?.[0]?.message?.content ?? `${bitki} Belgeseli`).trim().replace(/^"|"$/g, "");

  const senaryo = { baslik, bitki, sahneler: tumSahneler };
  fs.writeFileSync("senaryo.json", JSON.stringify(senaryo, null, 2), "utf8");
  console.log(`\nTamam! TOPLAM ${tumSahneler.length} sahne uretildi.`);
  console.log("Baslik:", baslik);
})();
