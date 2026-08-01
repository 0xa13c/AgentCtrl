import { NextResponse } from "next/server";
import { syncVault } from "@/lib/vault/sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await syncVault();
  return NextResponse.json(result);
}
