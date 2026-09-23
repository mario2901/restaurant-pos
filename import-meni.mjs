// Upis menija iz meni-hrana.json u backend, jelo po jelo.
// Pokretanje (backend mora biti upaljen):  node import-meni.mjs
// Opcionalno druga datoteka:              node import-meni.mjs neka-druga.json

import { readFile } from "node:fs/promises";

const API = "http://localhost:8080/api/food";
const FILE = process.argv[2] ?? new URL("./meni-hrana.json", import.meta.url);

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.fieldErrors ? JSON.stringify(data.fieldErrors) : data?.error ?? text;
    throw new Error(`${res.status} ${msg}`);
  }
  return data;
}

const menu = JSON.parse(await readFile(FILE, "utf-8"));

// zaštita od duplikata: preskoči jela koja već postoje u bazi
const existing = await fetch(API).then((r) => r.json());
const existingNames = new Set(existing.map((f) => f.name.toLowerCase()));

let created = 0, skipped = 0, failed = 0, optionErrors = 0;

for (const item of menu) {
  if (existingNames.has(item.name.toLowerCase())) {
    console.log(`↷ preskočeno (već postoji): ${item.name}`);
    skipped++;
    continue;
  }

  let food;
  try {
    food = await post(API, {
      name: item.name,
      description: item.description,
      portions: item.portions,
    });
  } catch (err) {
    console.error(`✗ ${item.name}: ${err.message}`);
    failed++;
    continue;
  }

  for (const opt of item.options ?? []) {
    const portion = opt.portionSize
      ? food.portions.find((p) => p.size === opt.portionSize)
      : null;

    if (opt.portionSize && !portion) {
      console.error(`  ✗ opcija "${opt.name}": porcija "${opt.portionSize}" ne postoji na jelu`);
      optionErrors++;
      continue;
    }

    try {
      await post(`${API}/${food.id}/options`, {
        portionId: portion ? portion.id : null,
        name: opt.name,
        extraPrice: opt.extraPrice,
      });
    } catch (err) {
      console.error(`  ✗ opcija "${opt.name}" za ${item.name}: ${err.message}`);
      optionErrors++;
    }
  }

  console.log(`✓ ${item.name} (${food.portions.length} porc., ${item.options?.length ?? 0} opc.)`);
  created++;
}

console.log(`\nGotovo: ${created} upisano, ${skipped} preskočeno, ${failed} grešaka na jelima, ${optionErrors} grešaka na opcijama.`);
