import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = join(rootDir, "data", "Icons");
const manifestPath = join(rootDir, "data", "icon-assets.json");

interface IconAsset {
  key: string;
  filename: string;
  localUrl: string;
  cdnUrl?: string;
  cloudflareUrl?: string;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function uploadImage(accountId: string, token: string, asset: IconAsset) {
  const form = new FormData();
  const file = new Blob([await readFile(join(iconsDir, asset.filename))], { type: "image/webp" });

  form.set("id", `hsr-tools/${asset.key}`);
  form.set("file", file, asset.filename);
  form.set("requireSignedURLs", "false");
  form.set("metadata", JSON.stringify({ project: "hsr-tools", key: asset.key }));

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = (await response.json()) as {
    success: boolean;
    result?: { variants?: string[] };
    errors?: Array<{ code: number; message: string }>;
  };

  if (!payload.success) {
    const alreadyExists = payload.errors?.some((error) => error.message.toLowerCase().includes("already exists"));

    if (!alreadyExists) {
      throw new Error(`Cloudflare upload failed for ${asset.filename}: ${JSON.stringify(payload.errors)}`);
    }

    return asset.cloudflareUrl;
  }

  return payload.result?.variants?.[0] ?? asset.cloudflareUrl;
}

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !token) {
    throw new Error("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN before uploading icons.");
  }

  const files = (await readdir(iconsDir)).filter((file) => file.endsWith(".webp"));
  const manifest = await readJson<Record<string, IconAsset>>(manifestPath).catch(
    (): Record<string, IconAsset> => ({}),
  );

  for (const file of files) {
    const key = basename(file, extname(file));
    const asset = manifest[key] ?? { key, filename: file, localUrl: `/icons/${file}` };
    const cloudflareUrl = await uploadImage(accountId, token, asset);

    manifest[key] = { ...asset, cloudflareUrl };
    console.log(`Uploaded ${file}`);
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Updated ${manifestPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
