// Briše opciju "Riža" s jela koja se služe u lepini / pecivu.
// Pokretanje (backend mora biti upaljen):  node fix-riza.mjs
// Probni hod bez brisanja:                 node fix-riza.mjs --dry

const API = "http://localhost:8080/api/food";
const DRY = process.argv.includes("--dry");

const TARGETS = [
  "Ćevapi",
  "Šiš",
  "Kombinacija",
  "Velika kombinacija",
  "Gurmanska pljeskavica u pizza tijestu",
  "Hamburger",
  "Cheeseburger",
  "Topli sendvič",
];

const norm = (s) => s.normalize("NFC").trim().toLowerCase();
const targetSet = new Set(TARGETS.map(norm));

const food = await fetch(API).then((r) => {
  if (!r.ok) throw new Error(`GET ${API} -> ${r.status}`);
  return r.json();
});

let deleted = 0, failed = 0, notFound = [...targetSet];

for (const item of food) {
  if (!targetSet.has(norm(item.name))) continue;
  notFound = notFound.filter((n) => n !== norm(item.name));

  const rice = (item.options ?? []).filter((o) => norm(o.name) === "riža");
  if (rice.length === 0) {
    console.log(`↷ ${item.name}: nema opciju Riža`);
    continue;
  }

  for (const opt of rice) {
    if (DRY) {
      console.log(`· ${item.name}: obrisao bih opciju #${opt.id} "${opt.name}"`);
      deleted++;
      continue;
    }
    const res = await fetch(`${API}/options/${opt.id}`, { method: "DELETE" });
    if (res.ok) {
      console.log(`✓ ${item.name}: obrisana Riža (#${opt.id})`);
      deleted++;
    } else {
      console.error(`✗ ${item.name}: DELETE #${opt.id} -> ${res.status}`);
      failed++;
    }
  }
}

if (notFound.length) console.warn(`\n⚠ nije nađeno u bazi: ${notFound.join(", ")}`);
console.log(`\n${DRY ? "[probni hod] " : ""}Gotovo: ${deleted} obrisano, ${failed} grešaka.`);
