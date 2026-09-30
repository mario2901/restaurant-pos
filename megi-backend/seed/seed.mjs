// Unos jela i dodataka iz JSON-a preko REST API-ja (backend mora biti pokrenut).
// Pokretanje iz megi-backend foldera:
//   node seed/seed.mjs                  -> koristi seed/meni.json
//   node seed/seed.mjs seed/drugi.json  -> neki drugi JSON
// Drugi server: API=http://192.168.1.10:8080/api node seed/seed.mjs
// Sigurno za ponovno pokretanje: stavke koje već postoje (po imenu) se preskaču.

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const API = process.env.API ?? "http://localhost:8080/api";
const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] ? resolve(process.argv[2]) : resolve(here, "meni.json");

const key = (s) => s.trim().toLowerCase();

async function request(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message ?? data?.error ?? text;
    const fields = data?.fieldErrors ? " " + JSON.stringify(data.fieldErrors) : "";
    throw new Error(`${res.status} ${msg}${fields}`);
  }
  return data;
}

async function seedFood(items = []) {
  const existing = new Set((await request("GET", "/food")).map((f) => key(f.name)));
  let added = 0, skipped = 0, failed = 0;

  for (const item of items) {
    if (existing.has(key(item.name))) {
      console.log(`  ↷ ${item.name} (već postoji)`);
      skipped++;
      continue;
    }
    try {
      const created = await request("POST", "/food", {
        name: item.name,
        description: item.description ?? null,
        category: item.category ?? null,
        portions: item.portions,
      });
      const p = created.portions.map((x) => `${x.size} ${Number(x.price).toFixed(2)}`).join(", ");
      console.log(`  ✓ ${created.name} [${created.category ?? "-"}] ${p}`);
      existing.add(key(item.name));
      added++;
    } catch (e) {
      console.error(`  ✗ ${item.name}: ${e.message}`);
      failed++;
    }
  }
  return { added, skipped, failed };
}

async function seedAddons(items = []) {
  const existing = new Set((await request("GET", "/addons")).map((a) => key(a.name)));
  let added = 0, skipped = 0, failed = 0;

  for (const item of items) {
    if (existing.has(key(item.name))) {
      console.log(`  ↷ ${item.name} (već postoji)`);
      skipped++;
      continue;
    }
    try {
      const created = await request("POST", "/addons", { name: item.name, price: item.price });
      console.log(`  ✓ ${created.name} ${Number(created.price).toFixed(2)}`);
      existing.add(key(item.name));
      added++;
    } catch (e) {
      console.error(`  ✗ ${item.name}: ${e.message}`);
      failed++;
    }
  }
  return { added, skipped, failed };
}

async function main() {
  const data = JSON.parse(await readFile(file, "utf8"));
  console.log(`API: ${API}\nJSON: ${file}\n`);

  console.log("JELA:");
  const f = await seedFood(data.food);
  console.log("\nDODACI:");
  const a = await seedAddons(data.addons);

  console.log(
    `\nJela    -> dodano ${f.added}, preskočeno ${f.skipped}, greške ${f.failed}` +
    `\nDodaci  -> dodano ${a.added}, preskočeno ${a.skipped}, greške ${a.failed}`,
  );
  if (f.failed || a.failed) process.exit(1);
}

main().catch((e) => {
  if (e.cause?.code === "ECONNREFUSED") {
    console.error(`Backend nije dostupan na ${API} — pokreni Spring Boot pa probaj ponovo.`);
  } else {
    console.error(e.message);
  }
  process.exit(1);
});
