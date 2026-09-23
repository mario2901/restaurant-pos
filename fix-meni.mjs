// Ispravke menija u bazi preko API-ja. Idempotentno - može se pokrenuti više puta.
//   1) briše opciju "Riža" s jela koja idu u lepini / pecivu
//   2) sinkronizira porcije Ćevapa (Srednja 10 KM, Velika 12 KM)
//   3) briše opcije vezane za Srednju i Veliku porciju Ćevapa
//
// Pokretanje (backend mora biti upaljen):  node fix-meni.mjs
// Probni hod bez pisanja:                  node fix-meni.mjs --dry

const API = "http://localhost:8080/api/food";
const DRY = process.argv.includes("--dry");

const RICE_TARGETS = [
  "Ćevapi", "Šiš", "Kombinacija", "Velika kombinacija",
  "Gurmanska pljeskavica u pizza tijestu", "Hamburger", "Cheeseburger",
  "Topli sendvič",
];

const CEVAPI_PORTIONS = { "Srednja": 10, "Velika": 12 };
const CEVAPI_NO_OPTIONS = ["Srednja", "Velika"];

const norm = (s) => s.normalize("NFC").trim().toLowerCase();
const riceSet = new Set(RICE_TARGETS.map(norm));
const eq = (a, b) => Math.abs(Number(a) - Number(b)) < 0.001;

let changed = 0, failed = 0;

async function send(method, url, body) {
  if (DRY) return { ok: true, dry: true };
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, text };
  }
  return { ok: true, data: await res.json().catch(() => null) };
}

async function step(label, method, url, body) {
  const res = await send(method, url, body);
  if (res.ok) {
    console.log(`${DRY ? "·" : "✓"} ${label}`);
    changed++;
  } else {
    console.error(`✗ ${label} -> ${res.status} ${res.text ?? ""}`);
    failed++;
  }
}

const food = await fetch(API).then((r) => {
  if (!r.ok) throw new Error(`GET ${API} -> ${r.status} (je li backend upaljen?)`);
  return r.json();
});

// --- 1) Riža ---
for (const item of food) {
  if (!riceSet.has(norm(item.name))) continue;
  for (const opt of (item.options ?? []).filter((o) => norm(o.name) === "riža")) {
    await step(`${item.name}: briše opciju "Riža" (#${opt.id})`,
      "DELETE", `${API}/options/${opt.id}`);
  }
}

// --- 2) i 3) Ćevapi ---
const cevapi = food.find((f) => norm(f.name) === norm("Ćevapi"));

if (!cevapi) {
  console.error("✗ Jelo 'Ćevapi' ne postoji u bazi.");
  failed++;
} else {
  for (const [size, price] of Object.entries(CEVAPI_PORTIONS)) {
    const existing = (cevapi.portions ?? []).find((p) => norm(p.size) === norm(size));

    if (!existing) {
      await step(`Ćevapi: dodaje porciju "${size}" (${price} KM)`,
        "POST", `${API}/${cevapi.id}/portions`, { size, price });
    } else if (!eq(existing.price, price)) {
      await step(`Ćevapi: "${size}" ${existing.price} -> ${price} KM`,
        "PUT", `${API}/portions/${existing.id}`, { size, price });
    } else {
      console.log(`↷ Ćevapi: "${size}" već je ${price} KM`);
    }
  }

  const noOpt = new Set(CEVAPI_NO_OPTIONS.map(norm));
  for (const opt of cevapi.options ?? []) {
    if (opt.portionSize && noOpt.has(norm(opt.portionSize))) {
      await step(`Ćevapi/${opt.portionSize}: briše opciju "${opt.name}" (#${opt.id})`,
        "DELETE", `${API}/options/${opt.id}`);
    }
  }
}

console.log(`\n${DRY ? "[probni hod] " : ""}Gotovo: ${changed} promjena, ${failed} grešaka.`);
if (DRY) console.log("Ništa nije upisano. Pokreni bez --dry za stvarnu izmjenu.");
