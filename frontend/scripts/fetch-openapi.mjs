import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE_URL = process.env.VITE_API_BASE_URL || "http://localhost:8000";
const outPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../openapi.json",
);

const res = await fetch(`${API_BASE_URL}/openapi.json`);
if (!res.ok) {
  throw new Error(`Failed to fetch ${API_BASE_URL}/openapi.json: ${res.status} ${res.statusText}`);
}
const json = await res.json();
await writeFile(outPath, JSON.stringify(json, null, 2) + "\n", "utf-8");
console.log(`Saved ${outPath}`);
