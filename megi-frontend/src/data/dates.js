// Lokalni datumi kao "YYYY-MM-DD" — bez toISOString (UTC bi poslije ponoći dao jučerašnji dan).

const pad = (n) => String(n).padStart(2, "0");

export const toDateKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromDateKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = () => toDateKey(new Date());

export const addDays = (key, days) => {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
};

export const MONTHS = [
  "Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
  "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac",
];

export const WEEKDAYS = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

/** "2026-10-18" -> "18.10.2026." */
export const formatDateKey = (key) => {
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}.`;
};

/** "2026-10-18" -> "nedjelja, 18. listopada 2026." */
export const formatLongDate = (key) =>
  fromDateKey(key).toLocaleDateString("hr-HR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const formatTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("hr-HR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "–";
