// gorsel-uret.mjs
// senaryo.json'daki her sahne icin Pollinations'tan gorsel indirir
// Gerekli: POLLINATIONS_KEY + senaryo.json (uret-senaryo.mjs uretir)

import fs from "node:fs";

const KEY = process.env.POLLINATIONS_KEY;
if (!KEY) {
  console.error("HATA: POLLINATIONS_KEY tanimli degil.");
  process.exit(1);
}

if (!fs.existsSync("senaryo.json")) {
  console.error("HATA: senaryo.json yok. Once senaryo uretilmeli.");
  process.exit(1);
}

const senaryo = JSON.parse(fs.readFileSync("senaryo.json", "utf8"));
const sahneler = senaryo.sahneler || [];
console.log(`${sahneler.length} sahne icin gorsel uretilecek.`);

if (!fs.existsSync("gorseller")) fs.mkdirSync("gorseller");

const bekle = (ms) => new Promise(r => setTimeout(r, ms));

async function gorselIndir(prompt, dosyaYolu, seed, deneme = 1) {
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}`
    + `?width=1280&height=720&nologo=true&model=flux&seed=${seed}`;
  try {
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${KEY}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error("Cok kucuk dosya (bos olabilir)");
    fs.writeFileSync(dosyaYolu, buf);
    return true;
  } catch (e) {
    if (deneme <= 3) {
      console.log(`  Hata (${e.message}), ${deneme*10}sn sonra tekrar...`);
      await bekle(deneme * 10000);
      return gorselIndir(prompt, dosyaYolu, seed, deneme + 1);
    }
    console.error(`  BASARISIZ: ${dosyaYolu} -> ${e.message}`);
    return false;
  }
}

(async () => {
  let basarili = 0, basarisiz = [];
  for (let i = 0; i < sahneler.length; i++) {
    const no = String(i + 1).padStart(2, "0");
    const dosya = `gorseller/sahne_${no}.jpg`;
    const prompt = sahneler[i].gorsel || "cinematic documentary scene, warm light";
    process.stdout.write(`Sahne ${no}/${sahneler.length}... `);
    const ok = await gorselIndir(prompt, dosya, i + 1);
    if (ok) { basarili++; console.log("tamam"); }
    else basarisiz.push(no);
    await bekle(2000); // rate limit icin nazik ara
  }
  console.log(`\nBitti! ${basarili}/${sahneler.length} gorsel indirildi.`);
  if (basarisiz.length) console.log("Basarisiz sahneler:", basarisiz.join(", "));
})();
