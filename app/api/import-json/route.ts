import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { applyImportPayload, exportImportPayload, getImportPreview } from "../../../src/lib/import-json/db";
import { parseImportPayload } from "../../../src/lib/import-json/schema";

const maxImportBytes = 512 * 1024;

function authenticatedUserId(session: Awaited<ReturnType<typeof auth>>) {
  return session?.user?.id || undefined;
}

export async function GET() {
  const session = await auth();
  const userId = authenticatedUserId(session);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await exportImportPayload(userId));
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = authenticatedUserId(session);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > maxImportBytes) {
    return NextResponse.json({ errors: ["El archivo supera el límite de 512 KiB."] }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ errors: ["JSON mal formado."] }, { status: 400 });
  }

  const dryRun = body && typeof body === "object" && "dryRun" in body ? Boolean((body as { dryRun?: unknown }).dryRun) : true;
  const candidate = body && typeof body === "object" && "payload" in body ? (body as { payload?: unknown }).payload : body;
  const parsed = parseImportPayload(candidate);

  if (!parsed.payload) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  const preview = await getImportPreview(userId, parsed.payload);

  if (!dryRun) {
    await applyImportPayload(userId, parsed.payload);
  }

  return NextResponse.json({ applied: !dryRun, preview });
}
