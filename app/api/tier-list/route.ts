import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { getTierListSnapshot, saveTierListSnapshot } from "../../../src/features/tier-list/db";
import { normalizeRows } from "../../../src/features/tier-list/tier-data";

export async function GET() {
  return NextResponse.json(await getTierListSnapshot());
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { patch?: unknown; rows?: unknown };
  const snapshot = await saveTierListSnapshot({
    patch: typeof body.patch === "string" ? body.patch : "Actual",
    rows: normalizeRows(body.rows),
  });

  return NextResponse.json(snapshot);
}
