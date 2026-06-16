// uret-senaryo.mjs
// Anadolu bitki belgeseli — sirali senaryo uretici (OpenAI)
// Gerekli: OPENAI_API_KEY + bitkiler.txt

import fs from "node:fs";

const MODEL = "gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("HATA: OPENAI_API_KEY tanimli degil.");
  process.exit(1);
}

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

const sistemMesaji = "Sen Anadolu bitkileri ve baharatlari uzerine uzman, bilimsel olarak dogru calisan bir belgesel senaristisin. Sadece istenen JSON formatinda yanit verirsin.";

const kullaniciMesaji = `Konu: "${bitki}"

Bu tek bitki hakkinda 12-15 dakikalik, Turkce, belgesel tadinda bir video senaryosu yaz.
Senaryo su bolumleri SIRAYLA, akici gecislerle islesin (basliklari yazma):

1. CENGEL: Guclu bir merak sorusuyla ac.
2. BITKI NEDIR: Botanik kimligi, nerede ve hangi iklimde yetisir, gorunumu.
3. ATALARIMIZ VE TARIH: Insanlik bu bitkiyi ilk ne zaman, nerede kullandi? Arkeolojik/tarihsel izler, eski uygarliklar, Orta Asya'dan Anadolu'ya gelis.
4. BILIM VE ETKEN MADDELER: Icindeki aktif bilesikler (isimleriyle), vucutta ne yapar, nelere iyi gelebilir. Bilimsel olarak dogru olsun.
5. MUTFAK: Anadolu mutfaginda ve dunyada nasil kullanilir, hangi yemeklerde.
6. KULTUR/DUNYA: Ayni bitkinin farkli kulturlerdeki adi ve kullanimi.
7. KAPANIS: Akilda kalici kapanis + kisa "doktorunuza danisin" notu.

SAGLIK DILI KURALI: "tedavi eder, iyilestirir, sifa" gibi kesin iddialar KULLANMA. "destekleyebilir, yardimci olabilir" gibi temkinli dil kullan.

Senaryoyu 40-46 sahneye bol. Her sahne:
- "anlatim": ~45-55 kelimelik, akici, sicak Turkce anlatim (seslendirilecek).
- "gorsel": o sahneye uygun, INGILIZCE, sinematik belgesel tarzi gorsel betimleme. Gorselde yazi OLMASIN.

SADECE su JSON formatinda yanit ver:
{
  "baslik": "merak uyandiran video basligi",
  "bitki": "${bitki}",
  "sahneler": [
    { "anlatim": "...", "gorsel": "..." }
  ]
}`;

async function openaiCagir(deneme = 1) {
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
      max_tokens: 8000,
      response_format: { type: "json_object" }
    })
  });

  if (res.status === 429 && deneme <= 4) {
    const bekle = deneme * 20;
    console.log(`429 rate limit. ${bekle}sn bekleniyor... (deneme ${deneme})`);
    await new Promise(r => setTimeout(r, bekle * 1000));
    return openaiCagir(deneme + 1);
  }
  if (!res.ok) throw new Error(`OpenAI hatasi ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

(async () => {
  let metin = await openaiCagir();
  metin = metin.replace(/```json/gi, "").replace(/```/g, "").trim();

  let senaryo;
  try {
    senaryo = JSON.parse(metin);
  } catch (e) {
    fs.writeFileSync("ham_cikti.txt", metin);
    console.error("JSON parse edilemedi. Ham cikti 'ham_cikti.txt' dosyasina yazildi.");
    process.exit(1);
  }

  fs.writeFileSync("senaryo.json", JSON.stringify(senaryo, null, 2), "utf8");
  console.log(`Tamam! ${senaryo.sahneler.length} sahne uretildi.`);
  console.log("Baslik:", senaryo.baslik);
})();
