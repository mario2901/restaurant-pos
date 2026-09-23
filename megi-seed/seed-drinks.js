// seed-drinks.js — ubacuje pica iz drinks.json u backend
//
// Pokretanje (iz ovog foldera):
//   node seed-drinks.js
//   node seed-drinks.js --dry                             samo ispise, ne salje
//   node seed-drinks.js --url http://localhost:8080/api/drinks
//
// Zahtijeva Node 18+ (ugradjeni fetch).

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry");
const urlIdx = args.indexOf("--url");

const API_URL =
  urlIdx !== -1 && args[urlIdx + 1]
    ? args[urlIdx + 1]
    : "http://localhost:8080/api/drinks";

const FILE = path.join(__dirname, "drinks.json");

async function main() {
  const drinks = JSON.parse(fs.readFileSync(FILE, "utf8"));
  console.log(`Ucitano ${drinks.length} pica iz drinks.json`);
  console.log(`Endpoint: ${API_URL}${DRY_RUN ? "  (DRY RUN)" : ""}\n`);

  let ok = 0;
  let skipped = 0;
  const failed = [];

  for (const drink of drinks) {
    const label = `${drink.name.padEnd(24)} ${drink.price.toFixed(2)} KM  [${drink.category}]`;

    if (DRY_RUN) {
      console.log(`[dry] ${label}`);
      ok++;
      continue;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(drink),
      });

      const text = await res.text();

      if (!res.ok) {
        // vec postoji -> preskoci, skripta je ponovo pokretljiva
        if (res.status === 400 && /vec postoji|već postoji/i.test(text)) {
          console.log(`- ${label}  (vec postoji, preskacem)`);
          skipped++;
          continue;
        }
        console.error(`x ${label}  -> ${res.status} ${res.statusText}`);
        if (text) console.error(`   ${text.slice(0, 300)}`);
        failed.push({ drink: drink.name, status: res.status });
        continue;
      }

      let id = "";
      try {
        id = JSON.parse(text)?.id ?? "";
      } catch (_) {}

      console.log(`+ ${label}${id ? `  (id ${id})` : ""}`);
      ok++;
    } catch (err) {
      console.error(`x ${label}  -> ${err.message}`);
      failed.push({ drink: drink.name, error: err.message });
    }
  }

  console.log(`\nDodano: ${ok}   Preskoceno: ${skipped}   Neuspjelo: ${failed.length}`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  - ${f.drink}: ${f.status ?? f.error}`));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("Fatalna greska:", e);
  process.exit(1);
});
