// uret-senaryo.mjs
// Anadolu bitki belgeseli — BOLUMLU senaryo uretici (OpenAI)
// Her bolum ayri uretilir, sonra birlestirilir -> uzun, dolu senaryo
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

// 2) Bolumler (her biri ayri uretilecek)
const bolumler = [
  { ad: "CENGEL", konu: "Guclu bir merak sorusuyla videoyu acan giris. Izleyiciyi ilk saniyede yakala.", sahne: 4 },
  { ad: "BITKI NED
