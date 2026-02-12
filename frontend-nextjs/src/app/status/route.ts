import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/const";

export async function GET() {
  return NextResponse.json({
    version: APP_VERSION,
    env: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
}
