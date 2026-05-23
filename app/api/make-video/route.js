import { NextResponse } from "next/server";

export async function POST() {
  const video = {
    success: true,
    title: "Antalya’da Kimsenin Bilmediği 3 Gizli Yer",
    script:
      "Antalya sadece deniz ve otellerden ibaret değil. Bugün sana çoğu turistin bilmediği üç gizli yeri göstereceğim. Birinci yer: sakin koylar. İkinci yer: eski taş sokaklar. Üçüncü yer: gün batımında fotoğraf için mükemmel noktalar. Bu tarz yerleri seviyorsan takipte kal.",
    scenes: [
      "Sahilde hızlı giriş görüntüsü",
      "Gizli koy görüntüsü",
      "Kaleiçi sokakları",
      "Gün batımı fotoğraf noktası",
      "Takip et çağrısı",
    ],
    youtubeDescription:
      "Antalya’da keşfedilecek gizli yerler, gezi önerileri ve kısa video fikirleri.",
    hashtags: ["#Antalya", "#Travel", "#Shorts", "#GezilecekYerler"],
    message: "AITUBE senaryo üretti",
  };

  return NextResponse.json(video);
}
