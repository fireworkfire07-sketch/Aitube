import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST() {
  return new Promise((resolve) => {
    exec("node scripts/make-video.js", (error, stdout, stderr) => {

      if (error) {
        resolve(
          NextResponse.json({
            success: false,
            message: "Video üretilemedi",
            error: error.message,
          })
        );
        return;
      }

      resolve(
        NextResponse.json({
          success: true,
          message: "AITUBE video oluşturdu",
          log: stdout || stderr,
          file: "/aitube-video.txt",
        })
      );
    });
  });
}
